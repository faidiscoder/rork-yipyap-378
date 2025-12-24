import { Platform } from 'react-native';

// System font mappings for different platforms
const systemFonts = {
  ios: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    extraBold: 'System',
    black: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto_medium',
    semiBold: 'Roboto_medium',
    bold: 'Roboto_bold',
    extraBold: 'Roboto_bold',
    black: 'Roboto_black',
  },
  web: {
    regular: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    medium: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    semiBold: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    bold: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    extraBold: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    black: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export const fonts = Platform.select({
  ios: systemFonts.ios,
  android: systemFonts.android,
  default: systemFonts.web,
}) as {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  extraBold: string;
  black: string;
};

export type FontWeight = keyof typeof fonts;

export const getFontFamily = (weight: FontWeight = 'regular'): string => {
  return fonts[weight];
};

// Font weight mappings for system fonts
export const getFontStyle = (weight: FontWeight = 'regular') => {
  const weightMap = {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  };

  return {
    fontFamily: getFontFamily(weight),
    fontWeight: weightMap[weight] as any,
  };
};