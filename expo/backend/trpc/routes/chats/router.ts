import { z } from 'zod';
import { protectedProcedure, router } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { executeQuery, getOne, getMany } from '../../../database/connection';

export const chatsRouter = router({
  getChats: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log('🔄 Fetching chats on Lightsail for user:', ctx.user.id);
      
      const chats = await getMany(`
        SELECT c.*, 
          m.content as last_message_content, 
          m.created_at as last_message_time,
          m.sender_id as last_message_sender_id,
          u.username as last_message_sender_username
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        LEFT JOIN messages m ON c.last_message_id = m.id
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE cp.user_id = ?
        ORDER BY c.updated_at DESC
      `, [ctx.user.id]);
      
      // Get participants for each chat
      const formattedChats = await Promise.all(chats.map(async (chat: any) => {
        const participants = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, u.is_online, u.last_seen
          FROM users u
          JOIN chat_participants cp ON u.id = cp.user_id
          WHERE cp.chat_id = ? AND u.id != ?
        `, [chat.id, ctx.user.id]);
        
        // Get current user's mute status for this chat
        const muteStatus = await getOne(`
          SELECT is_muted, muted_until FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [chat.id, ctx.user.id]);
        
        // Check if mute has expired
        let isMuted = muteStatus?.is_muted || false;
        if (isMuted && muteStatus?.muted_until) {
          const now = new Date();
          const mutedUntil = new Date(muteStatus.muted_until);
          if (now > mutedUntil) {
            // Mute has expired, update database
            await executeQuery(`
              UPDATE chat_participants
              SET is_muted = 0, muted_until = NULL
              WHERE chat_id = ? AND user_id = ?
            `, [chat.id, ctx.user.id]);
            isMuted = false;
          }
        }
        
        const formattedParticipants = participants.map((p: any) => ({
          id: p.id.toString(),
          username: p.username,
          name: p.display_name,
          avatar: p.avatar,
          isOnline: p.is_online,
          lastSeen: new Date(p.last_seen).getTime(),
        }));
        
        return {
          id: chat.id.toString(),
          name: chat.name || formattedParticipants[0]?.name || 'Chat',
          type: chat.type,
          lastMessage: chat.last_message_content,
          lastMessageTime: chat.last_message_time ? new Date(chat.last_message_time).getTime() : null,
          lastMessageSender: chat.last_message_sender_username,
          participants: formattedParticipants,
          unreadCount: 0, // TODO: Calculate unread messages
          isMuted,
          mutedUntil: muteStatus?.muted_until ? new Date(muteStatus.muted_until).getTime() : null,
        };
      }));
      
      console.log(`✅ Found ${formattedChats.length} chats on Lightsail`);
      
      return {
        chats: formattedChats,
        success: true,
      };
    } catch (error) {
      console.error('❌ Get chats error on Lightsail:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch chats on Lightsail',
      });
    }
  }),
  
  getMessages: protectedProcedure
    .input(z.object({
      chatId: z.string(),
      limit: z.number().default(50),
      cursor: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Fetching messages on Lightsail for chat:', input.chatId);
        
        // Check if user is a participant in this chat
        const isParticipant = await getOne(`
          SELECT 1 FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!isParticipant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat on Lightsail',
          });
        }
        
        // Get messages with cursor-based pagination
        const cursorClause = input.cursor 
          ? `AND m.id < ${input.cursor}` 
          : '';
        
        const messages = await getMany(`
          SELECT m.*, u.username, u.display_name, u.avatar
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.chat_id = ? ${cursorClause}
          ORDER BY m.created_at DESC
          LIMIT ?
        `, [input.chatId, input.limit]);
        
        // Format messages for frontend
        const formattedMessages = messages.map((msg: any) => ({
          id: msg.id.toString(),
          chatId: msg.chat_id.toString(),
          senderId: msg.sender_id.toString(),
          senderName: msg.display_name,
          senderUsername: msg.username,
          senderAvatar: msg.avatar,
          content: msg.content,
          type: msg.type,
          imageUri: msg.image_uri,
          videoUri: msg.video_uri,
          isRead: msg.is_read,
          timestamp: new Date(msg.created_at).getTime(),
          isMe: msg.sender_id.toString() === ctx.user.id.toString(),
          isSaved: msg.is_saved,
          isDeleted: msg.is_deleted,
          deletedFor: msg.deleted_for,
          expiresAt: msg.expires_at ? new Date(msg.expires_at).getTime() : null,
          viewCount: msg.view_count || 0,
        }));
        
        // Get the next cursor
        const nextCursor = formattedMessages.length > 0
          ? parseInt(formattedMessages[formattedMessages.length - 1].id)
          : undefined;
        
        console.log(`✅ Found ${formattedMessages.length} messages on Lightsail`);
        
        return {
          messages: formattedMessages,
          nextCursor,
          success: true,
        };
      } catch (error) {
        console.error('❌ Get messages error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch messages on Lightsail',
        });
      }
    }),
  
  sendMessage: protectedProcedure
    .input(z.object({
      chatId: z.string(),
      content: z.string(),
      type: z.enum(['text', 'image', 'video', 'voice', 'yip', 'system']).default('text'),
      imageUri: z.string().optional(),
      videoUri: z.string().optional(),
      replyToId: z.string().optional(),
      expiresAfterHours: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Sending message on Lightsail to chat:', input.chatId);
        
        // Check if user is a participant in this chat
        const isParticipant = await getOne(`
          SELECT 1 FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!isParticipant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat on Lightsail',
          });
        }
        
        // Calculate expiration time if provided
        let expiresAt = null;
        if (input.expiresAfterHours) {
          const expirationDate = new Date();
          expirationDate.setHours(expirationDate.getHours() + input.expiresAfterHours);
          expiresAt = expirationDate;
        }
        
        // Insert message
        const result = await executeQuery(`
          INSERT INTO messages (
            chat_id, sender_id, content, type, image_uri, video_uri, 
            reply_to_id, expires_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          input.chatId,
          ctx.user.id,
          input.content,
          input.type,
          input.imageUri || null,
          input.videoUri || null,
          input.replyToId || null,
          expiresAt,
        ]) as any;
        
        const messageId = result.insertId;
        
        // Update chat's last message
        await executeQuery(`
          UPDATE chats SET last_message_id = ?, updated_at = NOW()
          WHERE id = ?
        `, [messageId, input.chatId]);
        
        console.log('✅ Message sent successfully on Lightsail');
        
        return {
          success: true,
          messageId: messageId.toString(),
        };
      } catch (error) {
        console.error('❌ Send message error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send message on Lightsail',
        });
      }
    }),

  setTypingStatus: protectedProcedure
    .input(z.object({
      chatId: z.string(),
      isTyping: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Setting typing status on Lightsail');
        
        // Check if user is a participant in this chat
        const isParticipant = await getOne(`
          SELECT 1 FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!isParticipant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat',
          });
        }
        
        if (input.isTyping) {
          // Insert or update typing status
          await executeQuery(`
            INSERT INTO typing_indicators (chat_id, user_id, started_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE started_at = NOW()
          `, [input.chatId, ctx.user.id]);
        } else {
          // Remove typing status
          await executeQuery(`
            DELETE FROM typing_indicators 
            WHERE chat_id = ? AND user_id = ?
          `, [input.chatId, ctx.user.id]);
        }
        
        console.log('✅ Typing status updated successfully');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Set typing status error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set typing status',
        });
      }
    }),

  getTypingUsers: protectedProcedure
    .input(z.object({
      chatId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Getting typing users');
        
        // Check if user is a participant in this chat
        const isParticipant = await getOne(`
          SELECT 1 FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!isParticipant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat',
          });
        }
        
        // Get users currently typing (within last 10 seconds)
        const typingUsers = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar
          FROM typing_indicators ti
          JOIN users u ON ti.user_id = u.id
          WHERE ti.chat_id = ? 
            AND ti.user_id != ?
            AND ti.started_at > DATE_SUB(NOW(), INTERVAL 10 SECOND)
        `, [input.chatId, ctx.user.id]);
        
        const formattedUsers = typingUsers.map((user: any) => ({
          id: user.id.toString(),
          username: user.username,
          displayName: user.display_name,
          avatar: user.avatar,
        }));
        
        return {
          success: true,
          typingUsers: formattedUsers,
        };
      } catch (error) {
        console.error('❌ Get typing users error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get typing users',
        });
      }
    }),
  
  deleteMessage: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      deleteFor: z.enum(['me', 'everyone']).default('me'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Deleting message on Lightsail:', input.messageId);
        
        // Check if user is the sender of this message
        const message = await getOne(`
          SELECT * FROM messages
          WHERE id = ?
        `, [input.messageId]);
        
        if (!message) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Message not found on Lightsail',
          });
        }
        
        // Only allow deleting for everyone if user is the sender
        if (input.deleteFor === 'everyone' && message.sender_id.toString() !== ctx.user.id.toString()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own messages for everyone on Lightsail',
          });
        }
        
        if (input.deleteFor === 'everyone') {
          // Mark as deleted for everyone
          await executeQuery(`
            UPDATE messages
            SET is_deleted = 1, deleted_for = 'everyone', content = ''
            WHERE id = ?
          `, [input.messageId]);
        } else {
          // Mark as deleted for this user only
          await executeQuery(`
            INSERT INTO message_deletions (message_id, user_id, deleted_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE deleted_at = NOW()
          `, [input.messageId, ctx.user.id]);
        }
        
        console.log('✅ Message deleted successfully on Lightsail');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Delete message error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete message on Lightsail',
        });
      }
    }),
  
  saveMessage: protectedProcedure
    .input(z.object({
      messageId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Saving message on Lightsail:', input.messageId);
        
        // Check if message exists
        const message = await getOne(`
          SELECT * FROM messages
          WHERE id = ?
        `, [input.messageId]);
        
        if (!message) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Message not found on Lightsail',
          });
        }
        
        // Save message
        await executeQuery(`
          INSERT INTO saved_messages (message_id, user_id, saved_at)
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE saved_at = NOW()
        `, [input.messageId, ctx.user.id]);
        
        // Update message saved status
        await executeQuery(`
          UPDATE messages
          SET is_saved = 1
          WHERE id = ?
        `, [input.messageId]);
        
        console.log('✅ Message saved successfully on Lightsail');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Save message error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save message on Lightsail',
        });
      }
    }),
  
  unsaveMessage: protectedProcedure
    .input(z.object({
      messageId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Unsaving message on Lightsail:', input.messageId);
        
        // Remove from saved messages
        await executeQuery(`
          DELETE FROM saved_messages
          WHERE message_id = ? AND user_id = ?
        `, [input.messageId, ctx.user.id]);
        
        // Check if anyone else has saved this message
        const otherSaves = await getOne(`
          SELECT COUNT(*) as count
          FROM saved_messages
          WHERE message_id = ?
        `, [input.messageId]);
        
        // If no one else has saved it, update message saved status
        if (otherSaves.count === 0) {
          await executeQuery(`
            UPDATE messages
            SET is_saved = 0
            WHERE id = ?
          `, [input.messageId]);
        }
        
        console.log('✅ Message unsaved successfully on Lightsail');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Unsave message error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unsave message on Lightsail',
        });
      }
    }),
  
  createChat: protectedProcedure
    .input(z.object({
      participantIds: z.array(z.string()),
      name: z.string().optional(),
      type: z.enum(['direct', 'group', 'party', 'school']).default('direct'),
      settings: z.object({
        messageLifespan: z.enum(['default', 'immediate', 'never']).default('default'),
        allowScreenshots: z.boolean().default(true),
        showTypingIndicators: z.boolean().default(true),
        showReadReceipts: z.boolean().default(true),
        allowMediaSaving: z.boolean().default(true),
        notifyOnScreenshot: z.boolean().default(true),
        encryptionEnabled: z.boolean().default(false),
        autoDeleteAfterHours: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Creating chat on Lightsail');
        
        // For direct chats, check if a chat already exists between these users
        if (input.type === 'direct' && input.participantIds.length === 1) {
          const existingChat = await getOne(`
            SELECT c.id FROM chats c
            JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
            JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
            WHERE c.type = 'direct'
          `, [ctx.user.id, input.participantIds[0]]);
          
          if (existingChat) {
            console.log('✅ Chat already exists on Lightsail, returning existing chat');
            return {
              success: true,
              chatId: existingChat.id.toString(),
              isNew: false,
            };
          }
        }
        
        // Create new chat
        const result = await executeQuery(`
          INSERT INTO chats (name, type, created_by, created_at)
          VALUES (?, ?, ?, NOW())
        `, [
          input.name || null,
          input.type,
          ctx.user.id,
        ]) as any;
        
        const chatId = result.insertId;
        
        // Add creator as participant
        await executeQuery(`
          INSERT INTO chat_participants (chat_id, user_id, joined_at)
          VALUES (?, ?, NOW())
        `, [chatId, ctx.user.id]);
        
        // Add other participants
        for (const participantId of input.participantIds) {
          await executeQuery(`
            INSERT INTO chat_participants (chat_id, user_id, joined_at)
            VALUES (?, ?, NOW())
          `, [chatId, participantId]);
        }
        
        // Save chat settings if provided
        if (input.settings) {
          await executeQuery(`
            INSERT INTO chat_settings (
              chat_id, message_lifespan, allow_screenshots, 
              show_typing_indicators, show_read_receipts, 
              allow_media_saving, notify_on_screenshot, 
              encryption_enabled, auto_delete_after_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            chatId,
            input.settings.messageLifespan,
            input.settings.allowScreenshots ? 1 : 0,
            input.settings.showTypingIndicators ? 1 : 0,
            input.settings.showReadReceipts ? 1 : 0,
            input.settings.allowMediaSaving ? 1 : 0,
            input.settings.notifyOnScreenshot ? 1 : 0,
            input.settings.encryptionEnabled ? 1 : 0,
            input.settings.autoDeleteAfterHours || null,
          ]);
        }
        
        // Add system message
        const systemMessage = input.type === 'direct' 
          ? 'Chat created' 
          : `${input.name || 'Group'} created`;
        
        const messageResult = await executeQuery(`
          INSERT INTO messages (
            chat_id, sender_id, content, type, created_at
          ) VALUES (?, ?, ?, 'system', NOW())
        `, [
          chatId,
          ctx.user.id,
          systemMessage,
        ]) as any;
        
        // Update chat's last message
        await executeQuery(`
          UPDATE chats SET last_message_id = ?, updated_at = NOW()
          WHERE id = ?
        `, [messageResult.insertId, chatId]);
        
        console.log('✅ Chat created successfully on Lightsail');
        
        return {
          success: true,
          chatId: chatId.toString(),
          isNew: true,
        };
      } catch (error) {
        console.error('❌ Create chat error on Lightsail:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create chat on Lightsail',
        });
      }
    }),
    
  updateChatSettings: protectedProcedure
    .input(z.object({
      chatId: z.string(),
      settings: z.object({
        messageLifespan: z.enum(['default', 'immediate', 'never']).optional(),
        allowScreenshots: z.boolean().optional(),
        showTypingIndicators: z.boolean().optional(),
        showReadReceipts: z.boolean().optional(),
        allowMediaSaving: z.boolean().optional(),
        notifyOnScreenshot: z.boolean().optional(),
        encryptionEnabled: z.boolean().optional(),
        autoDeleteAfterHours: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Updating chat settings on Lightsail for chat:', input.chatId);
        
        // Check if user is a participant in this chat
        const isParticipant = await getOne(`
          SELECT 1 FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!isParticipant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat on Lightsail',
          });
        }
        
        // Check if settings exist for this chat
        const existingSettings = await getOne(`
          SELECT 1 FROM chat_settings
          WHERE chat_id = ?
        `, [input.chatId]);
        
        if (existingSettings) {
          // Update existing settings
          const updateFields = [];
          const updateValues = [];
          
          if (input.settings.messageLifespan !== undefined) {
            updateFields.push('message_lifespan = ?');
            updateValues.push(input.settings.messageLifespan);
          }
          
          if (input.settings.allowScreenshots !== undefined) {
            updateFields.push('allow_screenshots = ?');
            updateValues.push(input.settings.allowScreenshots ? 1 : 0);
          }
          
          if (input.settings.showTypingIndicators !== undefined) {
            updateFields.push('show_typing_indicators = ?');
            updateValues.push(input.settings.showTypingIndicators ? 1 : 0);
          }
          
          if (input.settings.showReadReceipts !== undefined) {
            updateFields.push('show_read_receipts = ?');
            updateValues.push(input.settings.showReadReceipts ? 1 : 0);
          }
          
          if (input.settings.allowMediaSaving !== undefined) {
            updateFields.push('allow_media_saving = ?');
            updateValues.push(input.settings.allowMediaSaving ? 1 : 0);
          }
          
          if (input.settings.notifyOnScreenshot !== undefined) {
            updateFields.push('notify_on_screenshot = ?');
            updateValues.push(input.settings.notifyOnScreenshot ? 1 : 0);
          }
          
          if (input.settings.encryptionEnabled !== undefined) {
            updateFields.push('encryption_enabled = ?');
            updateValues.push(input.settings.encryptionEnabled ? 1 : 0);
          }
          
          if (input.settings.autoDeleteAfterHours !== undefined) {
            updateFields.push('auto_delete_after_hours = ?');
            updateValues.push(input.settings.autoDeleteAfterHours);
          }
          
          if (updateFields.length > 0) {
            await executeQuery(`
              UPDATE chat_settings
              SET ${updateFields.join(', ')}
              WHERE chat_id = ?
            `, [...updateValues, input.chatId]);
          }
        } else {
          // Create new settings
          await executeQuery(`
            INSERT INTO chat_settings (
              chat_id, message_lifespan, allow_screenshots, 
              show_typing_indicators, show_read_receipts, 
              allow_media_saving, notify_on_screenshot, 
              encryption_enabled, auto_delete_after_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            input.chatId,
            input.settings.messageLifespan || 'default',
            input.settings.allowScreenshots !== undefined ? (input.settings.allowScreenshots ? 1 : 0) : 1,
            input.settings.showTypingIndicators !== undefined ? (input.settings.showTypingIndicators ? 1 : 0) : 1,
            input.settings.showReadReceipts !== undefined ? (input.settings.showReadReceipts ? 1 : 0) : 1,
            input.settings.allowMediaSaving !== undefined ? (input.settings.allowMediaSaving ? 1 : 0) : 1,
            input.settings.notifyOnScreenshot !== undefined ? (input.settings.notifyOnScreenshot ? 1 : 0) : 1,
            input.settings.encryptionEnabled !== undefined ? (input.settings.encryptionEnabled ? 1 : 0) : 0,
            input.settings.autoDeleteAfterHours || null,
          ]);
        }
        
        // Add system message about settings change
        await executeQuery(`
          INSERT INTO messages (
            chat_id, sender_id, content, type, created_at
          ) VALUES (?, ?, ?, 'system', NOW())
        `, [
          input.chatId,
          ctx.user.id,
          'Chat settings updated',
        ]);
        
        console.log('✅ Chat settings updated successfully on Lightsail');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Update chat settings error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update chat settings on Lightsail',
        });
      }
    }),

  // Mute chat
  muteChat: protectedProcedure
    .input(z.object({
      chatId: z.string(),
      duration: z.enum(['1hour', '8hours', '1day', '1week', 'forever']).default('forever'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Muting chat on Lightsail:', input.chatId);
        
        // Check if user is a participant in this chat
        const isParticipant = await getOne(`
          SELECT 1 FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!isParticipant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat on Lightsail',
          });
        }
        
        // Calculate mute duration
        let mutedUntil = null;
        if (input.duration !== 'forever') {
          const now = new Date();
          switch (input.duration) {
            case '1hour':
              mutedUntil = new Date(now.getTime() + 60 * 60 * 1000);
              break;
            case '8hours':
              mutedUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000);
              break;
            case '1day':
              mutedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              break;
            case '1week':
              mutedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
          }
        }
        
        // Update participant mute status
        await executeQuery(`
          UPDATE chat_participants
          SET is_muted = 1, muted_until = ?
          WHERE chat_id = ? AND user_id = ?
        `, [mutedUntil, input.chatId, ctx.user.id]);
        
        console.log('✅ Chat muted successfully on Lightsail');
        
        return {
          success: true,
          mutedUntil: mutedUntil ? mutedUntil.getTime() : null,
        };
      } catch (error) {
        console.error('❌ Mute chat error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mute chat on Lightsail',
        });
      }
    }),

  // Unmute chat
  unmuteChat: protectedProcedure
    .input(z.object({
      chatId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Unmuting chat on Lightsail:', input.chatId);
        
        // Check if user is a participant in this chat
        const isParticipant = await getOne(`
          SELECT 1 FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!isParticipant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat on Lightsail',
          });
        }
        
        // Update participant mute status
        await executeQuery(`
          UPDATE chat_participants
          SET is_muted = 0, muted_until = NULL
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        console.log('✅ Chat unmuted successfully on Lightsail');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Unmute chat error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unmute chat on Lightsail',
        });
      }
    }),

  // Get chat mute status
  getChatMuteStatus: protectedProcedure
    .input(z.object({
      chatId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Getting chat mute status on Lightsail:', input.chatId);
        
        const participant = await getOne(`
          SELECT is_muted, muted_until FROM chat_participants
          WHERE chat_id = ? AND user_id = ?
        `, [input.chatId, ctx.user.id]);
        
        if (!participant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this chat on Lightsail',
          });
        }
        
        // Check if mute has expired
        let isMuted = participant.is_muted;
        if (isMuted && participant.muted_until) {
          const now = new Date();
          const mutedUntil = new Date(participant.muted_until);
          if (now > mutedUntil) {
            // Mute has expired, update database
            await executeQuery(`
              UPDATE chat_participants
              SET is_muted = 0, muted_until = NULL
              WHERE chat_id = ? AND user_id = ?
            `, [input.chatId, ctx.user.id]);
            isMuted = false;
          }
        }
        
        return {
          success: true,
          isMuted,
          mutedUntil: participant.muted_until ? new Date(participant.muted_until).getTime() : null,
        };
      } catch (error) {
        console.error('❌ Get chat mute status error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get chat mute status on Lightsail',
        });
      }
    }),
});