

export const COLORS = {
  // Primary palette - deep navy + warm cream
  primary: '#0D1B2A',
  primaryDark: '#060F18',
  accent: '#E8A020',
  accentLight: '#FFF3DC',
  accentDark: '#C27A00',

  // Secondary
  secondary: '#1B4F72',
  secondaryLight: '#D6EAF8',

  // Status colors
  profit: '#1A7A4A',
  profitLight: '#D5F0E3',
  loss: '#C0392B',
  lossLight: '#FDEDEC',
  warning: '#D4802A',
  warningLight: '#FDEBD0',

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F8F6F1',
  surface: '#FFFFFF',
  surfaceElevated: '#F4F2EE',
  border: '#D8D3C8',
  borderLight: '#EDE9E1',
  muted: '#8A8070',
  mutedLight: '#C5BFB0',

  // Text
  text: '#1A1714',
  textSecondary: '#5A5248',
  textLight: '#9A9088',
  textInverse: '#FFFFFF',

  // Status badges
  statusDraft: '#8A8070',
  statusConfirmed: '#1B4F72',
  statusCompleted: '#1A7A4A',
  statusCancelled: '#C0392B',

  // Role badges
  roleAdmin: '#4A1060',
  roleSubAdmin: '#1B4F72',
  roleStaff: '#2E7D32',
};

export const FONTS = {
  heading: 'System',
  mono: 'Courier',

  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 100,
};

export const SHADOW = {
  sm: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: {
    bg: '#F0EDE6',
    text: COLORS.statusDraft,
    label: 'Draft',
  },
  confirmed: {
    bg: '#D6EAF8',
    text: COLORS.statusConfirmed,
    label: 'Confirmed',
  },
  completed: {
    bg: '#D5F0E3',
    text: COLORS.statusCompleted,
    label: 'Completed',
  },
  cancelled: {
    bg: '#FDEDEC',
    text: COLORS.statusCancelled,
    label: 'Cancelled',
  },
};

export const EXPENSE_CATEGORIES = [
  'Food & Beverage',
  'Transport',
  'Decoration',
  'Equipment',
  'Staff',
  'Venue',
  'Printing',
  'Other',
];

export const FONT_SIZE = FONTS.size;
export const FONT_WEIGHT = FONTS.weight;
