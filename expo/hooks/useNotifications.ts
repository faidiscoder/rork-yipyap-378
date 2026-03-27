import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useUserStore } from '@/store/userStore';

// Configure notification behavior for REAL push notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { settings } = useUserStore();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return; // Skip notifications setup on web
    }

    registerForPushNotificationsAsync();

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 REAL Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 REAL Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'YipYAP Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF9500',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });

      // Create specific channels for different notification types
      await Notifications.setNotificationChannelAsync('friends', {
        name: 'Friends & Social',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CD964',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages & Yips',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#007AFF',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('stories', {
        name: 'Stories & Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
        lightColor: '#FF9500',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('parties', {
        name: 'Parties & Events',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 100, 300],
        lightColor: '#FF2D92',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('school', {
        name: 'School Activity',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150],
        lightColor: '#5856D6',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('privacy', {
        name: 'Privacy Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 100, 300],
        lightColor: '#FF3B30',
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        // Show custom permission request dialog
        Alert.alert(
          "Stay Updated with YipYap",
          "Enable notifications to know when friends send you Yips, view your stories, or invite you to events.",
          [
            { 
              text: "Not Now", 
              style: "cancel" 
            },
            { 
              text: "Enable Notifications", 
              onPress: async () => {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                
                if (finalStatus !== 'granted') {
                  console.log('❌ Failed to get push token for push notification!');
                  return;
                }
                
                try {
                  const token = await Notifications.getExpoPushTokenAsync({
                    projectId: 'your-project-id', // Replace with your actual project ID
                  });
                  console.log('📱 Push token:', token);
                } catch (error) {
                  console.log('❌ Error getting push token:', error);
                }
              }
            }
          ],
          { cancelable: true }
        );
        return;
      }
      
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id', // Replace with your actual project ID
        });
        console.log('📱 Push token:', token);
      } catch (error) {
        console.log('❌ Error getting push token:', error);
      }
    } else {
      console.log('❌ Must use physical device for Push Notifications');
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case 'friend_request':
        // Navigate to friend requests
        break;
      case 'new_message':
        // Navigate to chat
        break;
      case 'story_posted':
        // Navigate to stories
        break;
      case 'party_invite':
        // Navigate to party
        break;
      case 'screenshot':
        // Navigate to privacy settings
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  };

  // REAL NOTIFICATION FUNCTIONS - These will show on phone's notification panel

  // Social & Friends Notifications
  const sendFriendRequestNotification = async (fromUser: string, toUserId: string) => {
    if (!settings?.notificationSettings?.friendRequestNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👋 New Friend Request',
        body: `${fromUser} wants to be your friend`,
        data: { type: 'friend_request', fromUser, toUserId },
        badge: 1,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
    console.log('📱 SENT: Friend request notification');
  };

  const sendFriendRequestAcceptedNotification = async (accepterName: string) => {
    if (!settings?.notificationSettings?.friendRequestNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Friend Request Accepted',
        body: `${accepterName} accepted your friend request!`,
        data: { type: 'friend_accepted', accepterName },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Friend request accepted notification');
  };

  const sendProfileViewNotification = async (viewerName: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👀 Profile View',
        body: `${viewerName} viewed your profile`,
        data: { type: 'profile_view', viewerName },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Profile view notification');
  };

  const sendRemovedOrBlockedNotification = async (action: 'removed' | 'blocked', userName: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: action === 'removed' ? '😔 Friend Removed' : '🚫 Blocked',
        body: action === 'removed' 
          ? `${userName} removed you as a friend` 
          : `${userName} blocked you`,
        data: { type: action, userName },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log(`📱 SENT: ${action} notification`);
  };

  const sendFriendJoinedSchoolNotification = async (friendName: string, schoolName: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏫 Friend Joined School',
        body: `${friendName} joined ${schoolName}`,
        data: { type: 'friend_school_join', friendName, schoolName },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Friend joined school notification');
  };

  // Chat & Messaging Notifications
  const sendMessageNotification = async (fromUser: string, message: string, chatId: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💬 ${fromUser}`,
        body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
        data: { type: 'new_message', fromUser, chatId },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Message notification');
  };

  const sendReactionNotification = async (reactorName: string, reaction: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❤️ Message Reaction',
        body: `${reactorName} reacted ${reaction} to your message`,
        data: { type: 'message_reaction', reactorName, reaction },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Reaction notification');
  };

  const sendYipOpenedNotification = async (openerName: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📖 Yip Opened',
        body: `${openerName} opened your Yip`,
        data: { type: 'yip_opened', openerName },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Yip opened notification');
  };

  const sendTypingNotification = async (typerName: string, chatId: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✏️ Someone is typing',
        body: `${typerName} is typing...`,
        data: { type: 'typing', typerName, chatId },
        badge: 0, // Don't increase badge for typing
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Typing notification');
  };

  // Stories & Yips Notifications
  const sendStoryNotification = async (fromUser: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📸 New Story',
        body: `${fromUser} posted a new story`,
        data: { type: 'story_posted', fromUser },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Story notification');
  };

  const sendStoryExpiringNotification = async () => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Story Expiring Soon',
        body: 'Your story will expire in 1 hour',
        data: { type: 'story_expiring' },
        badge: 0,
        sound: 'default',
      },
      trigger: { seconds: 3600 }, // 1 hour before expiry
    });
    console.log('📱 SENT: Story expiring notification');
  };

  const sendScreenshotNotification = async (screenshotterName: string, contentType: string) => {
    if (!settings?.notificationSettings?.screenshotNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📱 Screenshot Alert',
        body: `${screenshotterName} took a screenshot of your ${contentType}`,
        data: { type: 'screenshot', screenshotterName, contentType },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Screenshot notification');
  };

  // School Activity Notifications
  const sendSchoolJoinNotification = async (userName: string, schoolName: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎓 New School Member',
        body: `${userName} joined ${schoolName}`,
        data: { type: 'school_join', userName, schoolName },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: School join notification');
  };

  const sendClassGroupCreatedNotification = async (className: string, creatorName: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 New Class Group',
        body: `${creatorName} created a group for ${className}`,
        data: { type: 'class_group_created', className, creatorName },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Class group created notification');
  };

  const sendClassChatMessageNotification = async (senderName: string, className: string, message: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📖 ${className}`,
        body: `${senderName}: ${message.length > 40 ? `${message.substring(0, 40)}...` : message}`,
        data: { type: 'class_chat_message', senderName, className },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Class chat message notification');
  };

  // Parties & Events Notifications
  const sendPartyInviteNotification = async (fromUser: string, partyName: string, partyId: string) => {
    if (!settings?.notificationSettings?.partyInviteNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Party Invitation',
        body: `${fromUser} invited you to ${partyName}`,
        data: { type: 'party_invite', fromUser, partyId },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Party invite notification');
  };

  const sendPartyRSVPNotification = async (rsvperName: string, partyName: string, response: 'yes' | 'no' | 'maybe') => {
    if (!settings?.notificationSettings?.partyInviteNotifications || Platform.OS === 'web') return;
    
    const emoji = response === 'yes' ? '✅' : response === 'no' ? '❌' : '🤔';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} Party RSVP`,
        body: `${rsvperName} ${response === 'yes' ? 'is coming to' : response === 'no' ? 'cannot attend' : 'might attend'} ${partyName}`,
        data: { type: 'party_rsvp', rsvperName, response },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Party RSVP notification');
  };

  const sendPartyStartingSoonNotification = async (partyName: string, partyId: string) => {
    if (!settings?.notificationSettings?.partyInviteNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🕐 Party Starting Soon',
        body: `${partyName} starts in 30 minutes!`,
        data: { type: 'party_starting', partyId },
        badge: 1,
        sound: 'default',
      },
      trigger: { seconds: 1800 }, // 30 minutes before
    });
    console.log('📱 SENT: Party starting soon notification');
  };

  // System & Settings Notifications
  const sendTaggedNotification = async (taggerName: string, postType: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏷️ You were tagged',
        body: `${taggerName} tagged you in a ${postType}`,
        data: { type: 'tagged', taggerName, postType },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Tagged notification');
  };

  const sendReportReviewedNotification = async (reportStatus: 'resolved' | 'dismissed') => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛡️ Report Update',
        body: `Your report has been ${reportStatus}`,
        data: { type: 'report_reviewed', reportStatus },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Report reviewed notification');
  };

  const sendSubscriptionRenewalNotification = async (daysLeft: number) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💎 YipYAP+ Renewal',
        body: `Your YipYAP+ subscription expires in ${daysLeft} days`,
        data: { type: 'subscription_renewal', daysLeft },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Subscription renewal notification');
  };

  const sendMilestoneNotification = async (milestone: string) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Milestone Reached!',
        body: milestone,
        data: { type: 'milestone' },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Milestone notification');
  };

  // Advanced Features
  const sendStreakNotification = async (friendName: string, streakDays: number) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Streak Alert',
        body: `Your ${streakDays}-day streak with ${friendName} is about to end!`,
        data: { type: 'streak_ending', friendName, streakDays },
        badge: 1,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Streak notification');
  };

  const sendDailyRecapNotification = async (newYips: number, profileViews: number) => {
    if (!settings?.notificationSettings?.pushNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Recap',
        body: `${newYips} new Yips, ${profileViews} profile views today`,
        data: { type: 'daily_recap', newYips, profileViews },
        badge: 0,
        sound: 'default',
      },
      trigger: {
        hour: 20, // 8 PM
        minute: 0,
        repeats: true,
      },
    });
    console.log('📱 SENT: Daily recap notification');
  };

  // Chat Privacy Notifications
  const sendMessageDeletedNotification = async (deleterName: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🗑️ Message Deleted',
        body: `${deleterName} deleted a message`,
        data: { type: 'message_deleted', deleterName },
        badge: 0,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Message deleted notification');
  };

  const sendMessageSavedNotification = async (saverName: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔖 Message Saved',
        body: `${saverName} saved your message`,
        data: { type: 'message_saved', saverName },
        badge: 0,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Message saved notification');
  };

  const sendMessageExpiringNotification = async (chatName: string, timeLeft: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏳ Messages Expiring',
        body: `Messages in ${chatName} will expire in ${timeLeft}`,
        data: { type: 'messages_expiring', chatName },
        badge: 0,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Messages expiring notification');
  };

  // Yip specific notifications
  const sendYipExpiredNotification = async (senderName: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Yip Expired',
        body: `Your Yip to ${senderName} has expired without being viewed`,
        data: { type: 'yip_expired', senderName },
        badge: 0,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Yip expired notification');
  };

  const sendYipReplayedNotification = async (replayerName: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔄 Yip Replayed',
        body: `${replayerName} replayed your Yip`,
        data: { type: 'yip_replayed', replayerName },
        badge: 0,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Yip replayed notification');
  };

  const sendYipSavedNotification = async (saverName: string) => {
    if (!settings?.notificationSettings?.messageNotifications || Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💾 Yip Saved',
        body: `${saverName} saved your Yip in chat`,
        data: { type: 'yip_saved', saverName },
        badge: 0,
        sound: 'default',
      },
      trigger: null,
    });
    console.log('📱 SENT: Yip saved notification');
  };

  return {
    // Social & Friends
    sendFriendRequestNotification,
    sendFriendRequestAcceptedNotification,
    sendProfileViewNotification,
    sendRemovedOrBlockedNotification,
    sendFriendJoinedSchoolNotification,
    
    // Chat & Messaging
    sendMessageNotification,
    sendReactionNotification,
    sendYipOpenedNotification,
    sendTypingNotification,
    
    // Stories & Yips
    sendStoryNotification,
    sendStoryExpiringNotification,
    sendScreenshotNotification,
    
    // School Activity
    sendSchoolJoinNotification,
    sendClassGroupCreatedNotification,
    sendClassChatMessageNotification,
    
    // Parties & Events
    sendPartyInviteNotification,
    sendPartyRSVPNotification,
    sendPartyStartingSoonNotification,
    
    // System & Settings
    sendTaggedNotification,
    sendReportReviewedNotification,
    sendSubscriptionRenewalNotification,
    sendMilestoneNotification,
    
    // Advanced Features
    sendStreakNotification,
    sendDailyRecapNotification,
    
    // Chat Privacy
    sendMessageDeletedNotification,
    sendMessageSavedNotification,
    sendMessageExpiringNotification,
    
    // Yip specific
    sendYipExpiredNotification,
    sendYipReplayedNotification,
    sendYipSavedNotification,
  };
}