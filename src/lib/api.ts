import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { AnalyticsOverview, UploadedDocument, VerificationAnalytics } from '@/types';

// In the browser, /api/* rewrites to backend via next.config.ts
// In server components, use the direct backend URL
const API_URL =
  typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

type ErrorRecord = Record<string, unknown>;

function asRecord(value: unknown): ErrorRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as ErrorRecord
    : null;
}

function errorText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const messages = value.map(errorText).filter((message): message is string => Boolean(message));
    return messages.length ? messages.join(' · ') : null;
  }

  const record = asRecord(value);
  if (!record) return null;
  for (const key of ['msg', 'message', 'reason', 'detail']) {
    const message = errorText(record[key]);
    if (message) return message;
  }
  return null;
}

/** Convert FastAPI/Axios errors to safe text before showing them in React UI. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const outer = asRecord(error);
  if (!outer) return errorText(error) ?? fallback;
  const response = asRecord(outer.response);
  const data = asRecord(response?.data);
  return errorText(data?.detail) ?? errorText(data?.message) ?? errorText(outer.message) ?? errorText(error) ?? fallback;
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/signup');

    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !isAuthEndpoint
    ) {
      // Clear auth state
      localStorage.removeItem('auth_token');
      try {
        if (useAuthStore?.getState) {
          useAuthStore.getState().logout();
        }
      } catch {}
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendOtp: (data: { email: string; purpose?: string }) =>
    api.post('/auth/send-otp', data),
  verifyOtp: (data: { email: string; otp: string; purpose?: string }) =>
    api.post('/auth/verify-otp', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const chatApi = {
  getChats: () => api.get('/chat/history'),
  getChat: (id: string) => api.get(`/chat/${id}`),
  createChat: () => api.post('/chat/create'),
  deleteChat: (id: string) => api.delete(`/chat/${id}`),
  updateChat: (id: string, data: { title?: string; pinned?: boolean }) =>
    api.patch(`/chat/${id}`, data),
  sendMessage: (chatId: string, data: { content: string }) =>
    api.post('/chat', { content: data.content, chat_id: chatId }),
};

export const uploadApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<UploadedDocument>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadFiles: async (files: File[]) => {
    const uploaded: UploadedDocument[] = [];
    for (const file of files) {
      const response = await uploadApi.uploadFile(file);
      if (response.data.status !== 'ready') {
        throw new Error(response.data.error || `Could not process ${file.name}.`);
      }
      uploaded.push(response.data);
    }
    return uploaded;
  },
  listDocuments: () => api.get<UploadedDocument[]>('/upload'),
  deleteDocument: (id: string) => api.delete(`/upload/${id}`),
};

export const voiceApi = {
  transcribe: (audioBlob: Blob) => {
    const formData = new FormData();
    const extension = audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
    formData.append('audio', audioBlob, `recording.${extension}`);
    return api.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const analyticsApi = {
  getOverview: () => api.get<AnalyticsOverview>('/analytics/overview'),
  getVerification: () => api.get<VerificationAnalytics>('/analytics/verification'),
};

export default api;
