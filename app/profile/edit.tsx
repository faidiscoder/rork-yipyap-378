import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UserAvatar } from '@/components/UserAvatar';
import { Camera, X, Check, ArrowLeft, Info, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { currentUser, updateProfile } = useUserStore();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [age, setAge] = useState(currentUser?.age?.toString() || '');
  const [relationshipStatus, setRelationshipStatus] = useState(currentUser?.relationshipStatus || '');
  const [highSchool, setHighSchool] = useState(currentUser?.highSchool || '');
  const [birthday, setBirthday] = useState(currentUser?.birthday || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(currentUser?.photos || []);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>(currentUser?.photosCaptions || []);
  const [editingCaptionIndex, setEditingCaptionIndex] = useState<number | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleAddPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add photos');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = result.assets.map(asset => asset.uri);
      const updatedPhotos = [...selectedPhotos, ...newPhotos].slice(0, 10);
      setSelectedPhotos(updatedPhotos);
      
      // Add empty captions for new photos
      const newCaptions = [...photoCaptions];
      while (newCaptions.length < updatedPhotos.length) {
        newCaptions.push('');
      }
      setPhotoCaptions(newCaptions);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...selectedPhotos];
    newPhotos.splice(index, 1);
    setSelectedPhotos(newPhotos);
    
    const newCaptions = [...photoCaptions];
    newCaptions.splice(index, 1);
    setPhotoCaptions(newCaptions);
  };

  const handleEditCaption = (index: number) => {
    setEditingCaptionIndex(index);
    setCaptionText(photoCaptions[index] || '');
  };

  const handleSaveCaption = () => {
    if (editingCaptionIndex !== null) {
      const newCaptions = [...photoCaptions];
      newCaptions[editingCaptionIndex] = captionText;
      setPhotoCaptions(newCaptions);
      setEditingCaptionIndex(null);
      setCaptionText('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateProfile({
        name,
        username,
        bio,
        avatar,
        age: parseInt(age) || currentUser?.age || 0,
        relationshipStatus,
        highSchool,
        birthday,
        photos: selectedPhotos,
        photosCaptions: photoCaptions,
      });
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Render caption editor modal
  const renderCaptionEditor = () => {
    if (editingCaptionIndex === null) return null;
    
    return (
      <View style={styles.captionEditorOverlay}>
        <View style={styles.captionEditorContainer}>
          <Text style={styles.captionEditorTitle}>Add a Caption</Text>
          
          <TextInput
            style={styles.captionEditorInput}
            value={captionText}
            onChangeText={setCaptionText}
            placeholder="Write a caption for this photo..."
            placeholderTextColor="rgba(0, 0, 0, 0.5)"
            multiline
            maxLength={100}
            autoFocus
          />
          
          <View style={styles.captionEditorButtons}>
            <TouchableOpacity 
              style={[styles.captionEditorButton, styles.captionEditorCancelButton]}
              onPress={() => setEditingCaptionIndex(null)}
            >
              <Text style={styles.captionEditorCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.captionEditorButton, styles.captionEditorSaveButton]}
              onPress={handleSaveCaption}
            >
              <Text style={styles.captionEditorSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Profile',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#333333',
          headerTitleStyle: { color: '#333333' },
          headerShadowVisible: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#333333" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSave} 
              style={styles.saveButton}
              disabled={isLoading || isSaving}
            >
              {isLoading || isSaving ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <Check size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <UserAvatar size={120} uri={avatar} />
            )}
            <View style={styles.cameraButton}>
              <Camera size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change profile picture</Text>
        </View>
        
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              multiline
              numberOfLines={4}
              maxLength={150}
            />
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Your age"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
              keyboardType="number-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birthday (Month Day)</Text>
            <TextInput
              style={styles.input}
              value={birthday}
              onChangeText={setBirthday}
              placeholder="e.g. April 6"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship Status</Text>
            <TextInput
              style={styles.input}
              value={relationshipStatus}
              onChangeText={setRelationshipStatus}
              placeholder="Your relationship status"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>School</Text>
            <TextInput
              style={styles.input}
              value={highSchool}
              onChangeText={setHighSchool}
              placeholder="Your school"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
            />
          </View>
        </View>
        
        <View style={styles.photosSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Public Profile Photos</Text>
              <TouchableOpacity>
                <Info size={16} color="#666666" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleAddPhotos} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Photos</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.photosGrid}>
            {selectedPhotos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                
                <View style={styles.photoActions}>
                  <TouchableOpacity 
                    style={styles.captionButton}
                    onPress={() => handleEditCaption(index)}
                  >
                    <Text style={styles.captionButtonText}>
                      {photoCaptions[index] ? 'Edit Caption' : 'Add Caption'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {photoCaptions[index] && (
                  <View style={styles.captionPreview}>
                    <Text style={styles.captionPreviewText} numberOfLines={1}>
                      {photoCaptions[index]}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            
            {selectedPhotos.length < 10 && (
              <TouchableOpacity 
                style={styles.addPhotoButton}
                onPress={handleAddPhotos}
              >
                <Plus size={24} color="#FF9500" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.photoHint}>
            Add up to 10 photos to your public profile. These photos will be visible to other users.
          </Text>
        </View>
        
        {/* Fixed Save Button at bottom */}
        <TouchableOpacity 
          style={[styles.fixedSaveButton, (isLoading || isSaving) && styles.disabledSaveButton]}
          onPress={handleSave}
          disabled={isLoading || isSaving}
        >
          <Text style={styles.fixedSaveButtonText}>
            {isLoading || isSaving ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Caption Editor Modal */}
      {renderCaptionEditor()}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for the fixed save button
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF9500',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#666666',
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    color: '#333333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
  photosSection: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    position: 'relative',
    width: (Platform.OS === 'web' ? 150 : '31%'),
    aspectRatio: 1,
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  captionButton: {
    backgroundColor: 'rgba(255, 149, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  captionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  removePhotoButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  captionPreviewText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  addPhotoButton: {
    width: (Platform.OS === 'web' ? 150 : '31%'),
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9500',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    color: '#FF9500',
    marginTop: 8,
    fontWeight: '500',
  },
  photoHint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
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
  saveButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF9500',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  captionEditorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  captionEditorContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  captionEditorTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  captionEditorInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    color: '#333333',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  captionEditorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  captionEditorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  captionEditorCancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  captionEditorCancelText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  captionEditorSaveButton: {
    backgroundColor: '#FF9500',
  },
  captionEditorSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Fixed Save Button at bottom
  fixedSaveButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledSaveButton: {
    backgroundColor: '#CCCCCC',
  },
  fixedSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});