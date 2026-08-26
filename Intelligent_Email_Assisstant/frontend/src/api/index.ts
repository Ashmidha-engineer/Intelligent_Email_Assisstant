import { api } from './client.js';

export const authApi = {
  getSession: async () => {
    const res = await api.get('/auth/session');
    return res.data;
  },
  emailLogin: async (email: string, name?: string) => {
    const res = await api.post('/auth/email-login', { email, name });
    return res.data;
  },
  demoLogin: async () => {
    const res = await api.post('/auth/demo-login');
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
};

export const emailApi = {
  listEmails: async (params: { folder?: string; q?: string; limit?: number } = {}) => {
    const res = await api.get('/emails', { params });
    return res.data;
  },
  getThread: async (threadId: string) => {
    const res = await api.get(`/emails/${threadId}`);
    return res.data;
  },
  searchEmails: async (q: string) => {
    const res = await api.get('/emails/search', { params: { q } });
    return res.data;
  },
  markRead: async (id: string, isRead: boolean) => {
    const res = await api.patch(`/emails/${id}/read`, { isRead });
    return res.data;
  },
  markStar: async (id: string, isStarred: boolean) => {
    const res = await api.patch(`/emails/${id}/star`, { isStarred });
    return res.data;
  },
  archiveEmail: async (id: string) => {
    const res = await api.patch(`/emails/${id}/archive`);
    return res.data;
  },
  deleteEmail: async (id: string) => {
    const res = await api.delete(`/emails/${id}`);
    return res.data;
  },
  sendEmail: async (data: { to: string; subject: string; body: string; threadId?: string; cc?: string; bcc?: string }) => {
    const res = await api.post('/emails/send', data);
    return res.data;
  },
};

export const workflowApi = {
  summarize: async (threadId: string, format: 'bullets' | 'paragraph' = 'bullets') => {
    const res = await api.post('/workflows/summarize', { threadId, format });
    return res.data;
  },
  generateReply: async (threadId: string, tone: string, instructions?: string) => {
    const res = await api.post('/workflows/generate-reply', { threadId, tone, instructions });
    return res.data;
  },
  explain: async (threadId: string) => {
    const res = await api.post('/workflows/explain', { threadId });
    return res.data;
  },
  classify: async (emailId: string) => {
    const res = await api.post('/workflows/classify', { emailId });
    return res.data;
  },
  extractActions: async (threadId: string) => {
    const res = await api.post('/workflows/extract-actions', { threadId });
    return res.data;
  },
  compound: async (threadId: string, tone: string, instructions?: string) => {
    const res = await api.post('/workflows/compound', { threadId, tone, instructions });
    return res.data;
  },
};

export const executionApi = {
  getExecution: async (id: string) => {
    const res = await api.get(`/executions/${id}`);
    return res.data;
  },
  listExecutions: async (limit = 50) => {
    const res = await api.get('/executions', { params: { limit } });
    return res.data;
  },
  retry: async (id: string) => {
    const res = await api.post(`/executions/${id}/retry`);
    return res.data;
  },
};

export const analyticsApi = {
  getAnalytics: async () => {
    const res = await api.get('/analytics');
    return res.data;
  },
};

export const activityApi = {
  listActivity: async () => {
    const res = await api.get('/activity');
    return res.data;
  },
};

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  updateSettings: async (data: any) => {
    const res = await api.patch('/settings', data);
    return res.data;
  },
};

export const integrationApi = {
  getStatus: async () => {
    const res = await api.get('/integrations');
    return res.data;
  },
  disconnect: async (provider = 'google') => {
    const res = await api.post('/integrations/disconnect', { provider });
    return res.data;
  },
};
