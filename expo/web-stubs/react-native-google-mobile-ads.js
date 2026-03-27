// Web stub for react-native-google-mobile-ads
// This file provides mock implementations for web compatibility

import React from 'react';
import { View, Text } from 'react-native';

// Real Production Ad Unit IDs (for web stub compatibility)
export const TestIds = {
  NATIVE: 'ca-app-pub-1205636326841132/9526456446',
  BANNER: 'ca-app-pub-1205636326841132/9526456446',
  INTERSTITIAL: 'ca-app-pub-1205636326841132/9526456446',
  REWARDED: 'ca-app-pub-1205636326841132/9526456446',
};

// Mock NativeAd component
export const NativeAd = (props) => {
  const { children, adUnitId, onAdLoaded } = props;
  
  React.useEffect(() => {
    // Simulate ad loading
    const timer = setTimeout(() => {
      if (onAdLoaded) {
        onAdLoaded();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return <View>{children}</View>;
};

// Add subcomponents to NativeAd
NativeAd.Icon = (props) => <View style={props.style} />;
NativeAd.Headline = (props) => <Text style={props.style}>Ad Headline</Text>;
NativeAd.Body = (props) => <Text style={props.style}>Ad body text would appear here in a real ad.</Text>;
NativeAd.CallToAction = (props) => <Text style={props.style}>Learn More</Text>;
NativeAd.Advertiser = (props) => <Text style={props.style}>Advertiser</Text>;
NativeAd.Store = (props) => <Text style={props.style}>App Store</Text>;
NativeAd.StarRating = (props) => <View style={props.style} />;
NativeAd.Price = (props) => <Text style={props.style}>$0.00</Text>;
NativeAd.Image = (props) => <View style={props.style} />;

// Mock BannerAd component
export const BannerAd = (props) => {
  return (
    <View 
      style={{
        width: '100%',
        height: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Banner Ad (Web Stub)</Text>
    </View>
  );
};

// Mock mobileAds module
const mobileAds = {
  initialize: async () => {
    console.log('Mock mobileAds.initialize called');
    return Promise.resolve();
  },
  setRequestConfiguration: (config) => {
    console.log('Mock mobileAds.setRequestConfiguration called with:', config);
  },
};

export default mobileAds;