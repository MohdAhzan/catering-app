import { create } from 'zustand';
//import AsyncStorage from '@react-native-async-storage/async-storage';
//import { User, Event, DashboardStats } from '../types';
//import { authAPI } from '../api/client';

// ─── AUTH STORE ───────────────────────────────────────────────────────────────

interface AuthState {
  //user: User | null;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    console.log(email,password)
    //const data = await authAPI.login(email, password);
    //await AsyncStorage.setItem('auth_token', data.token);
    //await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
    //set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  logout: async () => {
    //await AsyncStorage.removeItem('auth_token');
    //await AsyncStorage.removeItem('auth_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {

    set({isLoading: false})
    //try {
    //  const token = await AsyncStorage.getItem('auth_token');
    //  const userStr = await AsyncStorage.getItem('auth_user');
    //  if (token && userStr) {
    //    const user = JSON.parse(userStr) as User;
    //    set({ user, token, isAuthenticated: true });
    //    // Refresh user from API
    //    try {
    //      const freshUser = await authAPI.me();
    //      await AsyncStorage.setItem('auth_user', JSON.stringify(freshUser));
    //      set({ user: freshUser });
    //    } catch {
    //      // Token may be expired - handled by interceptor
    //    }
    //  }
    //} finally {
    //  set({ isLoading: false });
    //}
  },
}));

// ─── EVENT STORE ──────────────────────────────────────────────────────────────

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  total: number;
  page: number;
  isLoading: boolean;
  searchQuery: string;
  filterStatus: string;

  setEvents: (events: Event[], total: number) => void;
  setCurrentEvent: (event: Event | null) => void;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  removeEvent: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setFilterStatus: (s: string) => void;
  setLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  currentEvent: null,
  total: 0,
  page: 1,
  isLoading: false,
  searchQuery: '',
  filterStatus: '',

  setEvents: (events, total) => set({ events, total }),
  setCurrentEvent: (event) => set({ currentEvent: event }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events], total: s.total + 1 })),
  updateEvent: (event) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === event.id ? event : e)),
      currentEvent: s.currentEvent?.id === event.id ? event : s.currentEvent,
    })),
  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id), total: Math.max(0, s.total - 1) })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setLoading: (isLoading) => set({ isLoading }),
  setPage: (page) => set({ page }),
}));

// ─── DASHBOARD STORE ──────────────────────────────────────────────────────────

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  setStats: (stats: DashboardStats) => void;
  setLoading: (l: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
}));
