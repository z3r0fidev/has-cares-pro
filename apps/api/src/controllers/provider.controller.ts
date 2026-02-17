import { Controller, Get, Post, Patch, Body, Param, Query, NotFoundException, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { ProviderService } from '../services/provider.service';
import { ReviewService } from '../services/review.service';
import { ClaimService } from '../services/claim.service';
import { ImageScraperService } from '../services/image-scraper.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AppDataSource, Provider } from '@careequity/db';
import { esClient, INDEX_NAME } from '@careequity/core';

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
    const filters: Record<string, any> = {};
    if (specialty) filters['specialty'] = specialty;
    if (insurance) filters['insurance'] = insurance;

    return this.searchService.searchProviders(
      parseFloat(lat),
      parseFloat(lon),
      parseInt(radius || '25', 10),
      filters,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const provider = await this.providerService.findOne(id);
    if (!provider) throw new NotFoundException();
    return provider;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateData: any, @Request() req: any) {
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
      // Fire and forget scrape to not block the response
      this.scraperService.scrapeAndStore(id, updateData.website_url).catch(err => 
        console.error(`Automated scraping failed for ${id}:`, err.message)
      );
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
        location: provider.location, // Keep existing location
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
  async createReview(@Param('id') id: string, @Body() reviewData: any) {
    return this.reviewService.create(id, reviewData);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  async claimProfile(@Param('id') id: string, @Request() req: any) {
    return this.claimService.claim(req.user.sub, id);
  }
}
