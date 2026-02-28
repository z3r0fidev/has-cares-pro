import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Res, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { BookingService } from '../services/booking.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AppointmentStatus } from '@careequity/db';
import { AuthenticatedRequest } from '../types/request.interface';
import { CreateAppointmentDto } from '../dto/booking.dto';
import ical from 'ical-generator';

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
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus },
    @Request() req: AuthenticatedRequest,
  ) {
    // Only the provider who owns the appointment or an admin may change status
    return this.bookingService.updateStatus(id, body.status, req.user.sub, req.user.providerId, req.user.role);
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

  @Get('appointment/:id/ical')
  async downloadIcal(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const appointment = await this.bookingService.getAppointmentById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patient.id !== req.user.sub) {
      throw new ForbiddenException('You do not have access to this appointment');
    }

    const start = appointment.appointment_date;
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

    const cal = ical({ name: 'CareEquity' });
    cal.createEvent({
      start,
      end,
      summary: `Appointment with ${appointment.provider.name}`,
      description: appointment.reason ?? '',
      organizer: { name: 'CareEquity', email: 'noreply@careequity.com' },
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="appointment.ics"');
    res.send(cal.toString());
  }
}
