import { api } from "./api";
import { ensureMarketingEngine } from "./marketingEngineService";

export type SEOSettings = {
  id: number;
  engine: number;
  primary_domain: string;
  ga4_property_id: string;
  gsc_property: string;
  monthly_revenue_posts_target: number;
  technical_seo_enabled: boolean;
  notes: string;
};

export type Keyword = {
  id: number;
  engine: number;
  phrase: string;
  intent?: string;
  status?: string;
  volume?: number | null;
  difficulty?: number | null;
  priority?: number | null;
  target_page_url?: string;
  notes?: string;
};

export type SEOContentPiece = {
  id: number;
  engine: number;
  title: string;
  content_type?: string;
  status?: string;
  target_keyword?: number | null;
  planned_publish_date?: string | null;
  published_url?: string;
  linked_task?: number | null;
  linked_calendar_item?: number | null;
  notes?: string;
};

export async function loadSEOClientData(clientId: number): Promise<{
  engineId: number;
  settings: SEOSettings | null;
  keywords: Keyword[];
  content: SEOContentPiece[];
}> {
  const engine = await ensureMarketingEngine(clientId);

  const [settingsRes, keywordsRes, contentRes] = await Promise.all([
    api.get("/seo-settings/", { params: { client: clientId } }),
    api.get("/keywords/", { params: { client: clientId } }),
    api.get("/seo-content-pieces/", { params: { client: clientId } })
  ]);

  const settings = (Array.isArray(settingsRes.data) ? settingsRes.data : settingsRes.data?.results ?? [])[0] ?? null;

  return {
    engineId: engine.id,
    settings,
    keywords: Array.isArray(keywordsRes.data) ? keywordsRes.data : keywordsRes.data?.results ?? [],
    content: Array.isArray(contentRes.data) ? contentRes.data : contentRes.data?.results ?? []
  };
}

export async function updateSEOSettings(id: number, payload: Partial<SEOSettings>) {
  const res = await api.put(`/seo-settings/${id}/`, payload);
  return res.data as SEOSettings;
}

export async function createKeyword(payload: Omit<Keyword, "id">) {
  const res = await api.post("/keywords/", payload);
  return res.data as Keyword;
}

export async function updateKeyword(id: number, payload: Partial<Keyword>) {
  const res = await api.patch(`/keywords/${id}/`, payload);
  return res.data as Keyword;
}

export async function deleteKeyword(id: number) {
  await api.delete(`/keywords/${id}/`);
}

export async function createSEOContentPiece(payload: Omit<SEOContentPiece, "id">) {
  const res = await api.post("/seo-content-pieces/", payload);
  return res.data as SEOContentPiece;
}

export async function updateSEOContentPiece(id: number, payload: Partial<SEOContentPiece>) {
  const res = await api.patch(`/seo-content-pieces/${id}/`, payload);
  return res.data as SEOContentPiece;
}

export async function deleteSEOContentPiece(id: number) {
  await api.delete(`/seo-content-pieces/${id}/`);
}
