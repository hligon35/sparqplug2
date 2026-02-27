import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { ClientDetailsScreen } from '../screens/ClientDetailsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { TaskEditScreen } from '../screens/TaskEditScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Clients: undefined;
  ClientDetails: { clientId: string };
  Tasks: undefined;
  TaskDetail: { taskId: string };
  TaskEdit: { taskId?: string };
  Notes: undefined;
  Files: undefined;
  Diagnostics: undefined;
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
      <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} options={{ title: 'Client' }} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task' }} />
      <Stack.Screen name="TaskEdit" component={TaskEditScreen} options={{ title: 'Edit Task' }} />
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="Files" component={FilesScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ title: 'Diagnostics' }} />
    </Stack.Navigator>
  );
}
