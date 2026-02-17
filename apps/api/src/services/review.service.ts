import { Injectable } from '@nestjs/common';
import { Review, AppDataSource } from '@careequity/db';
import { Redactor } from '@careequity/core';

@Injectable()
export class ReviewService {
  async create(providerId: string, reviewData: Partial<Review>) {
    const repo = AppDataSource.getRepository(Review);
    
    // Check for PHI presence before redaction to decide on flagging
    const containsPHI = reviewData.content ? Redactor.hasPHI(reviewData.content) : false;

    // Redact PHI for display
    if (reviewData.content) {
      reviewData.content = Redactor.redact(reviewData.content);
    }

    const review = repo.create({
      ...reviewData,
      provider: { id: providerId } as any,
      status: containsPHI ? 'flagged' : 'pending' // Auto-flag if PHI detected
    });
    
    return repo.save(review);
  }

  async findByProvider(providerId: string) {
    const repo = AppDataSource.getRepository(Review);
    return repo.find({ where: { provider: { id: providerId }, status: 'published' } });
  }
}
