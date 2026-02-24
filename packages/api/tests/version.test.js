import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/api/server.js';

describe('GET /version', () => {
  it('returns app version', async () => {
    const app = createApp();
    const res = await request(app).get('/version');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ app: 'SparQ2', version: '0.1.0' });
  });
});
