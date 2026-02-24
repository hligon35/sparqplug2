import { config } from '../../config/config.js';
import { getStripe } from '../../config/stripe.js';
import { logger } from '../../utils/logger.js';

export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  if (!config.STRIPE_WEBHOOK_SECRET) {
    logger.warn('STRIPE_WEBHOOK_SECRET missing; webhook validation disabled');
  }

  let event;
  try {
    if (config.STRIPE_WEBHOOK_SECRET) {
      event = getStripe().webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);
    } else {
      event = req.body;
    }
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info('Stripe event', event.type);

  // Minimal placeholder: acknowledge receipt.
  res.json({ received: true });
}
