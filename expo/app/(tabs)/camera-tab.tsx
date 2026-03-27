import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text, Dimensions, Alert, Modal, FlatList, TextInput, PanResponder } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ExpoHaptics from 'expo-haptics';
import { Repeat, Zap, ZapOff, X, Check, RefreshCw, Smile, Edit } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { UserCard } from '@/components/UserCard';
import { Image } from 'react-native';
import { trpcClient } from '@/lib/trpc';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [yipCaption, setYipCaption] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [captionPosition, setCaptionPosition] = useState({ top: screenHeight * 0.25, left: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const { currentUser, getFriendUsers, incrementYipScore } = useUserStore();
  const { sendYipMessage } = useChatStore();
  const router = useRouter();

  // Get real friends list
  const friends = getFriendUsers();

  // Create pan responder for draggable caption
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        if (Platform.OS !== 'web') {
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const newTop = Math.max(
          insets.top + 50, 
          Math.min(
            screenHeight - 200, 
            captionPosition.top + gestureState.dy
          )
        );
        const newLeft = Math.max(
          10, 
          Math.min(
            screenWidth - 200, 
            captionPosition.left + gestureState.dx
          )
        );
        
        setCaptionPosition({
          top: newTop,
          left: newLeft,
        });
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        if (Platform.OS !== 'web') {
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
        }
      },
    })
  ).current;

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <LinearGradient
          colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
          style={styles.permissionGradient}
        >
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Please Log In</Text>
            <Text style={styles.permissionText}>
              You need to be logged in to use the camera and send Yips
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => router.push({ pathname: '/auth/login' as any })}
            >
              <Text style={styles.permissionButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <LinearGradient
          colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
          style={styles.permissionGradient}
        >
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1000&q=80' }} 
            style={styles.permissionBackgroundImage}
          />
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Camera Access</Text>
            <Text style={styles.permissionText}>
              YipYap needs camera access to let you capture and share moments with friends
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
            </TouchableOpacity>
            <Text style={styles.permissionSubtext}>
              You can change this later in your device settings
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const handleFlip = () => {
    if (Platform.OS !== 'web') {
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    }
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleFlash = () => {
    if (Platform.OS !== 'web') {
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    }
    setFlash(!flash);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      if (Platform.OS !== 'web') {
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      }

      if (Platform.OS === 'web') {
        const timestamp = Date.now();
        const mockPhotoUri = `https://images.unsplash.com/photo-${timestamp % 10 === 0 ? '1506794778202-cad84cf45f1d' : '1535713875002-d1d0cf377fde'}?w=400&h=600&fit=crop&story=${timestamp}.jpg`;
        setCapturedMedia(mockPhotoUri);
      } else {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        
        if (photo && photo.uri) {
          setCapturedMedia(photo.uri);
        } else {
          Alert.alert('Error', 'Failed to capture photo');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', 'Failed to take photo: ' + errorMessage);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSendToSelectedFriends = async () => {
    if (!capturedMedia || !currentUser || selectedFriends.length === 0 || isSending) return;

    setIsSending(true);
    try {
      console.log('🔄 Sending Yips to selected friends via backend:', { 
        friendCount: selectedFriends.length, 
        hasImage: !!capturedMedia, 
        caption: yipCaption 
      });
      
      for (const friendId of selectedFriends) {
        const chatId = `chat_${friendId}`;
        
        try {
          await sendYipMessage(
            chatId, 
            capturedMedia,
            yipCaption
          );
          
          console.log(`✅ Yip sent successfully to friend ${friendId} via backend`);
          incrementYipScore();
        } catch (friendError) {
          console.error(`❌ Failed to send Yip to friend ${friendId}:`, friendError);
        }
      }
      
      if (Platform.OS !== 'web') {
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Yips Sent!', `Your Yip has been sent to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}`);
      setShowFriendSelector(false);
      setCapturedMedia(null);
      setSelectedFriends([]);
      setYipCaption('');
      setShowCaptionInput(false);
    } catch (error) {
      console.error('❌ Error sending Yips via backend:', error);
      Alert.alert('Error', 'Failed to send some Yips. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedMedia(null);
    setYipCaption('');
    setShowCaptionInput(false);
  };

  const handleContinue = () => {
    if (capturedMedia) {
      setShowFriendSelector(true);
    }
  };

  const handleAddCaption = () => {
    setShowCaptionInput(true);
  };

  const handleCaptionDone = () => {
    setShowCaptionInput(false);
  };

  const renderCaptureScreen = () => {
    if (capturedMedia) {
      return (
        <View style={styles.previewContainer}>
          <Image 
            source={{ uri: capturedMedia }} 
            style={styles.previewImage}
            resizeMode="cover"
          />
          
          {showCaptionInput ? (
            <View 
              {...panResponder.panHandlers}
              style={[
                styles.captionInputContainer,
                { 
                  top: captionPosition.top, 
                  left: captionPosition.left,
                  opacity: isDragging ? 0.9 : 1,
                  transform: [{ scale: isDragging ? 1.02 : 1 }]
                }
              ]}
            >
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={yipCaption}
                onChangeText={setYipCaption}
                autoFocus
                maxLength={100}
              />
              <TouchableOpacity 
                style={styles.captionDoneButton}
                onPress={handleCaptionDone}
              >
                <Check size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={styles.previewActionButton}
                onPress={handleRetakePhoto}
              >
                <X size={24} color="#FFFFFF" />
                <Text style={styles.previewActionText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.previewActionButton}
                onPress={handleAddCaption}
              >
                <Edit size={24} color="#FFFFFF" />
                <Text style={styles.previewActionText}>Caption</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.previewActionButton}
                onPress={handleContinue}
              >
                <Check size={24} color="#FFFFFF" />
                <Text style={styles.previewActionText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {yipCaption && !showCaptionInput ? (
            <View 
              {...panResponder.panHandlers}
              style={[
                styles.captionPreviewContainer,
                { 
                  top: captionPosition.top, 
                  left: captionPosition.left,
                  opacity: isDragging ? 0.9 : 1,
                  transform: [{ scale: isDragging ? 1.02 : 1 }]
                }
              ]}
            >
              <Text style={styles.captionPreviewText}>{yipCaption}</Text>
            </View>
          ) : null}
        </View>
      );
    }

    return (
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash ? 'on' : 'off'}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={[styles.topControls, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity style={styles.topButton} onPress={handleFlash}>
            {flash ? (
              <Zap size={24} color="#FFD700" />
            ) : (
              <ZapOff size={24} color="white" />
            )}
          </TouchableOpacity>

          <View style={styles.spacer} />
        </LinearGradient>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={[styles.bottomControls, { paddingBottom: insets.bottom + 40 }]} 
        >
          <View style={styles.captureRow}>
            <View style={styles.sideButton} />

            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sideButton} onPress={handleFlip}>
              <RefreshCw size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </CameraView>
    );
  };

  const renderFriendSelector = () => (
    <Modal
      visible={showFriendSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <LinearGradient
        colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
        style={styles.modalContainer}
      >
        <LinearGradient
          colors={['#6C5CE7', '#4A90E2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity 
            onPress={() => {
              setShowFriendSelector(false);
            }}
            disabled={isSending}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>
            Send Yip to Friends
          </Text>
          
          <TouchableOpacity 
            onPress={handleSendToSelectedFriends}
            disabled={selectedFriends.length === 0 || isSending}
            style={[
              styles.sendButton,
              { 
                backgroundColor: (selectedFriends.length === 0 || isSending) ? 'rgba(108, 92, 231, 0.3)' : '#6C5CE7',
                opacity: (selectedFriends.length === 0 || isSending) ? 0.5 : 1 
              }
            ]}
          >
            <Text style={[styles.sendButtonText, { color: '#FFFFFF' }]}>
              {isSending ? 'Sending...' : `Send (${selectedFriends.length})`}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
        
        <FlatList
          data={friends}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.friendItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
              onPress={() => toggleFriendSelection(item.id)}
              disabled={isSending}
            >
              <View style={styles.friendCardWrapper}>
                <UserCard
                  user={item}
                  showAddButton={false}
                  showFullInfo={true}
                />
              </View>
              <View style={[
                styles.checkbox,
                { borderColor: selectedFriends.includes(item.id) ? '#6C5CE7' : '#666666' },
                selectedFriends.includes(item.id) && { backgroundColor: '#6C5CE7' }
              ]}>
                {selectedFriends.includes(item.id) && (
                  <Check size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={[styles.friendsList, { paddingBottom: insets.bottom + 20 }]}
          ListEmptyComponent={
            <View style={styles.emptyFriends}>
              <Text style={[styles.emptyFriendsText, { color: '#FFFFFF' }]}>
                No friends to send Yips to. Add friends from the Pool!
              </Text>
            </View>
          }
        />
      </LinearGradient>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderCaptureScreen()}
      {renderFriendSelector()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  permissionGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  permissionContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  topButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  spacer: {
    width: 44,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 80,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendsList: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendCardWrapper: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyFriends: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFriendsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewActions: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  previewActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewActionText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
  },
  captionInputContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: screenWidth - 40,
    minWidth: 200,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captionInput: {
    flex: 1,
    color: 'white',
    fontSize: 18,
  },
  captionDoneButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionPreviewContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 12,
    maxWidth: screenWidth - 40,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captionPreviewText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});