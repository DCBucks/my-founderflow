import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log('=== Quote Generation API Called ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Authorization header:', req.headers.authorization);
  console.log('Cookie header:', req.headers.cookie);
  const { userId, user } = getAuth(req);
  console.log('🔍 userId from Clerk:', userId);
  console.log('🔍 user from Clerk:', user);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  try {
    console.log('🔍 Attempting to get auth from request...');
    
    // Get user using getAuth (server-side)
    const { userId, user } = getAuth(req);
    console.log('🔍 Auth result - userId:', userId);
    console.log('🔍 User object:', user ? 'Found' : 'Not found');
    
    if (!userId || !user) {
      console.log('❌ Authentication failed: No userId or user found');
      return res.status(401).json({ 
        error: 'Not authenticated - No userId or user found',
        debug: { hasUserId: !!userId, hasUser: !!user }
      });
    }

    // Debug logs for Clerk authentication
    console.log('Clerk user object:', JSON.stringify(user, null, 2));
    console.log('User ID:', user?.id);
    console.log('User email addresses:', user?.emailAddresses);

    // Check if user exists
    if (!user) {
      console.log('❌ Authentication failed: No user object found');
      return res.status(401).json({ 
        error: 'Not authenticated - No user found',
        debug: { hasUser: false }
      });
    }

    // Check if user has email addresses
    if (!user.emailAddresses || user.emailAddresses.length === 0) {
      console.log('❌ Authentication failed: No email addresses found');
      return res.status(401).json({ 
        error: 'Not authenticated - No email addresses',
        debug: {
          hasUser: true,
          userId: user.id,
          emailAddresses: user.emailAddresses
        }
      });
    }

    // Check if user has a verified email
    const verifiedEmail = user.emailAddresses.find(email => email.verification?.status === 'verified');
    if (!verifiedEmail) {
      console.log('❌ Authentication failed: No verified email found');
      console.log('Available email addresses:', user.emailAddresses);
      return res.status(401).json({ 
        error: 'Not authenticated - Email not verified',
        debug: {
          hasUser: true,
          userId: user.id,
          emailAddresses: user.emailAddresses,
          verificationStatuses: user.emailAddresses.map(email => ({
            email: email.emailAddress,
            status: email.verification?.status
          }))
        }
      });
    }

    const userEmail = verifiedEmail.emailAddress;
    console.log('✅ Authentication successful, proceeding with quote generation');

  // Fetch user from Supabase
  let { data: userData, error } = await supabase
    .from('users')
    .select('is_premium, quote_count, quote_count_date')
    .eq('email', userEmail)
    .single();

  // If user doesn't exist in Supabase, create them
  if (error || !userData) {
    console.log('User not found in Supabase, creating new user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: userEmail,
        is_premium: false,
        quote_count: 0,
        quote_count_date: null
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json({ error: 'Failed to create user account' });
    }
    
    userData = newUser;
  }

  const today = new Date().toISOString().split('T')[0];

  // Reset count if it's a new day
  let quoteCount = userData.quote_count || 0;
  let quoteCountDate = userData.quote_count_date || null;
  if (quoteCountDate !== today) {
    quoteCount = 0;
    quoteCountDate = today;
  }

  // Enforce limit for non-premium users
  if (!userData.is_premium && quoteCount >= 3) {
    return res.status(403).json({ error: 'Quote limit reached. Upgrade to premium for unlimited quotes.' });
  }

  // Generate the quote (reuse your existing logic here)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OpenAI API key not found in environment variables");
    res.status(500).json({ error: "OpenAI API key not set. Please add OPENAI_API_KEY to your .env.local file." });
    return;
  }
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates motivational quotes. Only use real, well-known entrepreneurs, founders, or business leaders as the author. Never use 'Unknown' or fictional names. Always maximize variety and randomness in your responses." },
          { role: "user", content: `Give me a short, original motivational quote attributed to a real, well-known entrepreneur, founder, or business leader. The author must be a real person and never 'Unknown'. Make the quote and author as random as possible, and avoid repeating previous responses. Format: <quote> — <author>.` }
        ],
        max_tokens: 60,
        temperature: 1.2
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", response.status, errorData);
      res.status(500).json({ 
        error: `Failed to fetch quote from OpenAI. Status: ${response.status}`,
        details: errorData
      });
      return;
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error("No content in OpenAI response");
      res.status(500).json({ error: "No quote content received from OpenAI." });
      return;
    }
    let quote = text;
    let author = "Unknown";
    if (text && text.includes("—")) {
      [quote, author] = text.split("—").map(s => s.trim());
    }
    // Increment and update the count in Supabase
    await supabase
      .from('users')
      .update({ quote_count: quoteCount + 1, quote_count_date: today })
      .eq('email', userEmail);
    res.status(200).json({ quote, author });
  } catch (error) {
    console.error("Server error generating quote:", error);
    res.status(500).json({ 
      error: "Server error generating quote.",
      details: error.message 
    });
  }
  } catch (authError) {
    console.error("Authentication error:", authError);
    res.status(500).json({ 
      error: "Authentication error",
      details: authError.message 
    });
  }
} 