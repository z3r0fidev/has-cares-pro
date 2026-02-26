import request from 'supertest';
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('POST /providers/:id/reviews', () => {
  it('should create a review', async () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const review = {
      rating_total: 5,
      content: 'Great doctor!',
      rating_wait_time: 5,
      rating_bedside_manner: 5,
      rating_cultural_sensitivity: 5
    };

    const response = await request(API_URL)
      .post(`/providers/${validId}/reviews`)
      .send(review);

    // 201 Created
    expect(response.status).toBe(201);
  });
});
