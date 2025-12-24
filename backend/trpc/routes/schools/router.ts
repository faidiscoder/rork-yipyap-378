import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { executeQuery, getOne, getMany } from '../../../database/connection';

export const schoolsRouter = router({
  // Get all schools
  getAllSchools: publicProcedure
    .input(z.object({
      userLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      try {
        console.log('🔄 Fetching all schools from database');
        
        // Get schools from database
        const schools = await getMany(`
          SELECT id, name, address, city, state, zip_code, 
                 latitude, longitude, school_type, student_count,
                 created_at
          FROM schools 
          ORDER BY name ASC
          LIMIT ? OFFSET ?
        `, [input?.limit || 50, input?.offset || 0]);
        
        // Format schools for frontend
        const formattedSchools = schools.map((school: any) => {
          let distance;
          if (input?.userLocation && school.latitude && school.longitude) {
            distance = calculateDistance(
              input.userLocation.latitude,
              input.userLocation.longitude,
              school.latitude,
              school.longitude
            );
          }
          
          return {
            id: school.id.toString(),
            name: school.name,
            city: school.city,
            state: school.state,
            type: school.school_type,
            location: {
              address: school.address,
              city: school.city,
              state: school.state,
              zipCode: school.zip_code,
              latitude: school.latitude,
              longitude: school.longitude
            },
            studentCount: school.student_count,
            distance,
            createdAt: new Date(school.created_at).getTime()
          };
        });
        
        // Sort by distance if available
        if (input?.userLocation) {
          formattedSchools.sort((a, b) => {
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            return 0;
          });
        }
        
        console.log(`✅ Returning ${formattedSchools.length} schools from database`);
        return formattedSchools;
      } catch (error) {
        console.error('❌ Error fetching schools from database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch schools',
        });
      }
    }),
  
  // Get school count
  getSchoolCount: publicProcedure
    .query(async () => {
      try {
        console.log('🔄 Getting school count from database');
        const result = await getOne('SELECT COUNT(*) as count FROM schools');
        return { count: result?.count || 0, success: true };
      } catch (error) {
        console.error('❌ Error getting school count from database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get school count',
        });
      }
    }),
  
  // Get school by ID
  getSchool: publicProcedure
    .input(z.object({
      schoolId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        console.log('🔄 Fetching school from database:', input.schoolId);
        
        const school = await getOne(`
          SELECT id, name, address, city, state, zip_code, 
                 latitude, longitude, school_type, student_count,
                 created_at
          FROM schools 
          WHERE id = ?
        `, [input.schoolId]);
        
        if (!school) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'School not found',
          });
        }
        
        const formattedSchool = {
          id: school.id.toString(),
          name: school.name,
          city: school.city,
          state: school.state,
          type: school.school_type,
          location: {
            address: school.address,
            city: school.city,
            state: school.state,
            zipCode: school.zip_code,
            latitude: school.latitude,
            longitude: school.longitude
          },
          studentCount: school.student_count,
          createdAt: new Date(school.created_at).getTime()
        };
        
        console.log('✅ School fetched successfully from database');
        
        return {
          success: true,
          school: formattedSchool,
        };
      } catch (error) {
        console.error('❌ Get school error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch school',
        });
      }
    }),
  
  // Get school students
  getSchoolStudents: publicProcedure
    .input(z.object({
      schoolId: z.string(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      try {
        console.log('🔄 Fetching school students from database for school:', input.schoolId);
        
        const students = await getMany(`
          SELECT u.id, u.username, u.display_name, u.avatar, u.bio,
                 u.yip_score, u.created_at
          FROM users u
          JOIN user_schools us ON u.id = us.user_id
          WHERE us.school_id = ?
          ORDER BY u.created_at DESC
          LIMIT ? OFFSET ?
        `, [input.schoolId, input.limit, input.offset]);
        
        const formattedStudents = students.map((student: any) => ({
          id: student.id.toString(),
          username: student.username,
          displayName: student.display_name,
          avatar: student.avatar,
          bio: student.bio,
          yipScore: student.yip_score,
          schoolId: input.schoolId,
          createdAt: new Date(student.created_at).getTime()
        }));
        
        console.log(`✅ Found ${formattedStudents.length} students for school from database`);
        
        return {
          success: true,
          students: formattedStudents,
        };
      } catch (error) {
        console.error('❌ Get school students error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch school students',
        });
      }
    }),
  
  // Join school
  joinSchool: protectedProcedure
    .input(z.object({
      schoolId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Joining school in database:', input.schoolId);
        
        // Check if school exists
        const school = await getOne('SELECT id FROM schools WHERE id = ?', [input.schoolId]);
        
        if (!school) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'School not found',
          });
        }
        
        // Check if user is already in this school
        const existingMembership = await getOne(`
          SELECT id FROM user_schools 
          WHERE user_id = ? AND school_id = ?
        `, [ctx.user.id, input.schoolId]);
        
        if (existingMembership) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already a member of this school',
          });
        }
        
        // Add user to school
        await executeQuery(`
          INSERT INTO user_schools (user_id, school_id, joined_at)
          VALUES (?, ?, NOW())
        `, [ctx.user.id, input.schoolId]);
        
        console.log('✅ Joined school successfully in database');
        
        return {
          success: true,
          message: 'Joined school successfully',
        };
      } catch (error) {
        console.error('❌ Join school error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to join school',
        });
      }
    }),
  
  // Leave school
  leaveSchool: protectedProcedure
    .input(z.object({
      schoolId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('🔄 Leaving school in database:', input.schoolId);
        
        // Remove user from school
        const result = await executeQuery(`
          DELETE FROM user_schools 
          WHERE user_id = ? AND school_id = ?
        `, [ctx.user.id, input.schoolId]) as any;
        
        if (result.affectedRows === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Not a member of this school',
          });
        }
        
        console.log('✅ Left school successfully in database');
        
        return {
          success: true,
          message: 'Left school successfully',
        };
      } catch (error) {
        console.error('❌ Leave school error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to leave school',
        });
      }
    }),
    
  // Search schools
  searchSchools: publicProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      try {
        console.log('🔄 Searching schools in database with query:', input.query);
        
        const schools = await getMany(`
          SELECT id, name, address, city, state, zip_code, 
                 latitude, longitude, school_type, student_count,
                 created_at
          FROM schools 
          WHERE name LIKE ? OR city LIKE ? OR state LIKE ?
          ORDER BY name ASC
          LIMIT ? OFFSET ?
        `, [
          `%${input.query}%`,
          `%${input.query}%`, 
          `%${input.query}%`,
          input.limit,
          input.offset
        ]);
        
        const formattedSchools = schools.map((school: any) => ({
          id: school.id.toString(),
          name: school.name,
          city: school.city,
          state: school.state,
          type: school.school_type,
          location: {
            address: school.address,
            city: school.city,
            state: school.state,
            zipCode: school.zip_code,
            latitude: school.latitude,
            longitude: school.longitude
          },
          studentCount: school.student_count,
          createdAt: new Date(school.created_at).getTime()
        }));
        
        // Get total count for pagination
        const countResult = await getOne(`
          SELECT COUNT(*) as total
          FROM schools 
          WHERE name LIKE ? OR city LIKE ? OR state LIKE ?
        `, [`%${input.query}%`, `%${input.query}%`, `%${input.query}%`]);
        
        console.log(`✅ Found ${formattedSchools.length} schools matching query in database`);
        
        return {
          success: true,
          schools: formattedSchools,
          total: countResult?.total || 0,
        };
      } catch (error) {
        console.error('❌ Search schools error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search schools',
        });
      }
    }),

  // Get or create school chat
  getSchoolChat: protectedProcedure
    .input(z.object({
      schoolId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('🔄 Getting school chat on Lightsail for school:', input.schoolId);
        
        // Check if user is a member of this school
        const membership = await getOne(`
          SELECT 1 FROM user_schools
          WHERE user_id = ? AND school_id = ?
        `, [ctx.user.id, input.schoolId]);
        
        if (!membership) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You must be a member of this school to access its chat',
          });
        }
        
        // Check if school chat already exists
        let schoolChat = await getOne(`
          SELECT id FROM chats
          WHERE type = 'school' AND school_id = ?
        `, [input.schoolId]);
        
        if (!schoolChat) {
          // Create school chat
          const school = await getOne('SELECT name FROM schools WHERE id = ?', [input.schoolId]);
          const chatName = `${school?.name || 'School'} Chat`;
          
          const result = await executeQuery(`
            INSERT INTO chats (name, type, created_by, school_id, created_at)
            VALUES (?, 'school', ?, ?, NOW())
          `, [chatName, ctx.user.id, input.schoolId]) as any;
          
          const chatId = result.insertId;
          
          // Add all school members as participants
          const schoolMembers = await getMany(`
            SELECT user_id FROM user_schools WHERE school_id = ?
          `, [input.schoolId]);
          
          for (const member of schoolMembers) {
            await executeQuery(`
              INSERT INTO chat_participants (chat_id, user_id, joined_at)
              VALUES (?, ?, NOW())
            `, [chatId, member.user_id]);
          }
          
          // Add system message
          const messageResult = await executeQuery(`
            INSERT INTO messages (
              chat_id, sender_id, content, type, created_at
            ) VALUES (?, ?, ?, 'system', NOW())
          `, [
            chatId,
            ctx.user.id,
            `Welcome to ${chatName}!`,
          ]) as any;
          
          // Update chat's last message
          await executeQuery(`
            UPDATE chats SET last_message_id = ?, updated_at = NOW()
            WHERE id = ?
          `, [messageResult.insertId, chatId]);
          
          schoolChat = { id: chatId };
        } else {
          // Check if user is already a participant
          const isParticipant = await getOne(`
            SELECT 1 FROM chat_participants
            WHERE chat_id = ? AND user_id = ?
          `, [schoolChat.id, ctx.user.id]);
          
          if (!isParticipant) {
            // Add user as participant
            await executeQuery(`
              INSERT INTO chat_participants (chat_id, user_id, joined_at)
              VALUES (?, ?, NOW())
            `, [schoolChat.id, ctx.user.id]);
          }
        }
        
        console.log('✅ School chat retrieved successfully on Lightsail');
        
        return {
          success: true,
          chatId: schoolChat.id.toString(),
        };
      } catch (error) {
        console.error('❌ Get school chat error on Lightsail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get school chat on Lightsail',
        });
      }
    }),

  // Get user's schools
  getUserSchools: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('🔄 Getting user schools on Lightsail for user:', ctx.user.id);
        
        const userSchools = await getMany(`
          SELECT s.id, s.name, s.city, s.state, s.school_type, s.student_count,
                 us.joined_at
          FROM schools s
          JOIN user_schools us ON s.id = us.school_id
          WHERE us.user_id = ?
          ORDER BY us.joined_at DESC
        `, [ctx.user.id]);
        
        const formattedSchools = userSchools.map((school: any) => ({
          id: school.id.toString(),
          name: school.name,
          city: school.city,
          state: school.state,
          type: school.school_type,
          studentCount: school.student_count,
          joinedAt: new Date(school.joined_at).getTime(),
        }));
        
        console.log(`✅ Found ${formattedSchools.length} schools for user on Lightsail`);
        
        return {
          success: true,
          schools: formattedSchools,
        };
      } catch (error) {
        console.error('❌ Get user schools error on Lightsail:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user schools on Lightsail',
        });
      }
    }),
});

// Helper function to calculate distance between two coordinates in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return parseFloat(distance.toFixed(3)); // Round to 3 decimal places
}