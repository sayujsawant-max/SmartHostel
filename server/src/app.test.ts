import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('Server Smoke Tests', () => {
  it('GET /api/health returns 200 with success response', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'healthy' },
    });
    expect(res.body.correlationId).toBeDefined();
  });

  it('GET /api/nonexistent returns 404 JSON error', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
    expect(res.body.correlationId).toBeDefined();
  });

  it('responses include X-Correlation-Id header', async () => {
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.headers['x-correlation-id']).toBeDefined();

    const notFoundRes = await request(app).get('/api/nonexistent');
    expect(notFoundRes.headers['x-correlation-id']).toBeDefined();
  });

  it('accepts and echoes provided X-Correlation-Id', async () => {
    const customId = 'test-correlation-123';
    const res = await request(app)
      .get('/api/health')
      .set('X-Correlation-Id', customId);

    expect(res.headers['x-correlation-id']).toBe(customId);
    expect(res.body.correlationId).toBe(customId);
  });
});
