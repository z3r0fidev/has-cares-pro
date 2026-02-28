import { Controller, Post, Get, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InvitationService } from '../services/invitation.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/request.interface';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('send/:providerId')
  @UseGuards(JwtAuthGuard)
  async sendInvitation(
    @Param('providerId') providerId: string,
    @Body() body: { email: string },
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.invitationService.sendInvitation(providerId, body.email);
  }

  @Get('preview/:token')
  async previewInvitation(@Param('token') token: string) {
    return this.invitationService.previewInvitation(token);
  }

  @Post('claim/:token')
  @UseGuards(JwtAuthGuard)
  async claimViaToken(
    @Param('token') token: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.invitationService.claimViaToken(token, req.user.sub);
  }
}
