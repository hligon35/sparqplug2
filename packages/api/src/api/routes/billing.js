import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createCheckoutSession, createPortalSession } from '../controllers/billingController.js';

export const billingRouter = Router();

billingRouter.post('/create-checkout-session', requireAuth, createCheckoutSession);
billingRouter.post('/portal', requireAuth, createPortalSession);
