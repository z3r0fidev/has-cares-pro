import { Controller, Patch, Param, Body, NotFoundException, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AppDataSource, Provider, VerificationRecord, VerificationStatus } from '@careequity/db';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  @Patch('verify/:id')
  @UseGuards(JwtAuthGuard)
  async verifyProvider(
    @Param('id') id: string,
    @Body() body: { tier: number; status: string; notes: string },
    @Request() req: any
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    const providerRepo = AppDataSource.getRepository(Provider);
    const recordRepo = AppDataSource.getRepository(VerificationRecord);

    const provider = await providerRepo.findOneBy({ id });
    if (!provider) throw new NotFoundException();

    const record = new VerificationRecord();
    record.provider = provider;
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
