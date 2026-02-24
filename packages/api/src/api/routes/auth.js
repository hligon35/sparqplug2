import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { me } from '../controllers/authController.js';

export const authRouter = Router();

authRouter.get('/me', requireAuth, me);
