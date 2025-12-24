import { z } from 'zod';
import { protectedProcedure, router } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { executeQuery, getOne, getMany } from '../../../database/connection';

export const partiesRouter = router({
  // Get all parties
  getParties: protectedProcedure
    .input(z.object({
      upcoming: z.boolean().default(true),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Fetching parties from database');
        
        let query = `
          SELECT p.*, u.username, u.display_name, u.avatar, u.is_verified,
            (SELECT COUNT(*) FROM party_attendees pa WHERE pa.party_id = p.id AND pa.status = 'attending') as attendee_count,
            (SELECT status FROM party_attendees pa WHERE pa.party_id = p.id AND pa.user_id = ?) as user_status
          FROM parties p
          JOIN users u ON p.creator_id = u.id
          LEFT JOIN party_attendees pa_self ON pa_self.party_id = p.id AND pa_self.user_id = ?
        `;
        
        const params = [ctx.user.userId, ctx.user.userId];
        
        const whereClauses: string[] = [];
        if (input?.upcoming) {
          whereClauses.push(`p.date >= NOW()`);
        }
        // Enforce invite-only visibility: user must be creator or invited/attending
        whereClauses.push(`(p.creator_id = ? OR pa_self.user_id IS NOT NULL)`);
        params.push(ctx.user.userId);
        
        if (whereClauses.length > 0) {
          query += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        
        query += ` ORDER BY p.date ASC LIMIT ? OFFSET ?`;
        params.push(input?.limit || 20, input?.offset || 0);
        
        const parties = await getMany(query, params);
        
        // Format parties
        const formattedParties = parties.map((party: any) => ({
          id: party.id.toString(),
          title: party.title,
          description: party.description,
          location: party.location,
          date: new Date(party.date).getTime(),
          maxAttendees: party.max_attendees,
          emoji: party.emoji,
          creator: {
            id: party.creator_id.toString(),
            username: party.username,
            displayName: party.display_name,
            avatar: party.avatar,
            isVerified: party.is_verified,
          },
          attendeeCount: party.attendee_count,
          userStatus: party.user_status || 'not_attending',
          isCreator: party.creator_id.toString() === ctx.user.userId.toString(),
        }));
        
        console.log(`✅ Found ${formattedParties.length} parties in database`);
        
        return {
          success: true,
          parties: formattedParties,
        };
      } catch (error) {
        console.error('❌ Get parties error in database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch parties',
        });
      }
    }),
  
  // Get user's parties (created by user)
  getUserParties: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('🔄 Fetching user created parties from database');
        
        const parties = await getMany(`
          SELECT p.*, u.username, u.display_name, u.avatar, u.is_verified,
            (SELECT COUNT(*) FROM party_attendees pa WHERE pa.party_id = p.id AND pa.status = 'attending') as attendee_count
          FROM parties p
          JOIN users u ON p.creator_id = u.id
          WHERE p.creator_id = ?
          ORDER BY p.date DESC
        `, [ctx.user.userId]);
        
        const formattedParties = parties.map((party: any) => ({
          id: party.id.toString(),
          title: party.title,
          description: party.description,
          location: party.location,
          date: new Date(party.date).getTime(),
          maxAttendees: party.max_attendees,
          emoji: party.emoji,
          creator: {
            id: party.creator_id.toString(),
            username: party.username,
            displayName: party.display_name,
            avatar: party.avatar,
            isVerified: party.is_verified,
          },
          attendeeCount: party.attendee_count,
          userStatus: 'attending',
          isCreator: true,
        }));
        
        return {
          success: true,
          parties: formattedParties,
        };
      } catch (error) {
        console.error('❌ Get user parties error in database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user parties',
        });
      }
    }),

  // Get parties user is invited to or attending
  getInvitedParties: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('🔄 Fetching invited parties from database');
        
        const parties = await getMany(`
          SELECT p.*, u.username, u.display_name, u.avatar, u.is_verified,
            pa.status as user_status,
            (SELECT COUNT(*) FROM party_attendees pa2 WHERE pa2.party_id = p.id AND pa2.status = 'attending') as attendee_count
          FROM parties p
          JOIN users u ON p.creator_id = u.id
          JOIN party_attendees pa ON p.id = pa.party_id
          WHERE pa.user_id = ? AND pa.status IN ('invited', 'attending', 'maybe')
          ORDER BY p.date ASC
        `, [ctx.user.userId]);
        
        const formattedParties = parties.map((party: any) => ({
          id: party.id.toString(),
          title: party.title,
          description: party.description,
          location: party.location,
          date: new Date(party.date).getTime(),
          maxAttendees: party.max_attendees,
          emoji: party.emoji,
          creator: {
            id: party.creator_id.toString(),
            username: party.username,
            displayName: party.display_name,
            avatar: party.avatar,
            isVerified: party.is_verified,
          },
          attendeeCount: party.attendee_count,
          userStatus: party.user_status,
          isCreator: party.creator_id.toString() === ctx.user.userId.toString(),
        }));
        
        return {
          success: true,
          parties: formattedParties,
        };
      } catch (error) {
        console.error('❌ Get invited parties error in database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch invited parties',
        });
      }
    }),
  
  // Get party by ID
  getParty: protectedProcedure
    .input(z.object({
      partyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Fetching party from database:', input.partyId);
        
        const party = await getOne(`
          SELECT p.*, u.username, u.display_name, u.avatar, u.is_verified,
            (SELECT status FROM party_attendees pa WHERE pa.party_id = p.id AND pa.user_id = ?) as user_status
          FROM parties p
          JOIN users u ON p.creator_id = u.id
          WHERE p.id = ?
        `, [ctx.user.userId, input.partyId]);
        
        if (!party) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Party not found',
          });
        }
        
        // Get attendees
        const attendees = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, u.is_verified, pa.status, pa.joined_at
          FROM party_attendees pa
          JOIN users u ON pa.user_id = u.id
          WHERE pa.party_id = ?
          ORDER BY pa.joined_at ASC
        `, [input.partyId]);
        
        // Format attendees
        const formattedAttendees = attendees.map((attendee: any) => ({
          id: attendee.id.toString(),
          username: attendee.username,
          displayName: attendee.display_name,
          avatar: attendee.avatar,
          isVerified: attendee.is_verified,
          status: attendee.status,
          joinedAt: new Date(attendee.joined_at).getTime(),
        }));
        
        // Format party
        const formattedParty = {
          id: party.id.toString(),
          title: party.title,
          description: party.description,
          location: party.location,
          date: new Date(party.date).getTime(),
          maxAttendees: party.max_attendees,
          emoji: party.emoji,
          creator: {
            id: party.creator_id.toString(),
            username: party.username,
            displayName: party.display_name,
            avatar: party.avatar,
            isVerified: party.is_verified,
          },
          attendees: formattedAttendees,
          userStatus: party.user_status || 'not_attending',
          isCreator: party.creator_id.toString() === ctx.user.userId.toString(),
          createdAt: new Date(party.created_at).getTime(),
        };
        
        console.log('✅ Party fetched successfully from database');
        
        return {
          success: true,
          party: formattedParty,
        };
      } catch (error) {
        console.error('❌ Get party error in database:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch party',
        });
      }
    }),
  
  // Create party
  createParty: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      location: z.string(),
      date: z.number(), // timestamp
      maxAttendees: z.number().optional(),
      emoji: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Creating party in database');
        
        // Convert timestamp to MySQL datetime
        const partyDate = new Date(input.date);
        
        // Create party
        const result = await executeQuery(`
          INSERT INTO parties (
            title, description, location, date, max_attendees, emoji, creator_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          input.title,
          input.description || null,
          input.location,
          partyDate,
          input.maxAttendees || null,
          input.emoji || null,
          ctx.user.userId,
        ]) as any;
        
        const partyId = result.insertId;
        
        // Add creator as attendee
        await executeQuery(`
          INSERT INTO party_attendees (party_id, user_id, status, joined_at)
          VALUES (?, ?, 'attending', NOW())
        `, [partyId, ctx.user.userId]);
        
        console.log('✅ Party created successfully in database with ID:', partyId);
        
        return {
          success: true,
          partyId: partyId.toString(),
        };
      } catch (error) {
        console.error('❌ Create party error in database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create party',
        });
      }
    }),
  
  // Update party
  updateParty: protectedProcedure
    .input(z.object({
      partyId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      date: z.number().optional(), // timestamp
      maxAttendees: z.number().optional(),
      emoji: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Updating party in database:', input.partyId);
        
        // Check if user is the creator
        const party = await getOne(`
          SELECT creator_id FROM parties WHERE id = ?
        `, [input.partyId]);
        
        if (!party) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Party not found',
          });
        }
        
        if (party.creator_id.toString() !== ctx.user.userId.toString()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the party creator can update the party',
          });
        }
        
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        
        if (input.title !== undefined) {
          updateFields.push('title = ?');
          updateValues.push(input.title);
        }
        
        if (input.description !== undefined) {
          updateFields.push('description = ?');
          updateValues.push(input.description);
        }
        
        if (input.location !== undefined) {
          updateFields.push('location = ?');
          updateValues.push(input.location);
        }
        
        if (input.date !== undefined) {
          updateFields.push('date = ?');
          updateValues.push(new Date(input.date));
        }
        
        if (input.maxAttendees !== undefined) {
          updateFields.push('max_attendees = ?');
          updateValues.push(input.maxAttendees);
        }
        
        if (input.emoji !== undefined) {
          updateFields.push('emoji = ?');
          updateValues.push(input.emoji);
        }
        
        if (updateFields.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No fields to update',
          });
        }
        
        updateFields.push('updated_at = NOW()');
        updateValues.push(input.partyId);
        
        await executeQuery(`
          UPDATE parties 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);
        
        console.log('✅ Party updated successfully in database');
        
        return {
          success: true,
          message: 'Party updated successfully',
        };
      } catch (error) {
        console.error('❌ Update party error in database:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update party',
        });
      }
    }),
  
  // Delete party
  deleteParty: protectedProcedure
    .input(z.object({
      partyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Deleting party in database:', input.partyId);
        
        // Check if user is the creator
        const party = await getOne(`
          SELECT creator_id FROM parties WHERE id = ?
        `, [input.partyId]);
        
        if (!party) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Party not found',
          });
        }
        
        if (party.creator_id.toString() !== ctx.user.userId.toString()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the party creator can delete the party',
          });
        }
        
        // Delete party attendees first (foreign key constraint)
        await executeQuery(`
          DELETE FROM party_attendees WHERE party_id = ?
        `, [input.partyId]);
        
        // Delete party
        await executeQuery(`
          DELETE FROM parties WHERE id = ?
        `, [input.partyId]);
        
        console.log('✅ Party deleted successfully in database');
        
        return {
          success: true,
          message: 'Party deleted successfully',
        };
      } catch (error) {
        console.error('❌ Delete party error in database:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete party',
        });
      }
    }),
  
  // RSVP to party
  rsvpToParty: protectedProcedure
    .input(z.object({
      partyId: z.string(),
      status: z.enum(['attending', 'maybe', 'not_attending']),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 RSVPing to party in database:', input.partyId);
        
        // Check if party exists
        const party = await getOne(`
          SELECT id, max_attendees FROM parties WHERE id = ?
        `, [input.partyId]);
        
        if (!party) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Party not found',
          });
        }
        
        // Check if party is full (if max_attendees is set)
        if (party.max_attendees && input.status === 'attending') {
          const currentAttendees = await getOne(`
            SELECT COUNT(*) as count 
            FROM party_attendees 
            WHERE party_id = ? AND status = 'attending'
          `, [input.partyId]);
          
          if (currentAttendees.count >= party.max_attendees) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Party is full',
            });
          }
        }
        
        // Update or insert RSVP
        await executeQuery(`
          INSERT INTO party_attendees (party_id, user_id, status, joined_at)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE 
            status = VALUES(status),
            joined_at = IF(status != VALUES(status), NOW(), joined_at)
        `, [input.partyId, ctx.user.userId, input.status]);
        
        console.log('✅ RSVP updated successfully in database');
        
        return {
          success: true,
          message: 'RSVP updated successfully',
        };
      } catch (error) {
        console.error('❌ RSVP error in database:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to RSVP to party',
        });
      }
    }),

  // Invite user to party
  inviteToParty: protectedProcedure
    .input(z.object({
      partyId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Inviting user to party in database:', input.partyId);
        
        // Check if user is the creator or has permission to invite
        const party = await getOne(`
          SELECT creator_id FROM parties WHERE id = ?
        `, [input.partyId]);
        
        if (!party) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Party not found',
          });
        }
        
        if (party.creator_id.toString() !== ctx.user.userId.toString()) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the party creator can invite users',
          });
        }
        
        // Check if user is already invited or attending
        const existingAttendee = await getOne(`
          SELECT status FROM party_attendees 
          WHERE party_id = ? AND user_id = ?
        `, [input.partyId, input.userId]);
        
        if (existingAttendee) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already invited or attending this party',
          });
        }
        
        // Add invitation
        await executeQuery(`
          INSERT INTO party_attendees (party_id, user_id, status, joined_at)
          VALUES (?, ?, 'invited', NOW())
        `, [input.partyId, input.userId]);
        
        console.log('✅ User invited to party successfully in database');
        
        return {
          success: true,
          message: 'User invited successfully',
        };
      } catch (error) {
        console.error('❌ Invite to party error in database:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invite user to party',
        });
      }
    }),
});