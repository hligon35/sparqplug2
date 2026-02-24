import { api } from "./api";
import { ensureMarketingEngine } from "./marketingEngineService";

export type RetentionSettings = {
  id: number;
  engine: number;
  provider?: string;
  account_id?: string;
  promotional_emails_per_month: number;
  notes: string;
};

export type EmailCampaign = {
  id: number;
  engine: number;
  subject: string;
  status?: string;
  send_at?: string | null;
  linked_task?: number | null;
  linked_calendar_item?: number | null;
  notes?: string;
};

export type EmailFlow = {
  id: number;
  engine: number;
  name: string;
  flow_type?: string;
  status?: string;
  last_updated_at?: string | null;
  linked_task?: number | null;
  notes?: string;
};

export async function loadRetentionClientData(clientId: number): Promise<{
  engineId: number;
  settings: RetentionSettings | null;
  campaigns: EmailCampaign[];
  flows: EmailFlow[];
}> {
  const engine = await ensureMarketingEngine(clientId);

  const [settingsRes, campaignsRes, flowsRes] = await Promise.all([
    api.get("/retention-settings/", { params: { client: clientId } }),
    api.get("/email-campaigns/", { params: { client: clientId } }),
    api.get("/email-flows/", { params: { client: clientId } })
  ]);

  const settings = (Array.isArray(settingsRes.data) ? settingsRes.data : settingsRes.data?.results ?? [])[0] ?? null;

  return {
    engineId: engine.id,
    settings,
    campaigns: Array.isArray(campaignsRes.data) ? campaignsRes.data : campaignsRes.data?.results ?? [],
    flows: Array.isArray(flowsRes.data) ? flowsRes.data : flowsRes.data?.results ?? []
  };
}

export async function updateRetentionSettings(id: number, payload: Partial<RetentionSettings>) {
  const res = await api.put(`/retention-settings/${id}/`, payload);
  return res.data as RetentionSettings;
}

export async function createEmailCampaign(payload: Omit<EmailCampaign, "id">) {
  const res = await api.post("/email-campaigns/", payload);
  return res.data as EmailCampaign;
}

export async function updateEmailCampaign(id: number, payload: Partial<EmailCampaign>) {
  const res = await api.patch(`/email-campaigns/${id}/`, payload);
  return res.data as EmailCampaign;
}

export async function deleteEmailCampaign(id: number) {
  await api.delete(`/email-campaigns/${id}/`);
}

export async function createEmailFlow(payload: Omit<EmailFlow, "id">) {
  const res = await api.post("/email-flows/", payload);
  return res.data as EmailFlow;
}

export async function updateEmailFlow(id: number, payload: Partial<EmailFlow>) {
  const res = await api.patch(`/email-flows/${id}/`, payload);
  return res.data as EmailFlow;
}

export async function deleteEmailFlow(id: number) {
  await api.delete(`/email-flows/${id}/`);
}
