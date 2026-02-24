import { useState } from 'react';
import { apiFetch } from '../utils/apiClient';

export function BillingPage() {
  const [priceId, setPriceId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Billing</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          placeholder="Stripe Price ID (e.g. price_...)"
          value={priceId}
          onChange={(e) => setPriceId(e.target.value)}
        />
        <button
          disabled={loading}
          onClick={async () => {
            setError(null);
            setLoading(true);
            try {
              const result = await apiFetch('/billing/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify({ priceId })
              });
              if (result?.url) window.location.href = result.url;
            } catch (err: any) {
              setError(err?.message || 'Failed to start checkout');
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? 'Redirecting…' : 'Start Checkout'}
        </button>

        <button
          onClick={async () => {
            setError(null);
            try {
              const result = await apiFetch('/billing/portal', {
                method: 'POST',
                body: JSON.stringify({})
              });
              if (result?.url) window.location.href = result.url;
            } catch (err: any) {
              setError(err?.message || 'Failed to open portal');
            }
          }}
        >
          Open Customer Portal
        </button>
      </div>

      {error ? <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div> : null}
    </div>
  );
}
