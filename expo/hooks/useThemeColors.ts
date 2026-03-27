import { useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { fonts, getFontFamily, FontWeight } from '@/constants/fonts';

// Define light theme colors
const lightColors = {
  primary: '#0084FF',
  secondary: '#6C5CE7',
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  notification: '#FF3B30',
  success: '#4CD964',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#0084FF',
  muted: '#999999',
  ocean: {
    deep: '#0066CC',
    light: '#0084FF'
  }
};

// Define dark theme colors
const darkColors = {
  primary: '#0084FF',
  secondary: '#6C5CE7',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#333333',
  notification: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0A84FF',
  muted: '#8E8E93',
  ocean: {
    deep: '#0066CC',
    light: '#0084FF'
  }
};

export function useThemeColors() {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  
  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);
  
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    mode: 'system' as const,
    fonts,
    getFontFamily,
  };
}