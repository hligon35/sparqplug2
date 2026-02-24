import { api } from "./api";

export type MarketingEngine = {
  id: number;
  client: number;
  created_at?: string;
  updated_at?: string;
};

export async function ensureMarketingEngine(clientId: number): Promise<MarketingEngine> {
  const res = await api.post("/marketing-engines/ensure/", { client: clientId });
  return res.data as MarketingEngine;
}
