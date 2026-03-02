import { Controller, Get, Patch, Post, Delete, Param, Body, NotFoundException, UseGuards, Request, ForbiddenException, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppDataSource, Provider, VerificationRecord, VerificationStatus, Review } from '@careequity/db';
import { esClient, INDEX_NAME } from '@careequity/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/request.interface';
import { NotificationService } from '../services/notification.service';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly notificationService: NotificationService) {}
  
  @Get('providers/unclaimed')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List unclaimed provider profiles (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated list of unclaimed providers' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getUnclaimedProviders(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = '1',
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');

    const repo = AppDataSource.getRepository(Provider);
    const limit = 20;
    const offset = (parseInt(page, 10) - 1) * limit;

    const [providers, total] = await repo.findAndCount({
      where: { is_claimed: false },
      select: ['id', 'name', 'specialties', 'address', 'verification_tier'],
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return { providers, total, page: parseInt(page, 10), limit };
  }

  @Get('verifications/pending')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all pending verification requests (admin)' })
  @ApiResponse({ status: 200, description: 'List of pending verification records' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getPendingVerifications(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');
    
    const repo = AppDataSource.getRepository(VerificationRecord);
    return repo.find({ 
      where: { status: VerificationStatus.SUBMITTED },
      relations: ['provider']
    });
  }

  @Get('reviews/flagged')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get flagged reviews awaiting moderation (admin)' })
  @ApiResponse({ status: 200, description: 'List of flagged reviews' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getFlaggedReviews(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');

    const repo = AppDataSource.getRepository(Review);
    return repo.find({ where: { status: 'flagged' }, relations: ['provider'] });
  }

  @Patch('reviews/:id/moderate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Publish or delete a flagged review (admin)' })
  @ApiResponse({ status: 200, description: 'Review moderated' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async moderateReview(
    @Param('id') id: string,
    @Body() body: { action: 'publish' | 'delete' },
    @Request() req: AuthenticatedRequest
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');

    const repo = AppDataSource.getRepository(Review);
    const review = await repo.findOneBy({ id });
    if (!review) throw new NotFoundException();

    if (body.action === 'delete') {
      await repo.remove(review);
    } else {
      review.status = 'published';
      await repo.save(review);
    }

    return { success: true };
  }

  @Post('test-email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a test insurance-verification email (admin)' })
  @ApiResponse({ status: 201, description: 'Test email dispatched' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async sendTestEmail(
    @Body() body: { email: string; name?: string },
    @Request() req: AuthenticatedRequest
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');

    await this.notificationService.sendInsuranceVerificationEmail(
      body.email,
      body.name || 'Test User'
    );

    return { success: true, message: `Test email sent to ${body.email}` };
  }

  @Delete('providers/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a provider profile (admin)' })
  @ApiResponse({ status: 204, description: 'Provider soft-deleted' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async softDeleteProvider(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');

    const repo = AppDataSource.getRepository(Provider);
    const provider = await repo.findOneBy({ id });
    if (!provider) throw new NotFoundException();

    await repo.softDelete(id);

    // Remove from search index so it no longer appears in results
    try {
      await esClient.delete({ index: INDEX_NAME, id });
    } catch {
      // Not found in ES is acceptable
    }
  }

  @Post('providers/:id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Restore a soft-deleted provider (admin)' })
  @ApiResponse({ status: 200, description: 'Provider restored' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Provider not found or not deleted' })
  async restoreProvider(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');

    const repo = AppDataSource.getRepository(Provider);
    const provider = await repo.findOne({ where: { id }, withDeleted: true });
    if (!provider || !provider.deleted_at) throw new NotFoundException('Provider not found or not deleted');

    await repo.restore(id);

    // Re-index restored provider in Elasticsearch
    let esLocation = null;
    if (provider.location && (provider.location as { coordinates: number[] }).coordinates) {
      esLocation = {
        lon: (provider.location as { coordinates: number[] }).coordinates[0],
        lat: (provider.location as { coordinates: number[] }).coordinates[1],
      };
    }

    await esClient.index({
      index: INDEX_NAME,
      id: provider.id,
      document: {
        id: provider.id,
        name: provider.name,
        specialties: provider.specialties,
        languages: provider.languages,
        location: esLocation,
        address: provider.address,
        insurance: provider.insurance,
        verification_tier: provider.verification_tier,
        profile_image_url: provider.profile_image_url,
        website_url: provider.website_url,
      },
    });

    return { success: true, message: 'Provider restored' };
  }

  @Patch('verify/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve or reject a provider verification request (admin)' })
  @ApiResponse({ status: 200, description: 'Verification record updated' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async verifyProvider(
    @Param('id') id: string,
    @Body() body: { tier: number; status: string; notes: string },
    @Request() req: AuthenticatedRequest
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const providerRepo = AppDataSource.getRepository(Provider);
    const recordRepo = AppDataSource.getRepository(VerificationRecord);

    const provider = await providerRepo.findOneBy({ id });
    if (!provider) throw new NotFoundException();

    // Create a new record or update existing pending
    let record = await recordRepo.findOne({ 
      where: { provider: { id }, status: VerificationStatus.SUBMITTED } 
    });

    if (!record) {
      record = new VerificationRecord();
      record.provider = provider;
    }

    record.tier = body.tier;
    record.status = body.status as VerificationStatus;
    record.notes = body.notes;
    record.reviewer_id = req.user.sub;

    await recordRepo.save(record);

    if (body.status === 'approved') {
      provider.verification_tier = body.tier;
      await providerRepo.save(provider);
    }

    return { success: true };
  }
}
