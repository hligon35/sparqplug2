import { APP_NAME, APP_VERSION } from '@sparq2/shared';

export const config = {
  APP_NAME,
  APP_VERSION,
  PORT: Number(process.env.API_PORT || process.env.PORT || 4000),

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  PUBLIC_WEB_BASE_URL: process.env.PUBLIC_WEB_BASE_URL || 'http://localhost:5173'
};
