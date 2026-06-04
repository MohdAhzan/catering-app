import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResponse, DashboardStats, Event, EventSummary,
  BillingItem, Expense, MiscExpense, ActivityLog,
  PaginatedResponse, ReportResponse, User,
} from '../types';

const BASE_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://your-production-api.com/api';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - inject token
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      // Navigation handled by auth store
    }
    return Promise.reject(err.response?.data || err);
  },
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  login: (email: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),

  me: () =>
    client.get<User>('/auth/me').then(r => r.data),

  listUsers: () =>
    client.get<User[]>('/auth/users').then(r => r.data),

  createUser: (data: { name: string; email: string; password: string; role: string }) =>
    client.post<User>('/auth/users', data).then(r => r.data),

  toggleUser: (id: string) =>
    client.put<{ is_active: boolean }>(`/auth/users/${id}/toggle`).then(r => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    client.put('/auth/change-password', { old_password: oldPassword, new_password: newPassword }).then(r => r.data),
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const dashboardAPI = {
  stats: () =>
    client.get<DashboardStats>('/dashboard').then(r => r.data),
};

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export const eventsAPI = {
  list: (params?: {
    page?: number; limit?: number; search?: string;
    status?: string; from?: string; to?: string;
  }) =>
    client.get<PaginatedResponse<Event>>('/events', { params }).then(r => r.data),

  get: (id: string) =>
    client.get<Event>(`/events/${id}`).then(r => r.data),

  create: (data: {
    name: string; location: string; date: string;
    bill_number: string; notes?: string; status?: string;
  }) =>
    client.post<Event>('/events', data).then(r => r.data),

  update: (id: string, data: Partial<{
    name: string; location: string; date: string;
    bill_number: string; notes: string; status: string;
  }>) =>
    client.put<Event>(`/events/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    client.delete(`/events/${id}`).then(r => r.data),

  suggestions: (q: string) =>
    client.get<string[]>('/events/suggestions', { params: { q } }).then(r => r.data),

  calendar: (year: number, month: number) =>
    client.get<Event[]>('/events/calendar', { params: { year, month } }).then(r => r.data),

  activityLog: (id: string) =>
    client.get<ActivityLog[]>(`/events/${id}/activity`).then(r => r.data),
};

// ─── BILLING ─────────────────────────────────────────────────────────────────

export const billingAPI = {
  list: (eventId: string) =>
    client.get<BillingItem[]>(`/events/${eventId}/items`).then(r => r.data),

  create: (eventId: string, data: {
    item_name: string; description?: string;
    quantity: number; rate: number; sort_order?: number;
  }) =>
    client.post<BillingItem>(`/events/${eventId}/items`, data).then(r => r.data),

  update: (eventId: string, itemId: string, data: Partial<BillingItem>) =>
    client.put<BillingItem>(`/events/${eventId}/items/${itemId}`, data).then(r => r.data),

  delete: (eventId: string, itemId: string) =>
    client.delete(`/events/${eventId}/items/${itemId}`).then(r => r.data),

  bulkReplace: (eventId: string, items: Array<{
    item_name: string; quantity: number; rate: number; sort_order?: number;
  }>) =>
    client.post<BillingItem[]>(`/events/${eventId}/items/bulk`, items).then(r => r.data),
};

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

export const expensesAPI = {
  list: (eventId: string) =>
    client.get<Expense[]>(`/events/${eventId}/expenses`).then(r => r.data),

  create: (eventId: string, data: {
    description: string; amount: number;
    bill_image_url?: string; category?: string;
  }) =>
    client.post<Expense>(`/events/${eventId}/expenses`, data).then(r => r.data),

  update: (eventId: string, expId: string, data: Partial<Expense>) =>
    client.put<Expense>(`/events/${eventId}/expenses/${expId}`, data).then(r => r.data),

  delete: (eventId: string, expId: string) =>
    client.delete(`/events/${eventId}/expenses/${expId}`).then(r => r.data),
};

export const miscExpensesAPI = {
  list: (eventId: string) =>
    client.get<MiscExpense[]>(`/events/${eventId}/misc-expenses`).then(r => r.data),

  create: (eventId: string, data: {
    description: string; amount: number; note?: string;
  }) =>
    client.post<MiscExpense>(`/events/${eventId}/misc-expenses`, data).then(r => r.data),

  delete: (eventId: string, mId: string) =>
    client.delete(`/events/${eventId}/misc-expenses/${mId}`).then(r => r.data),
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const reportsAPI = {
  generate: (params: { from: string; to: string }) =>
    client.get<ReportResponse>('/reports', { params }).then(r => r.data),

  singleInvoiceURL: (eventId: string) =>
    `${BASE_URL}/events/${eventId}/invoice.pdf`,

  multiInvoice: (from: string, to: string) =>
    client.post('/reports/invoice.pdf', { from, to }, { responseType: 'blob' }).then(r => r.data),
};

export default client;
