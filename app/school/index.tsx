import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, MapPin, School as SchoolIcon, Users, BookOpen, RefreshCw, GraduationCap, Star, Sparkles, Waves, Sun, Umbrella } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore } from '@/store/userStore';
import { useLocation } from '@/hooks/useLocation';
import { School } from '@/types/user';
import { LinearGradient } from 'expo-linear-gradient';
import { mockSchools } from '@/mocks/schools';

export default function SchoolsScreen() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { currentUser, calculateDistance } = useUserStore();
  const { location, loading: locationLoading, requestLocation, validateLocation } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [nearbySchools, setNearbySchools] = useState<School[]>([]);
  const [userSchool, setUserSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolCount, setSchoolCount] = useState(0);

  useEffect(() => {
    loadSchools();
    loadSchoolCount();
  }, [location]);

  const loadSchoolCount = async () => {
    try {
      setSchoolCount(mockSchools.length);
    } catch (error) {
      console.error('Error loading school count:', error);
      // Set a default count if API fails
      setSchoolCount(25000);
    }
  };

  const loadSchools = async () => {
    setIsLoading(true);
    try {
      // Load schools from mock data
      const schoolsData = mockSchools;
      
      // Calculate distance if location is available
      let schoolsWithDistance = schoolsData;
      if (location && validateLocation(location)) {
        schoolsWithDistance = schoolsData.map(school => {
          if (school.location) {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              school.location.latitude,
              school.location.longitude
            );
            return { ...school, distance };
          }
          return school;
        });
      }
      
      setSchools(schoolsWithDistance);
      
      // Set nearby schools if location is available
      if (location && validateLocation(location)) {
        const sortedByDistance = [...schoolsWithDistance]
          .filter(school => school.distance !== undefined && school.distance !== null)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setNearbySchools(sortedByDistance.slice(0, 5));
      }
      
      // Find user's school if they have one
      if (currentUser?.school) {
        const schoolId = currentUser.school.split(' - ')[1];
        const foundSchool = schoolsWithDistance.find((s: School) => s.id === schoolId);
        setUserSchool(foundSchool || null);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([]);
      setNearbySchools([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolPress = (school: School) => {
    router.push(`/school/${school.id}`);
  };

  const navigateToSearch = () => {
    router.push('/school/search');
  };
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Request fresh location and reload schools
    await requestLocation(true);
    await loadSchools();
    await loadSchoolCount();
    setRefreshing(false);
  }, [requestLocation]);

  const formatDistance = (distance: number | undefined): string => {
    if (distance === undefined) return 'N/A';
    if (distance < 0.1) {
      return `${Math.round(distance * 5280)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F0F8FF' }]} edges={['top', 'bottom']}>
      {/* Beachy Header */}
      <LinearGradient
        colors={isDark ? ['#0A3D62', '#1E5D8C'] : ['#87CEEB', '#4682B4', '#1E90FF']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <Waves size={28} color="#FFFFFF" />
              <Sun size={16} color="#FFD700" style={styles.sunIcon} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Schools</Text>
              <Text style={styles.headerSubtitle}>
                {schoolCount.toLocaleString()} high schools nationwide
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <RefreshCw size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {location && (
          <View style={styles.locationContainer}>
            <Umbrella size={14} color="#FFFFFF" />
            <Text style={styles.locationInfo}>
              Current Location Detected
              {location.accuracy && ` (±${Math.round(location.accuracy)}m accuracy)`}
            </Text>
          </View>
        )}
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Beachy Hero Section */}
        <LinearGradient
          colors={isDark ? ['#0A3D62', '#1E5D8C'] : ['#87CEEB', '#4682B4']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <GraduationCap size={48} color="#FFFFFF" />
              <Sparkles size={24} color="#FFD700" style={styles.sparkleIcon} />
              <Waves size={20} color="rgba(255,255,255,0.7)" style={styles.waveIcon} />
            </View>
            <Text style={styles.heroTitle}>Discover Your Campus</Text>
            <Text style={styles.heroSubtitle}>
              Connect with classmates, join study groups, and explore what's happening at your school
            </Text>
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={navigateToSearch}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F0F8FF']}
                style={styles.heroButtonGradient}
              >
                <Search size={20} color={isDark ? '#0A3D62' : '#4682B4'} />
                <Text style={[styles.heroButtonText, { color: isDark ? '#0A3D62' : '#4682B4' }]}>Find Your School</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.beachWaves}>
            <Waves size={32} color="rgba(255,255,255,0.3)" />
            <Waves size={24} color="rgba(255,255,255,0.2)" style={styles.wave2} />
            <Waves size={20} color="rgba(255,255,255,0.1)" style={styles.wave3} />
          </View>
        </LinearGradient>
        
        {currentUser?.school && userSchool ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Star size={20} color="#FFD700" />
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>Your School</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.schoolCard, styles.userSchoolCard]}
              onPress={() => handleSchoolPress(userSchool)}
            >
              <LinearGradient
                colors={isDark ? ['#0A3D62', '#1E5D8C'] : ['#4682B4', '#1E90FF']}
                style={styles.schoolCardGradient}
              >
                <View style={styles.schoolCardContent}>
                  <View style={styles.schoolBadge}>
                    <Text style={styles.schoolInitial}>
                      {userSchool.name.charAt(0)}
                    </Text>
                  </View>
                  
                  <View style={styles.schoolInfo}>
                    <Text style={styles.schoolName}>
                      {userSchool.name}
                    </Text>
                    <Text style={styles.schoolLocation}>
                      {userSchool.city}, {userSchool.state}
                    </Text>
                    
                    <View style={styles.schoolStats}>
                      <View style={styles.schoolStat}>
                        <Users size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.schoolStatText}>
                          {userSchool.students?.length || 0} Students
                        </Text>
                      </View>
                      <View style={styles.schoolStat}>
                        <BookOpen size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.schoolStatText}>
                          {userSchool.type ? userSchool.type.charAt(0).toUpperCase() + userSchool.type.slice(1) : 'School'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : currentUser?.school ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Star size={20} color="#FFD700" />
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>Your School</Text>
              </View>
            </View>
            
            <View style={[styles.errorCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#FF6B6B' }]}>
                School not found
              </Text>
              <TouchableOpacity
                style={styles.findSchoolButton}
                onPress={navigateToSearch}
              >
                <Text style={styles.findSchoolButtonText}>Find Your School</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        
        {/* Nearby Schools Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MapPin size={20} color={isDark ? '#0066CC' : '#4682B4'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>Nearby Schools</Text>
            </View>
          </View>
          
          {locationLoading ? (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              <ActivityIndicator size="large" color={isDark ? '#0066CC' : '#4682B4'} />
              <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>
                Getting your precise location...
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                Finding nearby schools
              </Text>
            </View>
          ) : !location || !validateLocation(location) ? (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              <MapPin size={48} color={isDark ? '#0066CC' : '#4682B4'} />
              <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>
                Location access needed
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                Enable high-accuracy location to see nearby schools
              </Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => requestLocation(true)}
              >
                <Text style={styles.locationButtonText}>Enable Location</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? '#0066CC' : '#4682B4'} />
              <Text style={[styles.loadingText, { color: isDark ? '#BBBBBB' : '#708090' }]}>Finding nearby schools...</Text>
            </View>
          ) : nearbySchools.length > 0 ? (
            nearbySchools.slice(0, 3).map((school: School) => (
              <TouchableOpacity
                key={school.id}
                style={[styles.schoolItem, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}
                onPress={() => handleSchoolPress(school)}
              >
                <View style={[styles.schoolItemIcon, { backgroundColor: isDark ? 'rgba(0, 102, 204, 0.2)' : 'rgba(70, 130, 180, 0.1)' }]}>
                  <SchoolIcon size={20} color={isDark ? '#0066CC' : '#4682B4'} />
                </View>
                
                <View style={styles.schoolItemInfo}>
                  <Text style={[styles.schoolItemName, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>
                    {school.name}
                  </Text>
                  <Text style={[styles.schoolItemLocation, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                    {school.city}, {school.state}
                  </Text>
                </View>
                
                <View style={styles.schoolItemDistance}>
                  <MapPin size={14} color={isDark ? '#0066CC' : '#4682B4'} />
                  <Text style={[styles.schoolItemDistanceText, { color: isDark ? '#0066CC' : '#4682B4' }]}>
                    {formatDistance(school.distance)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              <MapPin size={48} color={isDark ? '#0066CC' : '#4682B4'} />
              <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>
                No schools found nearby
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                Try expanding your search radius
              </Text>
            </View>
          )}
        </View>
        
        {/* Available Schools Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>Available Schools</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? '#0066CC' : '#4682B4'} />
              <Text style={[styles.loadingText, { color: isDark ? '#BBBBBB' : '#708090' }]}>Loading schools...</Text>
            </View>
          ) : schools.length > 0 ? (
            <View style={styles.schoolGrid}>
              {schools.slice(0, 6).map((school: School) => (
                <TouchableOpacity
                  key={school.id}
                  style={[styles.schoolGridItem, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}
                  onPress={() => handleSchoolPress(school)}
                >
                  <LinearGradient
                    colors={
                      school.type === 'public' 
                        ? (isDark ? ['#0A3D62', '#1E5D8C'] : ['#4682B4', '#1E90FF'])
                        : school.type === 'private' 
                        ? (isDark ? ['#0A3D62', '#1E5D8C'] : ['#87CEEB', '#4682B4'])
                        : (isDark ? ['#0A3D62', '#1E5D8C'] : ['#B0E0E6', '#87CEEB'])
                    }
                    style={styles.schoolGridIcon}
                  >
                    <SchoolIcon size={24} color="#FFFFFF" />
                  </LinearGradient>
                  
                  <Text style={[styles.schoolGridName, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]} numberOfLines={2}>
                    {school.name}
                  </Text>
                  <Text style={[styles.schoolGridLocation, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                    {school.city}, {school.state}
                  </Text>
                  
                  <View style={[styles.schoolGridType, { 
                    backgroundColor: 
                      school.type === 'public' ? (isDark ? 'rgba(0, 102, 204, 0.2)' : 'rgba(70, 130, 180, 0.2)') : 
                      school.type === 'private' ? (isDark ? 'rgba(0, 102, 204, 0.2)' : 'rgba(135, 206, 235, 0.2)') : 
                      (isDark ? 'rgba(0, 102, 204, 0.2)' : 'rgba(176, 224, 230, 0.2)')
                  }]}>
                    <Text style={[styles.schoolGridTypeText, { 
                      color: 
                        school.type === 'public' ? (isDark ? '#0066CC' : '#4682B4') : 
                        school.type === 'private' ? (isDark ? '#0066CC' : '#87CEEB') : 
                        (isDark ? '#0066CC' : '#B0E0E6')
                    }]}>
                      {school.type && school.type.charAt ? school.type.charAt(0).toUpperCase() + school.type.slice(1) : 'School'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              <SchoolIcon size={48} color={isDark ? '#0066CC' : '#4682B4'} />
              <Text style={[styles.emptyText, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>
                No schools found
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                Try searching for your school by name
              </Text>
            </View>
          )}
          
          {schools.length > 6 && (
            <TouchableOpacity
              style={[styles.viewMoreButton, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF', borderColor: isDark ? '#0066CC' : '#4682B4' }]}
              onPress={navigateToSearch}
            >
              <Text style={[styles.viewMoreText, { color: isDark ? '#0066CC' : '#4682B4' }]}>
                View All {schoolCount.toLocaleString()} Schools
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    position: 'relative',
  },
  sunIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  locationInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroContent: {
    padding: 32,
    alignItems: 'center',
    zIndex: 2,
  },
  heroIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  waveIcon: {
    position: 'absolute',
    bottom: -8,
    left: -8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  heroButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  beachWaves: {
    position: 'absolute',
    bottom: 0,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  wave2: {
    marginBottom: 4,
  },
  wave3: {
    marginBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  schoolCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  userSchoolCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  schoolCardGradient: {
    padding: 20,
  },
  schoolCardContent: {
    flexDirection: 'row',
  },
  schoolBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  schoolInfo: {
    flex: 1,
    marginLeft: 16,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  schoolLocation: {
    fontSize: 14,
    marginBottom: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  schoolStats: {
    flexDirection: 'row',
    gap: 16,
  },
  schoolStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  schoolStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  errorCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  findSchoolButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4682B4',
  },
  findSchoolButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  schoolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  schoolGridItem: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  schoolGridIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolGridName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 36,
  },
  schoolGridLocation: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  schoolGridType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  schoolGridTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  schoolItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  schoolItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  schoolItemLocation: {
    fontSize: 14,
  },
  schoolItemDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  schoolItemDistanceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  locationButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4682B4',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewMoreButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});