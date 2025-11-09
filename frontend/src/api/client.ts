import axios from 'axios';
import type {
  Document,
  Message,
  Conversation,
  ConversationListItem,
  ChatRequest,
  AnalyticsSummary,
  TimeSeriesData,
  TopicData,
  LLMProvider,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents API
export const documentsApi = {
  upload: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  list: async (): Promise<Document[]> => {
    const { data } = await apiClient.get('/api/documents/');
    return data;
  },

  get: async (id: number): Promise<Document> => {
    const { data } = await apiClient.get(`/api/documents/${id}`);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/documents/${id}`);
  },

  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/api/documents/stats/overview');
    return data;
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<Message> => {
    const { data } = await apiClient.post('/api/chat/', request);
    return data;
  },

  listConversations: async (): Promise<ConversationListItem[]> => {
    const { data } = await apiClient.get('/api/chat/conversations');
    return data;
  },

  getConversation: async (id: number): Promise<Conversation> => {
    const { data } = await apiClient.get(`/api/chat/conversations/${id}`);
    return data;
  },

  deleteConversation: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/chat/conversations/${id}`);
  },

  addFeedback: async (messageId: number, rating: number, comment?: string): Promise<void> => {
    await apiClient.post('/api/chat/feedback', {
      message_id: messageId,
      rating,
      comment,
    });
  },

  getProviders: async (): Promise<LLMProvider[]> => {
    const { data } = await apiClient.get('/api/chat/providers');
    return data;
  },
};

// Analytics API
export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const { data } = await apiClient.get('/api/analytics/summary');
    return data;
  },

  getTimeSeries: async (days: number = 7): Promise<TimeSeriesData[]> => {
    const { data } = await apiClient.get('/api/analytics/time-series', {
      params: { days },
    });
    return data;
  },

  getTopTopics: async (limit: number = 10): Promise<TopicData[]> => {
    const { data } = await apiClient.get('/api/analytics/top-topics', {
      params: { limit },
    });
    return data;
  },

  getDocumentUsage: async (): Promise<any> => {
    const { data } = await apiClient.get('/api/analytics/document-usage');
    return data;
  },
};

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const { data } = await apiClient.post('/api/auth/login', { username, password });
    return data;
  },

  register: async (email: string, username: string, password: string, full_name?: string): Promise<any> => {
    const { data } = await apiClient.post('/api/auth/register', {
      email,
      username,
      password,
      full_name,
    });
    return data;
  },

  getCurrentUser: async (token: string): Promise<any> => {
    const { data } = await apiClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  verifyToken: async (token: string): Promise<{ valid: boolean }> => {
    const { data } = await apiClient.get('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
};

export default apiClient;
