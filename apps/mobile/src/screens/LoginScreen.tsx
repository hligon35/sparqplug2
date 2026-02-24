import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';

export function LoginScreen() {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Login</Text>

      <TextInput
        autoCapitalize="none"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6 }}
      />
      <TextInput
        autoCapitalize="none"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6 }}
      />

      <Button
        title={loading ? 'Signing in…' : 'Sign in'}
        disabled={loading}
        onPress={async () => {
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
      />

      {error ? <Text style={{ color: 'crimson' }}>{error}</Text> : null}
    </View>
  );
}
