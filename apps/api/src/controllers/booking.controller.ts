import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { BookingService } from '../services/booking.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AppointmentStatus } from '@careequity/db';
import { AuthenticatedRequest } from '../types/request.interface';
import { CreateAppointmentDto } from '../dto/booking.dto';

@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('appointment')
  async create(@Request() req: AuthenticatedRequest, @Body() body: CreateAppointmentDto) {
    return this.bookingService.createAppointment(req.user.sub, body.providerId, new Date(body.date), body.reason ?? '');
  }

  @Get('my-appointments')
  async getMyAppointments(@Request() req: AuthenticatedRequest) {
    if (req.user.role === 'provider' && req.user.providerId) {
      return this.bookingService.getProviderAppointments(req.user.providerId);
    }
    return this.bookingService.getPatientAppointments(req.user.sub);
  }

  @Patch('appointment/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: AppointmentStatus }) {
    return this.bookingService.updateStatus(id, body.status);
  }

  @Patch('appointment/:id/cancel')
  async cancel(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookingService.cancelAppointment(id, req.user.sub);
  }

  @Post('save/:providerId')
  async toggleSave(@Param('providerId') providerId: string, @Request() req: AuthenticatedRequest) {
    return this.bookingService.toggleSavedProvider(req.user.sub, providerId);
  }

  @Get('saved')
  async getSaved(@Request() req: AuthenticatedRequest) {
    return this.bookingService.getSavedProviders(req.user.sub);
  }
}
