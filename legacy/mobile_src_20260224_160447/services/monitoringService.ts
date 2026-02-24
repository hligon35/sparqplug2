import { api } from "./api";
import { listWithFallback } from "./safeApi";

export type RemoteAgentStatus = "ok" | "warn" | "error" | string;

export type RemoteAgent = {
  id: number;
  client_id: number | null;
  agent_id: string;
  display_name: string;
  status: RemoteAgentStatus;
  last_seen_at: string | null;
  is_online: boolean;
  meta: any;
};

const mockRemoteAgents: RemoteAgent[] = [
  {
    id: 1,
    client_id: 1,
    agent_id: "server-1",
    display_name: "Backend Server",
    status: "ok",
    last_seen_at: new Date().toISOString(),
    is_online: true,
    meta: { version: "dev" }
  },
  {
    id: 2,
    client_id: 1,
    agent_id: "scheduler-1",
    display_name: "Analytics Scheduler",
    status: "warn",
    last_seen_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    is_online: false,
    meta: { note: "missed heartbeat" }
  }
];

export async function listRemoteAgents(params?: {
  clientId?: number;
}): Promise<{ data: RemoteAgent[]; usingMock: boolean; error: string | null }> {
  const qs = params?.clientId ? { client: params.clientId } : undefined;
  return listWithFallback(() => api.get("/monitoring/agents/", qs ? { params: qs } : undefined), mockRemoteAgents);
}
