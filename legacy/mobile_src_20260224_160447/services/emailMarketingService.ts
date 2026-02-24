import { api } from "./api";

export type EmailProviderSettings = {
  id: number;
  client: number;
  provider: string;
  from_email: string;
  from_name: string;
  reply_to: string;
  physical_address: string;
  public_base_url: string;

  // credentials (optional)
  sendgrid_api_key?: string;
  mailgun_api_key?: string;
  mailgun_domain?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_use_tls?: boolean;
};

export type EmailContact = {
  id: number;
  client: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  custom_fields?: Record<string, any>;
  is_suppressed?: boolean;
  suppressed_reason?: string;
  created_at?: string;
  updated_at?: string;
};

export type EmailAudience = {
  id: number;
  client: number;
  name: string;
  description?: string;
  member_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type EmailAudienceMembership = {
  id: number;
  client: number;
  audience: number;
  contact: number;
  status: string;
  subscribed_at?: string | null;
  unsubscribed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type EmailTemplate = {
  id: number;
  client: number;
  name: string;
  subject?: string;
  preheader?: string;
  html?: string;
  text?: string;
  created_at?: string;
  updated_at?: string;
};

export type EmailCampaign = {
  id: number;
  client: number;
  name: string;
  status: string;
  template: number | null;
  audience: number | null;
  segment: number | null;
  subject_override?: string;
  send_at?: string | null;
  sent_at?: string | null;
  stats?: {
    queued: number;
    sent: number;
    failed: number;
  };
};

function unwrapList<T>(res: any): T[] {
  return Array.isArray(res?.data) ? res.data : res?.data?.results ?? [];
}

export async function ensureEmailProviderSettings(clientId: number) {
  const res = await api.post("/email-provider-settings/ensure/", { client: clientId }, { params: { client: clientId } });
  return res.data as EmailProviderSettings;
}

export async function updateEmailProviderSettings(id: number, clientId: number, payload: Partial<EmailProviderSettings>) {
  const res = await api.patch(`/email-provider-settings/${id}/`, payload, { params: { client: clientId } });
  return res.data as EmailProviderSettings;
}

export async function listEmailContacts(clientId: number) {
  const res = await api.get("/email-contacts/", { params: { client: clientId } });
  return unwrapList<EmailContact>(res);
}

export async function createEmailContact(payload: Omit<EmailContact, "id">) {
  const res = await api.post("/email-contacts/", payload, { params: { client: payload.client } });
  return res.data as EmailContact;
}

export async function updateEmailContact(id: number, clientId: number, payload: Partial<EmailContact>) {
  const res = await api.patch(`/email-contacts/${id}/`, payload, { params: { client: clientId } });
  return res.data as EmailContact;
}

export async function deleteEmailContact(id: number, clientId: number) {
  await api.delete(`/email-contacts/${id}/`, { params: { client: clientId } });
}

export async function listEmailAudiences(clientId: number) {
  const res = await api.get("/email-audiences/", { params: { client: clientId } });
  return unwrapList<EmailAudience>(res);
}

export async function createEmailAudience(payload: Omit<EmailAudience, "id">) {
  const res = await api.post("/email-audiences/", payload, { params: { client: payload.client } });
  return res.data as EmailAudience;
}

export async function updateEmailAudience(id: number, clientId: number, payload: Partial<EmailAudience>) {
  const res = await api.patch(`/email-audiences/${id}/`, payload, { params: { client: clientId } });
  return res.data as EmailAudience;
}

export async function deleteEmailAudience(id: number, clientId: number) {
  await api.delete(`/email-audiences/${id}/`, { params: { client: clientId } });
}

export async function listEmailAudienceMemberships(clientId: number, audienceId?: number) {
  const res = await api.get("/email-audience-memberships/", {
    params: { client: clientId, ...(audienceId ? { audience: audienceId } : {}) }
  });
  return unwrapList<EmailAudienceMembership>(res);
}

export async function createEmailAudienceMembership(payload: Omit<EmailAudienceMembership, "id">) {
  const res = await api.post("/email-audience-memberships/", payload, { params: { client: payload.client } });
  return res.data as EmailAudienceMembership;
}

export async function updateEmailAudienceMembership(
  id: number,
  clientId: number,
  payload: Partial<EmailAudienceMembership>
) {
  const res = await api.patch(`/email-audience-memberships/${id}/`, payload, { params: { client: clientId } });
  return res.data as EmailAudienceMembership;
}

export async function deleteEmailAudienceMembership(id: number, clientId: number) {
  await api.delete(`/email-audience-memberships/${id}/`, { params: { client: clientId } });
}

export async function listEmailTemplates(clientId: number) {
  const res = await api.get("/email-templates/", { params: { client: clientId } });
  return unwrapList<EmailTemplate>(res);
}

export async function createEmailTemplate(payload: Omit<EmailTemplate, "id">) {
  const res = await api.post("/email-templates/", payload, { params: { client: payload.client } });
  return res.data as EmailTemplate;
}

export async function updateEmailTemplate(id: number, clientId: number, payload: Partial<EmailTemplate>) {
  const res = await api.patch(`/email-templates/${id}/`, payload, { params: { client: clientId } });
  return res.data as EmailTemplate;
}

export async function deleteEmailTemplate(id: number, clientId: number) {
  await api.delete(`/email-templates/${id}/`, { params: { client: clientId } });
}

export async function listEmailCampaigns(clientId: number) {
  const res = await api.get("/email-campaigns-v2/", { params: { client: clientId } });
  return unwrapList<EmailCampaign>(res);
}

export async function createEmailCampaign(payload: Omit<EmailCampaign, "id">) {
  const res = await api.post("/email-campaigns-v2/", payload, { params: { client: payload.client } });
  return res.data as EmailCampaign;
}

export async function updateEmailCampaign(id: number, clientId: number, payload: Partial<EmailCampaign>) {
  const res = await api.patch(`/email-campaigns-v2/${id}/`, payload, { params: { client: clientId } });
  return res.data as EmailCampaign;
}

export async function deleteEmailCampaign(id: number, clientId: number) {
  await api.delete(`/email-campaigns-v2/${id}/`, { params: { client: clientId } });
}

export async function sendEmailCampaignNow(id: number, clientId: number) {
  const res = await api.post(`/email-campaigns-v2/${id}/send-now/`, {}, { params: { client: clientId } });
  return res.data as { detail: string };
}
