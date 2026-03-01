import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MessagingService } from '../services/messaging.service';
import { SendMessageDto } from '../dto/message.dto';
import { AuthenticatedRequest } from '../types/request.interface';

/**
 * MessagingController — HIPAA-compliant in-app messaging between providers
 * and their patients, scoped to individual appointments.
 *
 * All endpoints require a valid JWT.  Authorization (patient vs. provider
 * access) is enforced inside MessagingService, keeping HTTP concerns
 * separate from business rules.
 */
@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * GET /messages/unread-count
   *
   * Returns the number of unread messages directed at the current user
   * across all their appointment threads.  Used to power the nav badge.
   *
   * Note: This route is declared *before* /thread/:appointmentId so that
   * Express does not misinterpret "unread-count" as an appointmentId param.
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get the count of unread messages for the current user' })
  @ApiResponse({ status: 200, description: 'Unread message count' })
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    return this.messagingService.getUnreadCount(req.user.sub);
  }

  /**
   * GET /messages
   *
   * Returns a list of all appointment threads (with last message preview
   * and unread count) accessible to the current user.
   */
  @Get()
  @ApiOperation({ summary: 'List all message threads accessible to the current user' })
  @ApiResponse({ status: 200, description: 'Thread list with last-message preview' })
  async getThreadList(@Request() req: AuthenticatedRequest) {
    return this.messagingService.getThreadList(
      req.user.sub,
      req.user.providerId,
    );
  }

  /**
   * GET /messages/thread/:appointmentId
   *
   * Returns all messages in the appointment thread ordered oldest-first.
   * Only the patient or treating provider on that appointment may access.
   */
  @Get('thread/:appointmentId')
  @ApiOperation({ summary: 'Get all messages in an appointment thread' })
  @ApiResponse({ status: 200, description: 'Ordered list of messages' })
  @ApiResponse({ status: 403, description: 'Not a participant in this thread' })
  async getThread(
    @Param('appointmentId') appointmentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messagingService.getThread(
      appointmentId,
      req.user.sub,
      req.user.providerId,
    );
  }

  /**
   * POST /messages/thread/:appointmentId
   *
   * Sends a new message in an appointment thread.  PHI redaction is applied
   * by the service before persisting.  Only the patient or treating provider
   * may send messages in the thread.
   */
  @Post('thread/:appointmentId')
  @ApiOperation({ summary: 'Send a PHI-redacted message in an appointment thread' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  @ApiResponse({ status: 403, description: 'Not a participant in this thread' })
  async sendMessage(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: SendMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messagingService.sendMessage(
      appointmentId,
      req.user.sub,
      req.user.providerId,
      dto.body,
    );
  }

  /**
   * PATCH /messages/:id/read
   *
   * Marks a message as read.  Only the recipient (the user who did NOT send
   * the message) may invoke this.
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messagingService.markRead(id, req.user.sub);
  }
}
