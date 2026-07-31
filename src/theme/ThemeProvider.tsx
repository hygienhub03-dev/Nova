import React, { createContext, useContext } from 'react';
import { colors, spacing, borderRadius, typography, shadows, transitions, layout } from './design-tokens';

export const ThemeContext = createContext({
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  layout,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return colors;
}

export function useThemeSpacing() {
  return spacing;
}

export function useThemeBorderRadius() {
  return borderRadius;
}

export function useThemeTypography() {
  return typography;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors, spacing, borderRadius, typography, shadows, transitions, layout }}>
      {children}
    </ThemeContext.Provider>
  );
}