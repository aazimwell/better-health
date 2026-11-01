export const colors = {
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  primarySoft: '#E3F0FF',
  bg: '#EAF4FF',
  bgLight: '#F4F9FF',
  card: '#FFFFFF',
  border: '#DCE9F7',
  text: '#0F2A4A',
  textMuted: '#6B7F99',
  success: '#22A66B',
  successSoft: '#E5F7EE',
  warning: '#F5A524',
  warningSoft: '#FFF3DC',
  danger: '#E5484D',
  dangerSoft: '#FDE8E9',
  purple: '#7C5CE0',
  purpleSoft: '#EEE9FD',
  orange: '#F97316',
  orangeSoft: '#FFEBDD',
};

/** Shared brand gradients (all 3-stop for a richer, less flat look). */
export const gradients = {
  hero: ['#1450C8', '#1F7BF0', '#3FB6FF'] as const,        // deep royal → bright sky
  primary: ['#3B9BFF', '#1F6FEB', '#1650C0'] as const,     // buttons / active nav
  success: ['#5FD39A', '#2DB87C', '#1A9060'] as const,
  danger: ['#FF7A7F', '#E5484D', '#C23036'] as const,
  brand: ['#1F7BF0', '#2AA7C9', '#35C48F'] as const,       // blue → teal → green (logo colours)
  screen: ['#D3E8FF', '#E9F3FF', '#F8FBFF'] as const,
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const shadow = {
  shadowColor: '#1A4F99',
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

export const font = { h1: 30, h2: 22, h3: 17, body: 14, small: 12 };

export const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: colors.warningSoft, fg: colors.warning, label: 'Pending' },
  approved: { bg: colors.successSoft, fg: colors.success, label: 'Confirmed' },
  rejected: { bg: colors.dangerSoft, fg: colors.danger, label: 'Rejected' },
  completed: { bg: colors.primarySoft, fg: colors.primary, label: 'Completed' },
  cancelled: { bg: '#EEF1F5', fg: colors.textMuted, label: 'Cancelled' },
};
