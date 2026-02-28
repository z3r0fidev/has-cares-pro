import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AppDataSource, Appointment, AppointmentStatus, SavedProvider, User, Provider } from '@careequity/db';
import { SmsService } from './sms.service';

@Injectable()
export class BookingService {
  constructor(private readonly smsService: SmsService) {}

  async createAppointment(userId: string, providerId: string, date: Date, reason: string) {
    const repo = AppDataSource.getRepository(Appointment);
    const appointment = repo.create({
      patient: { id: userId } as User,
      provider: { id: providerId } as Provider,
      appointment_date: date,
      reason,
      status: AppointmentStatus.PENDING
    });
    const saved = await repo.save(appointment);

    // Send SMS confirmation if the patient has a phone number on file
    const full = await repo.findOne({
      where: { id: saved.id },
      relations: ['patient', 'provider'],
    });
    if (full?.patient?.phone) {
      const formattedDate = full.appointment_date.toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      await this.smsService.sendBookingConfirmation(full.patient.phone, full.provider.name, formattedDate);
    }

    return saved;
  }

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    const repo = AppDataSource.getRepository(Appointment);
    return repo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'provider'],
    });
  }

  async getPatientAppointments(userId: string) {
    const repo = AppDataSource.getRepository(Appointment);
    return repo.find({ where: { patient: { id: userId } } });
  }

  async getProviderAppointments(providerId: string) {
    const repo = AppDataSource.getRepository(Appointment);
    return repo.find({ where: { provider: { id: providerId } } });
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    requestingUserId: string,
    requestingProviderId: string | undefined,
    requestingRole: string,
  ) {
    const repo = AppDataSource.getRepository(Appointment);
    const appt = await repo.findOne({ where: { id }, relations: ['provider'] });
    if (!appt) throw new NotFoundException();

    const isAdmin = requestingRole === 'admin';
    const isOwningProvider =
      requestingRole === 'provider' &&
      requestingProviderId !== undefined &&
      appt.provider?.id === requestingProviderId;

    if (!isAdmin && !isOwningProvider) {
      throw new ForbiddenException('Only the treating provider or an admin may update appointment status');
    }

    appt.status = status;
    return repo.save(appt);
  }

  async cancelAppointment(appointmentId: string, userId: string) {
    const repo = AppDataSource.getRepository(Appointment);
    const appt = await repo.findOne({ where: { id: appointmentId }, relations: ['patient'] });
    if (!appt) throw new NotFoundException();
    if (appt.patient.id !== userId) throw new ForbiddenException();
    appt.status = AppointmentStatus.CANCELLED;
    return repo.save(appt);
  }

  async toggleSavedProvider(userId: string, providerId: string) {
    const repo = AppDataSource.getRepository(SavedProvider);
    const existing = await repo.findOne({ where: { user: { id: userId }, provider: { id: providerId } } });
    
    if (existing) {
      await repo.remove(existing);
      return { saved: false };
    } else {
      const saved = repo.create({ user: { id: userId } as User, provider: { id: providerId } as Provider });
      await repo.save(saved);
      return { saved: true };
    }
  }

  async getSavedProviders(userId: string) {
    const repo = AppDataSource.getRepository(SavedProvider);
    return repo.find({ where: { user: { id: userId } } });
  }
}
