import request from 'supertest';
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('POST /providers/:id/claim', () => {
  it('should submit a claim request', async () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const claimData = {
      credentials_token: 'valid-token-123'
    };

    const response = await request(API_URL)
      .post(`/providers/${validId}/claim`)
      .send(claimData);

    // 202 Accepted
    expect(response.status).toBe(202);
  });
});
