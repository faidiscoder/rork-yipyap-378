import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface YipYapLogoProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
}

export function YipYapLogo({ size = 'medium', color = '#FFFFFF' }: YipYapLogoProps) {
  let logoSize: number;
  let textSize: number;
  
  if (typeof size === 'number') {
    logoSize = size;
    textSize = size * 1.2;
  } else {
    switch (size) {
      case 'small':
        logoSize = 20;
        textSize = 24;
        break;
      case 'large':
        logoSize = 40;
        textSize = 48;
        break;
      default: // medium
        logoSize = 24;
        textSize = 28;
        break;
    }
  }

  return (
    <View style={styles.logoContainer}>
      <Text style={[styles.logoText, { fontSize: textSize, color }]}>
        <Text style={styles.yipText}>Yip</Text>
        <Text style={styles.yapText}>Yap</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  yipText: {
    color: '#FF1493', // Brighter deep pink
  },
  yapText: {
    color: '#00BFFF', // Bright blue (keeping same as it's already bright)
  },
});