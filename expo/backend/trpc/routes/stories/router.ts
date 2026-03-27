import { z } from 'zod';
import { protectedProcedure, router } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { executeQuery, getOne, getMany } from '../../../database/connection';

export const storiesRouter = router({
  // Get all stories from friends
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('🔄 Fetching all stories from database for user:', ctx.user.id);
        
        // Get stories from friends and user's own stories
        const stories = await getMany(`
          SELECT s.*, u.username, u.display_name, u.avatar, u.is_verified,
                 (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id) as view_count,
                 (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = ?) as is_viewed
          FROM stories s
          JOIN users u ON s.user_id = u.id
          WHERE s.expires_at > NOW() 
            AND s.is_public = 1
            AND (
              s.user_id = ? OR
              s.user_id IN (
                SELECT friend_id FROM friendships 
                WHERE user_id = ? AND status = 'accepted'
                UNION
                SELECT user_id FROM friendships 
                WHERE friend_id = ? AND status = 'accepted'
              )
            )
          ORDER BY s.created_at DESC
        `, [ctx.user.id, ctx.user.id, ctx.user.id, ctx.user.id]);
        
        console.log(`Found ${stories.length} stories from database`);
        
        // Group stories by user
        const storyGroups: any[] = [];
        const userStoryMap = new Map();
        
        stories.forEach((story: any) => {
          const userId = story.user_id.toString();
          
          if (!userStoryMap.has(userId)) {
            userStoryMap.set(userId, {
              user: {
                id: userId,
                username: story.username,
                name: story.display_name || story.username,
                avatar: story.avatar || '',
              },
              stories: []
            });
            storyGroups.push(userStoryMap.get(userId));
          }
          
          userStoryMap.get(userId).stories.push({
            id: story.id.toString(),
            userId: userId,
            imageUrl: story.image_url,
            caption: story.caption || '',
            createdAt: new Date(story.created_at).getTime(),
            expiresAt: new Date(story.expires_at).getTime(),
            isPublic: story.is_public === 1,
            viewCount: story.view_count,
            isViewed: story.is_viewed > 0,
          });
        });
        
        // Sort story groups - current user first, then by most recent story
        storyGroups.sort((a, b) => {
          // Current user's stories always come first
          if (a.user.id === ctx.user.id.toString()) return -1;
          if (b.user.id === ctx.user.id.toString()) return 1;
          
          // Sort others by most recent story
          const aLatest = Math.max(...a.stories.map((s: any) => s.createdAt));
          const bLatest = Math.max(...b.stories.map((s: any) => s.createdAt));
          return bLatest - aLatest;
        });
        
        console.log(`✅ Found ${storyGroups.length} story groups from database`);
        
        return {
          success: true,
          storyGroups,
        };
      } catch (error) {
        console.error('❌ Error in getAll stories:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch stories',
        });
      }
    }),

  // Create a new story
  createStory: protectedProcedure
    .input(z.object({
      imageUrl: z.string(),
      caption: z.string().optional(),
      isPublic: z.boolean().default(true),
      expiresInHours: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Creating story in database');
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);
        
        const result = await executeQuery(`
          INSERT INTO stories (user_id, image_url, caption, is_public, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [
          ctx.user.id,
          input.imageUrl,
          input.caption || null,
          input.isPublic ? 1 : 0,
          expiresAt,
        ]) as any;
        
        const storyId = result.insertId;
        
        console.log('✅ Story created successfully in database with ID:', storyId);
        
        return {
          success: true,
          storyId: storyId.toString(),
        };
      } catch (error) {
        console.error('❌ Error in createStory:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create story',
        });
      }
    }),

  // View a story (mark as viewed)
  viewStory: protectedProcedure
    .input(z.object({
      storyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Marking story as viewed in database');
        
        // Check if story exists and is not expired
        const story = await getOne(`
          SELECT id, user_id FROM stories 
          WHERE id = ? AND expires_at > NOW()
        `, [input.storyId]);
        
        if (!story) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Story not found or expired',
          });
        }
        
        // Don't track views for own stories
        if (story.user_id.toString() === ctx.user.id.toString()) {
          return { success: true };
        }
        
        // Insert view record (ignore if already exists)
        await executeQuery(`
          INSERT IGNORE INTO story_views (story_id, viewer_id, viewed_at)
          VALUES (?, ?, NOW())
        `, [input.storyId, ctx.user.id]);
        
        console.log('✅ Story marked as viewed in database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in viewStory:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to view story',
        });
      }
    }),

  // Delete a story
  deleteStory: protectedProcedure
    .input(z.object({
      storyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Deleting story from database');
        
        // Check if user owns the story
        const story = await getOne(`
          SELECT user_id FROM stories WHERE id = ?
        `, [input.storyId]);
        
        if (!story) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Story not found',
          });
        }
        
        if (story.user_id.toString() !== ctx.user.id.toString()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own stories',
          });
        }
        
        // Delete story views first (foreign key constraint)
        await executeQuery(`
          DELETE FROM story_views WHERE story_id = ?
        `, [input.storyId]);
        
        // Delete story
        await executeQuery(`
          DELETE FROM stories WHERE id = ?
        `, [input.storyId]);
        
        console.log('✅ Story deleted successfully from database');
        
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in deleteStory:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete story',
        });
      }
    }),

  // Get story viewers (for own stories)
  getStoryViewers: protectedProcedure
    .input(z.object({
      storyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Fetching story viewers from database');
        
        // Check if user owns the story
        const story = await getOne(`
          SELECT user_id FROM stories WHERE id = ?
        `, [input.storyId]);
        
        if (!story) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Story not found',
          });
        }
        
        if (story.user_id.toString() !== ctx.user.id.toString()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view viewers of your own stories',
          });
        }
        
        // Get viewers
        const viewers = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, sv.viewed_at
          FROM story_views sv
          JOIN users u ON sv.viewer_id = u.id
          WHERE sv.story_id = ?
          ORDER BY sv.viewed_at DESC
        `, [input.storyId]);
        
        const formattedViewers = viewers.map((viewer: any) => ({
          id: viewer.id.toString(),
          username: viewer.username,
          displayName: viewer.display_name,
          avatar: viewer.avatar,
          viewedAt: new Date(viewer.viewed_at).getTime(),
        }));
        
        console.log(`✅ Found ${formattedViewers.length} story viewers from database`);
        
        return {
          success: true,
          viewers: formattedViewers,
        };
      } catch (error) {
        console.error('❌ Error in getStoryViewers:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get story viewers',
        });
      }
    }),

  // Clean up expired stories (should be called by a cron job)
  cleanupExpiredStories: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        console.log('🔄 Cleaning up expired stories from database');
        
        // Only allow admins to run cleanup
        if (!ctx.user?.isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can run cleanup',
          });
        }
        
        // Delete views for expired stories first
        await executeQuery(`
          DELETE sv FROM story_views sv
          JOIN stories s ON sv.story_id = s.id
          WHERE s.expires_at <= NOW()
        `);
        
        // Delete expired stories
        const result = await executeQuery(`
          DELETE FROM stories WHERE expires_at <= NOW()
        `) as any;
        
        console.log(`✅ Cleaned up ${result.affectedRows} expired stories from database`);
        
        return {
          success: true,
          deletedCount: result.affectedRows,
        };
      } catch (error) {
        console.error('❌ Error in cleanupExpiredStories:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cleanup expired stories',
        });
      }
    }),
});