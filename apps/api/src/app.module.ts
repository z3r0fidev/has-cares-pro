import { Module, OnModuleInit, Global } from '@nestjs/common';
import { ProviderController } from './controllers/provider.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { SearchService } from './services/search.service';
import { ProviderService } from './services/provider.service';
import { ReviewService } from './services/review.service';
import { ClaimService } from './services/claim.service';
import { AuthService } from './services/auth.service';
import { ImageScraperService } from './services/image-scraper.service';
import { AppDataSource } from '@careequity/db';

@Global()
@Module({
  imports: [],
  controllers: [ProviderController, AdminController, AuthController],
  providers: [
    SearchService,
    ProviderService,
    ReviewService,
    ClaimService,
    AuthService,
    ImageScraperService,    {
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
