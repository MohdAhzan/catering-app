// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'sub_admin' | 'staff';
export type EventStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

// ─── USER ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  parent_id?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

// ─── EVENT ───────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
  bill_number: string;
  status: EventStatus;
  notes: string;
  created_by: string;
  creator: User;
  billing_items?: BillingItem[];
  expenses?: Expense[];
  misc_expenses?: MiscExpense[];
  // Computed financials
  total_billing: number;
  total_expenses: number;
  total_misc: number;
  profit_loss: number;
  created_at: string;
  updated_at: string;
}

// ─── BILLING ─────────────────────────────────────────────────────────────────

export interface BillingItem {
  id: string;
  event_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
  created_by: string;
  created_at: string;
}

// ─── EXPENSE ──────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  event_id: string;
  description: string;
  amount: number;
  bill_image_url?: string;
  category?: string;
  created_by: string;
  creator: User;
  created_at: string;
}

export interface MiscExpense {
  id: string;
  event_id: string;
  description: string;
  amount: number;
  note?: string;
  created_by: string;
  creator: User;
  created_at: string;
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  user_id: string;
  user: User;
  action: ActionType;
  entity_type: string;
  entity_id: string;
  event_id?: string;
  description: string;
  old_values?: string;
  new_values?: string;
  created_at: string;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export interface PeriodStats {
  revenue: number;
  expenses: number;
  profit_loss: number;
  event_count: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface DashboardStats {
  total_events: number;
  total_revenue: number;
  total_expenses: number;
  total_misc: number;
  net_profit_loss: number;
  recent_events: Event[];
  monthly_revenue: MonthlyData[];
  events_by_status: Record<string, number>;
  this_month: PeriodStats;
  last_month: PeriodStats;
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

export interface EventSummary {
  id: string;
  name: string;
  bill_number: string;
  date: string;
  location: string;
  revenue: number;
  expenses: number;
  misc: number;
  profit_loss: number;
}

export interface ReportResponse {
  events: EventSummary[];
  total_revenue: number;
  total_expenses: number;
  net_profit_loss: number;
  period: string;
}

// ─── API RESPONSE TYPES ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── FORM TYPES ───────────────────────────────────────────────────────────────

export interface CreateEventForm {
  name: string;
  location: string;
  date: Date;
  bill_number: string;
  notes: string;
  status: EventStatus;
}

export interface BillingItemForm {
  item_name: string;
  description: string;
  quantity: string;
  rate: string;
}

export interface ExpenseForm {
  description: string;
  amount: string;
  category: string;
  bill_image_url: string;
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  EventDetails: { eventId: string };
  CreateEvent: { eventId?: string } | undefined;
  AddItems: { eventId: string };
  Expenses: { eventId: string };
  InvoicePreview: { eventId: string };
  ActivityLog: { eventId: string };
  UserManagement: undefined;
};
