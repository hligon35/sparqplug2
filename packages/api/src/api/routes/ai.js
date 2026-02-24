import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { run } from '../controllers/aiController.js';

export const aiRouter = Router();

aiRouter.post('/run', requireAuth, run);
