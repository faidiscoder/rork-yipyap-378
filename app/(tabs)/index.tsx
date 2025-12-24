import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity, Pressable, StatusBar, Modal, ScrollView } from 'react-native';
import { Eye, EyeOff, RefreshCw, Filter, X } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { NearbyUsersList } from '@/components/NearbyUsersList';
import { QuickAddSection } from '@/components/QuickAddSection';
import { YipYapLogo } from '@/components/YipYapLogo';
import { useUserStore } from '@/store/userStore';
import { useLocation } from '@/hooks/useLocation';
import * as Haptics from 'expo-haptics';
import { User } from '@/types/user';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function PoolScreen() {
  const [activeTab, setActiveTab] = useState<'nearby' | 'fast-add'>('nearby');
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'non-binary'>('all');
  const [distanceFilter, setDistanceFilter] = useState(5);
  
  const { 
    nearbyUsers, 
    isLoading, 
    isGhostModeEnabled, 
    toggleGhostMode, 
    currentUser, 
    fetchNearbyUsers,
    refreshQuickAdd,
    quickAddUsers,
    settings,
    setUserLocation,
    userLocation,
    isFriend,
    setMaxDistance
  } = useUserStore();
  
  const { 
    location, 
    loading: locationLoading, 
    error: locationError, 
    requestLocation,
    permissionStatus 
  } = useLocation();
  
  const { colors, isDark } = useThemeColors();
  const router = useRouter();

  // Get user's distance setting (default to 5 miles)
  const userDistanceSetting = settings?.distanceSettings?.maxDistance || 5;

  // Fix: Safely check if isFriend is a function
  const safeIsFriend = typeof isFriend === 'function' 
    ? isFriend 
    : () => false;

  // Update user location in store when location changes
  useEffect(() => {
    if (location) {
      setUserLocation(location);
    }
  }, [location, setUserLocation]);

  const handleGhostToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleGhostMode();
  };

  const handleUserPress = (user: User) => {
    router.push(`/profile/${user.id}`);
  };

  const handleRefresh = async () => {
    console.log('Manual refresh triggered for tab:', activeTab);
    
    if (activeTab === 'nearby') {
      // Request fresh location and then fetch nearby users
      const freshLocation = await requestLocation(true);
      if (freshLocation) {
        console.log('Fetching nearby users with fresh location');
        fetchNearbyUsers(freshLocation, userDistanceSetting);
      } else if (location) {
        console.log('Using existing location for nearby users');
        fetchNearbyUsers(location, userDistanceSetting);
      }
    } else if (activeTab === 'fast-add') {
      refreshQuickAdd();
    }
  };

  // Filter out friends and current user from nearby and quick add users
  const filteredNearbyUsers = nearbyUsers && Array.isArray(nearbyUsers) 
    ? nearbyUsers.filter(user => {
        const notSelfOrFriend = !safeIsFriend(user.id) && user.id !== 'current_user' && user.id !== currentUser?.id;
        const genderOk = genderFilter === 'all' ? true : (user.gender?.toLowerCase?.() === genderFilter);
        return notSelfOrFriend && genderOk;
      })
    : [];
  
  const filteredQuickAddUsers = quickAddUsers && Array.isArray(quickAddUsers)
    ? quickAddUsers.filter(user => 
        !safeIsFriend(user.id) && 
        user.id !== 'current_user' && 
        user.id !== currentUser?.id
      )
    : [];

  // Use filtered users
  const safeNearbyUsers = filteredNearbyUsers;
  const safeQuickAddUsers = filteredQuickAddUsers;

  const getSubtitle = () => {
    if (locationLoading) {
      return 'Getting your location...';
    }
    
    if (locationError) {
      return 'Location access needed for nearby features';
    }
    
    if (!location) {
      return 'Enable location to see nearby people';
    }

    if (activeTab === 'nearby') {
      if (isGhostModeEnabled) {
        return 'Ghost mode enabled - you are invisible';
      }
      return safeNearbyUsers.length > 0 
        ? `${safeNearbyUsers.length} people within ${userDistanceSetting} miles`
        : `No one nearby within ${userDistanceSetting} miles`;
    } else if (activeTab === 'fast-add') {
      return safeQuickAddUsers.length > 0 
        ? `${safeQuickAddUsers.length} people recommended for you`
        : 'Discover new friends';
    }
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={isDark ? ['#0A3D62', '#1E5D8C'] : ['#007AFF', '#0051D5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <YipYapLogo size={24} />
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleRefresh}
                disabled={isLoading || locationLoading}
              >
                <RefreshCw size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setShowFilters(true)}
              >
                <Filter size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  isGhostModeEnabled && styles.activeIconButton
                ]}
                onPress={handleGhostToggle}
              >
                {isGhostModeEnabled ? (
                  <EyeOff size={24} color="#FFFFFF" />
                ) : (
                  <Eye size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerContent}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
              style={styles.beachyBackground}
            >
              <Text style={[styles.title, { color: '#FFFFFF' }]}>Pool</Text>
              <Text style={[styles.subtitle, { color: '#FFFFFF' }]}>
                {getSubtitle()}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.tabs}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'nearby' && styles.activeTab
              ]}
              onPress={() => setActiveTab('nearby')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'nearby' && styles.activeTabText
              ]}>
                Nearby
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'fast-add' && styles.activeTab
              ]}
              onPress={() => setActiveTab('fast-add')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'fast-add' && styles.activeTabText
              ]}>
                Fast Add
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.content, isDark ? styles.darkContent : styles.lightContent]}>
        {activeTab === 'nearby' ? (
          <NearbyUsersList 
            users={safeNearbyUsers} 
            isLoading={isLoading || locationLoading} 
            onUserPress={handleUserPress}
            maxDistance={userDistanceSetting}
            showAge={true}
            showSchool={true}
            showRelationship={true}
          />
        ) : (
          <QuickAddSection 
            showAge={true}
            showSchool={true}
            showRelationship={true}
          />
        )}
      </View>
      
      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={[styles.filtersModal, isDark && styles.darkFiltersModal]}>
          <View style={styles.filtersHeader}>
            <Text style={[styles.filtersTitle, isDark && { color: '#FFFFFF' }]}>Filters</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowFilters(false)}
            >
              <X size={24} color={isDark ? '#FFFFFF' : '#333333'} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filtersContent}>
            {/* Distance Filter */}
            <View style={[styles.filterSection, isDark && styles.darkFilterSection]}>
              <Text style={[styles.filterLabel, isDark && { color: '#FFFFFF' }]}>Distance</Text>
              <Text style={[styles.filterValue, isDark && { color: '#0066CC' }]}>
                {distanceFilter} miles
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={distanceFilter}
                onValueChange={setDistanceFilter}
                onSlidingComplete={(value) => {
                  setMaxDistance(value);
                  if (activeTab === 'nearby' && location) {
                    fetchNearbyUsers(location, value);
                  }
                }}
                minimumTrackTintColor="#0066CC"
                maximumTrackTintColor={isDark ? '#333333' : '#E0E0E0'}
                thumbTintColor="#0066CC"
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, isDark && { color: '#999999' }]}>1 mile</Text>
                <Text style={[styles.sliderLabel, isDark && { color: '#999999' }]}>50 miles</Text>
              </View>
            </View>
            
            {/* Gender Filter */}
            <View style={[styles.filterSection, isDark && styles.darkFilterSection]}>
              <Text style={[styles.filterLabel, isDark && { color: '#FFFFFF' }]}>Gender</Text>
              <View style={styles.genderOptions}>
                {[{ key: 'all', label: 'All' }, { key: 'male', label: 'Male' }, { key: 'female', label: 'Female' }, { key: 'non-binary', label: 'Non-binary' }].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.genderOption,
                      genderFilter === option.key && styles.selectedGenderOption,
                      isDark && styles.darkGenderOption,
                      genderFilter === option.key && isDark && styles.selectedDarkGenderOption
                    ]}
                    onPress={() => setGenderFilter(option.key as any)}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      genderFilter === option.key && styles.selectedGenderOptionText,
                      isDark && { color: '#FFFFFF' },
                      genderFilter === option.key && { color: '#FFFFFF' }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Apply Filters Button */}
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                setMaxDistance(distanceFilter);
                if (activeTab === 'nearby' && location) {
                  fetchNearbyUsers(location, distanceFilter);
                }
                setShowFilters(false);
              }}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  header: {
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  beachyBackground: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    width: '100%',
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeIconButton: {
    backgroundColor: 'rgba(255, 127, 80, 0.5)',
  },
  tabs: {
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeTab: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
  },
  tabText: {
    color: '#E0FFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  lightContent: {
    backgroundColor: '#E0E0E0',
  },
  darkContent: {
    backgroundColor: '#1A1A1A',
  },
  filtersModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkFiltersModal: {
    backgroundColor: '#121212',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  darkFilterSection: {
    backgroundColor: '#1A1A1A',
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  filterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666666',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  darkGenderOption: {
    backgroundColor: '#333333',
  },
  selectedGenderOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  selectedDarkGenderOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  selectedGenderOptionText: {
    color: '#FFFFFF',
  },
  applyFiltersButton: {
    backgroundColor: '#0066CC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  applyFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});