# Stripe Integration Setup Guide

## What You've Already Implemented ✅

### Backend API
- ✅ `pages/api/create-checkout-session.js` - Creates Stripe checkout sessions
- ✅ `pages/api/stripe-webhook.js` - Handles webhook events from Stripe
- ✅ Dependencies installed (`stripe`, `micro`, `@supabase/supabase-js`)

### Frontend UI
- ✅ Premium status checking and display
- ✅ Upgrade modal with feature list
- ✅ Subscription checkout flow
- ✅ Success and cancel pages
- ✅ Premium badge in header

### Database Integration
- ✅ Webhook updates user's `is_premium` status in Supabase
- ✅ Uses Clerk authentication to get user email

## What You Need to Complete 🔧

### 1. Stripe Dashboard Setup

1. **Create a Stripe Account**
   - Go to [stripe.com](https://stripe.com) and create an account
   - Complete your business verification

2. **Get Your API Keys**
   - Go to Developers → API Keys in your Stripe dashboard
   - Copy your **Publishable Key** and **Secret Key**
   - Add them to your `.env.local` file:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Create a Product and Price**
   - Go to Products → Add Product
   - Name: "FounderFlow Premium"
   - Description: "Premium subscription for FounderFlow"
   - Pricing: $9.99/month (recurring)
   - Copy the **Price ID** (starts with `price_`)
   - Add to your `.env.local`:
   ```
   STRIPE_PRICE_ID=price_...
   ```

### 2. Supabase Database Setup

1. **Create Users Table**
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

2. **Create Habits Table** (if not exists)
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

### 3. Webhook Configuration

1. **Set Up Stripe Webhook**
   - Go to Developers → Webhooks in Stripe dashboard
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/api/stripe-webhook`
   - Events to send: `checkout.session.completed`
   - Copy the **Webhook Secret** (starts with `whsec_`)
   - Add to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Test Webhook** (for development)
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
   - Or use ngrok: `ngrok http 3000`

### 4. Environment Variables

Create/update your `.env.local` file:
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 5. Premium Features Implementation

You can now implement premium features by checking `isPremium` state:

```javascript
// Example: Premium-only feature
{isPremium ? (
  <div>Advanced Analytics Dashboard</div>
) : (
  <div>Upgrade to see advanced analytics</div>
)}
```

## Testing Your Integration

1. **Test the Flow**
   - Start your dev server: `npm run dev`
   - Sign in with Clerk
   - Click "Upgrade to Premium"
   - Complete the Stripe checkout
   - Verify webhook updates your database

2. **Test Webhook**
   - Use Stripe's webhook testing tool
   - Send a test `checkout.session.completed` event
   - Check your database for the `is_premium` update

## Production Deployment

1. **Update Environment Variables**
   - Use production Stripe keys (live mode)
   - Update webhook URL to your production domain
   - Set up production Supabase database

2. **Security Considerations**
   - Never expose secret keys in client-side code
   - Always verify webhook signatures
   - Use HTTPS in production
   - Implement proper error handling

## Premium Features You Can Add

1. **Advanced Analytics**
   - Detailed progress reports
   - Export functionality
   - Custom date ranges

2. **Enhanced Notifications**
   - Smart reminders
   - Streak notifications
   - Weekly reports

3. **Customization**
   - Custom themes
   - Personal branding
   - Advanced habit settings

4. **Team Features**
   - Team challenges
   - Shared goals
   - Leaderboards

## Troubleshooting

- **Webhook not working**: Check webhook URL and secret
- **User not getting premium**: Verify email matching between Clerk and Supabase
- **Checkout errors**: Check Stripe logs and API key configuration
- **Database errors**: Verify Supabase connection and table structure

Your Stripe integration is now ready! The foundation is solid and you can start implementing premium features based on the `isPremium` state. 