'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignOutButton, useAuth } from '@clerk/nextjs';
import { supabase } from './utils/supabaseClient';

function getCompletedDates(completed_dates) {
  if (Array.isArray(completed_dates)) return completed_dates;
  if (typeof completed_dates === 'string') {
    try {
      return JSON.parse(completed_dates);
    } catch {
      return [];
    }
  }
  return [];
}

export default function Home() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  // State variables
  const [currentTheme, setCurrentTheme] = useState('light');
  const [currentQuote, setCurrentQuote] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [lastQuoteDate, setLastQuoteDate] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [habits, setHabits] = useState([]);
  const [displayedMonth, setDisplayedMonth] = useState(new Date().getMonth());
  const [displayedYear, setDisplayedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  // New subscription-related state
  const [isPremium, setIsPremium] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Add at the top of Home component state:
  // Remove quoteCount state and all localStorage logic
  // Remove useEffect for quoteCount
  // Update handleGenerateQuote to handle 403 from backend

  // Category names mapping
  const categoryNames = {
    health: 'Health & Fitness',
    work: 'Work & Productivity',
    learning: 'Learning & Growth',
    personal: 'Personal Development',
    other: 'Other'
  };

  const userKey = user?.id || user?.primaryEmailAddress?.emailAddress || 'guest';

  // Load habits from Supabase for the logged-in user
  useEffect(() => {
    if (!isSignedIn) {
      setHabits([]);
      return;
    }
    const fetchHabits = async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);
      if (!error) setHabits(data || []);
    };
    fetchHabits();
  }, [isSignedIn, user]);

  // Theme, favorites, daily quote, lastQuoteDate localStorage logic remains unchanged
  useEffect(() => {
    localStorage.setItem('founderFlowFavorites', JSON.stringify(favorites));
    localStorage.setItem('founderFlowTheme', currentTheme);
    if (dailyQuote) {
      localStorage.setItem('founderFlowDailyQuote', JSON.stringify(dailyQuote));
    }
    if (lastQuoteDate) {
      const dateObj = typeof lastQuoteDate === "string" ? new Date(lastQuoteDate) : lastQuoteDate;
      localStorage.setItem('founderFlowLastQuoteDate', dateObj.toISOString());
    }
  }, [favorites, currentTheme, dailyQuote, lastQuoteDate]);

  // Add useEffect to initialize quoteCount from localStorage (daily reset):
  // Remove quoteCount state and all localStorage logic
  // Remove useEffect for quoteCount
  // Update handleGenerateQuote to handle 403 from backend

  // Theme toggle functionality
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  // Tab switching
  const switchTab = (tabName) => {
    setActiveTab(tabName);
  };

  // Add habit to Supabase
  const addHabit = async (name, category, time, frequency) => {
    if (!user) return;
    const newHabit = {
      user_id: user.id,
      name,
      category,
      time,
      frequency,
      completed_dates: [],
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('habits').insert([newHabit]).select();
    if (error) {
      alert('Error adding habit: ' + error.message);
      return;
    }
    if (data) setHabits(prev => [...prev, ...data]);
    setShowHabitModal(false);
  };

  // Toggle habit completion in Supabase
  const toggleHabitCompletion = async (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const isCompleted = getCompletedDates(habit.completed_dates).includes(today);
    const updatedDates = isCompleted
      ? getCompletedDates(habit.completed_dates).filter(date => date !== today)
      : [...getCompletedDates(habit.completed_dates), today];

    const { data, error } = await supabase
      .from('habits')
      .update({ completed_dates: updatedDates })
      .eq('id', habitId)
      .eq('user_id', user.id)
      .select();

    if (!error && data) {
      setHabits(habits.map(h => h.id === habitId ? { ...h, completed_dates: updatedDates } : h));
    }
  };

  // Delete habit from Supabase
  const deleteHabit = async (habitId) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user.id);
    if (!error) setHabits(habits.filter(habit => habit.id !== habitId));
  };

  // Filter habits by category
  const filterHabitsByCategory = (category) => {
    setActiveCategory(category);
  };

  const generateQuote = async () => {
    console.log('🟡 generateQuote called'); // Confirm function is called
    if (!isSignedIn) {
      alert('Please sign in to generate quotes');
      return;
    }
    const token = await getToken();
    console.log('🔐 Clerk Token:', token); // Debug log
    console.log('🟢 Sending fetch with headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    try {
      console.log("Generating quote...");
      const response = await fetch("/api/generate-quote", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Network or server error', details: e.message };
        }
        console.error('❌ API Error:', errorData);
        alert(`Failed to generate quote: ${errorData.error || 'Unknown error'}`);
        setCurrentQuote(null);
        return;
      }
      const data = await response.json();
      console.log("Quote generated successfully:", data);
      setCurrentQuote({ text: data.quote, author: data.author });
    } catch (error) {
      console.error("Error generating quote:", error);
      alert(`Error generating quote: ${error.message}`);
      setCurrentQuote(null);
    }
  };

  const generateDailyQuote = async () => {
    if (!isSignedIn) {
      return;
    }
    const token = await getToken();
    console.log('🔐 Clerk Token:', token); // Debug log
    try {
      const response = await fetch("/api/generate-quote", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        setDailyQuote(null);
        setLastQuoteDate(new Date().toISOString().split('T')[0]);
        return;
      }
      const data = await response.json();
      setDailyQuote({ text: data.quote, author: data.author });
      setLastQuoteDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      setDailyQuote(null);
      setLastQuoteDate(new Date().toISOString().split('T')[0]);
    }
  };

  // Add to favorites
  const addToFavorites = (quote, author) => {
    const newFavorite = {
      id: Date.now().toString(),
      quote,
      author,
      dateAdded: new Date().toISOString()
    };
    setFavorites(prevFavorites => [...prevFavorites, newFavorite]);
  };

  // Remove from favorites
  const removeFromFavorites = (id) => {
    setFavorites(prevFavorites => prevFavorites.filter(fav => fav.id !== id));
  };

  // Toggle favorite
  const toggleFavorite = () => {
    if (currentQuote) {
      const isFavorited = favorites.some(fav => 
        fav.quote === currentQuote.text && fav.author === currentQuote.author
      );
      
      if (isFavorited) {
        removeFromFavorites(favorites.find(fav => 
          fav.quote === currentQuote.text && fav.author === currentQuote.author
        ).id);
      } else {
        addToFavorites(currentQuote.text, currentQuote.author);
      }
    }
  };

  // Check if current quote is favorited
  const isCurrentQuoteFavorited = () => {
    if (!currentQuote) return false;
    return favorites.some(fav => 
      fav.quote === currentQuote.text && fav.author === currentQuote.author
    );
  };

  // Calendar navigation
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (displayedMonth === 0) {
        setDisplayedMonth(11);
        setDisplayedYear(prev => prev - 1);
      } else {
        setDisplayedMonth(prev => prev - 1);
      }
    } else {
      if (displayedMonth === 11) {
        setDisplayedMonth(0);
        setDisplayedYear(prev => prev + 1);
      } else {
        setDisplayedMonth(prev => prev + 1);
      }
    }
  };

  const goToToday = () => {
    setDisplayedMonth(new Date().getMonth());
    setDisplayedYear(new Date().getFullYear());
  };

  const getCurrentMonthName = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[displayedMonth]} ${displayedYear}`;
  };

  const getHabitsForDay = (date) => {
    return habits.filter(habit => getCompletedDates(habit.completed_dates).includes(date));
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const firstDay = new Date(displayedYear, displayedMonth, 1);
    const lastDay = new Date(displayedYear, displayedMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateString = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === displayedMonth;
      const isToday = dateString === today;
      const isPast = dateString < today;
      const isFuture = dateString > today;
      
      const dayHabits = getHabitsForDay(dateString);
      const hasHabits = dayHabits.length > 0;
      
      // Get habits that were active on this date (created before or on this date)
      const activeHabits = habits.filter(habit => {
        const habitStartDate = new Date(habit.created_at).toISOString().split('T')[0];
        return dateString >= habitStartDate;
      });
      
      // Check if all active habits for this day are completed
      const allHabitsCompleted = activeHabits.length > 0 && 
        activeHabits.every(habit => getCompletedDates(habit.completed_dates).includes(dateString));
      
      // Check if any active habits were missed (not completed)
      const hasMissedHabits = activeHabits.some(habit => 
        !getCompletedDates(habit.completed_dates).includes(dateString)
      );
      
      // Determine day status
      let dayStatus = 'normal';
      if (isFuture) {
        dayStatus = 'future';
      } else if (isPast) {
        if (activeHabits.length === 0) {
          dayStatus = 'no-habits'; // Grey - no habits created yet
        } else if (allHabitsCompleted) {
          dayStatus = 'completed'; // Green - all habits completed
        } else if (hasMissedHabits) {
          dayStatus = 'missed'; // Red - missed habits
        } else {
          dayStatus = 'no-habits'; // Grey - no habits created yet
        }
      } else {
        // Today
        if (activeHabits.length === 0) {
          dayStatus = 'no-habits';
        } else if (allHabitsCompleted) {
          dayStatus = 'completed';
        } else if (hasMissedHabits) {
          dayStatus = 'missed';
        } else {
          dayStatus = 'normal';
        }
      }
      
      days.push({
        date: currentDate,
        dateString,
        isCurrentMonth,
        isToday,
        hasHabits,
        dayHabits,
        allHabitsCompleted,
        hasMissedHabits,
        dayStatus,
        activeHabits
      });
    }
    
    return days;
  };

  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDay(day);
      setShowDayModal(true);
    }
  };

  const getHabitProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayHabits = habits.filter(habit => {
      const habitDate = new Date(habit.created_at).toISOString().split('T')[0];
      return habitDate <= today;
    });
    
    const completedToday = todayHabits.filter(habit => 
      getCompletedDates(habit.completed_dates).includes(today)
    ).length;
    
    return {
      completed: completedToday,
      total: todayHabits.length
    };
  };

  const getStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let completedThisWeek = 0;
    let totalCompletions = 0;
    
    habits.forEach(habit => {
      let completedDates = [];
      if (Array.isArray(habit.completed_dates)) {
        completedDates = habit.completed_dates;
      } else if (typeof habit.completed_dates === 'string') {
        try {
          completedDates = JSON.parse(habit.completed_dates);
        } catch {
          completedDates = [];
        }
      }
      completedDates.forEach(date => {
        if (date >= weekAgo.toISOString().split('T')[0]) {
          completedThisWeek++;
        }
        totalCompletions++;
      });
    });
    
    const successRate = habits.length > 0 ? Math.round((completedThisWeek / (habits.length * 7)) * 100) : 0;
    
    return {
      completed: completedThisWeek,
      successRate,
      streak: Math.floor(totalCompletions / habits.length) || 0
    };
  };

  // Get category breakdown for donut chart
  const getCategoryBreakdown = () => {
    const categories = {
      health: { name: 'Health & Fitness', count: 0, color: '#10b981' },
      work: { name: 'Work & Productivity', count: 0, color: '#6366f1' },
      learning: { name: 'Learning & Growth', count: 0, color: '#f59e0b' },
      personal: { name: 'Personal Development', count: 0, color: '#f472b6' },
      other: { name: 'Other', count: 0, color: '#64748b' }
    };

    const today = new Date().toISOString().split('T')[0];
    
    habits.forEach(habit => {
      const habitStartDate = new Date(habit.created_at).toISOString().split('T')[0];
      if (today >= habitStartDate) {
        categories[habit.category].count++;
      }
    });

    // Filter out categories with no habits and calculate percentages
    const totalHabits = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);
    
    const breakdown = Object.values(categories)
      .filter(cat => cat.count > 0)
      .map(cat => ({
        ...cat,
        percentage: Math.round((cat.count / totalHabits) * 100)
      }));

    return breakdown;
  };

  // Get current streak for warnings
  const getCurrentStreak = () => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    let daysChecked = 0;
    const maxDaysToCheck = 365; // Prevent infinite loops
    
    while (daysChecked < maxDaysToCheck) {
      try {
        const dateString = currentDate.toISOString().split('T')[0];
        const dayHabits = habits.filter(habit => {
          const habitStartDate = new Date(habit.created_at).toISOString().split('T')[0];
          return dateString >= habitStartDate;
        });
        
        if (dayHabits.length === 0) {
          // No habits for this day, streak continues
          currentDate.setDate(currentDate.getDate() - 1);
          daysChecked++;
          continue;
        }
        
        const allCompleted = dayHabits.every(habit => 
          getCompletedDates(habit.completed_dates).includes(dateString)
        );
        
        if (allCompleted) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
          daysChecked++;
        } else {
          break;
        }
      } catch (error) {
        // If there's an invalid date error, break the loop
        console.warn('Invalid date encountered in streak calculation:', error);
        break;
      }
    }
    
    return streak;
  };

  // Get streak warning message
  const getStreakWarning = () => {
    const streak = getCurrentStreak();
    const today = new Date().toISOString().split('T')[0];
    const todayHabits = habits.filter(habit => {
      const habitStartDate = new Date(habit.created_at).toISOString().split('T')[0];
      return today >= habitStartDate;
    });
    
    if (todayHabits.length === 0) return null;
    
    const todayCompleted = todayHabits.filter(habit => 
      getCompletedDates(habit.completed_dates).includes(today)
    ).length;
    
    if (streak > 0 && todayCompleted < todayHabits.length) {
      const remaining = todayHabits.length - todayCompleted;
      const hoursLeft = 24 - new Date().getHours();
      
      if (hoursLeft <= 4) {
        return `🔥 ${streak}-day streak at risk! Complete ${remaining} more habit${remaining > 1 ? 's' : ''} in the next ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}!`;
      } else if (hoursLeft <= 8) {
        return `⚡ Don't break your ${streak}-day streak! ${remaining} habit${remaining > 1 ? 's' : ''} remaining today.`;
      } else {
        return `🔥 ${streak}-day streak active! Keep it going by completing your remaining habits.`;
      }
    }
    
    return null;
  };

  // Check user's premium status
  useEffect(() => {
    if (!isSignedIn || !user) return;
    
    const checkPremiumStatus = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium')
        .eq('email', user.primaryEmailAddress?.emailAddress)
        .single();
      
      if (!error && data) {
        setIsPremium(data.is_premium || false);
      }
    };
    
    checkPremiumStatus();
  }, [isSignedIn, user]);

  // Handle subscription checkout
  const handleSubscribe = async () => {
    if (!isSignedIn) {
      alert('Please sign in to subscribe');
      return;
    }
    
    setIsLoadingSubscription(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription process. Please try again.');
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const progress = getHabitProgress();
  const stats = getStats();
  const categoryBreakdown = getCategoryBreakdown();
  const currentStreak = getCurrentStreak();
  const streakWarning = getStreakWarning();

  // Replace generateQuote button handler with premium gating:
  const handleGenerateQuote = async () => {
    try {
      console.log('🔍 Starting quote generation...');
      console.log('User signed in:', isSignedIn);
      console.log('User object:', user);
      
      const response = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (response.status === 403) {
        setShowUpgradeModal(true);
        return;
      }
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Network or server error', details: e.message };
        }
        console.error('❌ API Error:', errorData);
        alert(`Failed to generate quote: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await response.json();
      console.log('✅ Quote generated successfully:', data);
      setCurrentQuote({ text: data.quote, author: data.author });
    } catch (error) {
      console.error('💥 Error generating quote:', error);
      alert('Error generating quote. Please try again.');
    }
  };

  // Replace addHabit logic with premium gating:
  const handleAddHabit = async (name, category, time, frequency) => {
    if (!isPremium && habits.length >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    await addHabit(name, category, time, frequency);
  };

  return (
    <>
      {/* Header with Logo and Theme Toggle */}
      <header style={{
        background: '#18191c',
        color: 'white',
        padding: '1rem 0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#ffffff'
          }}>FounderFlow</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            {isSignedIn && !isPremium && (
              <button 
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onClick={() => setShowUpgradeModal(true)}
              >
                <i className="fas fa-crown"></i>
                Upgrade to Premium
              </button>
            )}
            {isSignedIn && isPremium && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fas fa-crown"></i>
                Premium
              </div>
            )}
            <button 
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={toggleTheme}
            >
              <i className={currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
            </button>
            <span style={{ color: '#fff', fontWeight: 500, fontSize: '1rem' }}>
              {isSignedIn ? user?.primaryEmailAddress?.emailAddress : 'Guest'}
            </span>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button
                  style={{
                    background: '#6c47ff',
                    color: 'white',
                    borderRadius: '9999px',
                    fontWeight: 500,
                    fontSize: '1rem',
                    height: '40px',
                    padding: '0 1.5rem',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none'
                  }}
                >
                  Login / Sign Up
                </button>
              </SignInButton>
            ) : (
              <SignOutButton>
                <button
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    borderRadius: '9999px',
                    fontWeight: 500,
                    fontSize: '1rem',
                    height: '40px',
                    padding: '0 1.5rem',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none'
                  }}
                >
                  Sign Out
                </button>
              </SignOutButton>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'dashboard' ? (currentTheme === 'dark' ? '#ffffff' : '#18191c') : (currentTheme === 'dark' ? '#b3b3b3' : '#666666'),
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: activeTab === 'dashboard' ? '600' : '500',
            whiteSpace: 'nowrap',
            borderBottom: activeTab === 'dashboard' ? `3px solid ${currentTheme === 'dark' ? '#ffffff' : '#18191c'}` : 'none'
          }}
          onClick={() => switchTab('dashboard')}
        >
          <i className="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </button>
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'habits' ? (currentTheme === 'dark' ? '#ffffff' : '#18191c') : (currentTheme === 'dark' ? '#b3b3b3' : '#666666'),
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: activeTab === 'habits' ? '600' : '500',
            whiteSpace: 'nowrap',
            borderBottom: activeTab === 'habits' ? `3px solid ${currentTheme === 'dark' ? '#ffffff' : '#18191c'}` : 'none'
          }}
          onClick={() => switchTab('habits')}
        >
          <i className="fas fa-tasks"></i>
          <span>Habit Tracker</span>
        </button>
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'calendar' ? (currentTheme === 'dark' ? '#ffffff' : '#18191c') : (currentTheme === 'dark' ? '#b3b3b3' : '#666666'),
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: activeTab === 'calendar' ? '600' : '500',
            whiteSpace: 'nowrap',
            borderBottom: activeTab === 'calendar' ? `3px solid ${currentTheme === 'dark' ? '#ffffff' : '#18191c'}` : 'none'
          }}
          onClick={() => switchTab('calendar')}
        >
          <i className="fas fa-calendar-alt"></i>
          <span>Calendar</span>
        </button>
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'quotes' ? (currentTheme === 'dark' ? '#ffffff' : '#18191c') : (currentTheme === 'dark' ? '#b3b3b3' : '#666666'),
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: activeTab === 'quotes' ? '600' : '500',
            whiteSpace: 'nowrap',
            borderBottom: activeTab === 'quotes' ? `3px solid ${currentTheme === 'dark' ? '#ffffff' : '#18191c'}` : 'none'
          }}
          onClick={() => switchTab('quotes')}
        >
          <i className="fas fa-quote-left"></i>
          <span>Quote Generator</span>
        </button>
        <button 
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'library' ? (currentTheme === 'dark' ? '#ffffff' : '#18191c') : (currentTheme === 'dark' ? '#b3b3b3' : '#666666'),
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '0.5rem 0.5rem 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: activeTab === 'library' ? '600' : '500',
            whiteSpace: 'nowrap',
            borderBottom: activeTab === 'library' ? `3px solid ${currentTheme === 'dark' ? '#ffffff' : '#18191c'}` : 'none'
          }}
          onClick={() => switchTab('library')}
        >
          <i className="fas fa-heart"></i>
          <span>My Library</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 140px)'
      }}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'block', animation: 'fadeIn 0.3s ease' }}>
            {/* Daily Quote Section - Full Width */}
            <div style={{
              background: '#232428',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #232428',
              transition: 'all 0.3s ease',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                color: '#fff',
                marginBottom: '1.5rem',
                fontSize: '1.5rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>Today's Motivation</h2>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '1.3rem',
                  fontStyle: 'italic',
                  marginBottom: '1.5rem',
                  lineHeight: '1.6',
                  color: '#fff',
                  maxWidth: '800px',
                  margin: '0 auto 1.5rem'
                }}>{dailyQuote ? dailyQuote.text : "Success is not final, failure is not fatal: it is the courage to continue that counts."}</p>
                <span style={{
                  fontWeight: '600',
                  color: '#b3b3b3',
                  fontSize: '1.1rem'
                }}>— {dailyQuote ? dailyQuote.author : "Winston Churchill"}</span>
              </div>
            </div>

            {/* Bottom Row - Two Columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Habit Overview */}
              <div style={{
                background: '#232428',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                border: '1px solid #232428',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  color: '#fff',
                  marginBottom: '1rem',
                  fontSize: '1.25rem',
                  fontWeight: '600'
                }}>Today's Habits</h2>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#232428',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    <span>{progress.completed}/{progress.total}</span>
                  </div>
                  <p style={{ color: '#b3b3b3' }}>{progress.total === 0 ? 'No habits set' : `${progress.completed} of ${progress.total} completed`}</p>
                </div>
                <button style={{
                  background: '#232428',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }} onClick={() => switchTab('habits')}>
                  <i className="fas fa-plus"></i> Add Habits
                </button>
              </div>

              {/* Analytics & Streak Section */}
              <div style={{
                background: '#232428',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                border: '1px solid #232428',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  color: '#fff',
                  marginBottom: '1rem',
                  fontSize: '1.25rem',
                  fontWeight: '600'
                }}>Analytics & Streak</h2>
                
                {/* Streak Warning */}
                {streakWarning && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: '#fff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    {streakWarning}
                  </div>
                )}

                {/* Donut Chart */}
                {categoryBreakdown.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem'
                    }}>Habit Distribution by Category</h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      {/* Donut Chart */}
                      <div style={{
                        position: 'relative',
                        width: '120px',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="10"
                          />
                          {categoryBreakdown.map((category, index) => {
                            const totalPercentage = categoryBreakdown.reduce((sum, cat, i) => 
                              i < index ? sum + cat.percentage : sum, 0
                            );
                            const startAngle = (totalPercentage / 100) * 360;
                            const endAngle = ((totalPercentage + category.percentage) / 100) * 360;
                            
                            const x1 = 60 + 50 * Math.cos((startAngle - 90) * Math.PI / 180);
                            const y1 = 60 + 50 * Math.sin((startAngle - 90) * Math.PI / 180);
                            const x2 = 60 + 50 * Math.cos((endAngle - 90) * Math.PI / 180);
                            const y2 = 60 + 50 * Math.sin((endAngle - 90) * Math.PI / 180);
                            
                            const largeArcFlag = category.percentage > 50 ? 1 : 0;
                            
                            return (
                              <path
                                key={category.name}
                                d={`M ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                                fill="none"
                                stroke={category.color}
                                strokeWidth="10"
                                strokeLinecap="round"
                              />
                            );
                          })}
                        </svg>
                        <div style={{
                          position: 'absolute',
                          textAlign: 'center',
                          color: '#fff'
                        }}>
                          <div style={{
                            fontSize: '1.2rem',
                            fontWeight: '700'
                          }}>
                            {habits.filter(habit => {
                              const today = new Date().toISOString().split('T')[0];
                              const habitStartDate = new Date(habit.created_at).toISOString().split('T')[0];
                              return today >= habitStartDate;
                            }).length}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: '#b3b3b3'
                          }}>Total</div>
                        </div>
                      </div>

                      {/* Category Legend */}
                      <div style={{
                        flex: 1,
                        minWidth: '150px'
                      }}>
                        {categoryBreakdown.map(category => (
                          <div key={category.name} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                            fontSize: '0.8rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: category.color
                              }}></div>
                              <span style={{ color: '#fff' }}>{category.name}</span>
                            </div>
                            <span style={{ color: '#b3b3b3', fontWeight: '600' }}>
                              {category.count} ({category.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#374151', borderRadius: '0.5rem' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.25rem'
                    }}>{stats.completed}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#b3b3b3'
                    }}>This Week</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#374151', borderRadius: '0.5rem' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.25rem'
                    }}>{stats.successRate}%</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#b3b3b3'
                    }}>Success Rate</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#374151', borderRadius: '0.5rem' }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.25rem'
                    }}>{currentStreak}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#b3b3b3'
                    }}>Day Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Habit Tracker Tab */}
        {activeTab === 'habits' && (
          <div className="tab-content active">
            <div className="habits-container">
              <div className="habits-header">
                <h2>Daily Habit Tracker</h2>
                <div className="habits-actions">
                  <button className="view-calendar-btn habit-action-btn" onClick={() => switchTab('calendar')}>
                    <i className="fas fa-calendar-alt"></i> View Calendar
                  </button>
                  <button className="add-habit-btn habit-action-btn" onClick={() => setShowHabitModal(true)}>
                    <i className="fas fa-plus"></i> Add New Habit
                  </button>
                </div>
              </div>
              
              <div className="category-icons">
                <div 
                  className={`category-icon ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => filterHabitsByCategory('all')}
                >
                  <i className="fas fa-th-large"></i>
                  <span>All</span>
                </div>
                <div 
                  className={`category-icon ${activeCategory === 'health' ? 'active' : ''}`}
                  onClick={() => filterHabitsByCategory('health')}
                >
                  <i className="fas fa-dumbbell"></i>
                  <span>Health & Fitness</span>
                </div>
                <div 
                  className={`category-icon ${activeCategory === 'work' ? 'active' : ''}`}
                  onClick={() => filterHabitsByCategory('work')}
                >
                  <i className="fas fa-briefcase"></i>
                  <span>Work & Productivity</span>
                </div>
                <div 
                  className={`category-icon ${activeCategory === 'learning' ? 'active' : ''}`}
                  onClick={() => filterHabitsByCategory('learning')}
                >
                  <i className="fas fa-graduation-cap"></i>
                  <span>Learning & Growth</span>
                </div>
                <div 
                  className={`category-icon ${activeCategory === 'personal' ? 'active' : ''}`}
                  onClick={() => filterHabitsByCategory('personal')}
                >
                  <i className="fas fa-user-graduate"></i>
                  <span>Personal Development</span>
                </div>
                <div 
                  className={`category-icon ${activeCategory === 'other' ? 'active' : ''}`}
                  onClick={() => filterHabitsByCategory('other')}
                >
                  <i className="fas fa-ellipsis-h"></i>
                  <span>Other</span>
                </div>
              </div>
              
              <div className="habits-list">
                {habits.length === 0 ? (
                  <div className="empty-habits">
                    <i className="fas fa-clipboard-list"></i>
                    <h3>No habits yet</h3>
                    <p>Start building your daily routine by adding your first habit!</p>
                  </div>
                ) : (
                  habits
                    .filter(habit => activeCategory === 'all' || habit.category === activeCategory)
                    .map(habit => {
                      const today = new Date().toISOString().split('T')[0];
                      const isCompleted = getCompletedDates(habit.completed_dates).includes(today);
                      const streak = getCompletedDates(habit.completed_dates).length;
                      return (
                        <div key={habit.id} className={`habit-item ${isCompleted ? 'completed' : ''}`}>  
                          {/* Left: Info */}
                          <div className="habit-info">
                            <div className="habit-title-row">
                              <span className="habit-title">{habit.name}</span>
                            </div>
                            <div className={`category-badge category-${habit.category}`}>{categoryNames[habit.category]}</div>
                            <div className="habit-meta-row">
                              <span className="habit-meta"><i className="fas fa-clock"></i> {habit.time}</span>
                              <span className="habit-meta"><i className="fas fa-calendar"></i> {habit.frequency}</span>
                            </div>
                          </div>
                          {/* Center: Flame and Streak */}
                          <div className="habit-flame-center">
                            <span className="flame-icon"><i className="fas fa-fire"></i></span>
                            <span className="streak-text">{streak} day streak</span>
                          </div>
                          {/* Right: Actions */}
                          <div className="habit-actions">
                            <button 
                              className={`habit-btn complete-btn${isCompleted ? ' checked' : ''}`}
                              onClick={() => toggleHabitCompletion(habit.id)}
                              title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button 
                              className="habit-btn delete-btn"
                              onClick={() => deleteHabit(habit.id)}
                              title="Delete habit"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="tab-content active">
            <div className="calendar-container">
              <div className="calendar-header">
                <h2>Habit Calendar</h2>
                <div className="calendar-controls">
                  <button className="calendar-nav-btn" onClick={() => navigateMonth('prev')}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <h3>{getCurrentMonthName()}</h3>
                  <button className="calendar-nav-btn" onClick={() => navigateMonth('next')}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              
              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>
                <div className="calendar-days">
                  {generateCalendarDays().map((day, index) => (
                    <div
                      key={index}
                      className={`calendar-day ${
                        !day.isCurrentMonth ? 'other-month' : ''
                      } ${
                        day.isToday ? 'today' : ''
                      } ${
                        day.hasHabits ? 'has-habits' : ''
                      } ${
                        day.dayStatus === 'completed' ? 'completed' : ''
                      } ${
                        day.dayStatus === 'missed' ? 'missed' : ''
                      } ${
                        day.dayStatus === 'no-habits' ? 'no-habits' : ''
                      } ${
                        day.dayStatus === 'future' ? 'future' : ''
                      }`}
                      onClick={() => handleDayClick(day)}
                      title={`${day.date.toLocaleDateString()} - ${day.activeHabits.length} active habits, ${day.dayHabits.length} completed`}
                    >
                      {day.date.getDate()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quote Generator Tab */}
        {activeTab === 'quotes' && (
          <div className="tab-content active">
            <div className="quote-generator">
              <h2>Motivational Quote Generator</h2>
              <div className="quote-box">
                {currentQuote ? (
                  <div className="quote-content">
                    <p>{currentQuote.text}</p>
                    <span className="quote-author">— {currentQuote.author}</span>
                  </div>
                ) : (
                  <div className="quote-placeholder">
                    <i className="fas fa-quote-left"></i>
                    <p>Click "Generate" to get an inspiring quote!</p>
                  </div>
                )}
              </div>
              <div className="quote-actions">
                <button className="generate-btn" onClick={handleGenerateQuote}>
                  <i className="fas fa-magic"></i> Generate Quote
                </button>
                {currentQuote && (
                  <button 
                    className={`favorite-btn ${isCurrentQuoteFavorited() ? 'favorited' : ''}`}
                    onClick={toggleFavorite}
                  >
                    <i className={isCurrentQuoteFavorited() ? 'fas fa-heart' : 'far fa-heart'}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="tab-content active">
            <div className="library-container">
              <h2>My Quote Library</h2>
              <div id="favorites-container">
                {favorites.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-heart-broken"></i>
                    <h3>No favorites yet</h3>
                    <p>Generate some quotes and save your favorites here!</p>
                    <button className="secondary-btn" onClick={() => switchTab('quotes')}>
                      <i className="fas fa-magic"></i> Generate Quotes
                    </button>
                  </div>
                ) : (
                  <div className="favorites-list">
                    {favorites.map(favorite => (
                      <div key={favorite.id} className="favorite-item">
                        <div className="favorite-quote">{favorite.quote}</div>
                        <div className="favorite-author">— {favorite.author}</div>
                        <div className="favorite-actions">
                          <button 
                            className="habit-btn" 
                            onClick={() => removeFromFavorites(favorite.id)}
                            title="Remove from favorites"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Habit Modal */}
      {showHabitModal && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Habit</h3>
              <button className="close-modal" onClick={() => setShowHabitModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleAddHabit(
                formData.get('habit-name'),
                formData.get('habit-category'),
                formData.get('habit-time'),
                formData.get('habit-frequency')
              );
            }}>
              <div className="form-group">
                <label htmlFor="habit-name">Habit Name</label>
                <input type="text" id="habit-name" name="habit-name" placeholder="e.g., Morning Exercise" required />
              </div>
              <div className="form-group">
                <label htmlFor="habit-category">Category</label>
                <select id="habit-category" name="habit-category" required>
                  <option value="health">Health & Fitness</option>
                  <option value="work">Work & Productivity</option>
                  <option value="learning">Learning & Growth</option>
                  <option value="personal">Personal Development</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="habit-time">Preferred Time</label>
                <select id="habit-time" name="habit-time">
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="habit-frequency">Frequency</label>
                <select id="habit-frequency" name="habit-frequency" required>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays Only</option>
                  <option value="weekends">Weekends Only</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowHabitModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day Habits Modal */}
      {showDayModal && selectedDay && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Habits for {selectedDay.date.toLocaleDateString()}</h3>
              <button className="close-modal" onClick={() => setShowDayModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="day-habits-content">
              {habits.length === 0 ? (
                <p>No habits created yet. Add some habits to see them here!</p>
              ) : (
                habits.map(habit => {
                  const habitStartDate = new Date(habit.created_at).toISOString().split('T')[0];
                  const isActive = selectedDay.dateString >= habitStartDate;
                  const isCompleted = getCompletedDates(habit.completed_dates).includes(selectedDay.dateString);
                  
                  if (!isActive) {
                    return null; // Don't show habits that haven't started yet
                  }
                  
                  return (
                    <div key={habit.id} className={`day-habit-item ${isCompleted ? 'completed' : ''}`}>
                      <input
                        type="checkbox"
                        className="day-habit-checkbox"
                        checked={isCompleted}
                        onChange={() => toggleHabitCompletion(habit.id)}
                      />
                      <div className="day-habit-name">{habit.name}</div>
                      <div className="day-habit-category">{categoryNames[habit.category]}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowDayModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal show">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Upgrade to FounderFlow Premium</h3>
              <button className="close-modal" onClick={() => setShowUpgradeModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  <i className="fas fa-crown"></i>
                </div>
                <h2 style={{ color: '#18191c', marginBottom: '1rem' }}>Unlock Premium Features</h2>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>
                  Take your productivity to the next level with exclusive premium features
                </p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#18191c', marginBottom: '1rem' }}>Premium Features:</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className="fas fa-chart-line" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                    <span>Advanced Analytics & Insights</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className="fas fa-bell" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                    <span>Smart Notifications & Reminders</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className="fas fa-download" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                    <span>Export Data & Reports</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className="fas fa-palette" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                    <span>Custom Themes & Personalization</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className="fas fa-users" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                    <span>Team Collaboration Features</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className="fas fa-infinity" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                    <span>Unlimited Quote Generation</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#18191c', marginBottom: '0.5rem' }}>
                  $9.99/month
                </div>
                <div style={{ color: '#666' }}>
                  Cancel anytime • 7-day free trial
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Maybe Later
                </button>
                <button 
                  type="button" 
                  className="save-btn" 
                  onClick={handleSubscribe}
                  disabled={isLoadingSubscription}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {isLoadingSubscription ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-crown"></i>
                      Start Free Trial
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
