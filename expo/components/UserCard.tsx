import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { UserPlus, Clock, Heart, HeartOff } from 'lucide-react-native';
import { User } from '@/types/user';
import { useThemeColors } from '@/hooks/useThemeColors';

interface UserCardProps {
  user: User;
  onPress?: () => void;
  onAddFriend?: () => void;
  onUnsend?: () => void;
  showAddButton?: boolean;
  isPending?: boolean;
  showAge?: boolean;
  showSchool?: boolean;
  showRelationship?: boolean;
  showMutualFriends?: boolean;
  showDistance?: boolean;
  compact?: boolean;
  showFullInfo?: boolean;
  maxDistance?: number;
  buttonText?: string;
}

export function UserCard({
  user,
  onPress,
  onAddFriend,
  onUnsend,
  showAddButton = true,
  isPending = false,
  showAge = true,
  showSchool = true,
  showRelationship = true,
  showMutualFriends = true,
  showDistance = true,
  compact = false,
  showFullInfo = false,
  maxDistance,
  buttonText = "Add",
}: UserCardProps) {
  const { colors, isDark, getFontFamily } = useThemeColors();

  // Safety check - if user is undefined, return null
  if (!user) {
    return null;
  }

  const formatDistance = (distance: number): string => {
    if (distance < 0.1) {
      return `${Math.round(distance * 5280)} ft away`;
    }
    // Round to 2 decimal places maximum
    return `${Math.round(distance * 100) / 100} mi away`;
  };

  const getRelationshipEmoji = (status: string) => {
    switch (status) {
      case 'single': return '💙';
      case 'taken': return '❤️';
      case 'complicated': return '💛';
      default: return '';
    }
  };

  const getRelationshipText = (status: string) => {
    switch (status) {
      case 'single': return 'Single';
      case 'taken': return 'Taken';
      case 'complicated': return 'Complicated';
      default: return '';
    }
  };

  const getGenderEmoji = (gender: string) => {
    switch (gender) {
      case 'male': return '♂️';
      case 'female': return '♀️';
      case 'non-binary': return '⚧️';
      default: return '';
    }
  };

  // Check if user is within max distance (if provided)
  const isWithinDistance = maxDistance === undefined || 
    user.distance === undefined || 
    user.distance <= maxDistance;

  // If user is outside max distance and maxDistance is provided, don't render
  if (maxDistance !== undefined && !isWithinDistance) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container, 
        compact && styles.compactContainer,
        isDark && styles.darkContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: user.avatar }} 
            style={styles.avatar} 
            defaultSource={require('../assets/images/icon.png')}
          />
          {user.isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.verifiedText, { fontFamily: getFontFamily('bold') }]}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[
              styles.name, 
              isDark && styles.darkText,
              { fontFamily: getFontFamily('semiBold') }
            ]} numberOfLines={1}>
              {user.displayName || user.name}
            </Text>
            {user.gender && (
              <Text style={styles.genderEmoji}>
                {getGenderEmoji(user.gender)}
              </Text>
            )}
          </View>

          <Text style={[
            styles.username, 
            isDark && styles.darkSubtext,
            { fontFamily: getFontFamily('regular') }
          ]} numberOfLines={1}>
            @{user.username || (user.name ? user.name.toLowerCase().replace(/\s/g, '_') : 'user')}
          </Text>

          <View style={styles.detailsContainer}>
            {(showAge || showFullInfo) && user.age ? (
              <Text style={[
                styles.detail, 
                isDark && styles.darkSubtext,
                { fontFamily: getFontFamily('regular') }
              ]}>
                {user.age} years
              </Text>
            ) : null}

            {(showDistance || showFullInfo) && user.distance !== undefined ? (
              <Text style={[
                styles.detail, 
                isDark && styles.darkSubtext,
                { fontFamily: getFontFamily('regular') }
              ]}>
                📍 {formatDistance(user.distance)}
              </Text>
            ) : null}

            {(showSchool || showFullInfo) && user.highSchool ? (
              <Text style={[
                styles.detail, 
                isDark && styles.darkSubtext,
                { fontFamily: getFontFamily('regular') }
              ]} numberOfLines={1}>
                🎓 {user.highSchool}
              </Text>
            ) : null}

            {(showRelationship || showFullInfo) && user.relationshipStatus ? (
              <Text style={[
                styles.detail, 
                isDark && styles.darkSubtext,
                { fontFamily: getFontFamily('regular') }
              ]}>
                {getRelationshipEmoji(user.relationshipStatus)} {getRelationshipText(user.relationshipStatus)}
              </Text>
            ) : null}

            {(showMutualFriends || showFullInfo) && user.mutualFriends && user.mutualFriends > 0 ? (
              <Text style={[
                styles.detail, 
                isDark && styles.darkSubtext,
                { fontFamily: getFontFamily('regular') }
              ]}>
                👥 {user.mutualFriends} mutual friends
              </Text>
            ) : null}
            
            {user.interests && user.interests.length > 0 && (
              <Text style={[
                styles.detail, 
                isDark && styles.darkSubtext,
                { fontFamily: getFontFamily('regular') }
              ]} numberOfLines={1}>
                ⭐ {user.interests.slice(0, 2).join(', ')}
              </Text>
            )}
          </View>
        </View>

        {showAddButton ? (
          <View style={styles.actionContainer}>
            {isPending ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.pendingButton]}
                onPress={onUnsend}
              >
                <Clock size={16} color="#666666" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={onAddFriend}
              >
                <Text style={[
                  styles.addButtonText,
                  { fontFamily: getFontFamily('semiBold') }
                ]}>{buttonText}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 90,
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  compactContainer: {
    marginBottom: 8,
    minHeight: 80,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5E5',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#000000',
  },
  darkText: {
    color: '#FFFFFF',
  },
  genderEmoji: {
    fontSize: 14,
  },
  age: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666666',
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666666',
  },
  darkSubtext: {
    color: '#BBBBBB',
  },
  detailsContainer: {
    gap: 4,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
    color: '#666666',
  },
  actionContainer: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionButton: {
    width: 60,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#0066CC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingButton: {
    backgroundColor: '#F5F5F5',
  },
});