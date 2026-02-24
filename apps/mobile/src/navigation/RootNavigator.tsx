import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { FilesScreen } from '../screens/FilesScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Clients: undefined;
  Tasks: undefined;
  Notes: undefined;
  Files: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (!user) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Clients" component={ClientsScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="Files" component={FilesScreen} />
    </Stack.Navigator>
  );
}
