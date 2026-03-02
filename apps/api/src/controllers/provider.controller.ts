import { Controller, Get, Post, Patch, Body, Param, Query, NotFoundException, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateReviewDto } from '../dto/review.dto';
import { UpdateProviderDto } from '../dto/provider.dto';
import { SearchService } from '../services/search.service';
import { ProviderService } from '../services/provider.service';
import { ReviewService } from '../services/review.service';
import { ClaimService } from '../services/claim.service';
import { ImageScraperService } from '../services/image-scraper.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AppDataSource, Provider, VerificationRecord, VerificationStatus, Point, Review } from '@careequity/db';
import { esClient, INDEX_NAME } from '@careequity/core';
import { AuthenticatedRequest } from '../types/request.interface';

@ApiTags('providers')
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Search providers by location, specialty, and insurance' })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: 40.7128 })
  @ApiQuery({ name: 'lon', required: true, type: Number, example: -74.006 })
  @ApiQuery({ name: 'radius', required: false, type: Number, example: 25 })
  @ApiQuery({ name: 'specialty', required: false, type: String })
  @ApiQuery({ name: 'insurance', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of matching providers' })
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

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated patient's own reviews" })
  @ApiResponse({ status: 200, description: 'List of reviews submitted by the current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReviews(@Request() req: AuthenticatedRequest) {
    const reviewRepo = AppDataSource.getRepository(Review);
    return reviewRepo.find({
      where: { patient_id: req.user.sub },
      relations: ['provider'],
      order: { created_at: 'DESC' },
    });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated provider's own profile" })
  @ApiResponse({ status: 200, description: 'Provider profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No linked provider profile' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    if (!req.user.providerId) {
      throw new NotFoundException('No provider profile associated with this user');
    }
    const provider = await this.providerService.findOne(req.user.providerId);
    if (!provider) throw new NotFoundException();
    return provider;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider found' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async findOne(@Param('id') id: string) {
    const provider = await this.providerService.findOne(id);
    if (!provider) throw new NotFoundException();
    return provider;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a provider profile (provider or admin)' })
  @ApiResponse({ status: 200, description: 'Updated provider' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async update(@Param('id') id: string, @Body() updateData: UpdateProviderDto, @Request() req: AuthenticatedRequest) {
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
  @ApiOperation({ summary: 'Get all published reviews for a provider' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getReviews(@Param('id') id: string) {
    return this.reviewService.findByProvider(id);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review for a provider' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createReview(
    @Param('id') id: string,
    @Body() reviewData: CreateReviewDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Attach the authenticated patient's ID to the review so it is traceable
    return this.reviewService.create(id, { ...reviewData, patient_id: req.user.sub });
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim an unclaimed provider profile' })
  @ApiResponse({ status: 201, description: 'Profile claimed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async claimProfile(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.claimService.claim(req.user.sub, id);
  }

  @Post('verify-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a verification tier upgrade request' })
  @ApiResponse({ status: 201, description: 'Verification request submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No linked provider profile' })
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
