import { api } from "./api";

export type MetaConnectionStatus = {
  connected: boolean;
  has_connection: boolean;
  token_expiry?: string | null;
  page_id?: string;
  page_name?: string;
  ig_business_account_id?: string;
};

export type GoogleAnalyticsConnectionStatus = {
  connected: boolean;
  has_connection: boolean;
  token_expiry?: string | null;
};

export async function getMetaStatus(clientId: number): Promise<MetaConnectionStatus> {
  const res = await api.get("/meta-connections/status/", { params: { client: clientId } });
  return res.data as MetaConnectionStatus;
}

export async function getMetaConnectUrl(clientId: number): Promise<{ authorization_url: string }> {
  const res = await api.post("/meta-connections/connect-url/", { client: clientId });
  return res.data as { authorization_url: string };
}

export async function disconnectMeta(clientId: number): Promise<{ detail: string }> {
  const res = await api.post("/meta-connections/disconnect/", { client: clientId });
  return res.data as { detail: string };
}

export async function listMetaPages(clientId: number): Promise<{ pages: Array<{ id: string; name: string; ig_business_account_id?: string | null }> }> {
  const res = await api.get("/meta-connections/pages/", { params: { client: clientId } });
  return res.data as { pages: Array<{ id: string; name: string; ig_business_account_id?: string | null }> };
}

export async function selectMetaPage(clientId: number, pageId: string): Promise<{ detail: string; page_id: string; page_name: string; ig_business_account_id?: string }> {
  const res = await api.post("/meta-connections/select-page/", { client: clientId, page_id: pageId });
  return res.data as { detail: string; page_id: string; page_name: string; ig_business_account_id?: string };
}

export async function getGoogleAnalyticsStatus(clientId: number): Promise<GoogleAnalyticsConnectionStatus> {
  const res = await api.get("/google-analytics-connections/status/", { params: { client: clientId } });
  return res.data as GoogleAnalyticsConnectionStatus;
}

export async function getGoogleAnalyticsConnectUrl(clientId: number): Promise<{ authorization_url: string }> {
  const res = await api.post("/google-analytics-connections/connect-url/", { client: clientId });
  return res.data as { authorization_url: string };
}

export async function disconnectGoogleAnalytics(clientId: number): Promise<{ detail: string }> {
  const res = await api.post("/google-analytics-connections/disconnect/", { client: clientId });
  return res.data as { detail: string };
}

export async function getGA4Summary(clientId: number, days: number = 30): Promise<{ property_id: string; days: number; totals: { activeUsers?: string | null; sessions?: string | null } }> {
  const res = await api.get("/google-analytics-connections/ga4-summary/", { params: { client: clientId, days } });
  return res.data as { property_id: string; days: number; totals: { activeUsers?: string | null; sessions?: string | null } };
}
