import { Injectable } from '@nestjs/common';
import { Review, AppDataSource, Provider } from '@careequity/db';
import { Redactor, AIModerator } from '@careequity/core';

@Injectable()
export class ReviewService {
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

    const review = repo.create({
      ...reviewData,
      provider: { id: providerId } as Provider,
      status: (containsPHI || isToxic) ? 'flagged' : 'pending' 
    });
    
    return repo.save(review);
  }

  async findByProvider(providerId: string) {
    const repo = AppDataSource.getRepository(Review);
    return repo.find({ where: { provider: { id: providerId }, status: 'published' } });
  }
}
