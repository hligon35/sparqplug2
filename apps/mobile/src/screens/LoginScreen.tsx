import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { Button } from '../components/ui/Button';

export function LoginScreen() {
  const { loginWithEmail, registerWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Screen scroll contentClassName="items-center">
      <View className="w-full" style={{ maxWidth: 440 }}>
        <View className="items-center mt-2">
          <Image
            source={require('../../assets/sparqpluglogo.png')}
            style={{ width: 120, height: 120 }}
            resizeMode="contain"
          />
        </View>

        <Card className="mt-4">
          <SectionHeader
            title={mode === 'signin' ? 'Sign in' : 'Create account'}
            subtitle="SparQ Plug"
          />

          <View className="gap-3 mt-4">
            <FloatingLabelInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FloatingLabelInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightAffordance={
                <Pressable onPress={() => setShowPassword((v) => !v)} className="px-2 py-2">
                  <Text className="font-semibold opacity-70">{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              }
            />

            <Button
              label={loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
              disabled={loading}
              onPress={async () => {
                setError(null);
                setLoading(true);
                try {
                  if (mode === 'signin') {
                    await loginWithEmail(email, password);
                  } else {
                    await registerWithEmail(email, password);
                  }
                } catch (err: any) {
                  setError(err?.message || 'Auth failed');
                } finally {
                  setLoading(false);
                }
              }}
            />

            <Pressable
              onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
              className="py-2"
            >
              <Text className="text-sm opacity-70 text-center">
                {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </Text>
            </Pressable>

            {error ? <Text className="text-xs text-red-600">{error}</Text> : null}
          </View>
        </Card>
      </View>
    </Screen>
  );
}
