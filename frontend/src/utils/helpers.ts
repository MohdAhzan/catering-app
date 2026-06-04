import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ─── CURRENCY ─────────────────────────────────────────────────────────────────

export const formatCurrency = (amount: number, compact = false): string => {
  if (compact && Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatProfitLoss = (amount: number): { text: string; isProfit: boolean } => {
  const isProfit = amount >= 0;
  return {
    text: `${isProfit ? '+' : ''}${formatCurrency(amount)}`,
    isProfit,
  };
};

// ─── DATES ────────────────────────────────────────────────────────────────────

export const formatDate = (dateStr: string, fmt = 'dd MMM yyyy'): string => {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
};

export const formatDateCompact = (dateStr: string): string =>
  formatDate(dateStr, 'dd MMM yy');

export const formatDateTime = (dateStr: string): string =>
  formatDate(dateStr, 'dd MMM yyyy, HH:mm');

export const formatRelative = (dateStr: string): string => {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

export const toAPIDate = (date: Date): string =>
  format(date, 'yyyy-MM-dd');

export const toAPIDateTime = (date: Date): string =>
  date.toISOString();

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
};

export const getRoleLabel = (role: string): string => {
  const map: Record<string, string> = {
    admin: 'Admin',
    sub_admin: 'Sub-Admin',
    staff: 'Staff',
  };
  return map[role] || role;
};

// ─── VALIDATION ───────────────────────────────────────────────────────────────

export const isValidAmount = (str: string): boolean => {
  const n = parseFloat(str);
  return !isNaN(n) && n > 0;
};

export const parseAmount = (str: string): number =>
  parseFloat(str) || 0;

// ─── MISC ─────────────────────────────────────────────────────────────────────

export const generateBillNumber = (): string => {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${yr}${mo}-${rand}`;
};

export const truncate = (str: string, len = 30): string =>
  str.length > len ? str.slice(0, len) + '…' : str;

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
