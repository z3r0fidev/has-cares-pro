import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AppDataSource, Appointment, Message, User } from '@careequity/db';
import { Redactor } from '@careequity/core';

/**
 * MessagingService — HIPAA-compliant appointment-scoped messaging.
 *
 * Design decisions:
 * - No PHI is stored in Elasticsearch; all messages live exclusively in
 *   PostgreSQL with standard FK audit trails.
 * - PHI redaction via `Redactor.redact()` is applied at write time so the
 *   persisted `body` is always clean.
 * - Access control is enforced per operation: only the patient on an
 *   appointment and the treating provider (identified by their linked
 *   `provider.id`) may read or send messages in that thread.
 */
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  // ─── helpers ──────────────────────────────────────────────────────────────

  /**
   * Loads the appointment and verifies that `userId` is either the patient
   * or the provider's linked user account.  Throws appropriate HTTP
   * exceptions on failure.
   */
  private async getAppointmentWithAccess(
    appointmentId: string,
    userId: string,
    providerId: string | undefined,
  ): Promise<Appointment> {
    const apptRepo = AppDataSource.getRepository(Appointment);
    const appointment = await apptRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'provider'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isPatient = appointment.patient.id === userId;
    // A provider user has `providerId` in their JWT payload pointing to the
    // Provider entity.  We compare that against the appointment's provider.
    const isTreatingProvider =
      providerId !== undefined && appointment.provider.id === providerId;

    if (!isPatient && !isTreatingProvider) {
      throw new ForbiddenException(
        'Only the patient or treating provider may access this thread',
      );
    }

    return appointment;
  }

  // ─── public API ───────────────────────────────────────────────────────────

  /**
   * Returns all messages in an appointment thread, ordered oldest-first.
   * Loads sender info so the UI can identify who wrote each message.
   */
  async getThread(
    appointmentId: string,
    userId: string,
    providerId: string | undefined,
  ): Promise<Message[]> {
    await this.getAppointmentWithAccess(appointmentId, userId, providerId);

    const msgRepo = AppDataSource.getRepository(Message);
    return msgRepo.find({
      where: { appointmentId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Redacts PHI from the body and persists the message.
   * Returns the saved message with sender relation populated.
   */
  async sendMessage(
    appointmentId: string,
    senderId: string,
    providerId: string | undefined,
    rawBody: string,
  ): Promise<Message> {
    await this.getAppointmentWithAccess(appointmentId, senderId, providerId);

    const redactedBody = Redactor.redact(rawBody);
    if (redactedBody !== rawBody) {
      this.logger.warn(
        `PHI redacted in message from user ${senderId} on appointment ${appointmentId}`,
      );
    }

    const msgRepo = AppDataSource.getRepository(Message);
    const message = msgRepo.create({
      appointmentId,
      sender: { id: senderId } as User,
      senderId,
      body: redactedBody,
      read: false,
    });

    const saved = await msgRepo.save(message);

    // Return with sender relation so callers get a fully-hydrated object.
    const full = await msgRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });

    return full!;
  }

  /**
   * Marks a message as read.  Only the *recipient* (i.e., the user who
   * did NOT send the message) may call this endpoint.
   */
  async markRead(messageId: string, userId: string): Promise<Message> {
    const msgRepo = AppDataSource.getRepository(Message);
    const message = await msgRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId === userId) {
      throw new ForbiddenException(
        'Senders may not mark their own messages as read',
      );
    }

    message.read = true;
    return msgRepo.save(message);
  }

  /**
   * Returns the count of unread messages across all appointment threads
   * where the current user is the *recipient* (i.e., they are not the
   * sender of those messages).
   *
   * This powers the unread badge in the navigation header.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const msgRepo = AppDataSource.getRepository(Message);

    // We need messages where:
    //   1. The message is unread.
    //   2. The current user is NOT the sender (they are the recipient).
    //   3. The current user has access to the appointment thread.
    //
    // To satisfy (3) we join through the appointment entity and check that
    // userId is either the patient or the appointment's provider's linked
    // user.  Since the provider's user linkage requires a User→Provider join
    // we do two separate subquery counts and sum them.

    const asPatient = await msgRepo
      .createQueryBuilder('msg')
      .innerJoin('msg.appointment', 'appt')
      .where('appt.patientId = :userId', { userId })
      .andWhere('msg.senderId != :userId', { userId })
      .andWhere('msg.read = false')
      .getCount();

    // For the provider side: find all providers linked to this user account,
    // then count unread messages in their appointments.
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ['provider'],
    });

    let asProvider = 0;
    if (user?.provider) {
      asProvider = await msgRepo
        .createQueryBuilder('msg')
        .innerJoin('msg.appointment', 'appt')
        .where('appt.providerId = :providerId', { providerId: user.provider.id })
        .andWhere('msg.senderId != :userId', { userId })
        .andWhere('msg.read = false')
        .getCount();
    }

    return { count: asPatient + asProvider };
  }

  /**
   * Returns all appointment threads (appointments) that have at least one
   * message and that the current user can access.  The result includes the
   * last message for preview purposes and the unread count for that thread.
   */
  async getThreadList(
    userId: string,
    providerId: string | undefined,
  ): Promise<ThreadSummary[]> {
    const apptRepo = AppDataSource.getRepository(Appointment);

    // Load all appointments accessible to this user.
    const qb = apptRepo
      .createQueryBuilder('appt')
      .leftJoinAndSelect('appt.patient', 'patient')
      .leftJoinAndSelect('appt.provider', 'provider');

    if (providerId) {
      qb.where('appt.patientId = :userId OR appt.providerId = :providerId', {
        userId,
        providerId,
      });
    } else {
      qb.where('appt.patientId = :userId', { userId });
    }

    const appointments = await qb.getMany();
    if (appointments.length === 0) return [];

    const appointmentIds = appointments.map((a) => a.id);

    const msgRepo = AppDataSource.getRepository(Message);

    // For each appointment fetch the last message + unread count.
    const results: ThreadSummary[] = [];

    for (const appt of appointments) {
      if (!appointmentIds.includes(appt.id)) continue;

      const [lastMessage, unreadCount] = await Promise.all([
        msgRepo.findOne({
          where: { appointmentId: appt.id },
          relations: ['sender'],
          order: { created_at: 'DESC' },
        }),
        msgRepo.count({
          where: { appointmentId: appt.id, read: false },
        }),
      ]);

      // Only include threads that have at least one message.
      if (!lastMessage) continue;

      results.push({
        appointmentId: appt.id,
        appointment: appt,
        lastMessage,
        unreadCount,
      });
    }

    // Most recently active threads first.
    results.sort(
      (a, b) =>
        b.lastMessage.created_at.getTime() -
        a.lastMessage.created_at.getTime(),
    );

    return results;
  }
}

export interface ThreadSummary {
  appointmentId: string;
  appointment: Appointment;
  lastMessage: Message;
  unreadCount: number;
}
