import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /**
   * Sends a booking confirmation SMS to the patient.
   * No-ops gracefully when Twilio environment variables are absent.
   */
  async sendBookingConfirmation(toPhone: string, providerName: string, date: string): Promise<void> {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      this.logger.warn(`Twilio not configured — skipping booking confirmation SMS to ${toPhone}`);
      return;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const body = [
      `Your appointment with ${providerName} is confirmed for ${date}.`,
      'Reply STOP to opt out.',
      '— CareEquity',
    ].join(' ');

    await client.messages.create({
      body,
      from: TWILIO_FROM_NUMBER,
      to: toPhone,
    });

    this.logger.log(`Booking confirmation SMS sent to ${toPhone}`);
  }

  /**
   * Sends a 24-hour appointment reminder SMS to the patient.
   * No-ops gracefully when Twilio environment variables are absent.
   */
  async sendAppointmentReminder(toPhone: string, providerName: string, date: string): Promise<void> {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      this.logger.warn(`Twilio not configured — skipping appointment reminder SMS to ${toPhone}`);
      return;
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const body = [
      `Reminder: You have an appointment with ${providerName} tomorrow, ${date}.`,
      'Reply STOP to opt out.',
      '— CareEquity',
    ].join(' ');

    await client.messages.create({
      body,
      from: TWILIO_FROM_NUMBER,
      to: toPhone,
    });

    this.logger.log(`Appointment reminder SMS sent to ${toPhone}`);
  }
}
