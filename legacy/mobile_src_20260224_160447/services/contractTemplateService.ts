import { api } from "./api";

export type ContractTemplate = {
  id: number;
  template_name: string;
  template_body: string;
  category?: string;
  version?: string;
  placeholders?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ServiceScheduleTemplate = {
  id: number;
  template: number;
  service_key: string;
  service_title: string;
  service_description?: string;
  default_price: string;
  default_terms?: string;
  created_at?: string;
  updated_at?: string;
};

function normalizeList<T>(data: any): T[] {
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function listContractTemplates(): Promise<ContractTemplate[]> {
  const res = await api.get("/contract-templates/");
  return normalizeList<ContractTemplate>(res.data);
}

export async function createContractTemplate(payload: Partial<ContractTemplate>) {
  const res = await api.post("/contract-templates/", payload);
  return res.data as ContractTemplate;
}

export async function updateContractTemplate(id: number, payload: Partial<ContractTemplate>) {
  const res = await api.patch(`/contract-templates/${id}/`, payload);
  return res.data as ContractTemplate;
}

export async function deleteContractTemplate(id: number) {
  await api.delete(`/contract-templates/${id}/`);
}

export async function listServiceScheduleTemplates(templateId?: number): Promise<ServiceScheduleTemplate[]> {
  const res = await api.get("/service-schedule-templates/", {
    params: templateId ? { template: templateId } : undefined
  });
  return normalizeList<ServiceScheduleTemplate>(res.data);
}

export async function createServiceScheduleTemplate(payload: Partial<ServiceScheduleTemplate>) {
  const res = await api.post("/service-schedule-templates/", payload);
  return res.data as ServiceScheduleTemplate;
}

export async function updateServiceScheduleTemplate(id: number, payload: Partial<ServiceScheduleTemplate>) {
  const res = await api.patch(`/service-schedule-templates/${id}/`, payload);
  return res.data as ServiceScheduleTemplate;
}

export async function deleteServiceScheduleTemplate(id: number) {
  await api.delete(`/service-schedule-templates/${id}/`);
}
