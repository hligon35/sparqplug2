import { api } from "./api";

export const billing = {
  status: () => api.get("/billing/status/"),
  ensureCustomer: (clientId: number) => api.post(`/billing/${clientId}/ensure-customer/`, {}),
  createInvoice: (clientId: number, payload?: { service_ids?: number[]; finalize?: boolean; send?: boolean }) =>
    api.post(`/billing/${clientId}/create-invoice/`, payload ?? {})
};
