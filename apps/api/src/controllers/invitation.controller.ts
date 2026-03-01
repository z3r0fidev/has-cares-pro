import { Controller, Post, Get, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvitationService } from '../services/invitation.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/request.interface';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('send/:providerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send an email invitation to claim a provider profile (admin)' })
  @ApiResponse({ status: 201, description: 'Invitation email sent' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
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
  @ApiOperation({ summary: 'Preview invitation details by token (public)' })
  @ApiResponse({ status: 200, description: 'Provider name and specialty for the invitation' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async previewInvitation(@Param('token') token: string) {
    return this.invitationService.previewInvitation(token);
  }

  @Post('claim/:token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim a provider profile via invitation token' })
  @ApiResponse({ status: 201, description: 'Profile claimed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token' })
  async claimViaToken(
    @Param('token') token: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.invitationService.claimViaToken(token, req.user.sub);
  }
}
