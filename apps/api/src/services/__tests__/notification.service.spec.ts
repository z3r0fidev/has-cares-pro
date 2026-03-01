/**
 * NotificationService unit tests
 *
 * Strategy:
 *  - jest.mock('nodemailer') at module scope to intercept createTransport/sendMail
 *  - jest.mock('@careequity/db') to stub AppDataSource without a live DB
 *  - SmsService is passed as a mock via NestJS TestingModule
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { SmsService } from '../sms.service';

// --------------------------------------------------------------------------
// nodemailer mock
// --------------------------------------------------------------------------
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = jest.fn().mockReturnValue({ sendMail: mockSendMail });

jest.mock('nodemailer', () => ({
  createTransport: (...args: unknown[]) => mockCreateTransport(...args),
}));

// --------------------------------------------------------------------------
// @careequity/db mock
// --------------------------------------------------------------------------
const mockGetMany = jest.fn();
const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: mockGetMany,
};
const mockProviderUpdate = jest.fn().mockResolvedValue({ affected: 1 });
const mockGetRepository = jest.fn((entity: { name: string }) => {
  if (entity.name === 'User') {
    return { createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) };
  }
  // Provider
  return { update: mockProviderUpdate };
});

jest.mock('@careequity/db', () => ({
  AppDataSource: {
    getRepository: (entity: { name: string }) => mockGetRepository(entity),
  },
  // These are type-only references in the service; exporting empty objects satisfies imports
  User: class User {},
  Provider: class Provider {},
}));

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'dr.smith@example.com',
    phone: '+15005550006',
    provider: { id: 'provider-1', name: 'Dr. Smith' },
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------
describe('NotificationService', () => {
  let service: NotificationService;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: SmsService,
          useValue: {
            sendAppointmentReminder: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    smsService = module.get(SmsService);
  });

  // -------------------------------------------------------------------------
  // sendInsuranceVerificationEmail
  // -------------------------------------------------------------------------
  describe('sendInsuranceVerificationEmail', () => {
    const savedEnv = process.env;

    beforeEach(() => {
      process.env = { ...savedEnv };
    });

    afterAll(() => {
      process.env = savedEnv;
    });

    it('no-ops when SMTP_HOST is absent', async () => {
      delete process.env.SMTP_HOST;
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASSWORD = 'pass';

      await service.sendInsuranceVerificationEmail('a@b.com', 'Dr. A');

      expect(mockCreateTransport).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('no-ops when SMTP_USER is absent', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      delete process.env.SMTP_USER;
      process.env.SMTP_PASSWORD = 'pass';

      await service.sendInsuranceVerificationEmail('a@b.com', 'Dr. A');

      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it('no-ops when SMTP_PASSWORD is absent', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user';
      delete process.env.SMTP_PASSWORD;

      await service.sendInsuranceVerificationEmail('a@b.com', 'Dr. A');

      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it('creates transporter with correct host/port and calls sendMail', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASSWORD = 'secret';
      process.env.SMTP_FROM = 'noreply@example.com';

      await service.sendInsuranceVerificationEmail('dr@example.com', 'Dr. Jones');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          auth: { user: 'user@example.com', pass: 'secret' },
        }),
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dr@example.com',
          from: 'noreply@example.com',
          subject: expect.stringContaining('insurance'),
        }),
      );
    });

    it('uses secure:true on port 465', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASSWORD = 'pass';

      await service.sendInsuranceVerificationEmail('a@b.com', 'Dr. A');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 465, secure: true }),
      );
    });

    it('uses secure:false on port 587', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASSWORD = 'pass';

      await service.sendInsuranceVerificationEmail('a@b.com', 'Dr. A');

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 587, secure: false }),
      );
    });

    it('email text and html contain the provider name', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASSWORD = 'pass';

      await service.sendInsuranceVerificationEmail('doc@clinic.com', 'Dr. Rivera');

      const mailArgs = mockSendMail.mock.calls[0][0];
      expect(mailArgs.text).toContain('Dr. Rivera');
      expect(mailArgs.html).toContain('Dr. Rivera');
    });

    it('falls back to SMTP_USER as from address when SMTP_FROM is unset', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'fallback@example.com';
      process.env.SMTP_PASSWORD = 'pass';
      delete process.env.SMTP_FROM;

      await service.sendInsuranceVerificationEmail('doc@clinic.com', 'Dr. Lee');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'fallback@example.com' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // notifyOverdueProviders
  // -------------------------------------------------------------------------
  describe('notifyOverdueProviders', () => {
    const savedEnv = process.env;

    beforeEach(() => {
      // Disable email sending so unit tests don't hit SMTP code paths
      process.env = { ...savedEnv };
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;
    });

    afterAll(() => {
      process.env = savedEnv;
    });

    it('does nothing when getMany returns []', async () => {
      mockGetMany.mockResolvedValueOnce([]);

      await service.notifyOverdueProviders();

      expect(smsService.sendAppointmentReminder).not.toHaveBeenCalled();
      expect(mockProviderUpdate).not.toHaveBeenCalled();
    });

    it('builds query with correct where clauses', async () => {
      mockGetMany.mockResolvedValueOnce([]);

      await service.notifyOverdueProviders();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.role = :role',
        { role: 'provider' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'provider.is_claimed = true',
      );
      // Third andWhere checks the 90-day interval condition
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('90 days'),
      );
    });

    it('calls smsService.sendAppointmentReminder for users with a phone', async () => {
      const user = buildUser({ phone: '+15005550006' });
      mockGetMany.mockResolvedValueOnce([user]);

      await service.notifyOverdueProviders();

      expect(smsService.sendAppointmentReminder).toHaveBeenCalledWith(
        '+15005550006',
        'Dr. Smith',
        'tomorrow',
      );
    });

    it('skips SMS when user.phone is null', async () => {
      const user = buildUser({ phone: null });
      mockGetMany.mockResolvedValueOnce([user]);

      await service.notifyOverdueProviders();

      expect(smsService.sendAppointmentReminder).not.toHaveBeenCalled();
    });

    it('skips SMS when user.phone is undefined', async () => {
      const user = buildUser({ phone: undefined });
      mockGetMany.mockResolvedValueOnce([user]);

      await service.notifyOverdueProviders();

      expect(smsService.sendAppointmentReminder).not.toHaveBeenCalled();
    });

    it('updates last_insurance_notified_at after processing each user', async () => {
      const user = buildUser({ phone: null });
      mockGetMany.mockResolvedValueOnce([user]);

      await service.notifyOverdueProviders();

      expect(mockProviderUpdate).toHaveBeenCalledWith(
        'provider-1',
        expect.objectContaining({ last_insurance_notified_at: expect.any(Date) }),
      );
    });

    it('continues processing remaining users when one throws', async () => {
      const user1 = buildUser({ id: 'user-1', email: 'a@b.com', provider: { id: 'p1', name: 'Dr. A' }, phone: null });
      const user2 = buildUser({ id: 'user-2', email: 'c@d.com', provider: { id: 'p2', name: 'Dr. B' }, phone: null });
      mockGetMany.mockResolvedValueOnce([user1, user2]);

      // Make the first provider update throw; second should still succeed
      mockProviderUpdate
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ affected: 1 });

      await expect(service.notifyOverdueProviders()).resolves.toBeUndefined();

      // Second provider should still be updated
      expect(mockProviderUpdate).toHaveBeenCalledTimes(2);
    });

    it('processes multiple overdue users', async () => {
      const users = [
        buildUser({ id: 'u1', phone: '+15005550001', provider: { id: 'p1', name: 'Dr. One' } }),
        buildUser({ id: 'u2', phone: '+15005550002', provider: { id: 'p2', name: 'Dr. Two' } }),
        buildUser({ id: 'u3', phone: null, provider: { id: 'p3', name: 'Dr. Three' } }),
      ];
      mockGetMany.mockResolvedValueOnce(users);

      await service.notifyOverdueProviders();

      expect(smsService.sendAppointmentReminder).toHaveBeenCalledTimes(2);
      expect(mockProviderUpdate).toHaveBeenCalledTimes(3);
    });
  });
});
