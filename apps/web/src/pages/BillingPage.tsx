import { useState } from 'react';
import { apiFetch } from '../utils/apiClient';

import { WebScreen } from '../components/ui/WebScreen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { Button } from '../components/ui/Button';

export function BillingPage() {
  const [priceId, setPriceId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <WebScreen title="Billing">
      <div style={{ maxWidth: 520 }}>
        <Card>
          <SectionHeader title="Billing" subtitle="Stripe Checkout + Portal" />
          <div className="mt-4 flex flex-col gap-3">
            <FloatingLabelInput label="Stripe Price ID" value={priceId} onChange={setPriceId} />

            <Button
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
            </Button>

            <Button
              variant="secondary"
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
            </Button>

            {error ? <div className="text-xs text-red-600">{error}</div> : null}
          </div>
        </Card>
      </div>
    </WebScreen>
  );
}
