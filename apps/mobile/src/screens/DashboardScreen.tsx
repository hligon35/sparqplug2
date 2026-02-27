import { Text, View } from 'react-native';
import { APP_VERSION } from '@sparq2/shared';
import { useAuth } from '../hooks/useAuth';

import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ListRow } from '../components/ui/ListRow';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function DashboardScreen({ navigation }: any) {
  const { logout } = useAuth();

  return (
    <Screen
      title="Dashboard"
      statusText={`v${APP_VERSION}`}
      headerRight={<Button label="Logout" variant="ghost" onPress={() => logout()} />}
    >
      <View className="rounded-2xl bg-indigo-600 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-bold text-base">Upcoming Meet</Text>
          <Badge variant="indigo" label="Join" />
        </View>
        <Text className="text-white opacity-90 mt-1 text-sm">SparQ Plug</Text>
      </View>

      <Card>
        <SectionHeader title="Quick access" subtitle="Jump into work" />
        <View className="mt-2">
          <ListRow title="Clients" onPress={() => navigation.navigate('Clients')} />
          <ListRow title="Tasks" onPress={() => navigation.navigate('Tasks')} />
          <ListRow title="Notes" onPress={() => navigation.navigate('Notes')} />
          <ListRow title="Files" onPress={() => navigation.navigate('Files')} showDivider={false} />
        </View>
      </Card>
    </Screen>
  );
}
