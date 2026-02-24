import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Login</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            await loginWithEmail(email, password);
          } catch (err: any) {
            setError(err?.message || 'Login failed');
          } finally {
            setLoading(false);
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button disabled={loading} type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <button style={{ marginTop: 12 }} onClick={() => loginWithGoogle()}>
        Continue with Google
      </button>
      {error ? <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div> : null}
    </div>
  );
}
