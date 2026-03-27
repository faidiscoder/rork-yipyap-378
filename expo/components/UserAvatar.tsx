import React from 'react';
import { Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import type { User } from '@/types/user';

interface Props {
  size?: number;
  imageUrl?: string;
  uri?: string;
  showOnline?: boolean;
  isOnline?: boolean;
  user?: User;
  showCrown?: boolean;
  onPress?: () => void;
}

export const UserAvatar: React.FC<Props> = ({ 
  imageUrl,
  uri,
  size = 40, 
  showOnline = false,
  isOnline = false,
  user,
  showCrown = false,
  onPress
}) => {
  const imageSource = uri || imageUrl || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&h=200&fit=crop';
  const isUserOnline = isOnline || user?.isOnline;
  const isVIP = showCrown || user?.isVIP;
  
  const AvatarComponent = onPress ? TouchableOpacity : View;
  
  return (
    <AvatarComponent 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: imageSource }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 }
        ]}
      />
      {showOnline && isUserOnline && (
        <View style={[
          styles.onlineIndicator,
          { right: size * 0.1, bottom: size * 0.1 }
        ]} />
      )}
      {isVIP && (
        <Image 
          source={{ uri: 'https://www.pngall.com/wp-content/uploads/5/Gold-Crown-PNG-Image-HD.png' }} 
          style={[
            styles.crown,
            { 
              top: -size * 0.3,
              left: -size * 0.1,
              width: size * 1.2,
              height: size * 0.6
            }
          ]} 
        />
      )}
    </AvatarComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#E1E1E1',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  crown: {
    position: 'absolute',
    resizeMode: 'contain',
  },
});