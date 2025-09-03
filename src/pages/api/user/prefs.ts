import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { query } from '../../../server/db';

// Types
interface UserPreferences {
  [key: string]: any;
}

interface AuthenticatedUser {
  username: string;
}

interface ApiResponse {
  status: string;
  data?: UserPreferences;
  error?: string;
}

// Authentication helper function
async function authenticateUser(req: NextApiRequest): Promise<AuthenticatedUser> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // Check token existence and required fields
  if (!token || !token.name) {
    throw new Error('Unauthorized');
  }

  // Check token expiration (exp is in seconds since epoch)
  if (typeof token.exp === 'number' && Date.now() >= token.exp * 1000) {
    throw new Error('Token expired');
  }

  // Check token issuer if present
  const expectedIssuer = process.env.NEXTAUTH_ISSUER;
  if (expectedIssuer && token.iss && token.iss !== expectedIssuer) {
    throw new Error('Invalid token issuer');
  }

  // Optionally check if user is still active in the database
  // Assuming a 'users' table with 'username' and 'active' fields
  const username = token.name.toLowerCase();
  try {
    const userResult = await query(
      'SELECT active FROM users WHERE username = $1',
      [username]
    );
    if (
      userResult.rows.length === 0 ||
      userResult.rows[0].active === false
    ) {
      throw new Error('User is not active');
    }
  } catch (e) {
    // If the users table doesn't exist or any DB error occurs, skip this check.
    // Optionally gate this behavior behind an env flag if stricter checks are required.
  }

  // Use Reddit username only, normalized to lowercase
  return { username };
}

// JSON validation helper function
function validatePreferencesData(data: any): { isValid: boolean; error?: string } {
  // Check if data exists
  if (data === null || data === undefined) {
    return { isValid: false, error: 'Preferences data is required' };
  }
  
  // Check if data is an object (not array or primitive)
  if (typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, error: 'Preferences data must be an object' };
  }
  
  // Check size limit (100KB)
  const jsonString = JSON.stringify(data);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
  const maxSizeInBytes = 100 * 1024; // 100KB
  
  if (sizeInBytes > maxSizeInBytes) {
    return { 
      isValid: false, 
      error: `Preferences data too large. Maximum size is ${maxSizeInBytes} bytes, got ${sizeInBytes} bytes` 
    };
  }
  
  return { isValid: true };
}

// GET handler - retrieve user preferences
async function handleGetRequest(req: NextApiRequest, res: NextApiResponse<ApiResponse | UserPreferences>) {
  try {
    // Authenticate user
    const user = await authenticateUser(req);
    
    // Query database for user preferences
    const result = await query<{ data: UserPreferences }>(
      'SELECT data FROM user_prefs WHERE user_id = $1',
      [user.username]
    );
    
    // Return preferences or empty object if none exist
    const preferences = result.rows.length > 0 ? result.rows[0].data : {};
    
    // Return raw preferences directly
    return res.status(200).json(preferences);
    
  } catch (error: any) {
    console.error('Error retrieving user preferences:', error);
    
    if (error.message === 'Unauthorized') {
      return res.status(401).json({
        status: 'Unauthorized',
        error: 'Authentication required'
      });
    }
    
    return res.status(500).json({
      status: 'Error',
      error: 'Internal server error'
    });
  }
}

// POST handler - save user preferences
async function handlePostRequest(req: NextApiRequest, res: NextApiResponse<ApiResponse | UserPreferences>) {
  try {
    // Validate Content-Type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        status: 'Unsupported Media Type',
        error: 'Content-Type must be application/json'
      });
    }
    
    // Authenticate user
    const user = await authenticateUser(req);
    
    // Rate limiting: 10 requests per minute per user
    const rateLimitKey = `rate_limit:${user.username}`;
    const currentTime = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    
    // Simple in-memory rate limiting (consider Redis for production)
    const g: any = global as any;
    if (!g.rateLimitStore) {
      g.rateLimitStore = new Map();
    }
    
    const userRateLimit = g.rateLimitStore.get(rateLimitKey);
    if (userRateLimit && currentTime - userRateLimit.timestamp < windowMs) {
      if (userRateLimit.count >= 10) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        return res.status(429).json({
          status: 'Too Many Requests',
          error: 'Rate limit exceeded. Please try again later.'
        });
      }
      userRateLimit.count++;
    } else {
      g.rateLimitStore.set(rateLimitKey, { count: 1, timestamp: currentTime });
    }
    
    // Validate request body
    const validation = validatePreferencesData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'Bad Request',
        error: validation.error
      });
    }
    
    // UPSERT preferences in database with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await query(
          `INSERT INTO user_prefs (user_id, data, updated_at) 
           VALUES ($1, $2::jsonb, now()) 
           ON CONFLICT (user_id) 
           DO UPDATE SET data = $2::jsonb, updated_at = now()`,
          [user.username, req.body]
        );
        break; // Success, exit retry loop
      } catch (dbError: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw dbError; // Re-throw after max attempts
        }
        
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = Math.pow(2, attempts - 1) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Return raw preferences directly to match GET format
    return res.status(200).json(req.body);
    
  } catch (error: any) {
    console.error('Error saving user preferences:', error);
    
    if (error.message === 'Unauthorized') {
      return res.status(401).json({
        status: 'Unauthorized',
        error: 'Authentication required'
      });
    }
    
    // Handle database constraint violations
    if (error.code === '23505') { // unique_violation
      return res.status(409).json({
        status: 'Conflict',
        error: 'Preferences update conflict'
      });
    }
    
    return res.status(500).json({
      status: 'Error',
      error: 'Internal server error'
    });
  }
}

// Next.js API route configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb', // 100KB limit for request body
    },
  },
}

// Main API handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | UserPreferences>
) {
  // Set security headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetRequest(req, res);
        
      case 'POST':
        return await handlePostRequest(req, res);
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          status: 'Method Not Allowed',
          error: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Unhandled error in preferences API:', error);
    return res.status(500).json({
      status: 'Error',
      error: 'Internal server error'
    });
  }
}