import { api } from "./api";
import { ensureMarketingEngine } from "./marketingEngineService";

export type AdsSettings = {
  id: number;
  engine: number;
  meta_ad_account_id: string;
  tiktok_ad_account_id: string;
  google_ads_customer_id: string;
  monthly_budget?: string | null;
  notes: string;
};

export type AdCampaign = {
  id: number;
  engine: number;
  platform?: string;
  objective?: string;
  funnel_stage?: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: string | null;
};

export type AdCreative = {
  id: number;
  engine: number;
  campaign?: number | null;
  name: string;
  creative_format?: string;
  hook?: string;
  asset_url?: string;
  variant?: string;
  status?: string;
  last_tested_at?: string | null;
  is_winner?: boolean;
  linked_task?: number | null;
};

export type GoogleAdsStatus = {
  connected: boolean;
  has_connection: boolean;
  token_expiry?: string | null;
  customer_id?: string;
  login_customer_id?: string;
};

export async function getGoogleAdsStatus(clientId: number): Promise<GoogleAdsStatus> {
  const res = await api.get("/google-ads-connections/status/", { params: { client: clientId } });
  return res.data as GoogleAdsStatus;
}

export async function getGoogleAdsConnectUrl(clientId: number, payload?: {
  customer_id?: string;
  login_customer_id?: string;
  developer_token?: string;
}): Promise<{ authorization_url: string }>{
  const res = await api.post("/google-ads-connections/connect-url/", {
    client: clientId,
    ...(payload ?? {})
  });
  return res.data as { authorization_url: string };
}

export async function disconnectGoogleAds(clientId: number): Promise<{ detail: string }>{
  const res = await api.post("/google-ads-connections/disconnect/", { client: clientId });
  return res.data as { detail: string };
}

export async function loadAdsClientData(clientId: number): Promise<{
  engineId: number;
  settings: AdsSettings | null;
  campaigns: AdCampaign[];
  creatives: AdCreative[];
}> {
  const engine = await ensureMarketingEngine(clientId);

  const [settingsRes, campaignsRes, creativesRes] = await Promise.all([
    api.get("/ads-settings/", { params: { client: clientId } }),
    api.get("/ad-campaigns/", { params: { client: clientId } }),
    api.get("/ad-creatives/", { params: { client: clientId } })
  ]);

  const settings = (Array.isArray(settingsRes.data) ? settingsRes.data : settingsRes.data?.results ?? [])[0] ?? null;

  return {
    engineId: engine.id,
    settings,
    campaigns: Array.isArray(campaignsRes.data) ? campaignsRes.data : campaignsRes.data?.results ?? [],
    creatives: Array.isArray(creativesRes.data) ? creativesRes.data : creativesRes.data?.results ?? []
  };
}

export async function updateAdsSettings(id: number, payload: Partial<AdsSettings>) {
  const res = await api.put(`/ads-settings/${id}/`, payload);
  return res.data as AdsSettings;
}

export async function createAdCampaign(payload: Omit<AdCampaign, "id">) {
  const res = await api.post("/ad-campaigns/", payload);
  return res.data as AdCampaign;
}

export async function updateAdCampaign(id: number, payload: Partial<AdCampaign>) {
  const res = await api.patch(`/ad-campaigns/${id}/`, payload);
  return res.data as AdCampaign;
}

export async function deleteAdCampaign(id: number) {
  await api.delete(`/ad-campaigns/${id}/`);
}

export async function createAdCreative(payload: Omit<AdCreative, "id">) {
  const res = await api.post("/ad-creatives/", payload);
  return res.data as AdCreative;
}

export async function updateAdCreative(id: number, payload: Partial<AdCreative>) {
  const res = await api.patch(`/ad-creatives/${id}/`, payload);
  return res.data as AdCreative;
}

export async function deleteAdCreative(id: number) {
  await api.delete(`/ad-creatives/${id}/`);
}
