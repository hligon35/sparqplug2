export const mockClients = [
  {
    id: 1,
    name: "B3U",
    industry: "Retail",
    status: "Active",
    stage: "Speaking",
    service: "Social media management",
    ownerRole: "Owner",
    website: "https://www.b3unstoppable.net",
    domainYearlyCost: 12.0,
    emailMonthlyCost: 8.4,
    monthlyCost: 250.0,
    primaryContactName: "Bree Charles",
    primaryContactRole: "Owner",
    primaryContactPhone: "6543219873",
    primaryContactEmail: "bree.charles@unstoppable.net",
    startDate: "2025-08-01",
    endDate: "2026-12-31"
  },
  {
    id: 2,
    name: "Northwind",
    industry: "B2B",
    status: "Onboarding",
    stage: "Onboarding",
    service: "SEO + Reporting",
    ownerRole: "Manager",
    website: "https://northwind.example",
    domainYearlyCost: 18.0,
    emailMonthlyCost: 12.0,
    monthlyCost: 500.0,
    primaryContactName: "Alex Johnson",
    primaryContactRole: "Manager",
    primaryContactPhone: "5551234567",
    primaryContactEmail: "alex@northwind.example",
    startDate: "2025-09-15",
    endDate: "2026-09-15"
  },
  {
    id: 3,
    name: "SparQ Demo",
    industry: "Agency",
    status: "Active",
    stage: "Active",
    service: "Full Marketing Engine",
    ownerRole: "Admin",
    website: "https://sparqplug.example",
    domainYearlyCost: 24.0,
    emailMonthlyCost: 15.0,
    monthlyCost: 999.0,
    primaryContactName: "Harold Ligon",
    primaryContactRole: "Admin",
    primaryContactPhone: "5559876543",
    primaryContactEmail: "admin@sparqplug.example",
    startDate: "2025-01-01",
    endDate: "2026-12-31"
  }
];

export const mockClientAccounts = mockClients.map((c) => ({
  id: c.id,
  name: c.name,
  status: c.status
}));

export const mockCalendarItems = [
  {
    id: 100,
    title: "Google Meet: Weekly sync",
    description: "Google Meet: https://meet.google.com/abc-defg-hij",
    scheduled_at: new Date(Date.now() + 10 * 60000).toISOString(),
    status: "scheduled",
    platform: "google_meet"
  },
  {
    id: 101,
    title: "Team standup",
    scheduled_at: (() => {
      const d = new Date();
      d.setHours(9, 30, 0, 0);
      return d.toISOString();
    })(),
    status: "scheduled"
  },
  {
    id: 102,
    title: "Client content review",
    scheduled_at: (() => {
      const d = new Date();
      d.setHours(14, 0, 0, 0);
      return d.toISOString();
    })(),
    status: "scheduled"
  },
  {
    id: 103,
    title: "Instagram post",
    scheduled_at: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: "scheduled"
  },
  {
    id: 104,
    title: "LinkedIn article",
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "draft"
  },
  {
    id: 105,
    title: "Email campaign send",
    scheduled_at: new Date(Date.now() + 6 * 86400000).toISOString(),
    status: "scheduled"
  },
  {
    id: 106,
    title: "Monthly reporting",
    scheduled_at: (() => {
      const d = new Date();
      d.setDate(1);
      d.setHours(11, 0, 0, 0);
      return d.toISOString();
    })(),
    status: "done"
  }
];

export const mockTasks: Array<{
  id: number;
  title: string;
  status: string;
  priority?: "high" | "med" | "low";
  due_date?: string;
}> = [
  { id: 201, title: "Write captions", status: "todo", priority: "med" },
  { id: 202, title: "Design carousel", status: "in_progress", priority: "high" },
  { id: 203, title: "Client approval", status: "blocked", priority: "low" }
];

export const mockNotes = [
  { id: 301, content: "Kickoff call notes placeholder", pinned: true },
  { id: 302, content: "Brand voice: confident, concise", pinned: false }
];

export const mockNotifications = [
  {
    id: 401,
    type: "info",
    message: "Welcome to SparQPlug",
    is_read: false,
    created_at: new Date().toISOString()
  }
];
