import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as nodemailer from 'nodemailer';
import { AppDataSource, Provider, ProviderInvitation } from '@careequity/db';
import { ClaimService } from './claim.service';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(private readonly claimService: ClaimService) {}

  async sendInvitation(providerId: string, email: string): Promise<{ invitationId: string }> {
    const providerRepo = AppDataSource.getRepository(Provider);
    const invitationRepo = AppDataSource.getRepository(ProviderInvitation);

    const provider = await providerRepo.findOneBy({ id: providerId });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.is_claimed) throw new BadRequestException('Provider profile is already claimed');

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = invitationRepo.create({ provider, email, token, expires_at: expiresAt, used_at: null });
    await invitationRepo.save(invitation);

    await this.sendInvitationEmail(email, provider.name, token);

    return { invitationId: invitation.id };
  }

  async previewInvitation(token: string) {
    const invitation = await this.findValidInvitation(token);
    const p = invitation.provider;
    return {
      providerName: p.name,
      specialty: p.specialties?.[0] ?? null,
      city: p.address?.city ?? null,
      state: p.address?.state ?? null,
    };
  }

  async claimViaToken(token: string, userId: string): Promise<{ success: boolean }> {
    const invitation = await this.findValidInvitation(token);
    await this.claimService.claim(userId, invitation.provider.id);
    invitation.used_at = new Date();
    await AppDataSource.getRepository(ProviderInvitation).save(invitation);
    return { success: true };
  }

  private async findValidInvitation(token: string): Promise<ProviderInvitation & { provider: Provider }> {
    const invitationRepo = AppDataSource.getRepository(ProviderInvitation);
    const invitation = await invitationRepo.findOne({
      where: { token },
      relations: ['provider'],
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.used_at) throw new BadRequestException('Invitation has already been used');
    if (invitation.expires_at < new Date()) throw new BadRequestException('Invitation has expired');

    return invitation as ProviderInvitation & { provider: Provider };
  }

  private async sendInvitationEmail(email: string, providerName: string, token: string): Promise<void> {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      this.logger.warn(`SMTP not configured — skipping invitation email to ${email} (token: ${token})`);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const claimUrl = `${baseUrl}/en/claim/${token}`;

    const port = Number(SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      // Use implicit TLS on port 465; STARTTLS on all other ports (587, 25, etc.)
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject: `Claim your CareEquity profile — ${providerName}`,
      text: [
        `Hello,`,
        '',
        `You've been invited to claim the CareEquity profile for ${providerName}.`,
        '',
        `Click the link below to claim your profile (expires in 7 days):`,
        claimUrl,
        '',
        'If you did not request this, please ignore this email.',
        '',
        'The CareEquity Team',
      ].join('\n'),
      html: `
        <p>Hello,</p>
        <p>You've been invited to claim the CareEquity profile for <strong>${providerName}</strong>.</p>
        <p><a href="${claimUrl}" style="background:#F5BE00;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Claim Your Profile</a></p>
        <p style="color:#888;font-size:12px;">This link expires in 7 days. If you did not request this, please ignore this email.</p>
        <p>The CareEquity Team</p>
      `,
    });

    this.logger.log(`Invitation email sent to ${email} for provider ${providerName}`);
  }
}
