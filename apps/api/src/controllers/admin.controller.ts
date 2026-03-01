import { Controller, Get, Patch, Post, Param, Body, NotFoundException, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { AppDataSource, Provider, VerificationRecord, VerificationStatus, Review } from '@careequity/db';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/request.interface';
import { NotificationService } from '../services/notification.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly notificationService: NotificationService) {}
  
  @Get('providers/unclaimed')
  @UseGuards(JwtAuthGuard)
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
  async getFlaggedReviews(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');

    const repo = AppDataSource.getRepository(Review);
    return repo.find({ where: { status: 'flagged' }, relations: ['provider'] });
  }

  @Patch('reviews/:id/moderate')
  @UseGuards(JwtAuthGuard)
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

  @Patch('verify/:id')
  @UseGuards(JwtAuthGuard)
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
