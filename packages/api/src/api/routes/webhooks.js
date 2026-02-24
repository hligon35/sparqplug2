import { Router } from 'express';
import { stripeWebhook } from '../controllers/webhooksController.js';

export const webhooksRouter = Router();

// Note: raw body middleware is attached at mount site in server.js.
webhooksRouter.post('/stripe', stripeWebhook);
