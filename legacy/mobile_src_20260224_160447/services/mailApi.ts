import { api } from "./api";

export type MailProvider = "google";

export type MailAccount = {
  id: number;
  provider: MailProvider;
  email: string;
  created_at: string;
  updated_at: string;
};

export type MailInboxMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  isUnread: boolean;
};

export type MailAttachment = {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
};

export type MailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  bodyText: string;
  bodyHtml: string;
  attachments: MailAttachment[];
};

export async function listMailAccounts(): Promise<MailAccount[]> {
  const res = await api.get<MailAccount[]>("/mail/accounts/");
  return res.data;
}

export async function startGoogleOAuth(params: {
  return_to?: string;
}): Promise<{ authUrl: string }> {
  const res = await api.post<{ authUrl: string }>("/mail/oauth/google/start/", {
    return_to: params.return_to ?? "sparqplug://mail-linked"
  });
  return res.data;
}

export async function listInboxMessages(params: {
  accountId: number;
  max?: number;
  pageToken?: string;
}): Promise<{ messages: MailInboxMessage[]; nextPageToken?: string | null }> {
  const res = await api.get<{ messages: MailInboxMessage[]; nextPageToken?: string }>(
    `/mail/accounts/${params.accountId}/messages`,
    {
      params: {
        max: params.max ?? 25,
        pageToken: params.pageToken
      }
    }
  );
  return {
    messages: res.data.messages ?? [],
    nextPageToken: res.data.nextPageToken
  };
}

export async function getMessage(params: {
  accountId: number;
  messageId: string;
}): Promise<MailMessage> {
  const res = await api.get<MailMessage>(
    `/mail/accounts/${params.accountId}/messages/${params.messageId}`
  );
  return res.data;
}

export async function trashMessage(params: {
  accountId: number;
  messageId: string;
}): Promise<void> {
  await api.post(`/mail/accounts/${params.accountId}/messages/${params.messageId}/delete`);
}

export async function sendMessage(params: {
  accountId: number;
  to: string[];
  subject: string;
  bodyText: string;
}): Promise<{ id?: string }> {
  const res = await api.post<{ id?: string }>(`/mail/accounts/${params.accountId}/send`, {
    to: params.to,
    subject: params.subject,
    bodyText: params.bodyText,
    attachments: []
  });
  return res.data;
}
