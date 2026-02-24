export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  DevLogin: undefined;
};

// Screens shared across the nested stacks.
export type AppStackParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Calendar: undefined;
  Email: undefined;
  ClientDetails: { clientId: number };
  Account: undefined;
  Profile: undefined;
  Notifications: undefined;
  Tasks: undefined;
};

// Bottom tab routes should be unique from stack route names to avoid
// "Found screens with the same name nested" warnings.
export type MainTabsParamList = {
  DashboardTab: undefined;
  ClientsTab: undefined;
  CalendarTab: undefined;
  EmailTab: undefined;
};
