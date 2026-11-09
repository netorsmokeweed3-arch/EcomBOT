// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

export const THEMES = {
  gold: {
    mode: 'gold',
    name: 'Gold Lux',
    bgDark: '#0D0D0E',
    cardBg: 'rgba(26, 26, 30, 0.65)',
    cardBorder: 'rgba(226, 177, 103, 0.25)',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    accentGain: '#34C759',
    accentLoss: '#FF3B30',
    primary: '#E2B167',
    gradientHeader: ['#2A2015', '#141210', '#0D0D0E'] as [string, string, string],
  },
  blue: {
    mode: 'blue',
    name: 'Cyber Blue',
    bgDark: '#090D16',
    cardBg: 'rgba(15, 23, 42, 0.65)',
    cardBorder: 'rgba(56, 189, 248, 0.25)',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    accentGain: '#34C759',
    accentLoss: '#FF3B30',
    primary: '#38BDF8',
    gradientHeader: ['#0F172A', '#090D16', '#05070B'] as [string, string, string],
  },
  purple: {
    mode: 'purple',
    name: 'Royal Purple',
    bgDark: '#0B0813',
    cardBg: 'rgba(26, 18, 38, 0.65)',
    cardBorder: 'rgba(175, 82, 222, 0.25)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A29EBB',
    accentGain: '#34C759',
    accentLoss: '#FF3B30',
    primary: '#AF52DE',
    gradientHeader: ['#1C102D', '#0B0813', '#050308'] as [string, string, string],
  },
  green: {
    mode: 'green',
    name: 'Emerald Green',
    bgDark: '#07100D',
    cardBg: 'rgba(15, 28, 23, 0.65)',
    cardBorder: 'rgba(52, 199, 89, 0.25)',
    textPrimary: '#FFFFFF',
    textSecondary: '#8DA697',
    accentGain: '#34C759',
    accentLoss: '#FF3B30',
    primary: '#34C759',
    gradientHeader: ['#0A291A', '#07100D', '#030706'] as [string, string, string],
  },
};

export type ThemeType = typeof THEMES.gold;

interface ThemeContextType {
  theme: ThemeType;
  setThemeMode: (mode: keyof typeof THEMES) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES.gold,
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeKey, setCurrentThemeKey] = useState<keyof typeof THEMES>('gold');

  const setThemeMode = (mode: keyof typeof THEMES) => {
    if (THEMES[mode]) {
      setCurrentThemeKey(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[currentThemeKey], setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ОСЬ ЦЕЙ ХУК ВИРІШУЄ ПРОБЛЕМУ З ПОМИЛКОЮ НА ФОТО:
export const useAppTheme = () => useContext(ThemeContext);