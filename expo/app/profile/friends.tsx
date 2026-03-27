import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UserAvatar } from '@/components/UserAvatar';
import { Search, Users, ArrowLeft, UserPlus } from 'lucide-react-native';

export default function FriendsScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { getFriendUsers } = useUserStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState(getFriendUsers());
  const [filteredFriends, setFilteredFriends] = useState(friends);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = friends.filter(friend => 
        (friend.name?.toLowerCase().includes(query) || 
         friend.username?.toLowerCase().includes(query) ||
         friend.displayName?.toLowerCase().includes(query))
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => handleViewProfile(item.id)}
    >
      <View style={styles.friendInfo}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <UserAvatar size={50} uri={item.avatar} />
        )}
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {item.displayName || item.name}
          </Text>
          <Text style={styles.friendUsername}>
            @{item.username || item.name?.toLowerCase().replace(/\s/g, '_')}
          </Text>
        </View>
      </View>
      {item.isOnline && <View style={styles.onlineIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Friends',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#333333',
          headerTitleStyle: { color: '#333333' },
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#333333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.addFriendButton}
              onPress={() => router.push('/profile/add-friends')}
            >
              <UserPlus size={20} color="#FF9500" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        
        {filteredFriends.length > 0 ? (
          <FlatList
            data={filteredFriends}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            {searchQuery.trim() !== '' ? (
              <>
                <Search size={64} color="#CCCCCC" />
                <Text style={styles.emptyTitle}>No Results</Text>
                <Text style={styles.emptyText}>
                  No friends found matching "{searchQuery}"
                </Text>
              </>
            ) : (
              <>
                <Users size={64} color="#CCCCCC" />
                <Text style={styles.emptyTitle}>No Friends Yet</Text>
                <Text style={styles.emptyText}>
                  You haven't added any friends yet. Start connecting with people around you!
                </Text>
                <TouchableOpacity 
                  style={styles.findFriendsButton}
                  onPress={() => router.push('/profile/add-friends')}
                >
                  <Text style={styles.findFriendsText}>Find Friends</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#333333',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendDetails: {
    marginLeft: 16,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333333',
  },
  friendUsername: {
    fontSize: 14,
    color: '#666666',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  findFriendsButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findFriendsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  addFriendButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
});