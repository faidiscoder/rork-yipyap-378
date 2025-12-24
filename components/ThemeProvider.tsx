import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { fonts, getFontFamily, FontWeight } from '@/constants/fonts';

// Define theme types
type ThemeType = 'light' | 'dark' | 'system';

// Define theme context
interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  fonts: typeof fonts;
  getFontFamily: (weight?: FontWeight) => string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
}

// Create context with default values (dark theme as default)
const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  setTheme: () => {},
  fonts,
  getFontFamily,
  colors: {
    primary: '#007AFF',
    secondary: '#6C5CE7',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    border: '#333333',
    notification: '#FF453A',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
    info: '#0A84FF',
  },
});

// Custom theme provider
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { mode, isDark, setMode, setIsDark, initializeTheme } = useThemeStore();
  
  // Initialize theme based on system preference or stored preference
  useEffect(() => {
    if (systemColorScheme) {
      initializeTheme(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, initializeTheme]);
  
  // Update isDark when mode changes
  useEffect(() => {
    if (mode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else if (mode === 'dark') {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, [mode, systemColorScheme, setIsDark]);
  
  // Define color palettes
  const lightColors = {
    primary: '#007AFF',
    secondary: '#6C5CE7',
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    notification: '#FF3B30',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
  };
  
  const darkColors = {
    primary: '#007AFF',
    secondary: '#6C5CE7',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    border: '#333333',
    notification: '#FF453A',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
    info: '#0A84FF',
  };
  
  // Select the appropriate color palette
  const colors = isDark ? darkColors : lightColors;
  
  // Set theme function
  const setTheme = (newTheme: ThemeType) => {
    setMode(newTheme);
  };
  
  // Context value
  const contextValue = {
    theme: mode,
    isDark,
    setTheme,
    fonts,
    getFontFamily,
    colors,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);