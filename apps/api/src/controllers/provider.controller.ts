import { Controller, Get, Post, Patch, Body, Param, Query, NotFoundException, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { ProviderService } from '../services/provider.service';
import { ReviewService } from '../services/review.service';
import { ClaimService } from '../services/claim.service';
import { ImageScraperService } from '../services/image-scraper.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AppDataSource, Provider, VerificationRecord, VerificationStatus, Point } from '@careequity/db';
import { esClient, INDEX_NAME } from '@careequity/core';
import { AuthenticatedRequest } from '../types/request.interface';

@Controller('providers')
export class ProviderController {
  constructor(
    private readonly searchService: SearchService,
    private readonly providerService: ProviderService,
    private readonly reviewService: ReviewService,
    private readonly claimService: ClaimService,
    private readonly scraperService: ImageScraperService,
  ) {}

  @Get()
  async findAll(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radius') radius: string,
    @Query('specialty') specialty: string,
    @Query('insurance') insurance: string,
  ) {
    const filters: Record<string, string> = {};
    if (specialty) filters['specialty'] = specialty;
    if (insurance) filters['insurance'] = insurance;

    return this.searchService.searchProviders(
      parseFloat(lat),
      parseFloat(lon),
      parseInt(radius || '25', 10),
      filters,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: AuthenticatedRequest) {
    if (!req.user.providerId) {
      throw new NotFoundException('No provider profile associated with this user');
    }
    const provider = await this.providerService.findOne(req.user.providerId);
    if (!provider) throw new NotFoundException();
    return provider;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const provider = await this.providerService.findOne(id);
    if (!provider) throw new NotFoundException();
    return provider;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateData: Partial<Provider>, @Request() req: AuthenticatedRequest) {
    if (req.user.providerId !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own profile');
    }

    const repo = AppDataSource.getRepository(Provider);
    const provider = await repo.findOneBy({ id });
    if (!provider) throw new NotFoundException();

    // Check if website_url changed to trigger scraping
    const shouldScrape = updateData.website_url && updateData.website_url !== provider.website_url;

    Object.assign(provider, updateData);
    await repo.save(provider);

    if (shouldScrape) {
      this.scraperService.scrapeAndStore(id, updateData.website_url!).catch(err => 
        console.error(`Automated scraping failed for ${id}:`, err.message)
      );
    }

    // Extract lat/lon from the GeoJSON object for ES
    let esLocation = null;
    if (provider.location && (provider.location as Point).coordinates) {
      esLocation = {
        lon: (provider.location as Point).coordinates[0],
        lat: (provider.location as Point).coordinates[1]
      };
    }

    // Sync to ES
    await esClient.index({
      index: INDEX_NAME,
      id: provider.id,
      document: {
        id: provider.id,
        name: provider.name,
        specialties: provider.specialties,
        languages: provider.languages,
        location: esLocation, // Correctly formatted for ES geo_point
        address: provider.address,
        insurance: provider.insurance,
        verification_tier: provider.verification_tier,
        profile_image_url: provider.profile_image_url,
        website_url: provider.website_url
      },
    });

    return provider;
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.reviewService.findByProvider(id);
  }

  @Post(':id/reviews')
  async createReview(@Param('id') id: string, @Body() reviewData: { rating_total: number; content: string }) {
    return this.reviewService.create(id, reviewData);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  async claimProfile(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.claimService.claim(req.user.sub, id);
  }

  @Post('verify-request')
  @UseGuards(JwtAuthGuard)
  async requestVerification(@Request() req: AuthenticatedRequest) {
    if (!req.user.providerId) throw new NotFoundException('No provider profile found');
    
    const recordRepo = AppDataSource.getRepository(VerificationRecord);
    const providerRepo = AppDataSource.getRepository(Provider);
    const provider = await providerRepo.findOneBy({ id: req.user.providerId });

    if (!provider) throw new NotFoundException();

    const record = new VerificationRecord();
    record.provider = provider;
    record.tier = provider.verification_tier < 3 ? provider.verification_tier + 1 : 3;
    record.status = VerificationStatus.SUBMITTED;
    record.notes = "Self-submitted verification request";
    
    await recordRepo.save(record);
    return { success: true, requestedTier: record.tier };
  }
}
