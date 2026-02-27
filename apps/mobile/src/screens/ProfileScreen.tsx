import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { FloatingLabelInput } from '../components/ui/FloatingLabelInput';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/apiClient';

function HeaderIconButton({ icon, onPress, disabled }: { icon: any; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      className={`w-12 h-12 items-center justify-center rounded-full bg-white border border-gray-200 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <Ionicons name={icon} size={22} color="black" />
    </Pressable>
  );
}

function PillButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <View className={`rounded-full border border-gray-200 px-5 py-2 ${disabled ? 'opacity-50' : ''}`}>
      <Text className="text-sm font-semibold text-gray-900">{label}</Text>
    </View>
  );
}

export function ProfileScreen({ navigation }: any) {
  const { user } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canUpdatePassword = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < 8) return false;
    return newPassword === confirmPassword;
  }, [currentPassword, newPassword, confirmPassword]);

  useEffect(() => {
    setName(user?.displayName ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phoneNumber ?? '');
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        // Best-effort; backend may not be wired yet.
        await apiFetch('/me', { method: 'GET' });
      } catch (err: any) {
        const msg = String(err?.message || 'Request failed');
        if (!alive) return;
        setError(msg.includes('401') ? 'Request failed with status code 401' : msg);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen
      title="Profile"
      headerLeft={<HeaderIconButton icon="chevron-back" onPress={() => navigation.goBack()} />}
      headerRight={<HeaderIconButton icon="person-outline" onPress={() => {}} />}
    >
      <Card className="p-5">
        <Text className="text-lg font-bold text-gray-900">Profile</Text>
        {error ? <Text className="text-sm opacity-70 mt-2">{error}</Text> : null}

        <View className="gap-3 mt-4">
          <FloatingLabelInput label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <FloatingLabelInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <FloatingLabelInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="default" />
          <FloatingLabelInput label="Address" value={address} onChangeText={setAddress} autoCapitalize="sentences" />
        </View>

        <View className="items-end mt-4">
          <PillButton label={busy ? 'Loading…' : 'Save'} disabled />
        </View>
      </Card>

      <Card className="p-5">
        <Text className="text-lg font-bold text-gray-900">Change Password</Text>

        <View className="gap-3 mt-4">
          <FloatingLabelInput
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <FloatingLabelInput label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <FloatingLabelInput
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <View className="items-end mt-4">
          <PillButton label="Update password" disabled={!canUpdatePassword} />
        </View>
      </Card>
    </Screen>
  );
}
