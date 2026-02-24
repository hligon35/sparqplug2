import { api } from "./api";
import { ensureMarketingEngine } from "./marketingEngineService";

export type MarketingReport = {
  id: number;
  engine: number;
  month?: string | null;
  status?: string;
  metrics?: Record<string, any>;
  summary?: string;
  due_date?: string | null;
  delivered_at?: string | null;
  linked_task?: number | null;
  linked_calendar_item?: number | null;
};

export type CompetitiveInsight = {
  id: number;
  engine: number;
  competitor?: string;
  insight: string;
  collected_at?: string | null;
};

export type StrategyPlan = {
  id: number;
  engine: number;
  period?: string;
  summary?: string;
  action_plan?: string;
  next_refresh_date?: string | null;
};

export async function loadReportingClientData(clientId: number): Promise<{
  engineId: number;
  reports: MarketingReport[];
  insights: CompetitiveInsight[];
  plans: StrategyPlan[];
}> {
  const engine = await ensureMarketingEngine(clientId);

  const [reportsRes, insightsRes, plansRes] = await Promise.all([
    api.get("/marketing-reports/", { params: { client: clientId } }),
    api.get("/competitive-insights/", { params: { client: clientId } }),
    api.get("/strategy-plans/", { params: { client: clientId } })
  ]);

  return {
    engineId: engine.id,
    reports: Array.isArray(reportsRes.data) ? reportsRes.data : reportsRes.data?.results ?? [],
    insights: Array.isArray(insightsRes.data) ? insightsRes.data : insightsRes.data?.results ?? [],
    plans: Array.isArray(plansRes.data) ? plansRes.data : plansRes.data?.results ?? []
  };
}

export async function createMarketingReport(payload: Omit<MarketingReport, "id">) {
  const res = await api.post("/marketing-reports/", payload);
  return res.data as MarketingReport;
}

export async function updateMarketingReport(id: number, payload: Partial<MarketingReport>) {
  const res = await api.patch(`/marketing-reports/${id}/`, payload);
  return res.data as MarketingReport;
}

export async function deleteMarketingReport(id: number) {
  await api.delete(`/marketing-reports/${id}/`);
}

export async function createCompetitiveInsight(payload: Omit<CompetitiveInsight, "id">) {
  const res = await api.post("/competitive-insights/", payload);
  return res.data as CompetitiveInsight;
}

export async function updateCompetitiveInsight(id: number, payload: Partial<CompetitiveInsight>) {
  const res = await api.patch(`/competitive-insights/${id}/`, payload);
  return res.data as CompetitiveInsight;
}

export async function deleteCompetitiveInsight(id: number) {
  await api.delete(`/competitive-insights/${id}/`);
}

export async function createStrategyPlan(payload: Omit<StrategyPlan, "id">) {
  const res = await api.post("/strategy-plans/", payload);
  return res.data as StrategyPlan;
}

export async function updateStrategyPlan(id: number, payload: Partial<StrategyPlan>) {
  const res = await api.patch(`/strategy-plans/${id}/`, payload);
  return res.data as StrategyPlan;
}

export async function deleteStrategyPlan(id: number) {
  await api.delete(`/strategy-plans/${id}/`);
}
