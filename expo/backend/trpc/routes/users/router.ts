import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { executeQuery, getOne, getMany } from '../../../database/connection';

export const usersRouter = router({
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('🔄 Fetching user profile from database:', ctx.user.id);
        
        const user = await getOne(`
          SELECT id, username, email, display_name, avatar, bio, 
                 yip_score, relationship_status, interests, zodiac_sign, 
                 pronouns, is_verified, is_admin, created_at, last_seen
          FROM users 
          WHERE id = ?
        `, [ctx.user.id]);
        
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
        
        const formattedUser = {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          avatar: user.avatar,
          bio: user.bio,
          yipScore: user.yip_score,
          relationshipStatus: user.relationship_status,
          interests: user.interests ? JSON.parse(user.interests) : [],
          zodiacSign: user.zodiac_sign,
          pronouns: user.pronouns,
          isVerified: user.is_verified === 1,
          isAdmin: user.is_admin === 1,
          createdAt: new Date(user.created_at).getTime(),
          lastSeen: user.last_seen ? new Date(user.last_seen).getTime() : null,
        };
        
        console.log('✅ User profile fetched successfully from database');
        
        return {
          success: true,
          user: formattedUser,
        };
      } catch (error) {
        console.error('❌ Error in getProfile:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user profile',
        });
      }
    }),

  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Searching users in database:', input.query);
        
        const searchTerm = `%${input.query}%`;
        
        const users = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, u.bio, 
                 u.yip_score, u.is_verified
          FROM users u
          WHERE u.id != ?
            AND (
              u.username LIKE ? OR 
              u.display_name LIKE ? OR
              u.email LIKE ?
            )
            AND u.id NOT IN (
              SELECT blocked_user_id FROM user_blocks 
              WHERE user_id = ?
            )
            AND u.id NOT IN (
              SELECT user_id FROM user_blocks 
              WHERE blocked_user_id = ?
            )
            AND u.is_banned = 0
          ORDER BY 
            CASE 
              WHEN u.username LIKE ? THEN 1
              WHEN u.display_name LIKE ? THEN 2
              ELSE 3
            END,
            u.yip_score DESC
          LIMIT ? OFFSET ?
        `, [
          ctx.user.id,
          searchTerm, searchTerm, searchTerm,
          ctx.user.id, ctx.user.id,
          `${input.query}%`, `${input.query}%`,
          input.limit, input.offset
        ]);
        
        const formattedUsers = users.map((user: any) => ({
          id: user.id.toString(),
          username: user.username,
          displayName: user.display_name,
          avatar: user.avatar,
          bio: user.bio,
          yipScore: user.yip_score,
          isVerified: user.is_verified === 1,
        }));
        
        console.log(`✅ Found ${formattedUsers.length} users from search`);
        
        return {
          success: true,
          users: formattedUsers,
        };
      } catch (error) {
        console.error('❌ Error in searchUsers:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search users',
        });
      }
    }),

  getNearbyUsers: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      maxDistance: z.number().default(5),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Fetching nearby users from database');
        
        // Get users within distance using Haversine formula
        const users = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, u.bio, 
                 u.yip_score, u.is_verified, ul.latitude, ul.longitude,
                 (6371 * acos(cos(radians(?)) * cos(radians(ul.latitude)) * 
                 cos(radians(ul.longitude) - radians(?)) + 
                 sin(radians(?)) * sin(radians(ul.latitude)))) AS distance
          FROM users u
          JOIN user_locations ul ON u.id = ul.user_id
          WHERE u.id != ? 
            AND ul.updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
          HAVING distance < ?
          ORDER BY distance ASC
          LIMIT 50
        `, [
          input.latitude, input.longitude, input.latitude,
          ctx.user.id, input.maxDistance
        ]);
        
        const formattedUsers = users.map((user: any) => ({
          id: user.id.toString(),
          username: user.username,
          displayName: user.display_name,
          avatar: user.avatar,
          bio: user.bio,
          yipScore: user.yip_score,
          isVerified: user.is_verified === 1,
          distance: parseFloat(user.distance.toFixed(2)),
        }));
        
        console.log(`✅ Found ${formattedUsers.length} nearby users from database`);
        
        return {
          success: true,
          users: formattedUsers,
        };
      } catch (error) {
        console.error('❌ Error in getNearbyUsers:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get nearby users',
        });
      }
    }),

  getQuickAdd: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Fetching quick add suggestions from database');
        
        const offset = (input.page - 1) * input.limit;
        
        // Get users that are not friends and not blocked
        const users = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, u.bio, 
                 u.yip_score, u.is_verified
          FROM users u
          WHERE u.id != ?
            AND u.id NOT IN (
              SELECT friend_id FROM friendships 
              WHERE user_id = ? AND status = 'accepted'
            )
            AND u.id NOT IN (
              SELECT user_id FROM friendships 
              WHERE friend_id = ? AND status = 'accepted'
            )
            AND u.id NOT IN (
              SELECT blocked_user_id FROM user_blocks 
              WHERE user_id = ?
            )
            AND u.id NOT IN (
              SELECT user_id FROM user_blocks 
              WHERE blocked_user_id = ?
            )
          ORDER BY u.created_at DESC
          LIMIT ? OFFSET ?
        `, [
          ctx.user.id, ctx.user.id, ctx.user.id,
          ctx.user.id, ctx.user.id,
          input.limit, offset
        ]);
        
        const formattedUsers = users.map((user: any) => ({
          id: user.id.toString(),
          username: user.username,
          displayName: user.display_name,
          avatar: user.avatar,
          bio: user.bio,
          yipScore: user.yip_score,
          isVerified: user.is_verified === 1,
        }));
        
        console.log(`✅ Found ${formattedUsers.length} quick add suggestions from database`);
        
        return {
          success: true,
          users: formattedUsers,
        };
      } catch (error) {
        console.error('❌ Error in getQuickAdd:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get quick add suggestions',
        });
      }
    }),

  getFriends: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('🔄 Fetching friends from database');
        
        const friends = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, u.bio, 
                 u.yip_score, u.is_verified, u.is_online, u.last_seen,
                 f.created_at as friendship_date
          FROM users u
          JOIN friendships f ON (
            (f.user_id = ? AND f.friend_id = u.id) OR
            (f.friend_id = ? AND f.user_id = u.id)
          )
          WHERE f.status = 'accepted'
            AND u.id != ?
          ORDER BY u.is_online DESC, u.last_seen DESC
        `, [ctx.user.id, ctx.user.id, ctx.user.id]);
        
        const formattedFriends = friends.map((friend: any) => ({
          id: friend.id.toString(),
          username: friend.username,
          displayName: friend.display_name,
          avatar: friend.avatar,
          bio: friend.bio,
          yipScore: friend.yip_score,
          isVerified: friend.is_verified === 1,
          isOnline: friend.is_online === 1,
          lastSeen: friend.last_seen ? new Date(friend.last_seen).getTime() : null,
          friendshipDate: new Date(friend.friendship_date).getTime(),
        }));
        
        console.log(`✅ Found ${formattedFriends.length} friends from database`);
        
        return {
          success: true,
          friends: formattedFriends,
        };
      } catch (error) {
        console.error('❌ Error in getFriends:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get friends',
        });
      }
    }),

  updateLocation: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Updating user location in database');
        
        await executeQuery(`
          INSERT INTO user_locations (user_id, latitude, longitude, updated_at)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE 
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            updated_at = NOW()
        `, [ctx.user.id, input.latitude, input.longitude]);
        
        console.log('✅ User location updated successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in updateLocation:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update location',
        });
      }
    }),

  isBlocked: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Checking if user is blocked in database');
        
        const block = await getOne(`
          SELECT id FROM user_blocks 
          WHERE user_id = ? AND blocked_user_id = ?
        `, [ctx.user.id, input.userId]);
        
        return {
          success: true,
          isBlocked: !!block,
        };
      } catch (error) {
        console.error('❌ Error in isBlocked:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check if user is blocked',
        });
      }
    }),

  sendFriendRequest: protectedProcedure
    .input(z.object({
      toUserId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Sending friend request in database');
        
        // Check if users are already friends or have pending request
        const existingFriendship = await getOne(`
          SELECT status FROM friendships 
          WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `, [ctx.user.id, input.toUserId, input.toUserId, ctx.user.id]);
        
        if (existingFriendship) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Friendship already exists or pending',
          });
        }
        
        // Check if user is blocked
        const isBlocked = await getOne(`
          SELECT id FROM user_blocks 
          WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)
        `, [ctx.user.id, input.toUserId, input.toUserId, ctx.user.id]);
        
        if (isBlocked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot send friend request to blocked user',
          });
        }
        
        // Send friend request
        await executeQuery(`
          INSERT INTO friendships (user_id, friend_id, status, created_at)
          VALUES (?, ?, 'pending', NOW())
        `, [ctx.user.id, input.toUserId]);
        
        console.log('✅ Friend request sent successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in sendFriendRequest:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send friend request',
        });
      }
    }),

  unsendFriendRequest: protectedProcedure
    .input(z.object({
      toUserId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Unsending friend request in database');
        
        const result = await executeQuery(`
          DELETE FROM friendships 
          WHERE user_id = ? AND friend_id = ? AND status = 'pending'
        `, [ctx.user.id, input.toUserId]) as any;
        
        if (result.affectedRows === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No pending friend request found',
          });
        }
        
        console.log('✅ Friend request unsent successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in unsendFriendRequest:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unsend friend request',
        });
      }
    }),

  removeFriend: protectedProcedure
    .input(z.object({
      friendId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Removing friend in database');
        
        const result = await executeQuery(`
          DELETE FROM friendships 
          WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
            AND status = 'accepted'
        `, [ctx.user.id, input.friendId, input.friendId, ctx.user.id]) as any;
        
        if (result.affectedRows === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Friendship not found',
          });
        }
        
        console.log('✅ Friend removed successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in removeFriend:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove friend',
        });
      }
    }),

  blockUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Blocking user in database');
        
        // Remove any existing friendship
        await executeQuery(`
          DELETE FROM friendships 
          WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `, [ctx.user.id, input.userId, input.userId, ctx.user.id]);
        
        // Block user
        await executeQuery(`
          INSERT INTO user_blocks (user_id, blocked_user_id, created_at)
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE created_at = NOW()
        `, [ctx.user.id, input.userId]);
        
        console.log('✅ User blocked successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in blockUser:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to block user',
        });
      }
    }),

  unblockUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Unblocking user in database');
        
        const result = await executeQuery(`
          DELETE FROM user_blocks 
          WHERE user_id = ? AND blocked_user_id = ?
        `, [ctx.user.id, input.userId]) as any;
        
        if (result.affectedRows === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User is not blocked',
          });
        }
        
        console.log('✅ User unblocked successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in unblockUser:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unblock user',
        });
      }
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      relationshipStatus: z.string().optional(),
      interests: z.array(z.string()).optional(),
      zodiacSign: z.string().optional(),
      pronouns: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Updating user profile in database');
        
        const updateFields = [];
        const updateValues = [];
        
        if (input.displayName !== undefined) {
          updateFields.push('display_name = ?');
          updateValues.push(input.displayName);
        }
        
        if (input.bio !== undefined) {
          updateFields.push('bio = ?');
          updateValues.push(input.bio);
        }
        
        if (input.avatar !== undefined) {
          updateFields.push('avatar = ?');
          updateValues.push(input.avatar);
        }
        
        if (input.relationshipStatus !== undefined) {
          updateFields.push('relationship_status = ?');
          updateValues.push(input.relationshipStatus);
        }
        
        if (input.interests !== undefined) {
          updateFields.push('interests = ?');
          updateValues.push(JSON.stringify(input.interests));
        }
        
        if (input.zodiacSign !== undefined) {
          updateFields.push('zodiac_sign = ?');
          updateValues.push(input.zodiacSign);
        }
        
        if (input.pronouns !== undefined) {
          updateFields.push('pronouns = ?');
          updateValues.push(input.pronouns);
        }
        
        if (updateFields.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No fields to update',
          });
        }
        
        updateFields.push('updated_at = NOW()');
        updateValues.push(ctx.user.id);
        
        await executeQuery(`
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);
        
        console.log('✅ User profile updated successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in updateProfile:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  // Admin-only endpoints
  reportUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Reporting user in database');
        
        await executeQuery(`
          INSERT INTO user_reports (reporter_id, reported_user_id, reason, note, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [ctx.user.id, input.userId, input.reason, input.note || null]);
        
        console.log('✅ User reported successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in reportUser:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to report user',
        });
      }
    }),

  banUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can ban users',
          });
        }
        
        console.log('🔄 Banning user in database');
        
        await executeQuery(`
          UPDATE users 
          SET is_banned = 1, ban_reason = ?, banned_at = NOW(), banned_by = ?
          WHERE id = ?
        `, [input.reason, ctx.user.id, input.userId]);
        
        console.log('✅ User banned successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in banUser:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to ban user',
        });
      }
    }),

  unbanUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can unban users',
          });
        }
        
        console.log('🔄 Unbanning user in database');
        
        await executeQuery(`
          UPDATE users 
          SET is_banned = 0, ban_reason = NULL, banned_at = NULL, banned_by = NULL
          WHERE id = ?
        `, [input.userId]);
        
        console.log('✅ User unbanned successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in unbanUser:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to unban user',
        });
      }
    }),

  getReports: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can view reports',
          });
        }
        
        console.log('🔄 Fetching user reports from database');
        
        const reports = await getMany(`
          SELECT r.*, 
                 reporter.username as reporter_username,
                 reporter.display_name as reporter_name,
                 reported.username as reported_username,
                 reported.display_name as reported_name
          FROM user_reports r
          JOIN users reporter ON r.reporter_id = reporter.id
          JOIN users reported ON r.reported_user_id = reported.id
          ORDER BY r.created_at DESC
        `);
        
        const formattedReports = reports.map((report: any) => ({
          id: report.id.toString(),
          reporter: {
            id: report.reporter_id.toString(),
            username: report.reporter_username,
            displayName: report.reporter_name,
          },
          reportedUser: {
            id: report.reported_user_id.toString(),
            username: report.reported_username,
            displayName: report.reported_name,
          },
          reason: report.reason,
          note: report.note,
          status: report.status,
          createdAt: new Date(report.created_at).getTime(),
        }));
        
        console.log(`✅ Found ${formattedReports.length} reports from database`);
        
        return {
          success: true,
          reports: formattedReports,
        };
      } catch (error) {
        console.error('❌ Error in getReports:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get reports',
        });
      }
    }),

  markReportAsReviewed: protectedProcedure
    .input(z.object({
      reportId: z.string(),
      action: z.enum(['none', 'warning', 'ban', 'suspend']),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can review reports',
          });
        }
        
        console.log('🔄 Marking report as reviewed in database');
        
        await executeQuery(`
          UPDATE user_reports 
          SET status = 'reviewed', action_taken = ?, reviewed_by = ?, reviewed_at = NOW()
          WHERE id = ?
        `, [input.action, ctx.user.id, input.reportId]);
        
        console.log('✅ Report marked as reviewed successfully in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in markReportAsReviewed:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to review report',
        });
      }
    }),
});