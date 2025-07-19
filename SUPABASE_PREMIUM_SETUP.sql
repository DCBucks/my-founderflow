-- Premium Authentication Database Setup for Supabase

-- 1. Create/Update Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  clerk_user_id VARCHAR(255) UNIQUE,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Premium Analytics Table (for premium features)
CREATE TABLE IF NOT EXISTS premium_analytics (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  analytics_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create User Settings Table (for premium features)
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create Premium Features Usage Table (for tracking)
CREATE TABLE IF NOT EXISTS premium_feature_usage (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_premium_analytics_user ON premium_analytics(user_email);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_email);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON premium_feature_usage(user_email);

-- 6. Disable Row Level Security (since we're using Clerk for auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE premium_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE premium_feature_usage DISABLE ROW LEVEL SECURITY;

-- 7. Create function to update user premium status
CREATE OR REPLACE FUNCTION update_user_premium_status(
  user_email_param VARCHAR(255),
  is_premium_param BOOLEAN,
  stripe_customer_id_param VARCHAR(255) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO users (email, is_premium, stripe_customer_id, updated_at)
  VALUES (user_email_param, is_premium_param, stripe_customer_id_param, NOW())
  ON CONFLICT (email) 
  DO UPDATE SET 
    is_premium = is_premium_param,
    stripe_customer_id = COALESCE(stripe_customer_id_param, users.stripe_customer_id),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get user premium status
CREATE OR REPLACE FUNCTION get_user_premium_status(user_email_param VARCHAR(255))
RETURNS TABLE(
  is_premium BOOLEAN,
  subscription_status VARCHAR(50),
  subscription_end_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.is_premium,
    u.subscription_status,
    u.subscription_end_date
  FROM users u
  WHERE u.email = user_email_param;
END;
$$ LANGUAGE plpgsql; 