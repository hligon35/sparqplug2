import { api } from "./api";
import { ensureMarketingEngine } from "./marketingEngineService";

export type SocialSettings = {
  id: number;
  engine: number;
  platforms: string[];
  monthly_posts_target: number;
  notes: string;
};

export type SocialCampaign = {
  id: number;
  engine: number;
  name: string;
  theme?: string;
  season?: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string;
};

export type SocialContentPost = {
  id: number;
  engine: number;
  campaign?: number | null;
  platform?: string;
  status?: string;
  post_format?: string;
  caption?: string;
  media_url?: string;
  published_platform_id?: string;
  published_at?: string | null;
  last_publish_error?: string;
  scheduled_at?: string | null;
  linked_task?: number | null;
  linked_calendar_item?: number | null;
};

export async function loadSocialClientData(clientId: number): Promise<{
  engineId: number;
  settings: SocialSettings | null;
  campaigns: SocialCampaign[];
  posts: SocialContentPost[];
}> {
  const engine = await ensureMarketingEngine(clientId);

  const [settingsRes, campaignsRes, postsRes] = await Promise.all([
    api.get("/social-settings/", { params: { client: clientId } }),
    api.get("/social-campaigns/", { params: { client: clientId } }),
    api.get("/social-posts/", { params: { client: clientId } })
  ]);

  const settings = (Array.isArray(settingsRes.data) ? settingsRes.data : settingsRes.data?.results ?? [])[0] ?? null;

  return {
    engineId: engine.id,
    settings,
    campaigns: Array.isArray(campaignsRes.data) ? campaignsRes.data : campaignsRes.data?.results ?? [],
    posts: Array.isArray(postsRes.data) ? postsRes.data : postsRes.data?.results ?? []
  };
}

export async function updateSocialSettings(id: number, payload: Partial<SocialSettings>) {
  const res = await api.put(`/social-settings/${id}/`, payload);
  return res.data as SocialSettings;
}

export async function createSocialCampaign(payload: Omit<SocialCampaign, "id">) {
  const res = await api.post("/social-campaigns/", payload);
  return res.data as SocialCampaign;
}

export async function updateSocialCampaign(id: number, payload: Partial<SocialCampaign>) {
  const res = await api.patch(`/social-campaigns/${id}/`, payload);
  return res.data as SocialCampaign;
}

export async function deleteSocialCampaign(id: number) {
  await api.delete(`/social-campaigns/${id}/`);
}

export async function createSocialPost(payload: Omit<SocialContentPost, "id">) {
  const res = await api.post("/social-posts/", payload);
  return res.data as SocialContentPost;
}

export async function updateSocialPost(id: number, payload: Partial<SocialContentPost>) {
  const res = await api.patch(`/social-posts/${id}/`, payload);
  return res.data as SocialContentPost;
}

export async function deleteSocialPost(id: number) {
  await api.delete(`/social-posts/${id}/`);
}

export async function publishSocialPost(id: number) {
  const res = await api.post(`/social-posts/${id}/publish-now/`, {});
  return res.data as SocialContentPost;
}
