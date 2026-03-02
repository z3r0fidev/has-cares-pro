import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { AppDataSource, User, Provider } from '@careequity/db';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly smsService: SmsService) {}

  async sendInsuranceVerificationEmail(email: string, name: string): Promise<void> {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
      this.logger.warn(`SMTP not configured — skipping email to ${email}`);
      return;
    }

    const port = Number(SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      // Use implicit TLS on port 465; STARTTLS on all other ports
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject: 'Action Required: Please verify your accepted insurance list',
      text: [
        `Hi ${name},`,
        '',
        'It has been 90 days since your insurance list was last verified on CareEquity.',
        'Please log in and confirm that your accepted insurance plans are accurate so patients can find you.',
        '',
        'Thank you,',
        'The CareEquity Team',
      ].join('\n'),
      html: `
        <p>Hi ${name},</p>
        <p>It has been 90 days since your insurance list was last verified on CareEquity.</p>
        <p>Please log in and confirm that your accepted insurance plans are accurate so patients can find you.</p>
        <p>Thank you,<br>The CareEquity Team</p>
      `,
    });

    this.logger.log(`Insurance verification email sent to ${email}`);
  }

  async notifyOverdueProviders(): Promise<void> {
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.provider', 'provider')
      .where('user.role = :role', { role: 'provider' })
      .andWhere('provider.is_claimed = true')
      .andWhere(
        "provider.last_insurance_notified_at IS NULL OR provider.last_insurance_notified_at < NOW() - INTERVAL '90 days'"
      )
      .getMany();

    this.logger.log(`Found ${users.length} provider(s) overdue for insurance verification`);

    for (const user of users) {
      try {
        await this.sendInsuranceVerificationEmail(user.email, user.provider!.name);

        if (user.phone) {
          await this.smsService.sendAppointmentReminder(user.phone, user.provider!.name, 'tomorrow');
        }

        user.provider!.last_insurance_notified_at = new Date();
        await AppDataSource.getRepository(Provider).save(user.provider!);
      } catch (err) {
        this.logger.error(`Failed to notify ${user.email}: ${(err as Error).message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkInsuranceNotifications(): Promise<void> {
    this.logger.log('Running daily insurance verification notification check');
    await this.notifyOverdueProviders();
  }
}
