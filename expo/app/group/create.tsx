import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  FlatList
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UserAvatar } from '@/components/UserAvatar';
import { Save, Users, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreateGroupScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { createGroup, currentUser, getFriendUsers } = useUserStore();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const friends = getFriendUsers();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend');
      return;
    }

    setIsLoading(true);
    
    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        participants: [currentUser?.id, ...selectedFriends],
      };

      const newGroup = await createGroup(groupData);
      
      // Navigate directly to the group chat instead of showing alert
      router.replace({ pathname: '/chat/[id]', params: { id: `group_${String(newGroup.id)}` } });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
      setIsLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => toggleFriendSelection(item.id)}
    >
      <UserAvatar size={40} uri={item.avatar} />
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: '#FFFFFF' }]}>
          {item.displayName || item.name}
        </Text>
        <Text style={[styles.friendUsername, { color: 'rgba(255, 255, 255, 0.7)' }]}>
          @{item.username}
        </Text>
      </View>
      <View style={[
        styles.checkbox,
        { 
          backgroundColor: selectedFriends.includes(item.id) ? '#6C5CE7' : 'transparent',
          borderColor: selectedFriends.includes(item.id) ? '#6C5CE7' : 'rgba(255, 255, 255, 0.3)'
        }
      ]}>
        {selectedFriends.includes(item.id) && (
          <Check size={16} color="#FFFFFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Create Group',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { color: '#FFFFFF' },
          headerTransparent: true,
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleCreateGroup}
              disabled={isLoading}
              style={styles.saveButton}
            >
              <Save size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Group Info */}
        <View style={styles.groupInfoSection}>
          <View style={styles.groupIcon}>
            <Users size={32} color="#6C5CE7" />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#FFFFFF' }]}>Group Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }]}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: '#FFFFFF' }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this group about?"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        {/* Friends Selection */}
        <View style={styles.friendsSection}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>
            Add Friends ({selectedFriends.length} selected)
          </Text>
          
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                No friends to add. Add some friends first!
              </Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.friendsList}
            />
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.createButton,
            { backgroundColor: isLoading ? 'rgba(108, 92, 231, 0.5)' : '#6C5CE7' }
          ]}
          onPress={handleCreateGroup}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating Group...' : 'Create Group'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 100,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  saveButton: {
    padding: 8,
  },
  groupInfoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  friendsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});