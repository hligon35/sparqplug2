import { getStripe } from '../config/stripe.js';
import { getFirestore } from '../config/firebaseAdmin.js';
import { config } from '../config/config.js';
import { HttpError } from '../utils/errors.js';

export class BillingService {
  static async getOrCreateStripeCustomer(uid, email) {
    const userRef = getFirestore().collection('users').doc(uid);
    const snap = await userRef.get();
    const data = snap.exists ? snap.data() : {};

    if (data?.stripeCustomerId) return data.stripeCustomerId;

    const customer = await getStripe().customers.create({
      email,
      metadata: { uid }
    });
    await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
    return customer.id;
  }

  static async createCheckoutSession({ uid, email, priceId, successUrl, cancelUrl }) {
    if (!priceId) throw new HttpError('Missing priceId', 400);
    const customerId = await BillingService.getOrCreateStripeCustomer(uid, email);

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${config.PUBLIC_WEB_BASE_URL}/billing?success=1`,
      cancel_url: cancelUrl || `${config.PUBLIC_WEB_BASE_URL}/billing?canceled=1`,
      allow_promotion_codes: true,
      metadata: { uid }
    });

    return session;
  }

  static async createPortalSession({ uid, returnUrl }) {
    const userRef = getFirestore().collection('users').doc(uid);
    const snap = await userRef.get();
    const customerId = snap.exists ? snap.data()?.stripeCustomerId : null;
    if (!customerId) throw new HttpError('No Stripe customer on file', 400);

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${config.PUBLIC_WEB_BASE_URL}/billing`
    });
    return session;
  }
}
