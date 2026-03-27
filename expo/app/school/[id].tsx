import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Users, MapPin, Globe, Calendar, BookOpen, MessageSquare, LogOut, RefreshCw, Waves, Sun, Umbrella, ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useLocation } from '@/hooks/useLocation';
import { useUserStore } from '@/store/userStore';
import { mockSchools } from '@/mocks/schools';
import { LinearGradient } from 'expo-linear-gradient';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { 
    location, 
    calculateDistance, 
    loading, 
    error, 
    permissionStatus, 
    requestLocation,
    validateLocation 
  } = useLocation();
  const { currentUser, joinSchool, leaveSchool, currentSchoolId } = useUserStore();
  const [activeTab, setActiveTab] = useState<'about' | 'classes'>('about');
  const [isJoining, setIsJoining] = useState(false);

  // Find school from mock database
  const school = mockSchools.find(s => s.id === id);
  
  if (!school) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? '#121212' : '#F0F8FF' }]}>
        <Text style={[styles.errorText, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>School not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate distance if location is available
  let calculatedDistance: number | undefined;
  let isWithinRange = false;

  if (
    location &&
    school.location?.latitude != null &&
    school.location?.longitude != null &&
    validateLocation(location)
  ) {
    calculatedDistance = calculateDistance(
      location.latitude,
      location.longitude,
      school.location.latitude,
      school.location.longitude
    );
    isWithinRange = calculatedDistance <= 5.0; // Strict 5.0 mile range
  }

  const isStudent = currentSchoolId === school.id;

  const formatDistance = (distance: number | undefined): string => {
    if (distance === undefined) return 'N/A';
    if (distance < 0.1) {
      return `${Math.round(distance * 5280)} ft`;
    }
    return `${distance.toFixed(3)} mi`;
  };

  const handleJoinSchool = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to join a school');
      return;
    }
    
    if (permissionStatus === 'denied') {
      Alert.alert(
        'Location Permission Required', 
        'To join a school, we need access to your location to verify you are within 5 miles of the school. Please enable location permissions in your device settings and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => requestLocation(true) }
        ]
      );
      return;
    }
    
    if (loading) {
      Alert.alert('Getting Location', 'Please wait while we get your current location...');
      return;
    }
    
    if (error) {
      Alert.alert(
        'Location Error', 
        error.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => requestLocation(true) }
        ]
      );
      return;
    }
    
    if (!location || !validateLocation(location)) {
      Alert.alert(
        'Location Required', 
        'We need your accurate location to verify you are within 5 miles of the school. Please enable high-accuracy location services and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => requestLocation(true) }
        ]
      );
      return;
    }
    
    if (!isWithinRange) {
      Alert.alert(
        'Out of Range', 
        `Sorry, you are ${calculatedDistance ? formatDistance(calculatedDistance) : 'too far'} away from this school. You must be within 5.0 miles to join.`
      );
      return;
    }
    
    try {
      setIsJoining(true);
      await joinSchool(school.id, school.name);
      Alert.alert('Success!', `You have successfully joined ${school.name}`);
    } catch (error) {
      console.error("Error joining school:", error);
      Alert.alert('Error', "An error occurred while trying to join the school");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveSchool = async () => {
    Alert.alert(
      'Leave School',
      `Are you sure you want to leave ${school.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveSchool();
              Alert.alert('Left School', `You have left ${school.name}`);
            } catch (error) {
              console.error("Error leaving school:", error);
              Alert.alert('Error', "An error occurred while trying to leave the school");
            }
          }
        }
      ]
    );
  };

  const handleSchoolChat = () => {
    router.push(`/chat/school_${school.id}`);
  };

  const renderLocationStatus = () => {
    if (loading) {
      return (
        <View style={styles.locationStatusContainer}>
          <RefreshCw size={16} color="#FF9500" />
          <Text style={styles.locationStatusText}>
            Getting your precise location...
          </Text>
        </View>
      );
    }

    if (error || permissionStatus === 'denied') {
      return (
        <View style={[styles.locationStatusContainer, styles.errorStatus]}>
          <MapPin size={16} color="#FF3B30" />
          <View style={styles.locationStatusTextContainer}>
            <Text style={[styles.locationStatusText, styles.errorText]}>
              High-accuracy location required
            </Text>
            <Text style={[styles.locationStatusSubtext, styles.errorText]}>
              {error?.message || 'Please enable precise location permissions to join schools'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => requestLocation(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (location && calculatedDistance !== undefined) {
      const isAccurate = location.accuracy && location.accuracy <= 50; // Within 50 meters
      return (
        <View style={[styles.locationStatusContainer, isWithinRange ? styles.successStatus : styles.errorStatus]}>
          <MapPin size={16} color={isWithinRange ? "#4CD964" : "#FF3B30"} />
          <View style={styles.locationStatusTextContainer}>
            <Text style={[styles.locationStatusText, { 
              color: isWithinRange ? "#4CD964" : "#FF3B30" 
            }]}>
              You are {formatDistance(calculatedDistance)} from this school
            </Text>
            {location.accuracy && (
              <Text style={[styles.locationStatusSubtext, { 
                color: isWithinRange ? "#4CD964" : "#FF3B30" 
              }]}>
                Location accuracy: ±{Math.round(location.accuracy)}m {isAccurate ? '✓' : '(improving...)'}
              </Text>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F0F8FF' }]} edges={['bottom']}>
      <Stack.Screen 
        options={{
          title: school.name,
          headerStyle: {
            backgroundColor: '#87CEEB',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => {/* Share school */}}>
              <Globe size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#87CEEB', '#4682B4']}
          style={styles.headerCard}
        >
          <View style={styles.schoolHeader}>
            <View style={styles.schoolIconContainer}>
              <Text style={styles.schoolInitial}>
                {school.name.charAt(0)}
              </Text>
              <Sun size={16} color="#FFD700" style={styles.sunIcon} />
            </View>
            
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <Text style={styles.schoolLocation}>
                {school.city ?? school.location.city}, {school.state ?? school.location.state}
              </Text>
              
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {school.type && school.type.charAt ? school.type.charAt(0).toUpperCase() + school.type.slice(1) : 'School'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statText}>
                {school.students?.length ?? school.studentCount ?? 0} Students
              </Text>
            </View>
            
            {school.yearFounded && (
              <View style={styles.statItem}>
                <Calendar size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statText}>
                  Est. {school.yearFounded}
                </Text>
              </View>
            )}
            
            <View style={styles.statItem}>
              <BookOpen size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statText}>
                {school.type && school.type.charAt ? school.type.charAt(0).toUpperCase() + school.type.slice(1) : 'School'}
              </Text>
            </View>
          </View>

          {renderLocationStatus()}
          
          {!isStudent ? (
            location && isWithinRange ? (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinSchool}
                disabled={isJoining}
              >
                <Text style={styles.joinButtonText}>
                  {isJoining ? 'Joining...' : 'Join School'}
                </Text>
              </TouchableOpacity>
            ) : location && !isWithinRange ? (
              <View style={styles.outOfRangeContainer}>
                <Text style={styles.outOfRangeText}>
                  Sorry, you are out of range
                </Text>
                <Text style={styles.outOfRangeSubtext}>
                  You must be within 5.0 miles of the school to join
                </Text>
                {calculatedDistance !== undefined && (
                  <Text style={styles.outOfRangeDistance}>
                    You are {formatDistance(calculatedDistance)} away
                  </Text>
                )}
              </View>
            ) : null
          ) : (
            <View style={styles.membershipContainer}>
              <View style={styles.memberBadge}>
                <Text style={styles.memberText}>
                  You are a student here
                </Text>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={handleSchoolChat}
                >
                  <MessageSquare size={16} color="#FFFFFF" />
                  <Text style={styles.chatButtonText}>School Chat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={handleLeaveSchool}
                >
                  <LogOut size={16} color="#FFFFFF" />
                  <Text style={styles.leaveButtonText}>Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Beachy decorative elements */}
          <View style={styles.beachDecoration}>
            <Waves size={24} color="rgba(255,255,255,0.3)" />
            <Umbrella size={20} color="rgba(255,255,255,0.2)" style={styles.umbrellaIcon} />
          </View>
        </LinearGradient>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'about' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('about')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'about' ? '#4682B4' : '#708090' }
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            {school.mascot && (
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                <Text style={[styles.infoLabel, { color: isDark ? '#BBBBBB' : '#708090' }]}>Mascot</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>{school.mascot}</Text>
              </View>
            )}
            
            {school.colors && school.colors.length > 0 && (
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                <Text style={[styles.infoLabel, { color: isDark ? '#BBBBBB' : '#708090' }]}>School Colors</Text>
                <View style={styles.colorsContainer}>
                  {school.colors.map((color: string, index: number) => (
                    <View 
                      key={index} 
                      style={[styles.colorCircle, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              </View>
            )}
            
            {school.website && (
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                <Text style={[styles.infoLabel, { color: isDark ? '#BBBBBB' : '#708090' }]}>Website</Text>
                <TouchableOpacity>
                  <Text style={styles.websiteLink}>{school.website}</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={[styles.infoCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              <Text style={[styles.infoLabel, { color: isDark ? '#BBBBBB' : '#708090' }]}>Location</Text>
              <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#2F4F4F' }]}>{school.address ?? `${school.location.city}, ${school.location.state}` }</Text>
              <Text style={[styles.infoSubvalue, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                {school.city ?? school.location.city}, {school.state ?? school.location.state}
              </Text>
              {calculatedDistance !== undefined && (
                <Text style={[styles.infoSubvalue, { color: isDark ? '#BBBBBB' : '#708090' }]}>
                  {formatDistance(calculatedDistance)} from your location
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#4682B4',
  },
  headerBackButton: {
    marginLeft: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  schoolHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  schoolIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  schoolInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sunIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  schoolInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  schoolLocation: {
    fontSize: 14,
    marginTop: 2,
    color: 'rgba(255,255,255,0.8)',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  successStatus: {
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
  },
  errorStatus: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  locationStatusTextContainer: {
    flex: 1,
  },
  locationStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9500',
  },
  locationStatusSubtext: {
    fontSize: 12,
    marginTop: 2,
    color: '#FF9500',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
  },
  outOfRangeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  outOfRangeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    color: '#FF3B30',
  },
  outOfRangeSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
    color: '#FF3B30',
  },
  outOfRangeDistance: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: '#FF3B30',
  },
  membershipContainer: {
    gap: 12,
  },
  memberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  memberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4682B4',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#FF3B30',
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  beachDecoration: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  umbrellaIcon: {
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#F0F8FF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  aboutContainer: {
    gap: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoSubvalue: {
    fontSize: 14,
    marginTop: 2,
  },
  colorsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  websiteLink: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
    color: '#4682B4',
  },
});