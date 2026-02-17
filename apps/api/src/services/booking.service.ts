import { Injectable, NotFoundException } from '@nestjs/common';
import { AppDataSource, Appointment, AppointmentStatus, SavedProvider } from '@careequity/db';

@Injectable()
export class BookingService {
  async createAppointment(userId: string, providerId: string, date: Date, reason: string) {
    const repo = AppDataSource.getRepository(Appointment);
    const appointment = repo.create({
      patient: { id: userId } as any,
      provider: { id: providerId } as any,
      appointment_date: date,
      reason,
      status: AppointmentStatus.PENDING
    });
    return repo.save(appointment);
  }

  async getPatientAppointments(userId: string) {
    const repo = AppDataSource.getRepository(Appointment);
    return repo.find({ where: { patient: { id: userId } } });
  }

  async getProviderAppointments(providerId: string) {
    const repo = AppDataSource.getRepository(Appointment);
    return repo.find({ where: { provider: { id: providerId } } });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const repo = AppDataSource.getRepository(Appointment);
    const appt = await repo.findOneBy({ id });
    if (!appt) throw new NotFoundException();
    appt.status = status;
    return repo.save(appt);
  }

  async toggleSavedProvider(userId: string, providerId: string) {
    const repo = AppDataSource.getRepository(SavedProvider);
    const existing = await repo.findOne({ where: { user: { id: userId }, provider: { id: providerId } } });
    
    if (existing) {
      await repo.remove(existing);
      return { saved: false };
    } else {
      const saved = repo.create({ user: { id: userId } as any, provider: { id: providerId } as any });
      await repo.save(saved);
      return { saved: true };
    }
  }

  async getSavedProviders(userId: string) {
    const repo = AppDataSource.getRepository(SavedProvider);
    return repo.find({ where: { user: { id: userId } } });
  }
}
