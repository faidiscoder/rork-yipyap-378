import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, StatusBar, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UserAvatar } from '@/components/UserAvatar';
import { mockUsers, getUserById } from '@/mocks/users';
import { 
  MessageCircle, 
  UserPlus, 
  UserMinus, 
  UserX, 
  MoreHorizontal, 
  MapPin, 
  Calendar,
  Heart,
  Users,
  Shield,
  Flag,
  Edit,
  ArrowLeft,
  Star,
  Share2,
  Info,
  Ban
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getZodiacSign, getZodiacEmoji } from '@/utils/zodiac';
import { useChatStore } from '@/store/chatStore';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { 
    currentUser, 
    isFriend, 
    isPendingRequest, 
    isBlocked,
    sendFriendRequest, 
    removeFriend, 
    blockUser,
    unblockUser,
    unsendFriendRequest,
    friends,
    forceUpdate,
    reportUser,
    banUser,
    unbanUser,
    isUserBanned
  } = useUserStore();
  
  const { getChat } = useChatStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [localFriendStatus, setLocalFriendStatus] = useState<string>('none');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const userId = Array.isArray(id) ? id[0] : id;
  const isCurrentUser = userId === 'current_user' || userId === currentUser?.id;
  
  // Safely get user data
  const user = isCurrentUser ? currentUser : (userId ? getUserById(userId) : null);

  // Get chat with this user to check streak
  const chatId = userId ? `chat_${userId}` : '';
  const chat = chatId ? getChat(chatId) : null;
  const yipStreak = chat?.yipStreak || 0;

  // Check if user is banned
  const userIsBanned = userId ? isUserBanned(userId) : false;

  // Check if current user is admin15
  const isRealAdmin = currentUser?.username === 'admin15';

  // Update local friend status when store changes
  useEffect(() => {
    if (!isCurrentUser && userId) {
      try {
        const currentFriendStatus = isBlocked(userId) ? 'blocked' :
          isFriend(userId) ? 'friends' : 
          isPendingRequest(userId) ? 'pending' : 'none';
        setLocalFriendStatus(currentFriendStatus);
      } catch (error) {
        console.error('Error updating friend status:', error);
        setLocalFriendStatus('none');
      }
    }
  }, [userId, isCurrentUser, isFriend, isPendingRequest, isBlocked, friends]);

  if (!user) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Stack.Screen 
          options={{ 
            title: 'Profile Not Found',
            headerStyle: { backgroundColor: isDark ? '#121212' : '#FFFFFF' },
            headerTintColor: isDark ? '#FFFFFF' : '#333333',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#333333'} />
              </TouchableOpacity>
            ),
          }} 
        />
        <Text style={[styles.errorText, isDark && { color: '#FF6B6B' }]}>User not found</Text>
      </View>
    );
  }

  const friendStatus = isCurrentUser ? 'self' : localFriendStatus;

  const handleFriendAction = async () => {
    if (isCurrentUser) return;
    
    setIsLoading(true);
    try {
      switch (friendStatus) {
        case 'none':
          await sendFriendRequest(userId);
          setLocalFriendStatus('pending');
          Alert.alert('Friend Request Sent', `Friend request sent to ${user.displayName || user.name}`);
          break;
        case 'pending':
          await unsendFriendRequest(userId);
          setLocalFriendStatus('none');
          Alert.alert('Request Cancelled', 'Friend request has been cancelled');
          break;
        case 'friends':
          Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove ${user.displayName || user.name} from your friends?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Remove', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    setIsLoading(true);
                    await removeFriend(userId);
                    setLocalFriendStatus('none');
                    forceUpdate(); // Force a re-render
                    Alert.alert('Friend Removed', `${user.displayName || user.name} has been removed from your friends`);
                    // Navigate back to avoid staying on removed friend's profile
                    router.back();
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to remove friend');
                  } finally {
                    setIsLoading(false);
                  }
                }
              }
            ]
          );
          return;
        case 'blocked':
          Alert.alert(
            'Unblock User',
            `Are you sure you want to unblock ${user.displayName || user.name}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Unblock', 
                onPress: async () => {
                  try {
                    await unblockUser(userId);
                    setLocalFriendStatus('none');
                    Alert.alert('User Unblocked', `${user.displayName || user.name} has been unblocked`);
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to unblock user');
                  }
                }
              }
            ]
          );
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to perform action');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (isCurrentUser) return;
    
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user.displayName || user.name}? They won't be able to see your profile or send you messages.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await blockUser(userId);
              setLocalFriendStatus('blocked');
              Alert.alert('User Blocked', `${user.displayName || user.name} has been blocked`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to block user');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Inappropriate Content',
          onPress: () => showReportNote('Inappropriate Content')
        },
        { 
          text: 'Harassment',
          onPress: () => showReportNote('Harassment')
        },
        { 
          text: 'Spam',
          onPress: () => showReportNote('Spam')
        },
        { 
          text: 'Fake Account',
          onPress: () => showReportNote('Fake Account')
        },
        { 
          text: 'Other',
          onPress: () => showReportNote('Other')
        }
      ]
    );
  };

  const showReportNote = (reason: string) => {
    Alert.prompt(
      'Report Details',
      'Please provide additional details (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Report',
          onPress: async (note) => {
            try {
              await reportUser(userId, reason, note);
              Alert.alert(
                'Report Submitted',
                'Thank you for your report. Our moderation team will review it shortly.'
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to submit report');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleAdminBanUser = async () => {
    if (!isRealAdmin) return;
    
    Alert.alert(
      'Ban User',
      `Are you sure you want to ban ${user.displayName || user.name}? This will prevent them from accessing the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban User',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Ban Reason',
              'Please provide a reason for the ban:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Ban User',
                  style: 'destructive',
                  onPress: async (reason) => {
                    try {
                      await banUser(userId, reason || 'Banned by admin');
                      Alert.alert('User Banned', `${user.displayName || user.name} has been banned`);
                      router.back();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to ban user');
                    }
                  }
                }
              ],
              'plain-text'
            );
          }
        }
      ]
    );
  };

  const handleAdminUnbanUser = async () => {
    if (!isRealAdmin) return;
    
    Alert.alert(
      'Unban User',
      `Are you sure you want to unban ${user.displayName || user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban User',
          onPress: async () => {
            try {
              await unbanUser(userId);
              Alert.alert('User Unbanned', `${user.displayName || user.name} has been unbanned`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unban user');
            }
          }
        }
      ]
    );
  };

  const handleMessageUser = () => {
    if (isCurrentUser) return;
    if (friendStatus !== 'friends') {
      Alert.alert('Cannot Message', 'You can only message friends');
      return;
    }
    router.push(`/chat/chat_${userId}`);
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleViewPublicProfile = () => {
    if (isCurrentUser) {
      router.push('/profile/edit');
    } else {
      // Show photo gallery modal
      if (user.photos && user.photos.length > 0) {
        setSelectedPhotoIndex(0);
      }
    }
  };

  const handleMoreOptions = () => {
    if (isCurrentUser) {
      Alert.alert(
        'Profile Options',
        'Choose an option',
        [
          { 
            text: 'Edit Profile', 
            onPress: handleEditProfile 
          },
          { 
            text: 'Cancel', 
            style: 'cancel' 
          }
        ]
      );
    } else {
      const options: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}> = [
        {
          text: friendStatus === 'friends' ? 'Remove Friend' : 
                friendStatus === 'pending' ? 'Cancel Request' :
                friendStatus === 'blocked' ? 'Unblock User' : 'Add Friend',
          onPress: handleFriendAction
        },
        {
          text: 'Report User',
          onPress: handleReportUser
        },
        {
          text: 'Block User',
          onPress: handleBlockUser,
          style: 'destructive'
        }
      ];

      // Add admin options
      if (isRealAdmin) {
        if (userIsBanned) {
          options.unshift({
            text: 'Unban User (Admin)',
            onPress: handleAdminUnbanUser
          });
        } else {
          options.unshift({
            text: 'Ban User (Admin)',
            onPress: handleAdminBanUser,
            style: 'destructive'
          });
        }
      }

      options.push({
        text: 'Cancel',
        style: 'cancel'
      });

      Alert.alert('User Options', 'Choose an option', options);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getFriendButtonConfig = () => {
    switch (friendStatus) {
      case 'none':
        return {
          icon: <UserPlus size={20} color="#FFFFFF" />,
          text: 'Add Friend',
          style: { backgroundColor: '#0066CC' }
        };
      case 'pending':
        return {
          icon: <UserMinus size={20} color="#FFFFFF" />,
          text: 'Cancel Request',
          style: { backgroundColor: '#FF3B30' }
        };
      case 'friends':
        return {
          icon: <UserMinus size={20} color="#FFFFFF" />,
          text: 'Remove Friend',
          style: { backgroundColor: '#FF3B30' }
        };
      case 'blocked':
        return {
          icon: <UserX size={20} color="#FFFFFF" />,
          text: 'Unblock',
          style: { backgroundColor: '#0066CC' }
        };
      default:
        return null;
    }
  };

  // Format birthday to show first 3 letters of month and day
  const formatBirthday = () => {
    const birthday = user.birthday || 'Apr 6';
    const parts = birthday.split(' ');
    if (parts.length === 2) {
      const month = parts[0].substring(0, 3);
      return `${month} ${parts[1]}`;
    }
    return birthday;
  };

  // Get zodiac sign based on birthday
  const zodiacSign = user.zodiacSign || getZodiacSign(user.birthday);
  const zodiacEmoji = getZodiacEmoji(zodiacSign);

  // Get gender emoji
  const getGenderEmoji = (gender: string) => {
    switch (gender) {
      case 'male': return '♂️';
      case 'female': return '♀️';
      case 'non-binary': return '⚧️';
      default: return '';
    }
  };

  // Format distance to avoid huge numbers
  const formatDistance = (distance: number) => {
    if (distance < 0.1) {
      return `${Math.round(distance * 5280)} ft away`;
    }
    // Round to 2 decimal places maximum
    return `${Math.round(distance * 100) / 100} mi away`;
  };

  // Render photo gallery modal
  const renderPhotoGallery = () => {
    if (selectedPhotoIndex === null || !user.photos || user.photos.length === 0) return null;

    const photo = user.photos[selectedPhotoIndex];
    const hasCaption = user.photosCaptions && user.photosCaptions[selectedPhotoIndex];
    const caption = hasCaption ? user.photosCaptions?.[selectedPhotoIndex] : '';

    return (
      <View style={[styles.photoGalleryOverlay, isDark && styles.darkPhotoGalleryOverlay]}>
        <View style={[styles.photoGalleryHeader, isDark && styles.darkPhotoGalleryHeader]}>
          <TouchableOpacity onPress={() => setSelectedPhotoIndex(null)} style={styles.galleryBackButton}>
            <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#333333'} />
          </TouchableOpacity>
          <Text style={[styles.photoGalleryTitle, isDark && { color: '#FFFFFF' }]}>
            {selectedPhotoIndex + 1} / {user.photos.length}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <Image 
          source={{ uri: photo }} 
          style={styles.photoGalleryImage}
          resizeMode="contain"
        />

        {caption && (
          <View style={[styles.photoCaptionContainer, isDark && styles.darkPhotoCaptionContainer]}>
            <Text style={[styles.photoCaptionText, isDark && { color: '#FFFFFF' }]}>{caption}</Text>
          </View>
        )}

        <View style={[styles.photoGalleryControls, isDark && styles.darkPhotoGalleryControls]}>
          <TouchableOpacity 
            style={[styles.photoGalleryButton, { opacity: selectedPhotoIndex > 0 ? 1 : 0.5 }]}
            onPress={() => {
              if (selectedPhotoIndex > 0) {
                setSelectedPhotoIndex(selectedPhotoIndex - 1);
              }
            }}
            disabled={selectedPhotoIndex === 0}
          >
            <Text style={styles.photoGalleryButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.photoGalleryButton, { opacity: selectedPhotoIndex < (user.photos?.length || 0) - 1 ? 1 : 0.5 }]}
            onPress={() => {
              if (selectedPhotoIndex < (user.photos?.length || 0) - 1) {
                setSelectedPhotoIndex(selectedPhotoIndex + 1);
              }
            }}
            disabled={selectedPhotoIndex === (user.photos?.length || 0) - 1}
          >
            <Text style={styles.photoGalleryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView style={styles.scrollView}>
        <Stack.Screen 
          options={{ 
            title: isCurrentUser ? 'Your Profile' : user.displayName || user.name,
            headerStyle: { backgroundColor: isDark ? '#121212' : '#FFFFFF' },
            headerTintColor: isDark ? '#FFFFFF' : '#333333',
            headerShadowVisible: false,
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: isDark ? '#333333' : '#F0F0F0' }]}>
                <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#333333'} />
              </TouchableOpacity>
            ),
            headerRight: () => !isCurrentUser ? (
              <TouchableOpacity onPress={handleMoreOptions} style={[styles.headerButton, { backgroundColor: isDark ? '#333333' : '#F0F0F0' }]}>
                <MoreHorizontal size={24} color={isDark ? '#FFFFFF' : '#333333'} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleEditProfile} style={[styles.headerButton, { backgroundColor: isDark ? '#333333' : '#F0F0F0' }]}>
                <Edit size={24} color={isDark ? '#FFFFFF' : '#333333'} />
              </TouchableOpacity>
            ),
          }} 
        />

        <View style={[styles.header, isDark && styles.darkHeader]}>
          <View style={styles.avatarContainer}>
            <UserAvatar size={120} uri={user.avatar} />
            {user.isVIP && (
              <View style={styles.vipBadge}>
                <Text style={styles.vipText}>VIP</Text>
              </View>
            )}
            {userIsBanned && isRealAdmin && (
              <View style={styles.bannedBadge}>
                <Ban size={16} color="#FFFFFF" />
              </View>
            )}
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={[styles.displayName, isDark && { color: '#FFFFFF' }]}>
              {user.displayName || user.name}
            </Text>
            {user.gender && (
              <Text style={styles.genderEmoji}>
                {getGenderEmoji(user.gender)}
              </Text>
            )}
          </View>
          
          <Text style={[styles.username, isDark && { color: '#BBBBBB' }]}>
            @{user.username || user.name?.toLowerCase().replace(/\s/g, '_')}
          </Text>

          {userIsBanned && isRealAdmin && (
            <View style={styles.bannedIndicator}>
              <Ban size={16} color="#FF3B30" />
              <Text style={styles.bannedText}>This user is banned</Text>
            </View>
          )}

          {user.bio && (
            <Text style={[styles.bio, isDark && { color: '#DDDDDD' }]}>
              {user.bio}
            </Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && { color: '#FFFFFF' }]}>
                {user.yipScore || 0}
              </Text>
              <Text style={[styles.statLabel, isDark && { color: '#BBBBBB' }]}>
                Yip Score
              </Text>
            </View>
            <View style={[styles.statDivider, isDark && { backgroundColor: '#333333' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && { color: '#FFFFFF' }]}>
                {user.mutualFriends || 0}
              </Text>
              <Text style={[styles.statLabel, isDark && { color: '#BBBBBB' }]}>
                Mutual Friends
              </Text>
            </View>
          </View>
        </View>

        {/* Info Pills */}
        <View style={styles.pillsContainer}>
          <TouchableOpacity style={[styles.pill, isDark && styles.darkPill]}>
            <Text style={styles.pillEmoji}>🎈</Text>
            <Text style={[styles.pillText, isDark && { color: '#FFFFFF' }]}>
              {formatBirthday()}
            </Text>
          </TouchableOpacity>
          
          {yipStreak > 0 && (
            <TouchableOpacity style={[styles.pill, isDark && styles.darkPill]}>
              <Text style={styles.pillEmoji}>⭐</Text>
              <Text style={[styles.pillText, isDark && { color: '#FFFFFF' }]}>
                {yipStreak} day streak
              </Text>
            </TouchableOpacity>
          )}
          
          {user.highSchool && (
            <TouchableOpacity style={[styles.pill, isDark && styles.darkPill]}>
              <Text style={styles.pillEmoji}>🏫</Text>
              <Text style={[styles.pillText, isDark && { color: '#FFFFFF' }]}>{user.highSchool}</Text>
            </TouchableOpacity>
          )}
          
          {zodiacSign && (
            <TouchableOpacity style={[styles.pill, isDark && styles.darkPill]}>
              <Text style={styles.pillEmoji}>{zodiacEmoji}</Text>
              <Text style={[styles.pillText, isDark && { color: '#FFFFFF' }]}>{zodiacSign}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.details}>
          <View style={[styles.detailCard, isDark && styles.darkDetailCard]}>
            <View style={styles.detailRow}>
              <Calendar size={20} color="#0066CC" style={styles.detailIcon} />
              <Text style={[styles.detailText, isDark && { color: '#FFFFFF' }]}>
                {user.age} years old
              </Text>
            </View>

            {user.gender && (
              <View style={styles.detailRow}>
                <Users size={20} color="#0066CC" style={styles.detailIcon} />
                <Text style={[styles.detailText, isDark && { color: '#FFFFFF' }]}>
                  {user.gender.charAt(0).toUpperCase() + user.gender.slice(1).replace('-', ' ')}
                </Text>
              </View>
            )}

            {user.highSchool && (
              <View style={styles.detailRow}>
                <Shield size={20} color="#0066CC" style={styles.detailIcon} />
                <Text style={[styles.detailText, isDark && { color: '#FFFFFF' }]}>
                  {user.highSchool}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Heart size={20} color="#0066CC" style={styles.detailIcon} />
              <Text style={[styles.detailText, isDark && { color: '#FFFFFF' }]}>
                {user.relationshipStatus || 'Not specified'}
              </Text>
            </View>

            {user.distance !== undefined && !isCurrentUser && (
              <View style={styles.detailRow}>
                <MapPin size={20} color="#0066CC" style={styles.detailIcon} />
                <Text style={[styles.detailText, isDark && { color: '#FFFFFF' }]}>
                  {user.distance === 0 ? 'Very close' : formatDistance(user.distance)}
                </Text>
              </View>
            )}
            
            {yipStreak > 0 && !isCurrentUser && (
              <View style={styles.detailRow}>
                <Star size={20} color="#0066CC" style={styles.detailIcon} />
                <Text style={[styles.detailText, isDark && { color: '#FFFFFF' }]}>
                  {yipStreak} day streak with you
                </Text>
              </View>
            )}
          </View>

          {user.interests && user.interests.length > 0 && (
            <View style={[styles.interestsCard, isDark && styles.darkInterestsCard]}>
              <Text style={[styles.interestsTitle, isDark && { color: '#FFFFFF' }]}>Interests</Text>
              <View style={styles.interestsList}>
                {user.interests.map((interest, index) => (
                  <View key={index} style={[styles.interestTag, isDark && styles.darkInterestTag]}>
                    <Text style={[styles.interestText, isDark && { color: '#FFFFFF' }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Public Profile Card */}
          <TouchableOpacity 
            style={[styles.publicProfileCard, isDark && styles.darkPublicProfileCard]}
            onPress={handleViewPublicProfile}
          >
            <View style={styles.publicProfileHeader}>
              <Text style={[styles.publicProfileTitle, isDark && { color: '#FFFFFF' }]}>
                {isCurrentUser ? 'Edit Public Profile' : 'View Public Profile'}
              </Text>
              <Share2 size={20} color={isDark ? '#FFFFFF' : '#333333'} />
            </View>
            <Text style={[styles.publicProfileSubtitle, isDark && { color: '#BBBBBB' }]}>
              {isCurrentUser 
                ? 'Add photos and captions to your public profile' 
                : user.photos && user.photos.length > 0 
                  ? `${user.photos.length} photos` 
                  : 'No photos yet'}
            </Text>
            
            {user.photos && user.photos.length > 0 && (
              <View style={styles.photoPreviewContainer}>
                {user.photos?.slice(0, 3).map((photo, index) => (
                  <Image 
                    key={index} 
                    source={{ uri: photo }} 
                    style={styles.photoPreview} 
                  />
                ))}
                {(user.photos?.length || 0) > 3 && (
                  <View style={styles.morePhotosOverlay}>
                    <Text style={styles.morePhotosText}>+{(user.photos?.length || 0) - 3}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!isCurrentUser && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.messageButton,
                { opacity: friendStatus === 'friends' ? 1 : 0.5 }
              ]}
              onPress={handleMessageUser}
              disabled={friendStatus !== 'friends'}
            >
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>

            {getFriendButtonConfig() && (
              <TouchableOpacity
                style={[styles.friendButton, getFriendButtonConfig()?.style]}
                onPress={handleFriendAction}
                disabled={isLoading}
              >
                {getFriendButtonConfig()?.icon}
                <Text style={styles.friendButtonText}>
                  {isLoading ? 'Loading...' : getFriendButtonConfig()?.text}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Admin Actions - Only show for admin15 */}
        {isRealAdmin && !isCurrentUser && (
          <View style={styles.adminActions}>
            <Text style={[styles.adminTitle, { color: isDark ? colors.text : '#333333' }]}>
              Admin Actions
            </Text>
            <View style={styles.adminButtonsContainer}>
              {userIsBanned ? (
                <TouchableOpacity
                  style={[styles.adminButton, { backgroundColor: '#34C759' }]}
                  onPress={handleAdminUnbanUser}
                >
                  <Shield size={20} color="#FFFFFF" />
                  <Text style={styles.adminButtonText}>Unban User</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.adminButton, { backgroundColor: '#FF3B30' }]}
                  onPress={handleAdminBanUser}
                >
                  <Ban size={20} color="#FFFFFF" />
                  <Text style={styles.adminButtonText}>Ban User</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Photo Gallery Modal */}
      {renderPhotoGallery()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#FF3B30',
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  darkHeader: {
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  avatarContainer: {
    position: 'relative',
  },
  vipBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#0066CC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  bannedBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF3B30',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  bannedText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
    gap: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333333',
  },
  genderEmoji: {
    fontSize: 20,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666666',
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
    color: '#333333',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#666666',
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
    marginVertical: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  darkPill: {
    backgroundColor: '#2A2A2A',
    borderColor: '#333333',
  },
  pillEmoji: {
    fontSize: 16,
  },
  pillText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  details: {
    padding: 16,
    gap: 16,
  },
  detailCard: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkDetailCard: {
    backgroundColor: '#1A1A1A',
    shadowOpacity: 0.2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
    color: '#333333',
  },
  interestsCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkInterestsCard: {
    backgroundColor: '#1A1A1A',
    shadowOpacity: 0.2,
  },
  interestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  darkInterestTag: {
    backgroundColor: 'rgba(0, 102, 204, 0.2)',
  },
  interestText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  publicProfileCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkPublicProfileCard: {
    backgroundColor: '#1A1A1A',
    shadowOpacity: 0.2,
  },
  publicProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  publicProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  publicProfileSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
  },
  photoPreview: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 8,
  },
  morePhotosOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    paddingBottom: 16,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  friendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  adminActions: {
    padding: 16,
    paddingTop: 0,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  adminButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  adminButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoGalleryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  darkPhotoGalleryOverlay: {
    backgroundColor: '#121212',
  },
  photoGalleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
  },
  darkPhotoGalleryHeader: {
    backgroundColor: '#1A1A1A',
  },
  photoGalleryTitle: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  photoGalleryImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 200,
    resizeMode: 'contain',
  },
  photoCaptionContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  darkPhotoCaptionContainer: {
    backgroundColor: '#1A1A1A',
    borderTopColor: '#333333',
  },
  photoCaptionText: {
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
  },
  photoGalleryControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  darkPhotoGalleryControls: {
    backgroundColor: '#1A1A1A',
    borderTopColor: '#333333',
  },
  photoGalleryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  photoGalleryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});