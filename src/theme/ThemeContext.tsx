import React, { createContext, useContext, useState } from 'react';

export type ThemeMode = 'gold' | 'blue' | 'purple' | 'green';

export interface ThemeColors {
  mode: ThemeMode;
  name: string;
  bgDark: string;
  cardBg: string;
  cardBorder: string;
  primary: string;
  primaryGlow: string;
  gradientHeader: string[];
  textPrimary: string;
  textSecondary: string;
  accentGain: string;
  accentLoss: string;
}

export const THEMES: Record<ThemeMode, ThemeColors> = {
  gold: {
    mode: 'gold',
    name: '👑 Gold Lux',
    bgDark: '#0B0C0E',
    cardBg: '#15171E',
    cardBorder: 'rgba(212, 175, 55, 0.25)',
    primary: '#D4AF37',
    primaryGlow: 'rgba(212, 175, 55, 0.15)',
    gradientHeader: ['#2A210B', '#151208', '#0B0C0E'],
    textPrimary: '#FFFFFF',
    textSecondary: '#9A9DAE',
    accentGain: '#34C759',
    accentLoss: '#FF3B30',
  },
  blue: {
    mode: 'blue',
    name: '💎 Cyber Blue',
    bgDark: '#080C14',
    cardBg: '#101726',
    cardBorder: 'rgba(0, 122, 255, 0.25)',
    primary: '#007AFF',
    primaryGlow: 'rgba(0, 122, 255, 0.18)',
    gradientHeader: ['#0A2540', '#081726', '#080C14'],
    textPrimary: '#FFFFFF',
    textSecondary: '#8E9BB0',
    accentGain: '#30D158',
    accentLoss: '#FF453A',
  },
  purple: {
    mode: 'purple',
    name: '🔮 Royal Purple',
    bgDark: '#0B0813',
    cardBg: '#161124',
    cardBorder: 'rgba(175, 82, 222, 0.25)',
    primary: '#AF52DE',
    primaryGlow: 'rgba(175, 82, 222, 0.18)',
    gradientHeader: ['#28123B', '#160B24', '#0B0813'],
    textPrimary: '#FFFFFF',
    textSecondary: '#A296B8',
    accentGain: '#34C759',
    accentLoss: '#FF3B30',
  },
  green: {
    mode: 'green',
    name: '❇️ Emerald Green',
    bgDark: '#060E0B',
    cardBg: '#0F1A15',
    cardBorder: 'rgba(52, 199, 89, 0.25)',
    primary: '#34C759',
    primaryGlow: 'rgba(52, 199, 89, 0.18)',
    gradientHeader: ['#0A291A', '#06170F', '#060E0B'],
    textPrimary: '#FFFFFF',
    textSecondary: '#8DA697',
    accentGain: '#30D158',
    accentLoss: '#FF453A',
  },
};

interface ThemeContextType {
  theme: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES.gold,
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentMode] = useState<ThemeMode>('gold');

  return (
    <ThemeContext.Provider value={{ theme: THEMES[currentMode], setThemeMode: setCurrentMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);