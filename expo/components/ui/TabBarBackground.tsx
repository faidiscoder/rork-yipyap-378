import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

function TabBarBackground() {
  // On iOS, use BlurView for a more native look with custom styling
  // On Android, use a gradient background
  if (Platform.OS === 'ios') {
    return (
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
          style={[StyleSheet.absoluteFill, styles.gradientContainer]}
        />
        <BlurView 
          tint="dark" 
          intensity={80} 
          style={[StyleSheet.absoluteFill, styles.blurContainer]} 
        />
      </View>
    );
  }
  
  // For Android and other platforms
  return (
    <LinearGradient
      colors={['rgba(20,20,30,0.9)', 'rgba(10,10,15,0.95)']}
      style={[StyleSheet.absoluteFill, styles.androidBackground]}
    />
  );
}

// Default export
export default TabBarBackground;

// Named export for compatibility
export { TabBarBackground };

const styles = StyleSheet.create({
  blurContainer: {
    // Ensure the blur extends beyond the tab bar boundaries
    bottom: -10,
    left: -10,
    right: -10,
  },
  gradientContainer: {
    // Ensure the gradient extends beyond the tab bar boundaries
    bottom: -10,
    left: -10,
    right: -10,
  },
  androidBackground: {
    // Add subtle shadow to the top of the tab bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  }
});