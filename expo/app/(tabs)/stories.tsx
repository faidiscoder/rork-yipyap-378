import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Dimensions, 
  Image, 
  RefreshControl, 
  Modal, 
  Platform,
  SafeAreaView
} from 'react-native';
import { useUserStore } from '@/store/userStore';
import { UserAvatar } from '@/components/UserAvatar';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Play, 
  X, 
  Download, 
  Heart, 
  Camera, 
  Eye, 
  MessageCircle, 
  Trash2, 
  Image as ImageIcon,
  Send,
  Users
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { trpcClient } from '@/lib/trpc';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useThemeColors } from '@/hooks/useThemeColors';

const { width } = Dimensions.get('window');
const storyWidth = (width - 48) / 3;

interface StoryGroup {
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  stories: {
    id: string;
    userId: string;
    imageUrl: string;
    caption: string;
    createdAt: number;
    expiresAt: number;
    isPublic: boolean;
    viewCount: number;
    isViewed: boolean;
  }[];
}

export default function StoriesScreen() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const router = useRouter();
  const { currentUser, incrementYipScore } = useUserStore();
  const { isDark } = useThemeColors();
  
  // State management
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const [showViewers, setShowViewers] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);

  // Load stories from backend
  const loadStoriesFromBackend = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Fetching stories from backend');
      
      const response = await trpcClient.stories.getAll.query();
      
      if (response.success && response.storyGroups) {
        console.log(`✅ Loaded ${response.storyGroups.length} story groups from backend`);
        setStoryGroups(response.storyGroups);
        
        const currentUserStories = response.storyGroups.find(
          group => group.user.id === currentUser?.id
        );
        
        if (currentUserStories) {
          setUserStories(currentUserStories.stories);
        } else {
          setUserStories([]);
        }
      } else {
        console.log('⚠️ No stories found from backend');
        setStoryGroups([]);
        setUserStories([]);
      }
    } catch (error) {
      console.error('❌ Error loading stories from backend:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', errorMessage);
      setStoryGroups([]);
      setUserStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize stories on component mount
  useEffect(() => {
    if (currentUser) {
      loadStoriesFromBackend();
    }
  }, [currentUser]);

  const onRefresh = useCallback(async () => {
    if (currentUser) {
      await loadStoriesFromBackend();
    }
  }, [currentUser]);

  const handleTakePhoto = useCallback(async () => {
    if (!currentUser) {
      Alert.alert('Please log in', 'You need to be logged in to create stories');
      return;
    }

    try {
      if (!permission) {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          showCameraPermissionModal();
          return;
        }
      }

      if (!permission?.granted) {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          showCameraPermissionModal();
          return;
        }
      }

      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  }, [permission, requestPermission, currentUser]);

  const showCameraPermissionModal = () => {
    Alert.alert(
      "Camera Access Required",
      "YipYap needs access to your camera to take photos for stories. Please enable camera access in your device settings.",
      [
        { 
          text: "Not Now", 
          style: "cancel" 
        },
        { 
          text: "Open Settings", 
          onPress: () => {
            Alert.alert("Opening Settings", "This would open your device settings in a real app.");
          } 
        }
      ],
      { cancelable: false }
    );
  };

  const takePicture = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const timestamp = Date.now();
        const randomPhotoIndex = Math.floor(Math.random() * 10) + 1;
        const mockPhotoUri = `https://source.unsplash.com/random/800x1200?portrait,person&sig=${timestamp}${randomPhotoIndex}`;
        setSelectedPhoto(mockPhotoUri);
        setShowCamera(false);
        return;
      }

      if (cameraRef.current) {
        console.log('Taking picture with camera...');
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        
        console.log('Photo taken:', photo);
        
        if (photo && photo.uri) {
          setSelectedPhoto(photo.uri);
          setShowCamera(false);
          console.log('Photo saved to state:', photo.uri);
        } else {
          console.error('No photo URI returned');
          Alert.alert('Error', 'Failed to capture photo');
        }
      } else {
        console.error('Camera ref not available');
        Alert.alert('Error', 'Camera not ready');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to take photo: ' + errorMessage);
    }
  }, []);

  const pickImage = useCallback(async () => {
    if (!currentUser) {
      Alert.alert('Please log in', 'You need to be logged in to create stories');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Gallery Access Required",
            "YipYap needs access to your photos to select images for stories. Please enable photo access in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Open Settings", 
                onPress: () => {
                  Alert.alert("Opening Settings", "This would open your device settings in a real app.");
                }
              }
            ]
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  }, [currentUser]);

  const postStory = useCallback(async () => {
    if (!selectedPhoto || !currentUser || isPosting) return;

    setIsPosting(true);
    try {
      console.log('🔄 Creating story in backend...', { imageUrl: selectedPhoto });
      
      const response = await trpcClient.stories.createStory.mutate({
        imageUrl: selectedPhoto,
        caption: '',
        isPublic: true,
        expiresInHours: 24
      });
      
      if (response.success) {
        console.log('✅ Story created successfully in backend');
        
        incrementYipScore();
        setSelectedPhoto(null);
        
        await loadStoriesFromBackend();
        
        if (Platform.OS !== 'web') {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Story Posted!',
                body: 'Your story has been shared with friends',
                data: { type: 'story_posted', userId: currentUser.id },
              },
              trigger: null,
            });
          } catch (notifError) {
            console.log('Notification error:', notifError);
          }
        }
        
        Alert.alert('Success!', 'Your story has been posted successfully');
      } else {
        throw new Error('Failed to create story in backend');
      }
    } catch (error) {
      console.error('❌ Error creating story in backend:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to post story: ${errorMessage}`);
    } finally {
      setIsPosting(false);
    }
  }, [selectedPhoto, currentUser, incrementYipScore, isPosting]);

  const deleteStoryItem = useCallback(async (storyId: string) => {
    if (!currentUser) return;

    try {
      console.log('🔄 Deleting story from backend:', storyId);
      
      const response = await trpcClient.stories.deleteStory.mutate({
        storyId
      });
      
      if (response.success) {
        console.log('✅ Story deleted successfully from backend');
        
        await loadStoriesFromBackend();
        
        setShowStoryViewer(false);
        setSelectedStory(null);
        Alert.alert('Deleted', 'Story has been deleted successfully');
      } else {
        throw new Error('Failed to delete story from backend');
      }
    } catch (error) {
      console.error('❌ Error deleting story from backend:', error);
      Alert.alert('Error', 'Failed to delete story');
    }
  }, [currentUser]);

  const handleStoryPress = useCallback(async (story: any) => {
    if (!currentUser) return;

    try {
      await trpcClient.stories.viewStory.mutate({
        storyId: story.id
      });
      
      if (!viewedStories.has(story.id)) {
        setViewedStories(prev => {
          const newSet = new Set(prev);
          newSet.add(story.id);
          return newSet;
        });
      }

      setSelectedStory(story);
      setCurrentStoryIndex(0);
      setShowStoryViewer(true);
    } catch (error) {
      console.error('Error viewing story:', error);
      setSelectedStory(story);
      setCurrentStoryIndex(0);
      setShowStoryViewer(true);
    }
  }, [viewedStories, currentUser]);

  const handleMyStoryPress = useCallback(() => {
    if (!currentUser) {
      Alert.alert('Please log in', 'You need to be logged in to view stories');
      return;
    }

    if (userStories.length > 0) {
      setSelectedStory(userStories[0]);
      setCurrentStoryIndex(0);
      setShowStoryViewer(true);
    } else {
      handleTakePhoto();
    }
  }, [userStories, handleTakePhoto, currentUser]);

  const handleAddToStory = useCallback(() => {
    if (!currentUser) {
      Alert.alert('Please log in', 'You need to be logged in to create stories');
      return;
    }
    handleTakePhoto();
  }, [handleTakePhoto, currentUser]);

  const nextStoryItem = useCallback(() => {
    if (!selectedStory) return;
    
    if (currentStoryIndex < selectedStory.items?.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      const allStories = storyGroups.flatMap(group => group.stories);
      const currentStoryIndexInList = allStories.findIndex(s => s.id === selectedStory.id);
      
      if (currentStoryIndexInList < allStories.length - 1) {
        const nextStory = allStories[currentStoryIndexInList + 1];
        setSelectedStory(nextStory);
        setCurrentStoryIndex(0);
      } else {
        setShowStoryViewer(false);
      }
    }
  }, [selectedStory, currentStoryIndex, storyGroups]);

  const previousStoryItem = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  }, [currentStoryIndex]);

  const getStoryOwner = useCallback((story: any) => {
    if (story.userId === currentUser?.id) {
      return { name: 'Your Story', avatar: currentUser?.avatar || '' };
    }
    
    const storyGroup = storyGroups.find(group => 
      group.stories.some(s => s.id === story.id)
    );
    
    return {
      name: storyGroup?.user.name || 'Unknown',
      avatar: storyGroup?.user.avatar || ''
    };
  }, [currentUser, storyGroups]);

  const saveToGallery = useCallback(async (imageUrl: string) => {
    if (Platform.OS === 'web') {
      window.open(imageUrl, '_blank');
      return;
    }

    try {
      if (!mediaPermission?.granted) {
        Alert.alert(
          "Gallery Access Required",
          "YipYap needs access to your photos to save this image. Please enable photo access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Allow Access", 
              onPress: async () => {
                const { status } = await requestMediaPermission();
                if (status === 'granted') {
                  saveToGallery(imageUrl);
                }
              }
            }
          ]
        );
        return;
      }

      let localUri = imageUrl;
      if (imageUrl.startsWith('http')) {
        const fileUri = `${FileSystem.cacheDirectory}temp_story_image_${Date.now()}.jpg`;
        const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
        localUri = downloadResult.uri;
      }

      const asset = await MediaLibrary.createAssetAsync(localUri);
      await MediaLibrary.createAlbumAsync('YipYap', asset, false);
      
      Alert.alert('Saved!', 'Image saved to your gallery');
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      Alert.alert('Error', 'Failed to save image to gallery');
    }
  }, [mediaPermission, requestMediaPermission]);

  const handleImagePress = useCallback((imageUrl: string) => {
    setFullImageUrl(imageUrl);
    setShowFullImage(true);
  }, []);

  const handleViewersPress = useCallback(async () => {
    if (selectedStory && currentUser) {
      try {
        const response = await trpcClient.stories.getStoryViewers.query({
          storyId: selectedStory.id
        });
        
        if (response.success) {
          console.log('Story viewers:', response.viewers);
          setShowViewers(true);
        }
      } catch (error) {
        console.error('Error fetching story viewers:', error);
        setShowViewers(true);
      }
    }
  }, [selectedStory, currentUser]);

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <LinearGradient
        colors={isDark ? ['#1e3a5f', '#2d5a87', '#3d7ab8'] : ['#f0f9ff', '#e0f2fe', '#bae6fd']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loginPrompt}>
            <Text style={[styles.loginPromptText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Please log in to view and create stories
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const renderMyStoryItem = () => {
    return (
      <TouchableOpacity style={styles.storyItem} onPress={handleMyStoryPress}>
        <View style={styles.myStoryContainer}>
          {userStories.length > 0 && userStories[0] ? (
            <View style={styles.storyContainer}>
              <Image source={{ uri: userStories[0].imageUrl }} style={styles.storyImage} />
              {userStories.length > 1 && (
                <View style={styles.multipleStoriesIndicator}>
                  <Text style={styles.multipleStoriesText}>
                    {userStories.length}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <LinearGradient
              colors={['#007AFF', '#0051D5']}
              style={styles.storyImage}
            >
              <Plus size={32} color="#FFFFFF" />
            </LinearGradient>
          )}
          <TouchableOpacity 
            style={styles.addStoryButton}
            onPress={handleAddToStory}
          >
            <Plus size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.storyUserName, { color: isDark ? '#FFFFFF' : '#333333' }]}>
          Your Story
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStoryItem = ({ item }: { item: StoryGroup }) => {
    const latestStory = item.stories[0];
    const isViewed = viewedStories.has(latestStory.id) || latestStory.isViewed;
    
    return (
      <TouchableOpacity style={styles.storyItem} onPress={() => handleStoryPress(latestStory)}>
        <View style={[
          styles.storyContainer,
          { borderColor: isViewed ? 'rgba(255, 255, 255, 0.3)' : '#007AFF' }
        ]}>
          <Image source={{ uri: latestStory.imageUrl }} style={styles.storyImage} />
          {item.stories.length > 1 && (
            <View style={styles.multipleStoriesIndicator}>
              <Text style={styles.multipleStoriesText}>
                {item.stories.length}
              </Text>
            </View>
          )}
          <View style={styles.storyAvatar}>
            <UserAvatar size={24} uri={item.user.avatar} />
          </View>
          <View style={styles.timeIndicator}>
            <Text style={styles.timeText}>
              {Math.floor((Date.now() - latestStory.createdAt) / 3600000)}h
            </Text>
          </View>
        </View>
        <Text style={[styles.storyUserName, { color: isDark ? '#FFFFFF' : '#333333' }]} numberOfLines={1}>
          {item.user.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStoryViewer = () => {
    if (!selectedStory) return null;
    
    const owner = getStoryOwner(selectedStory);
    const isMyStory = selectedStory.userId === currentUser?.id;
    const timestamp = new Date(selectedStory.createdAt);
    const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return (
      <Modal
        visible={showStoryViewer}
        animationType="fade"
        presentationStyle="fullScreen"
      >
        <View style={styles.storyViewerContainer}>
          <TouchableOpacity 
            style={styles.storyTouchArea}
            onPress={nextStoryItem}
            onLongPress={previousStoryItem}
          >
            <Image 
              source={{ uri: selectedStory.imageUrl }} 
              style={styles.fullStoryImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.storyHeader}
          >
            <View style={styles.storyUserInfo}>
              <UserAvatar size={32} uri={owner.avatar} />
              <View>
                <Text style={styles.storyViewerUserName}>{owner.name}</Text>
                <Text style={styles.storyTime}>
                  {formattedTime} • {formattedDate}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.closeStoryButton}
              onPress={() => {
                setShowStoryViewer(false);
                setSelectedStory(null);
              }}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.storyActions}
          >
            {!isMyStory ? (
              <>
                <TouchableOpacity 
                  style={styles.storyActionButton} 
                  onPress={() => handleImagePress(selectedStory.imageUrl)}
                >
                  <Eye size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.storyActionButton} 
                  onPress={() => saveToGallery(selectedStory.imageUrl)}
                >
                  <Download size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.storyActionButton} onPress={() => Alert.alert('Liked!')}>
                  <Heart size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.storyActionButton} onPress={() => Alert.alert('Reply feature coming soon!')}>
                  <MessageCircle size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.storyActionButton} 
                  onPress={handleViewersPress}
                >
                  <Users size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.storyActionButton} 
                  onPress={() => handleImagePress(selectedStory.imageUrl)}
                >
                  <Eye size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.storyActionButton} 
                  onPress={() => saveToGallery(selectedStory.imageUrl)}
                >
                  <Download size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.storyActionButton} 
                  onPress={() => {
                    Alert.alert(
                      'Delete Story',
                      'Are you sure you want to delete this story?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: () => deleteStoryItem(selectedStory.id)
                        }
                      ]
                    );
                  }}
                >
                  <Trash2 size={24} color="#FF3B30" />
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  const renderFullImageViewer = () => {
    if (!fullImageUrl) return null;
    
    return (
      <Modal
        visible={showFullImage}
        animationType="fade"
        presentationStyle="fullScreen"
        transparent={true}
      >
        <View style={styles.fullImageContainer}>
          <Image 
            source={{ uri: fullImageUrl }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          <View style={styles.fullImageHeader}>
            <TouchableOpacity 
              style={styles.closeFullImageButton}
              onPress={() => setShowFullImage(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveFullImageButton}
              onPress={() => {
                saveToGallery(fullImageUrl);
              }}
            >
              <Download size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save to Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderViewersModal = () => {
    if (!selectedStory || !showViewers) return null;
    
    const isMyStory = selectedStory.userId === currentUser?.id;
    if (!isMyStory) {
      setShowViewers(false);
      return null;
    }
    
    const mockViewers = [
      { id: '1', name: 'John Smith', username: 'johnsmith', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
      { id: '2', name: 'Sarah Johnson', username: 'sarahj', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
      { id: '3', name: 'Michael Brown', username: 'mikebrown', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
    ];
    
    return (
      <Modal
        visible={showViewers}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.viewersModalContainer}>
          <View style={[styles.viewersModalContent, isDark && styles.darkViewersModalContent]}>
            <View style={[styles.viewersModalHeader, isDark && styles.darkViewersModalHeader]}>
              <Text style={[styles.viewersModalTitle, isDark && { color: '#FFFFFF' }]}>Viewers</Text>
              <TouchableOpacity onPress={() => setShowViewers(false)}>
                <X size={24} color={isDark ? '#FFFFFF' : '#333333'} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={mockViewers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.viewerItem, isDark && styles.darkViewerItem]}>
                  <UserAvatar size={40} uri={item.avatar} />
                  <View style={styles.viewerInfo}>
                    <Text style={[styles.viewerName, isDark && { color: '#FFFFFF' }]}>{item.name}</Text>
                    <Text style={[styles.viewerUsername, isDark && { color: '#BBBBBB' }]}>@{item.username}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyViewers}>
                  <Text style={[styles.emptyViewersText, isDark && { color: '#BBBBBB' }]}>No viewers yet</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderCameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.cameraContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webCameraPlaceholder}>
            <Camera size={64} color="#FFFFFF" />
            <Text style={styles.webCameraText}>Camera Preview</Text>
            <Text style={styles.webCameraSubtext}>Taking a real photo...</Text>
            <TouchableOpacity style={styles.webCameraButton} onPress={takePicture}>
              <Text style={styles.webCameraButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webCameraButton} onPress={() => setShowCamera(false)}>
              <Text style={styles.webCameraButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView 
            ref={cameraRef} 
            style={styles.camera} 
            facing={facing}
            mode="picture"
          >
            <View style={styles.cameraHeader}>
              <TouchableOpacity 
                style={styles.closeCameraButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.galleryButton}
                onPress={() => {
                  setShowCamera(false);
                  pickImage();
                }}
              >
                <ImageIcon size={24} color="#FFFFFF" />
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.flipButton}
                onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
              >
                <Text style={styles.flipButtonText}>Flip</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📸</Text>
      <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
        No stories yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>
        Be the first to share a story with your friends!
      </Text>
      <TouchableOpacity 
        style={styles.createStoryButton}
        onPress={handleTakePhoto}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.createStoryButtonText}>Create Story</Text>
      </TouchableOpacity>
    </View>
  );

  const friendStoryGroups = storyGroups.filter(group => group.user.id !== currentUser?.id);

  return (
    <LinearGradient
      colors={isDark ? ['#1e3a5f', '#2d5a87', '#3d7ab8'] : ['#f0f9ff', '#e0f2fe', '#bae6fd']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stories</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={pickImage}
            >
              <ImageIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleTakePhoto}
            >
              <Camera size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {selectedPhoto && (
          <View style={styles.selectedPhotoContainer}>
            <Image source={{ uri: selectedPhoto }} style={styles.selectedPhotoPreview} />
            <View style={styles.selectedPhotoActions}>
              <TouchableOpacity 
                style={styles.selectedPhotoButton}
                onPress={() => setSelectedPhoto(null)}
                disabled={isPosting}
              >
                <X size={20} color="#FFFFFF" />
                <Text style={styles.selectedPhotoButtonText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.selectedPhotoButton, styles.postButton, isPosting && styles.disabledButton]}
                onPress={postStory}
                disabled={isPosting}
              >
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.selectedPhotoButtonText}>
                  {isPosting ? 'Posting...' : 'Post Story'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {friendStoryGroups.length === 0 && userStories.length === 0 && !selectedPhoto ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={[{ isMyStory: true }, ...friendStoryGroups]}
            renderItem={({ item }) => {
              if ('isMyStory' in item) {
                return renderMyStoryItem();
              }
              return renderStoryItem({ item });
            }}
            keyExtractor={(item, index) => 
              'isMyStory' in item ? 'my_story' : item.user.id
            }
            numColumns={3}
            contentContainerStyle={styles.storiesGrid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={onRefresh}
                tintColor={isDark ? "#FFFFFF" : "#000000"}
                colors={[isDark ? "#FFFFFF" : "#000000"]}
              />
            }
          />
        )}

        {renderStoryViewer()}
        {renderCameraModal()}
        {renderFullImageViewer()}
        {renderViewersModal()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPhotoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  selectedPhotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedPhotoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectedPhotoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  postButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  selectedPhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storiesGrid: {
    padding: 16,
    paddingBottom: 100,
  },
  storyItem: {
    width: storyWidth,
    marginRight: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  myStoryContainer: {
    position: 'relative',
  },
  storyContainer: {
    borderWidth: 3,
    borderRadius: 12,
    padding: 2,
    position: 'relative',
  },
  storyImage: {
    width: storyWidth - 16,
    height: (storyWidth - 16) * 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multipleStoriesIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multipleStoriesText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  timeIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyAvatar: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 14,
  },
  storyUserName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: storyWidth,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  createStoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storyViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyTouchArea: {
    flex: 1,
    width: '100%',
  },
  fullStoryImage: {
    width: '100%',
    height: '100%',
  },
  storyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storyViewerUserName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  storyTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  closeStoryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 60,
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  storyActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  webCameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    gap: 20,
  },
  webCameraText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  webCameraSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  webCameraButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  webCameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraHeader: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  closeCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 4,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  flipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullImageHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeFullImageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveFullImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewersModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  viewersModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  darkViewersModalContent: {
    backgroundColor: '#1A1A1A',
  },
  viewersModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  darkViewersModalHeader: {
    borderBottomColor: '#333333',
  },
  viewersModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  darkViewerItem: {
    borderBottomColor: '#333333',
  },
  viewerInfo: {
    marginLeft: 12,
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  viewerUsername: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  emptyViewers: {
    padding: 20,
    alignItems: 'center',
  },
  emptyViewersText: {
    fontSize: 16,
    color: '#666666',
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