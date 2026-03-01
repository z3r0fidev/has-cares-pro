import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Res, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { BookingService } from '../services/booking.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AppointmentStatus } from '@careequity/db';
import { AuthenticatedRequest } from '../types/request.interface';
import { CreateAppointmentDto } from '../dto/booking.dto';
import ical from 'ical-generator';

@ApiTags('booking')
@ApiBearerAuth()
@Controller('booking')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('appointment')
  @ApiOperation({ summary: 'Book an appointment with a provider' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Request() req: AuthenticatedRequest, @Body() body: CreateAppointmentDto) {
    return this.bookingService.createAppointment(req.user.sub, body.providerId, new Date(body.date), body.reason ?? '');
  }

  @Get('my-appointments')
  @ApiOperation({ summary: "Get the current user's appointments" })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  async getMyAppointments(@Request() req: AuthenticatedRequest) {
    if (req.user.role === 'provider' && req.user.providerId) {
      return this.bookingService.getProviderAppointments(req.user.providerId);
    }
    return this.bookingService.getPatientAppointments(req.user.sub);
  }

  @Patch('appointment/:id/status')
  @ApiOperation({ summary: 'Update appointment status (provider or admin)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus },
    @Request() req: AuthenticatedRequest,
  ) {
    // Only the provider who owns the appointment or an admin may change status
    return this.bookingService.updateStatus(id, body.status, req.user.sub, req.user.providerId, req.user.role);
  }

  @Patch('appointment/:id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment (patient)' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 403, description: 'Not the appointment owner' })
  async cancel(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.bookingService.cancelAppointment(id, req.user.sub);
  }

  @Post('save/:providerId')
  @ApiOperation({ summary: 'Toggle saving a provider to care team' })
  @ApiResponse({ status: 201, description: 'Save state toggled' })
  async toggleSave(@Param('providerId') providerId: string, @Request() req: AuthenticatedRequest) {
    return this.bookingService.toggleSavedProvider(req.user.sub, providerId);
  }

  @Get('saved')
  @ApiOperation({ summary: "Get the current patient's saved providers" })
  @ApiResponse({ status: 200, description: 'List of saved providers' })
  async getSaved(@Request() req: AuthenticatedRequest) {
    return this.bookingService.getSavedProviders(req.user.sub);
  }

  @Get('appointment/:id/ical')
  @ApiOperation({ summary: 'Download an iCal (.ics) file for an appointment' })
  @ApiResponse({ status: 200, description: 'iCal file download' })
  @ApiResponse({ status: 403, description: 'Not the appointment owner' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
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
