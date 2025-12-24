import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { UserAvatar } from '@/components/UserAvatar';
import { 
  Settings, 
  Users, 
  MapPin, 
  Bell,
  Shield,
  User,
  Palette,
  UserMinus,
  LogIn,
  ChevronRight,
  Lock,
  Camera,
  Edit,
  LogOut,
  Heart,
  MessageCircle,
  Calendar,
  Award,
  Bookmark,
} from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getZodiacSign, getZodiacEmoji } from '@/utils/zodiac';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { 
    currentUser, 
    friends, 
    getFriendUsers, 
    logout, 
    currentSchoolId,
    isLoading,
    error,
    clearError,
    authToken,
    isInitialized
  } = useUserStore();
  
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  useEffect(() => {
    if (error) {
      console.log('Profile error:', error);
      setShowError(true);
      setShowLoading(false);
      setShowLoginPrompt(false);
      setShowProfile(false);
    } else if (!isInitialized) {
      setShowLoading(true);
      setShowLoginPrompt(false);
      setShowError(false);
      setShowProfile(false);
    } else if (!currentUser && !authToken && !isLoading) {
      setShowLoginPrompt(true);
      setShowLoading(false);
      setShowError(false);
      setShowProfile(false);
    } else if (isLoading) {
      setShowLoading(true);
      setShowLoginPrompt(false);
      setShowError(false);
      setShowProfile(false);
    } else if (!currentUser) {
      setShowLoginPrompt(true);
      setShowLoading(false);
      setShowError(false);
      setShowProfile(false);
    } else {
      setShowProfile(true);
      setShowLoading(false);
      setShowLoginPrompt(false);
      setShowError(false);
    }
  }, [isInitialized, currentUser, authToken, isLoading, error]);

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleViewFriends = () => {
    router.push('/profile/friends');
  };

  const handleMoreOptions = () => {
    Alert.alert(
      'Profile Options',
      'Choose an option',
      [
        { 
          text: 'Edit Profile', 
          onPress: handleEditProfile 
        },
        { 
          text: 'Settings', 
          onPress: () => router.push('/settings/account')
        },
        { 
          text: 'Logout', 
          onPress: () => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Logout', 
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                  }
                }
              ]
            );
          },
          style: 'destructive'
        },
        { 
          text: 'Cancel', 
          style: 'cancel' 
        }
      ]
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    showChevron: boolean = true
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        {icon}
        <Text style={[styles.settingLabel, { color: isDark ? colors.text : '#333333' }]}>{label}</Text>
      </View>
      {showChevron && (
        <ChevronRight size={20} color={isDark ? colors.border : '#A0A0A0'} />
      )}
    </TouchableOpacity>
  );

  const formatBirthday = () => {
    if (!currentUser) return '';
    
    // Use birthday or dateOfBirth property
    const birthday = currentUser.birthday || currentUser.dateOfBirth || 'Apr 6';
    const parts = birthday.split(' ');
    if (parts.length === 2) {
      const month = parts[0].substring(0, 3);
      return `${month} ${parts[1]}`;
    }
    return birthday;
  };

  const handleYipScoreInfo = () => {
    Alert.alert(
      'Yip Score',
      `Your current Yip Score is ${currentUser?.yipScore || 0}. Increase your score by being active on YipYap!`
    );
  };

  const zodiacSign = currentUser?.zodiacSign || (currentUser?.birthday || currentUser?.dateOfBirth ? getZodiacSign(currentUser.birthday || currentUser.dateOfBirth || '') : '');
  const zodiacEmoji = getZodiacEmoji(zodiacSign);
  
  const friendUsers = getFriendUsers();

  // Render content based on state
  let content;
  
  if (showLoading) {
    content = (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.background : '#F8F8F8' }]}>
        <Text style={[styles.loadingText, { color: isDark ? colors.text : '#333333' }]}>
          {!isInitialized ? 'Initializing...' : 'Loading profile...'}
        </Text>
      </View>
    );
  } else if (showLoginPrompt) {
    content = (
      <View style={[styles.loginPromptContainer, { backgroundColor: isDark ? colors.background : '#F8F8F8' }]}>
        <LogIn size={64} color={isDark ? colors.text : '#333333'} />
        <Text style={[styles.loginPromptTitle, { color: isDark ? colors.text : '#333333' }]}>Welcome to YipYap</Text>
        <Text style={[styles.loginPromptText, { color: isDark ? colors.textSecondary : '#666666' }]}>
          Please log in or create an account to view your profile
        </Text>
        
        <View style={styles.loginButtons}>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.loginButton, styles.signupButton, { borderColor: colors.primary }]}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={[styles.signupButtonText, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (showError) {
    content = (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? colors.background : '#F8F8F8' }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            clearError();
            router.replace('/auth/login');
          }}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (!showProfile || !currentUser) {
    content = (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? colors.background : '#F8F8F8' }]}>
        <Text style={[styles.loadingText, { color: isDark ? colors.text : '#333333' }]}>No user found</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { 
          backgroundColor: isDark ? colors.card : '#FFFFFF',
        }]}>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.moreButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={handleMoreOptions}
            >
              <Settings size={22} color={isDark ? colors.text : '#333333'} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity onPress={handleEditProfile} style={styles.avatarContainer}>
              {currentUser.avatar ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
              ) : (
                <UserAvatar size={100} uri={currentUser.avatar} />
              )}
              <View style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}>
                <Camera size={16} color="#FFFFFF" />
              </View>
              {currentUser.isVIP && (
                <Image 
                  source={{ uri: 'https://www.pngall.com/wp-content/uploads/5/Gold-Crown-PNG-Image-HD.png' }} 
                  style={styles.crown} 
                />
              )}
            </TouchableOpacity>
            
            <Text style={[styles.name, { color: isDark ? colors.text : '#333333' }]}>
              {currentUser.name || currentUser.displayName}
            </Text>
            <Text style={[styles.username, { color: isDark ? colors.textSecondary : '#666666' }]}>
              @{currentUser.username}
            </Text>
            
            {currentUser.bio && (
              <Text style={[styles.bio, { color: isDark ? colors.text : '#333333' }]}>
                {currentUser.bio}
              </Text>
            )}

            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statItem} onPress={handleYipScoreInfo}>
                <Text style={[styles.statValue, { color: isDark ? colors.text : '#333333' }]}>{currentUser.yipScore || 0}</Text>
                <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : '#666666' }]}>Score</Text>
              </TouchableOpacity>
              
              <View style={[styles.statDivider, { backgroundColor: isDark ? colors.border : '#E0E0E0' }]} />
              
              <TouchableOpacity style={styles.statItem} onPress={handleViewFriends}>
                <Text style={[styles.statValue, { color: isDark ? colors.text : '#333333' }]}>{friends?.length || 0}</Text>
                <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : '#666666' }]}>Friends</Text>
              </TouchableOpacity>
              
              <View style={[styles.statDivider, { backgroundColor: isDark ? colors.border : '#E0E0E0' }]} />
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={[styles.statValue, { color: isDark ? colors.text : '#333333' }]}>{currentUser.age || 0}</Text>
                <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : '#666666' }]}>Age</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.pillsContainer}>
          <TouchableOpacity style={[styles.pill, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }]}>
            <Calendar size={16} color={colors.primary} />
            <Text style={[styles.pillText, { color: isDark ? colors.text : '#333333' }]}>
              {formatBirthday()}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.pill, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }]} onPress={handleYipScoreInfo}>
            <Award size={16} color={colors.warning} />
            <Text style={[styles.pillText, { color: isDark ? colors.text : '#333333' }]}>
              {currentUser.yipScore || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.pill, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          }]} onPress={handleViewFriends}>
            <Users size={16} color={colors.info} />
            <Text style={[styles.pillText, { color: isDark ? colors.text : '#333333' }]}>
              {friends?.length || 0} friends
            </Text>
          </TouchableOpacity>
          
          {currentUser.highSchool && (
            <TouchableOpacity 
              style={[styles.pill, { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }]}
              onPress={() => router.push(`/school/${currentSchoolId || 'search'}`)}
            >
              <MapPin size={16} color={colors.success} />
              <Text style={[styles.pillText, { color: isDark ? colors.text : '#333333' }]}>{currentUser.highSchool}</Text>
            </TouchableOpacity>
          )}
          
          {zodiacSign && (
            <TouchableOpacity style={[styles.pill, { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }]}>
              <Text style={styles.pillEmoji}>{zodiacEmoji}</Text>
              <Text style={[styles.pillText, { color: isDark ? colors.text : '#333333' }]}>{zodiacSign}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.quickActionsContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleEditProfile}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <Edit size={20} color={colors.ocean.deep} />
            </View>
            <Text style={[styles.quickActionText, { color: isDark ? colors.text : '#333333' }]}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleViewFriends}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <Users size={20} color={colors.ocean.deep} />
            </View>
            <Text style={[styles.quickActionText, { color: isDark ? colors.text : '#333333' }]}>Friends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/settings/privacy')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <Lock size={20} color={colors.ocean.deep} />
            </View>
            <Text style={[styles.quickActionText, { color: isDark ? colors.text : '#333333' }]}>Privacy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/settings/account')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <User size={20} color={colors.ocean.deep} />
            </View>
            <Text style={[styles.quickActionText, { color: isDark ? colors.text : '#333333' }]}>Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#333333' }]}>Settings</Text>
          
          {renderSettingItem(
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <Bell size={20} color={colors.ocean.deep} />
            </View>,
            "Notifications",
            () => router.push('/settings/notifications')
          )}
          
          {renderSettingItem(
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <Shield size={20} color={colors.ocean.deep} />
            </View>,
            "Privacy",
            () => router.push('/settings/privacy')
          )}
          
          {renderSettingItem(
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <Palette size={20} color={colors.ocean.deep} />
            </View>,
            "Appearance",
            () => router.push('/settings/appearance')
          )}
          
          {renderSettingItem(
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <MapPin size={20} color={colors.ocean.deep} />
            </View>,
            "Distance",
            () => router.push('/settings/distance')
          )}
          
          {renderSettingItem(
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <UserMinus size={20} color={colors.ocean.deep} />
            </View>,
            "Blocked Users",
            () => router.push('/settings/blocked')
          )}
          
          {renderSettingItem(
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <User size={20} color={colors.ocean.deep} />
            </View>,
            "Account",
            () => router.push('/settings/account')
          )}
          
          {renderSettingItem(
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
              <LogOut size={20} color={colors.ocean.deep} />
            </View>,
            "Logout",
            async () => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: async () => {
                      await logout();
                    }
                  }
                ]
              );
            }
          )}
        </View>

        <Text style={[styles.versionText, { color: isDark ? colors.textSecondary : '#999999' }]}>
          YipYap v1.0.0
        </Text>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F8F8' }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    flex: 1,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
    backgroundColor: '#F8F8F8',
  },
  loginPromptTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333333',
  },
  loginPromptText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666666',
  },
  loginButtons: {
    width: '100%',
    gap: 16,
    marginTop: 16,
  },
  loginButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0084FF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0084FF',
  },
  signupButtonText: {
    color: '#0084FF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    fontSize: 16,
    color: '#333333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: '#F8F8F8',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#FF3B30',
  },
  retryButton: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerActions: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0084FF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  crown: {
    position: 'absolute',
    top: -20,
    left: -10,
    width: 50,
    height: 30,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    color: '#333333',
  },
  username: {
    fontSize: 16,
    marginTop: 4,
    color: '#666666',
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    color: '#333333',
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '80%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  pillEmoji: {
    fontSize: 16,
  },
  pillText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 96) / 4,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  settingsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999999',
    marginBottom: 32,
    marginTop: 8,
  },
});