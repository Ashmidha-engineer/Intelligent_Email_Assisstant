import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Send HTTP-only session cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage as fallback
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('assistant_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultTone: 'Professional' | 'Friendly' | 'Formal' | 'Concise';
  notificationPrefs: string;
  aiProvider: string;
  aiModel: string;
  autoClassify: boolean;
}

export interface EmailItem {
  id: string;
  gmailMessageId: string;
  threadId: string;
  subject: string;
  snippet: string;
  from: string;
  to: string;
  labels: string[];
  category: string;
  priority: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  receivedAt: string;
}

export interface ThreadMessage {
  id: string;
  gmailMessageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  bodyPlain: string;
  bodyHtml: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
}

export interface ExecutionRecord {
  id: string;
  workflowType: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  input?: any;
  output?: any;
  error?: string | null;
  durationMs?: number | null;
  createdAt: string;
}

export interface AIDraftRecord {
  id: string;
  threadId: string;
  tone: string;
  content: string;
  instructions?: string | null;
  createdAt: string;
}
