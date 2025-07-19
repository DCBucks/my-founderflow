# Premium Features Setup Guide

## Overview

This guide shows how to implement secure premium features that require proper authentication and database access.

## Database Tables Needed

### 1. Premium Analytics Table

```sql
CREATE TABLE premium_analytics (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  analytics_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_premium_analytics_user_email ON premium_analytics(user_email);
```

### 2. User Settings Table

```sql
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_user_settings_user_email ON user_settings(user_email);
```

### 3. Update Users Table (if not exists)

```sql
-- Make sure your users table has these columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

## Security Considerations

### 1. Row Level Security (RLS)

Since you're using Clerk instead of Supabase Auth, you'll need to disable RLS or implement custom policies:

```sql
-- Disable RLS for Clerk authentication
ALTER TABLE premium_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 2. API Route Security

The API routes handle authentication through Clerk, so RLS isn't needed at the database level.

## How the Authentication Works

### 1. Frontend Request

```javascript
// Frontend sends request with Clerk session cookies
const response = await fetch("/api/premium-features", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Includes Clerk session cookies
  body: JSON.stringify({ feature: "get_premium_data" }),
});
```

### 2. API Route Authentication

```javascript
// API route verifies user through Clerk
const { userId, user } = getAuth(req);
if (!userId || !user) {
  return res.status(401).json({ error: "Authentication required" });
}
```

### 3. Database Access

```javascript
// Only authenticated users can access their own data
const { data } = await supabase
  .from("premium_analytics")
  .select("*")
  .eq("user_email", userEmail); // User's own email
```

## Testing the Setup

### 1. Test Authentication

```bash
# Test if Clerk authentication works
curl -X GET http://localhost:3000/api/test-auth \
  -H "Cookie: your-clerk-session-cookie"
```

### 2. Test Premium Features

1. Sign in to your app
2. Navigate to the premium features example
3. Try accessing premium data
4. Check the console for authentication logs

## Environment Variables Required

Make sure you have these in your `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
```

## Common Issues and Solutions

### Issue 1: Authentication Fails (401)

**Cause**: Clerk session cookies not being sent or invalid
**Solution**:

- Check `credentials: "include"` in fetch requests
- Verify Clerk environment variables
- Check browser console for cookie issues

### Issue 2: Premium Status Not Found (403)

**Cause**: User doesn't have `is_premium: true` in database
**Solution**:

- Check if Stripe webhook is working
- Verify user exists in `users` table
- Manually set `is_premium: true` for testing

### Issue 3: Database Connection Error

**Cause**: Supabase credentials or table doesn't exist
**Solution**:

- Verify Supabase environment variables
- Create required tables
- Check Supabase dashboard for connection issues

## Next Steps

1. **Create the database tables** using the SQL above
2. **Test the authentication** with the test endpoint
3. **Implement your specific premium features** using the pattern shown
4. **Add rate limiting** for production use
5. **Implement proper error handling** and user feedback
6. **Add logging** for security monitoring

## Security Best Practices

1. **Always verify authentication** in API routes
2. **Use user-specific queries** (filter by user email)
3. **Validate input data** before database operations
4. **Implement rate limiting** to prevent abuse
5. **Log authentication events** for monitoring
6. **Use HTTPS** in production
7. **Regular security audits** of your authentication flow
