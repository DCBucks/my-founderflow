# Supabase Database Setup Guide

## Required Tables

### 1. Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Habits Table

```sql
CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  time VARCHAR(50),
  frequency VARCHAR(50) NOT NULL,
  completed_dates JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Favorites Table (NEW)

```sql
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  quote TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

**IMPORTANT**: Since you're using Clerk for authentication (not Supabase Auth), we need to disable RLS for now or use a different approach. Here are your options:

### Option 1: Disable RLS (Simplest for now)

```sql
-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
```

### Option 2: Use Service Role Key (More secure)

If you want to keep RLS enabled, you'll need to use the service role key in your API routes and handle authentication server-side.

## Setup Instructions

1. **Go to your Supabase Dashboard**

   - Navigate to your project
   - Go to SQL Editor

2. **Run the table creation scripts**

   - Copy and paste each CREATE TABLE statement
   - Execute them one by one

3. **Disable RLS (for now)**

   - Run the ALTER TABLE statements to disable RLS
   - This will allow the client-side code to work

4. **Verify the setup**

   - Go to Table Editor
   - You should see `users`, `habits`, and `favorites` tables
   - Check that RLS is disabled for each table

## Notes

- The `user_id` field uses VARCHAR(255) to match Clerk's user ID format
- All tables include `created_at` timestamps for tracking
- RLS is disabled because you're using Clerk authentication
- The favorites table stores quotes as TEXT to handle long quotes
- The habits table uses JSONB for `completed_dates` to store arrays efficiently

## Security Note

With RLS disabled, the security relies on your client-side code to only allow users to access their own data. This is generally acceptable for most applications, but if you need stronger security, consider implementing server-side API routes that use the service role key.
