import request from 'supertest';
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('PATCH /admin/verify/:id', () => {
  it('should update verification status', async () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const payload = {
      tier: 2,
      status: 'approved',
      notes: 'Identity verified via documents'
    };

    const response = await request(API_URL)
      .patch(`/admin/verify/${validId}`)
      .send(payload)
      // .set('Authorization', 'Bearer admin-token') // In real test

    // 200 OK
    expect(response.status).toBe(200);
  });
});
