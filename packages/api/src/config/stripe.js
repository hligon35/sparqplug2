import Stripe from 'stripe';
import { config } from './config.js';

let cachedStripe;

export function getStripe() {
  if (cachedStripe) return cachedStripe;
  if (!config.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY in env');
  }
  cachedStripe = new Stripe(config.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
  return cachedStripe;
}

// Convenience export (spec-friendly)
export const stripe = () => getStripe();
