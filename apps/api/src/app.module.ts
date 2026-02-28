import { Module, OnModuleInit, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ProviderController } from './controllers/provider.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { BookingController } from './controllers/booking.controller';
import { HealthController } from './controllers/health.controller';
import { InvitationController } from './controllers/invitation.controller';
import { MessagingController } from './controllers/messaging.controller';
import { ReferralController } from './controllers/referral.controller';
import { EligibilityController } from './controllers/eligibility.controller';
import { FhirController } from './controllers/fhir.controller';
import { SearchService } from './services/search.service';
import { ProviderService } from './services/provider.service';
import { ReviewService } from './services/review.service';
import { ClaimService } from './services/claim.service';
import { AuthService } from './services/auth.service';
import { ImageScraperService } from './services/image-scraper.service';
import { AnalyticsService } from './services/analytics.service';
import { BookingService } from './services/booking.service';
import { NotificationService } from './services/notification.service';
import { SmsService } from './services/sms.service';
import { InvitationService } from './services/invitation.service';
import { MessagingService } from './services/messaging.service';
import { EligibilityService } from './services/eligibility.service';
import { FhirService } from './services/fhir.service';
import { AppDataSource } from '@careequity/db';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
  controllers: [ProviderController, AdminController, AuthController, AnalyticsController, BookingController, HealthController, InvitationController, MessagingController, ReferralController, EligibilityController, FhirController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    SearchService,
    ProviderService,
    ReviewService,
    ClaimService,
    AuthService,
    ImageScraperService,
    AnalyticsService,
    BookingService,
    NotificationService,
    SmsService,
    InvitationService,
    MessagingService,
    EligibilityService,
    FhirService,
    {
      provide: 'DATA_SOURCE',
      useFactory: async () => {
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }
        return AppDataSource;
      },
    },
  ],
  exports: ['DATA_SOURCE'],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  }
}
