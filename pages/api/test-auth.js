import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  console.log('=== Test Auth API Called ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  
  try {
    const { userId, user } = getAuth(req);
    console.log('🔍 Auth test - userId:', userId);
    console.log('🔍 Auth test - User object:', user ? 'Found' : 'Not found');
    console.log('User details:', JSON.stringify(user, null, 2));
    
    if (!userId || !user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'No userId or user found in request',
        debug: { hasUserId: !!userId, hasUser: !!user }
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        emailAddresses: user.emailAddresses,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: error.message
    });
  }
} 