import { Pool, PoolConfig, QueryResult } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pg_pool__: Pool | undefined;
}

// Parse DATABASE_URL for SSL configuration
const parseSSLFromUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.has('ssl') || 
           parsed.searchParams.get('sslmode') === 'require';
  } catch {
    return false;
  }
};

// Determine SSL configuration
const shouldUseSSL = () => {
  // Check explicit SSL environment variables
  if (process.env.DATABASE_SSL === 'true' || process.env.PGSSLMODE === 'require') {
    return true;
  }
  
  // Check SSL parameters in DATABASE_URL
  if (parseSSLFromUrl(process.env.DATABASE_URL)) {
    return true;
  }
  
  // Default to SSL in production if no explicit flags are set
  if (process.env.NODE_ENV === 'production' && 
      !process.env.DATABASE_SSL && 
      !process.env.PGSSLMODE) {
    return true;
  }
  
  return false;
};

// Database connection configuration
const config: PoolConfig = {
  // Use DATABASE_URL if available, otherwise fall back to individual env vars
  connectionString: process.env.DATABASE_URL || undefined,
  
  // If DATABASE_URL is not set, use individual environment variables
  ...(!process.env.DATABASE_URL && {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  }),
  
  // SSL configuration with auto-detection
  ssl: shouldUseSSL() ? { rejectUnauthorized: false } : false,
    
  // Pool configuration
  max: 20, // maximum number of clients in pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return error after 2 seconds if connection could not be established
};

// Create singleton pool instance with dev caching
const pool = global.__pg_pool__ ?? new Pool(config);
if (process.env.NODE_ENV !== 'production') global.__pg_pool__ = pool;

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  // Exit process only if explicitly configured to do so
  if (process.env.DB_EXIT_ON_ERROR === 'true') {
    process.exit(-1);
  }
});

// Convenience query function with error handling
export const query = <T = any>(text: string, params?: any[]) => pool.query<T>(text, params);

// Graceful shutdown handling - only register once in dev
const shutdown = async () => {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error during database pool shutdown:', error);
  }
};

// Prevent multiple registration in development hot reload
if (!((globalThis as any).__db_shutdown_registered)) {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('beforeExit', shutdown);
  (globalThis as any).__db_shutdown_registered = true;
}

// Export pool for direct access when needed
export default pool;