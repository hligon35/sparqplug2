import { api } from "./api";

export type ClientServiceSchedule = {
  id: number;
  client_contract: number;
  service_key: string;
  is_enabled: boolean;
  special_price?: string | null;
  quantity: string;
  unit_price?: string;
  subtotal: string;
  created_at?: string;
  updated_at?: string;
};

export type ClientContract = {
  id: number;
  client: number;
  client_name?: string;
  template: number;
  contract_status: string;
  base_fields: Record<string, any>;
  total_price: string;
  rendered_contract?: string;
  signature_status: string;
  signed_pdf_url?: string;
  service_schedules: ClientServiceSchedule[];
  created_at?: string;
  updated_at?: string;
};

export async function ensureClientContract(clientId: number, templateId?: number) {
  const res = await api.post("/client-contracts/ensure/", {
    client: clientId,
    template: templateId
  });
  return res.data as ClientContract;
}

export async function getClientContract(contractId: number) {
  const res = await api.get(`/client-contracts/${contractId}/`);
  return res.data as ClientContract;
}

export async function updateClientContract(contractId: number, payload: Partial<ClientContract>) {
  const res = await api.patch(`/client-contracts/${contractId}/`, payload);
  return res.data as ClientContract;
}

export async function setContractService(
  contractId: number,
  args: {
    service_key: string;
    is_enabled?: boolean;
    special_price?: string | null;
    quantity?: string;
  }
) {
  const res = await api.post(`/client-contracts/${contractId}/set-service/`, args);
  return res.data as ClientServiceSchedule;
}

export async function renderClientContract(contractId: number) {
  const res = await api.post(`/client-contracts/${contractId}/render/`, {});
  return res.data as { id: number; rendered_contract: string; total_price: string };
}

export async function recalculateClientContract(contractId: number) {
  const res = await api.post(`/client-contracts/${contractId}/recalculate/`, {});
  return res.data as { id: number; total_price: string };
}
