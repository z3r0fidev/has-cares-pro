import { Module, OnModuleInit, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProviderController } from './controllers/provider.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { BookingController } from './controllers/booking.controller';
import { HealthController } from './controllers/health.controller';
import { SearchService } from './services/search.service';
import { ProviderService } from './services/provider.service';
import { ReviewService } from './services/review.service';
import { ClaimService } from './services/claim.service';
import { AuthService } from './services/auth.service';
import { ImageScraperService } from './services/image-scraper.service';
import { AnalyticsService } from './services/analytics.service';
import { BookingService } from './services/booking.service';
import { NotificationService } from './services/notification.service';
import { AppDataSource } from '@careequity/db';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ProviderController, AdminController, AuthController, AnalyticsController, BookingController, HealthController],
  providers: [
    SearchService,
    ProviderService,
    ReviewService,
    ClaimService,
    AuthService,
    ImageScraperService,
    AnalyticsService,
    BookingService,
    NotificationService,
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
