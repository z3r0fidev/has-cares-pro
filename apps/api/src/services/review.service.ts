import { Injectable } from '@nestjs/common';
import { Review, AppDataSource } from '@careequity/db';
import { Redactor } from '@careequity/core';

@Injectable()
export class ReviewService {
  async create(providerId: string, reviewData: Partial<Review>) {
    const repo = AppDataSource.getRepository(Review);
    
    // Redact PHI
    if (reviewData.content) {
      reviewData.content = Redactor.redact(reviewData.content);
    }

    const review = repo.create({
      ...reviewData,
      provider: { id: providerId } as any,
      status: 'pending' // Default to pending moderation
    });
    
    return repo.save(review);
  }

  async findByProvider(providerId: string) {
    const repo = AppDataSource.getRepository(Review);
    return repo.find({ where: { provider: { id: providerId }, status: 'published' } });
  }
}
