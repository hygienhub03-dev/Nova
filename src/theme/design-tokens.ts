export const colors = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  accent: '#f59e0b',
  accentLight: '#fbbf24',
  danger: '#ef4444',
  dangerLight: '#fca5a5',
  success: '#22c55e',
  successLight: '#86efac',
  purple: '#7c3aed',
  purpleLight: '#a78bfa',
  pink: '#ec4899',
  pinkLight: '#f9a8d4',
  surface: '#0a1628',
  surfaceLight: '#1e3a5f',
  background: '#000000',
  card: 'rgba(255,255,255,0.08)',
  cardHover: 'rgba(255,255,255,0.12)',
  textPrimary: '#ffffff',
  textSecondary: '#e0e0e0',
  textTertiary: '#888888',
  textMuted: '#666666',
  textInverse: '#000000',
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0,0,0,0.5)',
  glass: 'rgba(255,255,255,0.05)',
  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  xxxxxxxl: 64,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  xxxl: 30,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    primary: 'System',
    mono: 'monospace',
  },
  fontSize: {
    xs: 10,
    sm: 11,
    md: 13,
    lg: 15,
    xl: 17,
    xxl: 20,
    xxxl: 24,
    xxxxl: 28,
    xxxxxl: 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
    loose: 2.0,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '300ms ease',
  slow: '500ms ease',
  spring: 'spring(damping: 10)',
} as const;

export const layout = {
  screenPaddingHorizontal: 16,
  cardPadding: 14,
  inputPaddingVertical: 12,
  inputPaddingHorizontal: 16,
  buttonHeight: 44,
  headerHeight: 48,
  tabBarHeight: 60,
  maxContentWidth: 600,
  borderRadiusCard: 14,
  borderRadiusButton: 12,
  borderRadiusInput: 12,
  borderRadiusPill: 20,
} as const;