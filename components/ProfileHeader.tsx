import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { User } from '@/types/user';
import { Edit3 } from 'lucide-react-native';

interface Props {
  user: User;
  onEditPress?: () => void;
}

export function ProfileHeader({ user, onEditPress }: Props) {
  const { colors, getFontFamily } = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
        />
        {onEditPress && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={onEditPress}
          >
            <Edit3 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[
        styles.displayName, 
        { color: colors.text, fontFamily: getFontFamily('bold') }
      ]}>
        {user.displayName}
      </Text>
      <Text style={[
        styles.username, 
        { color: colors.textSecondary, fontFamily: getFontFamily('medium') }
      ]}>
        @{user.username}
      </Text>

      {user.bio && (
        <Text style={[
          styles.bio, 
          { color: colors.text, fontFamily: getFontFamily('regular') }
        ]}>
          {user.bio}
        </Text>
      )}

      {user.highSchool && (
        <Text style={[
          styles.school, 
          { color: colors.textSecondary, fontFamily: getFontFamily('regular') }
        ]}>
          {user.highSchool}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  school: {
    fontSize: 14,
  },
});