import { api } from "./api";

export const endpoints = {
  clientAccounts: {
    list: (params?: any) => api.get("/client-accounts/", params ? { params } : undefined),
    get: (id: number) => api.get(`/client-accounts/${id}/`),
    create: (payload: any) => api.post("/client-accounts/", payload),
    update: (id: number, payload: any) => api.put(`/client-accounts/${id}/`, payload),
    remove: (id: number) => api.delete(`/client-accounts/${id}/`)
  },
  clients: {
    list: (params?: any) => api.get("/clients/", params ? { params } : undefined),
    get: (id: number) => api.get(`/clients/${id}/`),
    create: (payload: any) => api.post("/clients/", payload),
    update: (id: number, payload: any) => api.put(`/clients/${id}/`, payload),
    remove: (id: number) => api.delete(`/clients/${id}/`),
    uploadLogo: (
      id: number,
      file: { uri: string; name: string; type: string }
    ) => {
      const form = new FormData();
      form.append("file", file as any);
      return api.post(`/clients/${id}/upload-logo/`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }
  },
  clientSocialConnections: {
    list: (clientId?: number) =>
      api.get("/client-social-connections/", {
        params: clientId ? { client: clientId } : undefined
      }),
    create: (payload: any) => api.post("/client-social-connections/", payload),
    update: (id: number, payload: any) => api.put(`/client-social-connections/${id}/`, payload),
    remove: (id: number) => api.delete(`/client-social-connections/${id}/`),
    refresh: (id: number) => api.post(`/client-social-connections/${id}/refresh/`, {})
  },
  contacts: {
    list: (params?: any) => api.get("/contacts/", params ? { params } : undefined),
    listByClient: (clientId: number) => api.get("/contacts/", { params: { client: clientId } }),
    create: (payload: any) => api.post("/contacts/", payload),
    update: (id: number, payload: any) => api.put(`/contacts/${id}/`, payload),
    remove: (id: number) => api.delete(`/contacts/${id}/`)
  },
  clientServices: {
    list: (params?: any) => api.get("/client-services/", params ? { params } : undefined),
    listByClient: (clientId: number) => api.get("/client-services/", { params: { client: clientId } }),
    create: (payload: any) => api.post("/client-services/", payload),
    update: (id: number, payload: any) => api.put(`/client-services/${id}/`, payload),
    remove: (id: number) => api.delete(`/client-services/${id}/`)
  },
  calendar: {
    list: (params?: any) => api.get("/calendar/", params ? { params } : undefined),
    create: (payload: any) => api.post("/calendar/", payload),
    scheduleGoogleMeet: (payload: any) => api.post("/calendar/google-meet/", payload),
    update: (id: number, payload: any) => api.put(`/calendar/${id}/`, payload),
    remove: (id: number) => api.delete(`/calendar/${id}/`)
  },
  notes: {
    list: (params?: any) => api.get("/notes/", params ? { params } : undefined),
    create: (payload: any) => api.post("/notes/", payload),
    update: (id: number, payload: any) => api.put(`/notes/${id}/`, payload),
    remove: (id: number) => api.delete(`/notes/${id}/`)
  },
  tasks: {
    list: (params?: any) => api.get("/tasks/", params ? { params } : undefined),
    create: (payload: any) => api.post("/tasks/", payload),
    update: (id: number, payload: any) => api.put(`/tasks/${id}/`, payload),
    remove: (id: number) => api.delete(`/tasks/${id}/`)
  },
  expenses: {
    list: (params?: any) => api.get("/expenses/", params ? { params } : undefined),
    get: (id: number) => api.get(`/expenses/${id}/`),
    create: (payload: any) => api.post("/expenses/", payload),
    update: (id: number, payload: any) => api.put(`/expenses/${id}/`, payload),
    remove: (id: number) => api.delete(`/expenses/${id}/`)
  },
  overhead: {
    company: (params?: any) => api.get("/overhead/company/", params ? { params } : undefined),
    client: (clientId: number, params?: any) => api.get(`/clients/${clientId}/overhead/`, params ? { params } : undefined)
  },
  clientFeeRules: {
    list: (params?: any) => api.get("/client-fee-rules/", params ? { params } : undefined),
    upsert: (payload: any) => api.post("/client-fee-rules/upsert/", payload)
  },
  clientFeeEvents: {
    list: (params?: any) => api.get("/client-fee-events/", params ? { params } : undefined),
    create: (payload: any) => api.post("/client-fee-events/", payload),
    remove: (id: number) => api.delete(`/client-fee-events/${id}/`)
  },
  files: {
    list: (params?: any) => api.get("/files/", params ? { params } : undefined),
    create: (payload: any) => api.post("/files/", payload),
    update: (id: number, payload: any) => api.put(`/files/${id}/`, payload),
    remove: (id: number) => api.delete(`/files/${id}/`)
  },
  users: {
    list: (params?: any) => api.get("/users/", params ? { params } : undefined),
    team: () => api.get("/users/team/"),
    me: () => api.get("/users/me/"),
    create: (payload: any) => api.post("/users/", payload),
    update: (id: number, payload: any) => api.put(`/users/${id}/`, payload),
    updateMe: (payload: any) => api.patch("/users/me/", payload),
    remove: (id: number) => api.delete(`/users/${id}/`)
  },
  google: {
    oauthStart: (payload: { return_to?: string }) => api.post("/google/oauth/start/", payload),
    accounts: () => api.get("/google/accounts/")
  },
  notifications: {
    list: (params?: any) => api.get("/notifications/", params ? { params } : undefined),
    create: (payload: any) => api.post("/notifications/", payload),
    send: (payload: any) => api.post("/notifications/send/", payload),
    update: (id: number, payload: any) => api.put(`/notifications/${id}/`, payload),
    remove: (id: number) => api.delete(`/notifications/${id}/`)
  },
  marketing: {
    engines: {
      list: () => api.get("/marketing-engines/"),
      ensure: (clientId: number) => api.post("/marketing-engines/ensure/", { client: clientId }),
      create: (payload: any) => api.post("/marketing-engines/", payload),
      update: (id: number, payload: any) => api.put(`/marketing-engines/${id}/`, payload),
      remove: (id: number) => api.delete(`/marketing-engines/${id}/`)
    },
    seoSettings: {
      list: () => api.get("/seo-settings/"),
      create: (payload: any) => api.post("/seo-settings/", payload),
      update: (id: number, payload: any) => api.put(`/seo-settings/${id}/`, payload),
      remove: (id: number) => api.delete(`/seo-settings/${id}/`)
    },
    keywords: {
      list: () => api.get("/keywords/"),
      create: (payload: any) => api.post("/keywords/", payload),
      update: (id: number, payload: any) => api.put(`/keywords/${id}/`, payload),
      remove: (id: number) => api.delete(`/keywords/${id}/`)
    },
    seoContentPieces: {
      list: () => api.get("/seo-content-pieces/"),
      create: (payload: any) => api.post("/seo-content-pieces/", payload),
      update: (id: number, payload: any) => api.put(`/seo-content-pieces/${id}/`, payload),
      remove: (id: number) => api.delete(`/seo-content-pieces/${id}/`)
    },
    socialSettings: {
      list: () => api.get("/social-settings/"),
      create: (payload: any) => api.post("/social-settings/", payload),
      update: (id: number, payload: any) => api.put(`/social-settings/${id}/`, payload),
      remove: (id: number) => api.delete(`/social-settings/${id}/`)
    },
    socialCampaigns: {
      list: () => api.get("/social-campaigns/"),
      create: (payload: any) => api.post("/social-campaigns/", payload),
      update: (id: number, payload: any) => api.put(`/social-campaigns/${id}/`, payload),
      remove: (id: number) => api.delete(`/social-campaigns/${id}/`)
    },
    socialPosts: {
      list: () => api.get("/social-posts/"),
      create: (payload: any) => api.post("/social-posts/", payload),
      update: (id: number, payload: any) => api.put(`/social-posts/${id}/`, payload),
      remove: (id: number) => api.delete(`/social-posts/${id}/`)
    },
    adsSettings: {
      list: () => api.get("/ads-settings/"),
      create: (payload: any) => api.post("/ads-settings/", payload),
      update: (id: number, payload: any) => api.put(`/ads-settings/${id}/`, payload),
      remove: (id: number) => api.delete(`/ads-settings/${id}/`)
    },
    adCampaigns: {
      list: () => api.get("/ad-campaigns/"),
      create: (payload: any) => api.post("/ad-campaigns/", payload),
      update: (id: number, payload: any) => api.put(`/ad-campaigns/${id}/`, payload),
      remove: (id: number) => api.delete(`/ad-campaigns/${id}/`)
    },
    adCreatives: {
      list: () => api.get("/ad-creatives/"),
      create: (payload: any) => api.post("/ad-creatives/", payload),
      update: (id: number, payload: any) => api.put(`/ad-creatives/${id}/`, payload),
      remove: (id: number) => api.delete(`/ad-creatives/${id}/`)
    },
    retentionSettings: {
      list: () => api.get("/retention-settings/"),
      create: (payload: any) => api.post("/retention-settings/", payload),
      update: (id: number, payload: any) => api.put(`/retention-settings/${id}/`, payload),
      remove: (id: number) => api.delete(`/retention-settings/${id}/`)
    },
    emailCampaigns: {
      list: () => api.get("/email-campaigns/"),
      create: (payload: any) => api.post("/email-campaigns/", payload),
      update: (id: number, payload: any) => api.put(`/email-campaigns/${id}/`, payload),
      remove: (id: number) => api.delete(`/email-campaigns/${id}/`)
    },
    emailFlows: {
      list: () => api.get("/email-flows/"),
      create: (payload: any) => api.post("/email-flows/", payload),
      update: (id: number, payload: any) => api.put(`/email-flows/${id}/`, payload),
      remove: (id: number) => api.delete(`/email-flows/${id}/`)
    },
    reports: {
      list: () => api.get("/marketing-reports/"),
      create: (payload: any) => api.post("/marketing-reports/", payload),
      update: (id: number, payload: any) => api.put(`/marketing-reports/${id}/`, payload),
      remove: (id: number) => api.delete(`/marketing-reports/${id}/`)
    },
    insights: {
      list: () => api.get("/competitive-insights/"),
      create: (payload: any) => api.post("/competitive-insights/", payload),
      update: (id: number, payload: any) => api.put(`/competitive-insights/${id}/`, payload),
      remove: (id: number) => api.delete(`/competitive-insights/${id}/`)
    },
    strategyPlans: {
      list: () => api.get("/strategy-plans/"),
      create: (payload: any) => api.post("/strategy-plans/", payload),
      update: (id: number, payload: any) => api.put(`/strategy-plans/${id}/`, payload),
      remove: (id: number) => api.delete(`/strategy-plans/${id}/`)
    }
  }
};
