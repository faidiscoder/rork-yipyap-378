import { initTRPC, TRPCError } from '@trpc/server';
import { TRPCContext } from './create-context';
import superjson from 'superjson';

// Enhanced logging function
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  
  // Force immediate output to ensure PM2 captures it
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(logEntry));
  
  // Also write directly to stdout to ensure PM2 captures it
  process.stdout.write(JSON.stringify(logEntry) + '\n');
}

// Initialize tRPC with superjson transformer
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    log('error', 'TRPC error', { 
      code: error.code, 
      message: error.message,
      stack: error.stack
    });
    return {
      ...shape,
      message: error.message,
      code: error.code,
    };
  },
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  log('info', 'Auth middleware - Checking user:', { 
    userPresent: ctx.user ? true : false,
    url: ctx.req?.url
  });
  
  if (!ctx.user) {
    log('warn', 'Auth middleware - UNAUTHORIZED: No user in context', {
      url: ctx.req?.url
    });
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }
  
  log('info', 'Auth middleware - User authenticated:', { 
    username: ctx.user.username,
    userId: ctx.user.id
  });
  
  return next({
    ctx: {
      user: ctx.user,
      // You can add more user data here if needed
      userId: ctx.user.id,
    },
  });
});

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(isAuthed);