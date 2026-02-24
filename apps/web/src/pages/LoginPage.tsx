import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import logo from '../assets/sparqpluglogo.png';
import { WebScreen } from '../components/ui/WebScreen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const { user, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <WebScreen className="min-h-screen">
      <div className="w-full mx-auto" style={{ maxWidth: 440 }}>
        <div className="flex justify-center mt-2">
          <img src={logo} alt="SparQ Plug" className="w-[120px] h-[120px] object-contain" />
        </div>

        <Card className="mt-4">
          <SectionHeader
            title={mode === 'signin' ? 'Sign in' : 'Create account'}
            subtitle="SparQ Plug"
          />

          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              try {
                if (mode === 'signin') await loginWithEmail(email, password);
                else await registerWithEmail(email, password);
              } catch (err: any) {
                setError(err?.message || 'Auth failed');
              } finally {
                setLoading(false);
              }
            }}
          >
            <FloatingLabelInput label="Email" value={email} onChange={setEmail} type="email" />
            <FloatingLabelInput
              label="Password"
              value={password}
              onChange={setPassword}
              type={showPassword ? 'text' : 'password'}
              rightAffordance={
                <button type="button" className="px-2 py-2 font-semibold opacity-70" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              }
            />

            <Button disabled={loading} type="submit">
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </Button>

            <Button type="button" variant="secondary" onClick={() => loginWithGoogle()}>
              Continue with Google
            </Button>

            <button
              type="button"
              className="py-2 text-sm opacity-70"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>

            {error ? <div className="text-xs text-red-600">{error}</div> : null}
          </form>
        </Card>
      </div>
    </WebScreen>
  );
}
