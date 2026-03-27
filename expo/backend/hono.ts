import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './trpc/app-router';
import { createContext } from './trpc/create-context';

// Enhanced logging function for PM2 and production
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [HONO] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

const app = new Hono();

// Production-ready CORS configuration
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://your-domain.com', // Replace with your actual domain
      'http://your-lightsail-ip:3000', // Replace with your Lightsail IP
      'exp://192.168.1.100:8081', // Replace with your development IP for Expo
    ]
  : '*'; // Allow all origins in development

app.use('*', cors({
  origin: corsOrigins,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
}));

// Health check endpoint with detailed info
app.get('/health', (c) => {
  log('info', 'Health check requested');
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    version: '1.0.0',
  };
  
  return c.json(healthData);
});

// Root endpoint
app.get('/', (c) => {
  log('info', 'Root endpoint accessed');
  return c.json({ 
    message: 'YipYap Backend API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      trpc: '/api/trpc',
    },
    features: [
      'Stories with 24h expiration',
      'Friend-only story viewing',
      'Party invitations and RSVPs',
      'Real-time chat messaging',
      'User authentication',
      'School communities',
    ]
  });
});

// TRPC handler with enhanced logging and error handling
app.use('/api/trpc/*', async (c) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const method = c.req.method;
  const path = c.req.path;
  const startTime = Date.now();
  
  log('info', 'TRPC request received', { 
    requestId, 
    method, 
    path,
    userAgent: c.req.header('user-agent'),
    origin: c.req.header('origin'),
    contentType: c.req.header('content-type')
  });

  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: c.req.raw,
      router: appRouter,
      createContext: (opts: any) => createContext(opts, c, requestId),
      onError: ({ error, path, input }: { error: any; path: any; input: any }) => {
        log('error', 'TRPC procedure error', {
          requestId,
          path,
          error: error.message,
          code: error.code,
          input: input ? JSON.stringify(input).substring(0, 200) : undefined,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      },
    });

    const duration = Date.now() - startTime;
    log('info', 'TRPC request completed', { 
      requestId, 
      status: response.status,
      path,
      duration: `${duration}ms`
    });

    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log('error', 'TRPC handler error', {
      requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path,
      duration: `${duration}ms`
    });
    
    return c.json({ 
      error: 'Internal server error',
      requestId,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }, 500);
  }
});

// API status endpoint
app.get('/api/status', (c) => {
  return c.json({
    api: 'YipYap Backend',
    status: 'operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      stories: 'enabled',
      parties: 'enabled',
      chats: 'enabled',
      authentication: 'enabled',
      schools: 'enabled',
    },
    uptime: process.uptime(),
  });
});

// Catch-all for unmatched routes
app.notFound((c) => {
  log('warn', '404 - Route not found', { 
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('user-agent')
  });
  
  return c.json({ 
    error: 'Route not found',
    path: c.req.path,
    method: c.req.method,
    availableEndpoints: ['/health', '/api/trpc', '/api/status'],
    message: 'Please check the API documentation for available endpoints'
  }, 404);
});

// Global error handler
app.onError((err, c) => {
  log('error', 'Global error handler', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: c.req.path,
    method: c.req.method
  });
  
  return c.json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  }, 500);
});

// Log server startup
log('info', 'YipYap Backend Server initialized', {
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform
});

export default app;