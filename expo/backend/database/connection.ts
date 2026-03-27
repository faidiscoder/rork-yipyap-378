import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Enhanced logging function for PM2
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    service: 'database',
    message,
    ...data
  };
  
  // Format for PM2 logs
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [DATABASE] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

// Production database configuration for Lightsail - Fixed MySQL2 configuration
const dbConfig = {
  host: process.env.DB_HOST || '18.221.219.126',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'YipYap!2025',
  database: process.env.DB_NAME || 'yip_app',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10, // Reduced for better stability
  queueLimit: 0,
  charset: 'utf8mb4',
  // Valid MySQL2 pool options only - removed invalid options
  idleTimeout: 300000, // 5 minutes
  maxIdle: 5, // Maximum idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create a connection pool
let pool: mysql.Pool;

try {
  log('info', 'Creating database connection pool', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    connectionLimit: dbConfig.connectionLimit
  });
  
  pool = mysql.createPool(dbConfig);
  
  // Handle pool events with proper typing - Fixed event handling
  pool.on('connection', (connection: any) => {
    log('info', 'New database connection established', { connectionId: connection.threadId });
  });
  
  // Fixed: Use 'acquire' event instead of 'error' for pool events
  pool.on('acquire', (connection: any) => {
    log('info', 'Connection acquired from pool', { connectionId: connection.threadId });
  });
  
  pool.on('release', (connection: any) => {
    log('info', 'Connection released back to pool', { connectionId: connection.threadId });
  });
  
  log('info', 'Database connection pool created successfully');
} catch (error: any) {
  log('error', 'Failed to create database connection pool', { 
    error: error.message,
    stack: error.stack
  });
  throw error;
}

// Test database connection with retries
export async function testConnection(retries = 5): Promise<boolean> {
  let attempts = 0;
  
  while (attempts < retries) {
    try {
      log('info', `Testing database connection`, { 
        attempt: attempts + 1, 
        maxRetries: retries,
        host: dbConfig.host,
        database: dbConfig.database
      });
      
      const connection = await pool.getConnection();
      await connection.execute('SELECT 1 as test');
      connection.release();
      
      log('info', 'Database connection test successful');
      return true;
    } catch (error: any) {
      attempts++;
      log('error', `Database connection test failed`, { 
        attempt: attempts,
        maxRetries: retries,
        error: error.message,
        code: error.code,
        errno: error.errno
      });
      
      if (attempts < retries) {
        const waitTime = Math.min(Math.pow(2, attempts) * 1000, 10000);
        log('info', `Waiting before retry`, { waitTimeMs: waitTime });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  log('error', 'All database connection attempts failed', { totalAttempts: attempts });
  return false;
}

// Execute a query with parameters and proper error handling
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const startTime = Date.now();
  let connection: mysql.PoolConnection | null = null;
  
  try {
    // Sanitize SQL and params for logging (don't log sensitive data)
    const sanitizedSql = sql.replace(/password|token|secret/gi, '***');
    const sanitizedParams = params.map(p => {
      if (typeof p === 'string') {
        if (p.length > 50) return p.substring(0, 50) + '...';
        if (/password|token|secret/i.test(p)) return '***';
      }
      return p;
    });
    
    log('info', 'Executing database query', { 
      sql: sanitizedSql.substring(0, 200) + (sanitizedSql.length > 200 ? '...' : ''),
      paramCount: params.length
    });
    
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    const executionTime = Date.now() - startTime;
    
    // Fixed: Better type handling for results
    let resultSummary = 'Unknown result type';
    if (Array.isArray(results)) {
      resultSummary = `${results.length} rows`;
    } else if (results && typeof results === 'object') {
      // Fixed: Proper type checking for ResultSetHeader
      const resultObj = results as any;
      if ('insertId' in resultObj && resultObj.insertId !== undefined) {
        resultSummary = `Insert ID: ${resultObj.insertId}`;
      } else if ('affectedRows' in resultObj && resultObj.affectedRows !== undefined) {
        resultSummary = `${resultObj.affectedRows} rows affected`;
      } else if ('changedRows' in resultObj && resultObj.changedRows !== undefined) {
        resultSummary = `${resultObj.changedRows} rows changed`;
      }
    }
    
    log('info', 'Query executed successfully', { 
      executionTimeMs: executionTime,
      result: resultSummary
    });
    
    return results;
  } catch (dbError: any) {
    const executionTime = Date.now() - startTime;
    
    log('error', 'Database query error', { 
      sql: sql.replace(/password|token|secret/gi, '***').substring(0, 200),
      error: dbError.message,
      code: dbError.code,
      errno: dbError.errno,
      sqlState: dbError.sqlState,
      executionTimeMs: executionTime
    });
    
    throw dbError;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Get multiple rows from a query
export async function getMany(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const results = await executeQuery(sql, params);
    
    if (Array.isArray(results)) {
      log('info', 'getMany query successful', { rowCount: results.length });
      return results;
    }
    
    log('warn', 'getMany query returned non-array result');
    return [];
  } catch (error: any) {
    log('error', 'getMany query failed', { 
      error: error.message,
      code: error.code
    });
    throw error;
  }
}

// Get a single row from a query
export async function getOne(sql: string, params: any[] = []): Promise<any> {
  try {
    const results = await executeQuery(sql, params);
    
    if (Array.isArray(results) && results.length > 0) {
      log('info', 'getOne query successful', { hasResult: true });
      return results[0];
    }
    
    log('info', 'getOne query returned no results');
    return null;
  } catch (error: any) {
    log('error', 'getOne query failed', { 
      error: error.message,
      code: error.code
    });
    throw error;
  }
}

// Close the connection pool gracefully
export async function closePool(): Promise<void> {
  try {
    log('info', 'Closing database connection pool');
    await pool.end();
    log('info', 'Database connection pool closed successfully');
  } catch (error: any) {
    log('error', 'Error closing database connection pool', { 
      error: error.message
    });
    throw error;
  }
}

// Health check for the database
export async function healthCheck(): Promise<{ healthy: boolean; details: any }> {
  let connection: mysql.PoolConnection | null = null;
  
  try {
    const startTime = Date.now();
    connection = await pool.getConnection();
    
    // Test basic query
    const [result] = await connection.execute('SELECT 1 as health_check, NOW() as server_time');
    const responseTime = Date.now() - startTime;
    
    const details = {
      responseTimeMs: responseTime,
      serverTime: (result as any)[0]?.server_time,
      poolConnections: {
        total: dbConfig.connectionLimit,
        active: (pool as any).pool?._allConnections?.length || 0,
        idle: (pool as any).pool?._freeConnections?.length || 0
      }
    };
    
    log('info', 'Database health check passed', details);
    
    return {
      healthy: true,
      details
    };
  } catch (error: any) {
    log('error', 'Database health check failed', {
      error: error.message,
      code: error.code
    });
    
    return {
      healthy: false,
      details: {
        error: error.message,
        code: error.code
      }
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}