import { asyncHandler } from '../../utils/asyncHandler.js';
import { BillingService } from '../../services/BillingService.js';

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { priceId, successUrl, cancelUrl } = req.body || {};
  const session = await BillingService.createCheckoutSession({
    uid: req.user.uid,
    email: req.user.email,
    priceId,
    successUrl,
    cancelUrl
  });
  res.json({ id: session.id, url: session.url });
});

export const createPortalSession = asyncHandler(async (req, res) => {
  const { returnUrl } = req.body || {};
  const session = await BillingService.createPortalSession({ uid: req.user.uid, returnUrl });
  res.json({ url: session.url });
});
