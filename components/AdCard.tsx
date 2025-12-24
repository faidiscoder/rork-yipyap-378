import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Image, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { 
  NativeAd, 
  areRealAdsAvailable, 
  shouldShowRealAds,
  getAdUnitId, 
  isPlatformSupported,
  generateAdId,
  trackAdInteraction,
  AdData
} from '@/services/ads';

interface AdCardProps {
  ad?: AdData;
  adUnitId?: string;
  style?: any;
  onPress?: () => void;
  featured?: boolean;
}

export function AdCard({ ad, adUnitId, style, onPress, featured = false }: AdCardProps) {
  const { colors, isDark } = useThemeColors();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [adId] = useState(generateAdId());

  // Use REAL production ad unit ID
  const realAdUnitId = adUnitId || getAdUnitId();

  useEffect(() => {
    // Animate in the ad
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Only track if ads are supported
    if (isPlatformSupported()) {
      trackAdInteraction('load', adId);
    }
  }, []);

  // If we have a mock ad, render it
  if (ad) {
    return (
      <Animated.View 
        style={[
          styles.container, 
          { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF', opacity: fadeAnim },
          featured && styles.featuredContainer,
          style
        ]}
      >
        <TouchableOpacity 
          style={styles.touchable}
          onPress={() => {
            if (onPress) {
              onPress();
              trackAdInteraction('click', adId);
            }
          }}
        >
          <Text style={[styles.adLabel, { color: isDark ? '#AAAAAA' : '#888888' }]}>
            {featured ? 'Featured' : 'Ad'}
          </Text>
          
          <View style={styles.adContent}>
            <View style={styles.adHeader}>
              {ad.iconUrl && (
                <Image 
                  source={{ uri: ad.iconUrl }} 
                  style={styles.adIcon} 
                  resizeMode="cover"
                />
              )}
              <View style={styles.adHeaderText}>
                <Text style={[styles.adHeadline, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {ad.title}
                </Text>
                <Text style={[styles.adAdvertiser, { color: isDark ? '#BBBBBB' : '#666666' }]}>
                  {ad.advertiser}
                </Text>
              </View>
              {ad.rating && (
                <View style={styles.ratingContainer}>
                  <Text style={[styles.rating, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    ★ {ad.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            
            {ad.imageUrl && (
              <Image 
                source={{ uri: ad.imageUrl }} 
                style={styles.adImage} 
                resizeMode="cover"
              />
            )}
            
            <View style={styles.adBody}>
              <Text style={[styles.adBodyText, { color: isDark ? '#DDDDDD' : '#333333' }]}>
                {ad.body}
              </Text>
            </View>
            
            <View style={styles.adFooter}>
              {ad.price && (
                <Text style={[styles.adPrice, { color: isDark ? '#BBBBBB' : '#666666' }]}>
                  {ad.price}
                </Text>
              )}
              {ad.store && (
                <Text style={[styles.adStore, { color: isDark ? '#BBBBBB' : '#666666' }]}>
                  {ad.store}
                </Text>
              )}
              <View style={[styles.adCallToActionContainer, featured && styles.featuredCTA]}>
                <Text style={styles.adCallToActionText}>
                  {ad.ctaText}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Don't render anything if platform doesn't support ads
  if (!isPlatformSupported()) {
    console.log('🚫 AdCard: Platform not supported for ads');
    return null;
  }

  // Don't render anything if real ads aren't available
  if (!areRealAdsAvailable()) {
    console.log('🚫 AdCard: Real ads not available');
    return null;
  }

  // Real native ad component
  const RealNativeAdCard = () => {
    if (!NativeAd) {
      console.log('❌ NativeAd component not available');
      return null;
    }

    return (
      <Animated.View style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim }, style]}>
        <Text style={[styles.adLabel, { color: colors.subtext }]}>Advertisement</Text>
        
        <NativeAd
          adUnitId={realAdUnitId}
          onAdLoaded={() => {
            console.log('✅ Native ad loaded successfully!');
            console.log('🎯 Ad Unit ID:', realAdUnitId);
            console.log('🌍 Platform:', Platform.OS);
            setAdLoaded(true);
            setAdError(false);
            setErrorMessage('');
            trackAdInteraction('load', adId);
          }}
          onAdFailedToLoad={(error: any) => {
            console.log('❌ Native ad failed to load:', error);
            console.log('🎯 Ad Unit ID that failed:', realAdUnitId);
            setAdError(true);
            setAdLoaded(false);
            setErrorMessage(error?.message || 'Ad failed to load');
            trackAdInteraction('error', adId);
          }}
          onAdOpened={() => {
            console.log('📱 Native ad opened');
          }}
          onAdClosed={() => {
            console.log('📱 Native ad closed');
          }}
          onAdClicked={() => {
            console.log('🎯 Native ad clicked!');
            trackAdInteraction('click', adId);
          }}
          onAdImpression={() => {
            console.log('👁️ Native ad impression!');
            trackAdInteraction('impression', adId);
          }}
        >
          <View style={styles.adContent}>
            <View style={styles.adHeader}>
              <NativeAd.Icon style={styles.adIcon} />
              <View style={styles.adHeaderText}>
                <NativeAd.Headline style={[styles.adHeadline, { color: colors.text }]} />
                <NativeAd.Advertiser style={[styles.adAdvertiser, { color: colors.subtext }]} />
              </View>
              <NativeAd.StarRating style={styles.adStarRating} />
            </View>
            
            <NativeAd.Image style={styles.adImage} />
            
            <View style={styles.adBody}>
              <NativeAd.Body style={[styles.adBodyText, { color: colors.text }]} />
            </View>
            
            <View style={styles.adFooter}>
              <NativeAd.Price style={[styles.adPrice, { color: colors.subtext }]} />
              <NativeAd.Store style={[styles.adStore, { color: colors.subtext }]} />
              <NativeAd.CallToAction style={styles.adCallToAction} />
            </View>
          </View>
        </NativeAd>
      </Animated.View>
    );
  };

  return <RealNativeAdCard />;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    minHeight: 180,
    position: 'relative',
  },
  featuredContainer: {
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  touchable: {
    flex: 1,
  },
  adLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  adContent: {
    flex: 1,
    padding: 16,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  adHeaderText: {
    flex: 1,
  },
  adHeadline: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  adAdvertiser: {
    fontSize: 14,
  },
  adStarRating: {
    width: 80,
    height: 16,
  },
  ratingContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  adImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F0F0F0',
  },
  adBody: {
    marginBottom: 12,
  },
  adBodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  adFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  adStore: {
    fontSize: 14,
  },
  adCallToAction: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  adCallToActionContainer: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  featuredCTA: {
    backgroundColor: '#0084FF',
  },
  adCallToActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});