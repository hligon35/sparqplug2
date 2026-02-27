import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { ClientDetailsScreen } from '../screens/ClientDetailsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { TaskEditScreen } from '../screens/TaskEditScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { InboxScreen } from '../screens/InboxScreen';

type TabsParamList = {
  DashboardTab: undefined;
  ClientsTab: undefined;
  CalendarTab: undefined;
  InboxTab: undefined;
};

type DashboardStackParamList = {
  DashboardHome: undefined;
  Tasks: undefined;
  TaskDetail: { taskId: string };
  TaskEdit: { taskId?: string };
  Notes: undefined;
  Files: undefined;
  Profile: undefined;
};

type ClientsStackParamList = {
  ClientsHome: undefined;
  ClientDetails: { clientId: string };
  Profile: undefined;
};

type CalendarStackParamList = {
  CalendarHome: undefined;
  Profile: undefined;
};

type InboxStackParamList = {
  InboxHome: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const ClientsStack = createNativeStackNavigator<ClientsStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const InboxStack = createNativeStackNavigator<InboxStackParamList>();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="Tasks" component={TasksScreen} />
      <DashboardStack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <DashboardStack.Screen name="TaskEdit" component={TaskEditScreen} />
      <DashboardStack.Screen name="Notes" component={NotesScreen} />
      <DashboardStack.Screen name="Files" component={FilesScreen} />
      <DashboardStack.Screen name="Profile" component={ProfileScreen} />
    </DashboardStack.Navigator>
  );
}

function ClientsStackNavigator() {
  return (
    <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientsStack.Screen name="ClientsHome" component={ClientsScreen} />
      <ClientsStack.Screen name="ClientDetails" component={ClientDetailsScreen} />
      <ClientsStack.Screen name="Profile" component={ProfileScreen} />
    </ClientsStack.Navigator>
  );
}

function CalendarStackNavigator() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarHome" component={CalendarScreen} />
      <CalendarStack.Screen name="Profile" component={ProfileScreen} />
    </CalendarStack.Navigator>
  );
}

function InboxStackNavigator() {
  return (
    <InboxStack.Navigator screenOptions={{ headerShown: false }}>
      <InboxStack.Screen name="InboxHome" component={InboxScreen} />
      <InboxStack.Screen name="Profile" component={ProfileScreen} />
    </InboxStack.Navigator>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'DashboardTab'
              ? 'grid-outline'
              : route.name === 'ClientsTab'
                ? 'people-outline'
                : route.name === 'CalendarTab'
                  ? 'calendar-outline'
                  : 'mail-outline';

          return <Ionicons name={iconName as any} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackNavigator} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="ClientsTab" component={ClientsStackNavigator} options={{ title: 'Clients' }} />
      <Tab.Screen name="CalendarTab" component={CalendarStackNavigator} options={{ title: 'Calendar' }} />
      <Tab.Screen name="InboxTab" component={InboxStackNavigator} options={{ title: 'Inbox' }} />
    </Tab.Navigator>
  );
}
