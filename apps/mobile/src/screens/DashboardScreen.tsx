import { Button, Text, View } from 'react-native';
import { APP_NAME, APP_VERSION } from '@sparq2/shared';
import { useAuth } from '../hooks/useAuth';

export function DashboardScreen({ navigation }: any) {
  const { logout } = useAuth();

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Dashboard</Text>
      <Text>
        {APP_NAME} v{APP_VERSION}
      </Text>

      <Button title="Clients" onPress={() => navigation.navigate('Clients')} />
      <Button title="Tasks" onPress={() => navigation.navigate('Tasks')} />
      <Button title="Notes" onPress={() => navigation.navigate('Notes')} />
      <Button title="Files" onPress={() => navigation.navigate('Files')} />

      <Button title="Logout" onPress={() => logout()} />
    </View>
  );
}
