import { Platform } from 'react-native';
import React from "react";

// Type definitions for Google Mobile Ads
interface GoogleMobileAds {
  initialize: () => Promise<void>;
  setRequestConfiguration: (config: any) => void;
}

interface NativeAdComponent {
  Icon: any;
  Headline: any;
  Body: any;
  CallToAction: any;
  Advertiser: any;
  Store: any;
  StarRating: any;
  Price: any;
  Image: any;
}

interface NativeAdProps {
  adUnitId: string;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
  onAdClicked?: () => void;
  onAdImpression?: () => void;
  children?: React.ReactNode;
}

interface TestIds {
  NATIVE: string;
  BANNER: string;
  INTERSTITIAL: string;
  REWARDED: string;
}

// Mock ad data interface
export interface AdData {
  id: string;
  title: string;
  body: string;
  advertiser: string;
  ctaText: string;
  imageUrl: string;
  iconUrl: string;
  rating?: number;
  price?: string;
  store?: string;
  featured?: boolean;
}

// Platform-specific exports with proper typing
export let NativeAd: (React.ComponentType<NativeAdProps> & NativeAdComponent) | null = null;
export let TestIds: TestIds | null = null;
export let BannerAd: any = null;
export let mobileAds: GoogleMobileAds | null = null;

// REAL PRODUCTION AD UNIT IDs
export const AD_UNIT_IDS = {
  NATIVE: 'ca-app-pub-1205636326841132/9526456446',
  BANNER: 'ca-app-pub-1205636326841132/9526456446',
  INTERSTITIAL: 'ca-app-pub-1205636326841132/9526456446',
  REWARDED: 'ca-app-pub-1205636326841132/9526456446',
  APP_ID: 'ca-app-pub-1205636326841132~8951693640',
};

// Initialize ads function
export let initializeAds: () => Promise<boolean>;

// Check if we're on React Native (not web)
const isReactNative = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

// Check if we're running in Expo Go (which doesn't support native modules)
const isExpoGo = (): boolean => {
  try {
    const Constants = require('expo-constants').default;
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
};

// Check if we're in a development build (not Expo Go)
const isDevelopmentBuild = (): boolean => {
  try {
    const Constants = require('expo-constants').default;
    return Constants.executionEnvironment === 'standalone' || Constants.executionEnvironment === 'bare';
  } catch {
    return false;
  }
};

// Check if we should show ads (React Native development build only)
const shouldShowAds = (): boolean => {
  return isReactNative() && !isExpoGo() && isDevelopmentBuild();
};

// Initialize real ads for React Native development builds only
const initializeRealAds = async (): Promise<boolean> => {
  try {
    // Only initialize on React Native development builds (not web or Expo Go)
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform detected - using web stub for ads');
      // Import web stub
      const webStub = await import('../web-stubs/react-native-google-mobile-ads');
      NativeAd = webStub.NativeAd;
      TestIds = webStub.TestIds;
      BannerAd = webStub.BannerAd;
      mobileAds = webStub.default;
      return false; // Don't show real ads on web
    }

    // For development purposes, let's try to initialize ads even in Expo Go
    // This will fail gracefully, but allows for easier testing
    console.log('📱 Attempting to initialize Google Mobile Ads...');
    console.log('🎯 Platform:', Platform.OS);
    
    // Try to load the native module
    const mobileAdsModule = await import('react-native-google-mobile-ads');
    
    if (!mobileAdsModule || !mobileAdsModule.default) {
      throw new Error('Google Mobile Ads module not found');
    }
    
    // Set the exports after successful import
    mobileAds = mobileAdsModule.default;
    NativeAd = mobileAdsModule.NativeAd;
    TestIds = mobileAdsModule.TestIds;
    BannerAd = mobileAdsModule.BannerAd;
    
    if (!mobileAds || typeof mobileAds.initialize !== 'function') {
      throw new Error('AdMob initialize method not available');
    }
    
    // Configure ads
    if (mobileAds.setRequestConfiguration) {
      mobileAds.setRequestConfiguration({
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: 'MA',
      });
    }
    
    // Initialize the ads SDK
    await mobileAds.initialize();
    
    console.log('✅ Google Mobile Ads initialized successfully!');
    console.log('🎯 Ad Unit ID:', AD_UNIT_IDS.NATIVE);
    
    return true;
  } catch (error) {
    console.log('⚠️ Google Mobile Ads not available:', error.message);
    console.log('💡 This is normal if:');
    console.log('   - Running in Expo Go (native modules not supported)');
    console.log('   - Running on web platform');
    console.log('   - react-native-google-mobile-ads not installed');
    console.log('   - Not using a development build');
    console.log('🚫 Ads will be disabled');
    
    // Reset exports on failure
    mobileAds = null;
    NativeAd = null;
    TestIds = null;
    BannerAd = null;
    
    return false;
  }
};

// Set the initialize function
initializeAds = initializeRealAds;

// Helper functions
export const areRealAdsAvailable = (): boolean => {
  return shouldShowAds() && NativeAd !== null && mobileAds !== null;
};

export const shouldShowRealAds = (): boolean => {
  return shouldShowAds() && areRealAdsAvailable();
};

export const getAdUnitId = (): string => {
  return AD_UNIT_IDS.NATIVE;
};

export const getAppId = (): string => {
  return AD_UNIT_IDS.APP_ID;
};

export const isPlatformSupported = (): boolean => {
  return shouldShowAds();
};

// Track ad interactions for analytics
export const trackAdInteraction = (action: 'impression' | 'click' | 'load' | 'error', adId: string) => {
  if (!shouldShowRealAds()) {
    return;
  }
  
  console.log(`📊 Ad Analytics: ${action.toUpperCase()} - Ad ID: ${adId}`);
  console.log(`🎯 Platform: ${Platform.OS}, Ad Unit: ${getAdUnitId()}`);
};

// Get random ad ID for tracking
export const generateAdId = (): string => {
  return `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Log ad configuration
export const logAdConfiguration = () => {
  console.log('🎯 Ad Configuration:');
  console.log('   Platform:', Platform.OS);
  console.log('   React Native:', isReactNative());
  console.log('   Expo Go:', isExpoGo());
  console.log('   Development Build:', isDevelopmentBuild());
  console.log('   Ads Available:', areRealAdsAvailable());
  console.log('   Should Show Ads:', shouldShowRealAds());
  console.log('   Ad Unit ID:', getAdUnitId());
};

// Mock ads data for when real ads aren't available
const MOCK_ADS: AdData[] = [
  {
    id: 'ad-1',
    title: 'YipYap Premium',
    body: 'Upgrade to YipYap Premium for an ad-free experience and exclusive features!',
    advertiser: 'YipYap',
    ctaText: 'Upgrade Now',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    rating: 4.9,
  },
  {
    id: 'ad-2',
    title: 'Campus Connect',
    body: 'Find study groups and events happening on your campus. Connect with classmates!',
    advertiser: 'Campus Connect',
    ctaText: 'Join Now',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    rating: 4.7,
  },
  {
    id: 'ad-3',
    title: 'Student Discounts',
    body: 'Exclusive deals for students! Save on food, entertainment, and more with your .edu email.',
    advertiser: 'Student Perks',
    ctaText: 'Get Deals',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    price: 'Free',
    store: 'App Store',
  },
  {
    id: 'ad-4',
    title: 'Campus Eats',
    body: 'Order food from your favorite campus spots. Free delivery on your first order!',
    advertiser: 'Campus Eats',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    rating: 4.5,
  },
  {
    id: 'ad-5',
    title: 'Study Buddy',
    body: 'AI-powered study assistant to help you ace your exams. Try it free for 7 days!',
    advertiser: 'Study Buddy AI',
    ctaText: 'Try Free',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    price: '$4.99/mo',
    store: 'Google Play',
  }
];

// Function to get a random ad from the mock ads
export const getRandomAd = (): AdData => {
  const randomIndex = Math.floor(Math.random() * MOCK_ADS.length);
  return MOCK_ADS[randomIndex];
};

// Function to get a specific ad by ID
export const getAdById = (id: string): AdData | undefined => {
  return MOCK_ADS.find(ad => ad.id === id);
};

// Function to get all mock ads
export const getAllMockAds = (): AdData[] => {
  return [...MOCK_ADS];
};