import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/request.interface';
import { AppDataSource, ProviderReferral, Provider, User } from '@careequity/db';
import { CreateReferralDto, UpdateReferralStatusDto } from '../dto/referral.dto';

/**
 * Handles provider-to-provider patient referrals.
 *
 * All routes require a valid JWT.  Role enforcement:
 *  - Creating and sending referrals: provider role only
 *  - Accepting / declining: only the receiving provider (toProvider)
 *  - Viewing patient's own referrals: patient role
 */
@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  /** POST /referrals — provider creates a referral */
  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateReferralDto,
  ) {
    if (req.user.role !== 'provider') {
      throw new ForbiddenException('Only providers can create referrals');
    }

    if (!req.user.providerId) {
      throw new ForbiddenException('Your account does not have a linked provider profile');
    }

    const repo = AppDataSource.getRepository(ProviderReferral);

    // Verify the target provider exists
    const toProvider = await AppDataSource.getRepository(Provider).findOneBy({ id: body.toProviderId });
    if (!toProvider) {
      throw new NotFoundException(`Provider ${body.toProviderId} not found`);
    }

    // Verify the patient exists
    const patient = await AppDataSource.getRepository(User).findOneBy({ id: body.patientId });
    if (!patient) {
      throw new NotFoundException(`Patient ${body.patientId} not found`);
    }

    const referral = repo.create({
      fromProvider: { id: req.user.providerId } as Provider,
      toProvider: { id: body.toProviderId } as Provider,
      patient: { id: body.patientId } as User,
      note: body.note ?? null,
      status: 'pending',
    });

    return repo.save(referral);
  }

  /** GET /referrals/sent — referrals sent by this provider */
  @Get('sent')
  async getSent(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'provider') {
      throw new ForbiddenException('Only providers can view sent referrals');
    }

    if (!req.user.providerId) {
      throw new ForbiddenException('Your account does not have a linked provider profile');
    }

    const repo = AppDataSource.getRepository(ProviderReferral);
    return repo.find({
      where: { fromProvider: { id: req.user.providerId } },
      order: { created_at: 'DESC' },
    });
  }

  /** GET /referrals/received — referrals received by this provider */
  @Get('received')
  async getReceived(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'provider') {
      throw new ForbiddenException('Only providers can view received referrals');
    }

    if (!req.user.providerId) {
      throw new ForbiddenException('Your account does not have a linked provider profile');
    }

    const repo = AppDataSource.getRepository(ProviderReferral);
    return repo.find({
      where: { toProvider: { id: req.user.providerId } },
      order: { created_at: 'DESC' },
    });
  }

  /** GET /referrals/my-referrals — patient views their own referrals */
  @Get('my-referrals')
  async getMyReferrals(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'patient') {
      throw new ForbiddenException('Only patients can view their own referrals');
    }

    const repo = AppDataSource.getRepository(ProviderReferral);
    return repo.find({
      where: { patient: { id: req.user.sub } },
      order: { created_at: 'DESC' },
    });
  }

  /** PATCH /referrals/:id/status — toProvider accepts or declines */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateReferralStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'provider') {
      throw new ForbiddenException('Only providers can update referral status');
    }

    const repo = AppDataSource.getRepository(ProviderReferral);
    const referral = await repo.findOne({
      where: { id },
      relations: ['toProvider'],
    });

    if (!referral) {
      throw new NotFoundException(`Referral ${id} not found`);
    }

    // Only the provider who is the target of the referral may accept/decline
    if (referral.toProvider.id !== req.user.providerId) {
      throw new ForbiddenException('Only the receiving provider may accept or decline this referral');
    }

    referral.status = body.status;
    return repo.save(referral);
  }
}
