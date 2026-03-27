export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'voice' | 'party' | 'system' | 'yip';
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'opened';
  isSaved?: boolean;
  isDeleted?: boolean;
  deletedFor?: 'me' | 'everyone';
  imageUri?: string;
  videoUri?: string;
  partyId?: string;
  chatId?: string;
  text?: string; // For backward compatibility
  
  // Yip specific properties
  yipStatus?: 'delivered' | 'opened' | 'screenshot' | 'saved' | 'expired';
  yipViewDuration?: number; // In seconds
  yipCaption?: string;
  viewedAt?: number;
  viewCount?: number;
  yipScreenshotted?: boolean;
  yipExpired?: boolean;
  expiresAt?: number; // Timestamp when message expires
}

export interface Chat {
  id: string;
  name?: string;
  emoji?: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt: number;
  lastMessage: Message | null;
  unreadCount: number;
  isGroup: boolean;
  avatar?: string;
  isParty?: boolean;
  isSchool?: boolean;
  type?: 'direct' | 'group' | 'party' | 'school';
  createdBy?: string;
  
  // Mute functionality
  isMuted?: boolean;
  mutedUntil?: number | null;
  
  // Yip specific properties
  yipStreak: number;
  lastYipAt: number;
  dailyReplaysRemaining: number;
  lastReplayUsedAt?: number;
}