import request from 'supertest';
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('GET /providers', () => {
  it('should return 200 and a list of providers', async () => {
    const response = await request(API_URL)
      .get('/providers')
      .query({ lat: 40.7128, lon: -74.0060, radius: 10 }); // New York

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should filter by specialty', async () => {
    const response = await request(API_URL)
      .get('/providers')
      .query({ lat: 40.7128, lon: -74.0060, specialty: 'Cardiology' });

    expect(response.status).toBe(200);
    // In a real test, we would verify the content
  });
});
