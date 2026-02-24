import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { errorHandler, notFound } from '../utils/errors.js';

import { authRouter } from './routes/auth.js';
import { billingRouter } from './routes/billing.js';
import { aiRouter } from './routes/ai.js';
import { clientsRouter } from './routes/clients.js';
import { tasksRouter } from './routes/tasks.js';
import { notesRouter } from './routes/notes.js';
import { filesRouter } from './routes/files.js';
import { webhooksRouter } from './routes/webhooks.js';

export function createApp() {
  const app = express();

  app.use(cors());

  // Stripe webhooks require the raw request body.
  app.use('/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'SparQ Plug API' });
  });

  app.get('/version', (req, res) => {
    res.json({ app: config.APP_NAME, version: config.APP_VERSION });
  });

  app.use('/auth', authRouter);
  app.use('/billing', billingRouter);
  app.use('/ai', aiRouter);

  app.use('/clients', clientsRouter);
  app.use('/tasks', tasksRouter);
  app.use('/notes', notesRouter);
  app.use('/files', filesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`${config.APP_NAME} API listening on :${config.PORT}`);
  });
}
