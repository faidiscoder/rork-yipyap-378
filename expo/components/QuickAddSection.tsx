import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { UserCard } from './UserCard';
import { useUserStore } from '@/store/userStore';
import { RefreshCw, Search, Filter, X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AdCard } from '@/components/AdCard';
import { getRandomAd } from '@/services/ads';
import { useRouter } from 'expo-router';

interface QuickAddSectionProps {
  showAge?: boolean;
  showSchool?: boolean;
  showRelationship?: boolean;
}

interface FilterState {
  minAge: number;
  maxAge: number;
  gender: 'all' | 'male' | 'female';
  relationshipStatus: 'all' | 'single' | 'dating' | 'taken' | 'complicated' | 'private';
  interests: string[];
  searchQuery: string;
  hasHighSchool: boolean;
  distance: number;
}

interface ItemWithAd {
  type: 'user' | 'ad';
  data: any;
}

const INTEREST_OPTIONS = [
  'Sports', 'Music', 'Art', 'Gaming', 'Reading', 
  'Travel', 'Food', 'Movies', 'Technology', 'Fashion',
  'Fitness', 'Photography', 'Dance', 'Cooking', 'Hiking',
  'Swimming', 'Basketball', 'Football', 'Soccer', 'Tennis',
  'Volleyball', 'Baseball', 'Golf', 'Running', 'Cycling',
  'Yoga', 'Meditation', 'Writing', 'Drawing', 'Painting',
  'Singing', 'Guitar', 'Piano', 'Drums', 'Theater',
  'Comedy', 'Podcasts', 'Anime', 'Comics', 'Board Games',
  'Video Games', 'Streaming', 'Netflix', 'YouTube', 'TikTok'
];

export function QuickAddSection({
  showAge = false,
  showSchool = false,
  showRelationship = false
}: QuickAddSectionProps) {
  const { 
    quickAddUsers, 
    isLoading, 
    refreshQuickAdd, 
    sendFriendRequest, 
    isPendingRequest,
    unsendFriendRequest,
    currentUser
  } = useUserStore();
  const { isDark } = useThemeColors();
  const router = useRouter();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minAge: 18,
    maxAge: 25,
    gender: 'all',
    relationshipStatus: 'all',
    interests: [],
    searchQuery: '',
    hasHighSchool: false,
    distance: 25
  });

  const safeIsPendingRequest = typeof isPendingRequest === 'function' 
    ? isPendingRequest 
    : () => false;

  const handleAddFriend = async (userId: string) => {
    try {
      if (typeof sendFriendRequest === 'function') {
        await sendFriendRequest(userId);
      } else {
        console.error('sendFriendRequest is not a function');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleUnsendRequest = async (userId: string) => {
    try {
      if (typeof unsendFriendRequest === 'function') {
        await unsendFriendRequest(userId);
      } else {
        console.error('unsendFriendRequest is not a function');
      }
    } catch (error) {
      console.error('Failed to unsend friend request:', error);
    }
  };

  const handleRefresh = () => {
    if (typeof refreshQuickAdd === 'function') {
      refreshQuickAdd();
    } else {
      console.error('refreshQuickAdd is not a function');
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const toggleInterestFilter = (interest: string) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  // Filter users based on search and filters
  const filteredUsers = quickAddUsers ? quickAddUsers.filter(user => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesUsername = user.username?.toLowerCase().includes(query);
      const matchesDisplayName = user.displayName?.toLowerCase().includes(query);
      const matchesName = user.name?.toLowerCase().includes(query);
      
      if (!matchesUsername && !matchesDisplayName && !matchesName) {
        return false;
      }
    }

    // Age filter
    if (user.age) {
      if (user.age < filters.minAge || user.age > filters.maxAge) {
        return false;
      }
    }

    // Gender filter
    if (filters.gender !== 'all' && user.gender && user.gender !== filters.gender) {
      return false;
    }

    // Relationship status filter
    if (filters.relationshipStatus !== 'all' && user.relationshipStatus && user.relationshipStatus !== filters.relationshipStatus) {
      return false;
    }

    // High school filter
    if (filters.hasHighSchool && !user.highSchool) {
      return false;
    }

    // Interests filter
    if (filters.interests.length > 0) {
      const userInterests = user.interests || [];
      const hasMatchingInterest = filters.interests.some(interest => 
        userInterests.includes(interest)
      );
      if (!hasMatchingInterest) {
        return false;
      }
    }

    // Distance filter (if user has distance property)
    if (user.distance !== undefined && user.distance > filters.distance) {
      return false;
    }

    return true;
  }) : [];

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <View style={styles.loginPrompt}>
        <Text style={[styles.loginPromptText, isDark && styles.darkText]}>
          Please log in to discover new friends
        </Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading && (!quickAddUsers || quickAddUsers.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          Finding people for you...
        </Text>
      </View>
    );
  }

  if (!quickAddUsers || quickAddUsers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
          No suggestions right now
        </Text>
        <Text style={[styles.emptySubtitle, isDark && styles.darkSubtext]}>
          We're working on finding more people for you!
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={20} color="#FFFFFF" />
          <Text style={styles.refreshButtonText}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const itemsWithAds: ItemWithAd[] = [];
  filteredUsers.forEach((user, index) => {
    itemsWithAds.push({ type: 'user', data: user });
    
    if ((index + 1) % 3 === 0) {
      itemsWithAds.push({ type: 'ad', data: getRandomAd() });
    }
  });

  return (
    <View style={styles.container}>
      <View style={[styles.searchHeader, isDark && styles.darkSearchHeader]}>
        <View style={[styles.searchContainer, isDark && styles.darkSearchContainer]}>
          <Search size={20} color={isDark ? '#BBBBBB' : '#666666'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.darkSearchInput]}
            placeholder="Search by username..."
            placeholderTextColor={isDark ? '#BBBBBB' : '#666666'}
            value={filters.searchQuery}
            onChangeText={(text) => setFilters(prev => ({ ...prev, searchQuery: text }))}
          />
          {filters.searchQuery ? (
            <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}>
              <X size={20} color={isDark ? '#BBBBBB' : '#666666'} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={[styles.filterButton, isDark && styles.darkFilterButton]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={isDark ? '#FFFFFF' : '#333333'} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.filtersPanel, isDark && styles.darkFiltersPanel]}>
          <Text style={[styles.filterTitle, isDark && styles.darkText]}>Filters</Text>
          
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, isDark && styles.darkSubtext]}>Age Range</Text>
            <View style={styles.ageRangeContainer}>
              <TextInput
                style={[styles.ageInput, isDark && styles.darkAgeInput]}
                value={filters.minAge.toString()}
                onChangeText={(text) => {
                  const age = parseInt(text) || 18;
                  setFilters(prev => ({ ...prev, minAge: Math.max(18, Math.min(age, prev.maxAge)) }));
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={[styles.ageRangeText, isDark && styles.darkSubtext]}>to</Text>
              <TextInput
                style={[styles.ageInput, isDark && styles.darkAgeInput]}
                value={filters.maxAge.toString()}
                onChangeText={(text) => {
                  const age = parseInt(text) || 25;
                  setFilters(prev => ({ ...prev, maxAge: Math.max(prev.minAge, Math.min(age, 99)) }));
                }}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => setFilters({
              minAge: 18,
              maxAge: 25,
              gender: 'all',
              relationshipStatus: 'all',
              interests: [],
              searchQuery: '',
              hasHighSchool: false,
              distance: 25
            })}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={itemsWithAds}
        keyExtractor={(item, index) => item.type === 'user' ? item.data.id : `ad-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'ad') {
            return (
              <AdCard 
                ad={item.data}
                onPress={() => console.log('Ad clicked:', item.data.title)}
              />
            );
          } else {
            const user = item.data;
            return (
              <UserCard
                user={user}
                onPress={() => handleUserPress(user.id)}
                onAddFriend={() => handleAddFriend(user.id)}
                onUnsend={() => handleUnsendRequest(user.id)}
                isPending={safeIsPendingRequest(user.id)}
                showAddButton={true}
                showMutualFriends={true}
                showDistance={false}
                showAge={showAge}
                showSchool={showSchool}
                showRelationship={showRelationship}
                buttonText="Add"
              />
            );
          }
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>
              {isLoading ? 'Loading...' : 'Refresh Suggestions'}
            </Text>
          </TouchableOpacity>
        }
        ListFooterComponentStyle={styles.footer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  darkSearchHeader: {
    backgroundColor: '#1A1A1A',
    borderBottomColor: '#333333',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  darkSearchContainer: {
    backgroundColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  darkSearchInput: {
    color: '#FFFFFF',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkFilterButton: {
    backgroundColor: '#2A2A2A',
  },
  filtersPanel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    maxHeight: 400,
  },
  darkFiltersPanel: {
    backgroundColor: '#1A1A1A',
    borderBottomColor: '#333333',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333333',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666666',
  },
  ageRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    color: '#333333',
  },
  darkAgeInput: {
    borderColor: '#333333',
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
  },
  ageRangeText: {
    fontSize: 16,
    color: '#666666',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubtext: {
    color: '#BBBBBB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
    marginBottom: 40,
    alignItems: 'center',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#000000',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});