import { Injectable } from '@nestjs/common';
import { LessThanOrEqual, In } from 'typeorm';
import { Review, AppDataSource, Provider, Appointment, AppointmentStatus } from '@careequity/db';
import { Redactor, AIModerator } from '@careequity/core';

@Injectable()
export class ReviewService {
  /**
   * Determines whether the given patient has a confirmed or past-pending
   * appointment with the given provider, qualifying them as a "verified patient"
   * for review purposes.
   */
  private async checkVerifiedPatient(patientId: string, providerId: string): Promise<boolean> {
    const apptRepo = AppDataSource.getRepository(Appointment);
    const now = new Date();

    // A patient is verified if they have:
    //   (a) any CONFIRMED appointment with this provider, OR
    //   (b) a PENDING appointment whose date is in the past (i.e., the visit occurred)
    const match = await apptRepo.findOne({
      where: [
        {
          patient: { id: patientId },
          provider: { id: providerId },
          status: AppointmentStatus.CONFIRMED,
        },
        {
          patient: { id: patientId },
          provider: { id: providerId },
          status: AppointmentStatus.PENDING,
          appointment_date: LessThanOrEqual(now),
        },
      ],
    });

    return match !== null;
  }

  async create(providerId: string, reviewData: Partial<Review>) {
    const repo = AppDataSource.getRepository(Review);

    // 1. Basic keyword/PHI check
    const containsPHI = reviewData.content ? Redactor.hasPHI(reviewData.content) : false;

    // 2. Sophisticated AI Toxicity check
    let isToxic = false;
    if (reviewData.content) {
      isToxic = await AIModerator.shouldFlag(reviewData.content);
    }

    // Redact PHI for display
    if (reviewData.content) {
      reviewData.content = Redactor.redact(reviewData.content);
    }

    // 3. Determine verified-patient status
    const isVerifiedPatient =
      reviewData.patient_id != null
        ? await this.checkVerifiedPatient(reviewData.patient_id, providerId)
        : false;

    const review = repo.create({
      ...reviewData,
      provider: { id: providerId } as Provider,
      status: containsPHI || isToxic ? 'flagged' : 'pending',
      is_verified_patient: isVerifiedPatient,
    });

    return repo.save(review);
  }

  async findByProvider(providerId: string) {
    const repo = AppDataSource.getRepository(Review);
    return repo.find({
      where: { provider: { id: providerId }, status: In(['published']) },
      order: { created_at: 'DESC' },
    });
  }
}
