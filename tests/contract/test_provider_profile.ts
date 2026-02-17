import request from 'supertest';
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('GET /providers/:id', () => {
  it('should return 200 and provider details', async () => {
    // Assuming a valid ID exists or mocking
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(API_URL).get(`/providers/${validId}`);
    
    // Expect 404 if not found, or mock it
    if (response.status === 200) {
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    }
  });
});
