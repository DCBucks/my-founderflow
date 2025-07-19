"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";
import { supabase } from "./utils/supabaseClient";

function getCompletedDates(completed_dates) {
  if (Array.isArray(completed_dates)) return completed_dates;
  if (typeof completed_dates === "string") {
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
  const [currentTheme, setCurrentTheme] = useState("dark");
  const [currentQuote, setCurrentQuote] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [lastQuoteDate, setLastQuoteDate] = useState(null);
  const [isDailyQuoteLoading, setIsDailyQuoteLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [habits, setHabits] = useState([]);
  const [displayedMonth, setDisplayedMonth] = useState(new Date().getMonth());
  const [displayedYear, setDisplayedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeCategory, setActiveCategory] = useState("all");
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
    health: "Health & Fitness",
    work: "Work & Productivity",
    learning: "Learning & Growth",
    personal: "Personal Development",
    other: "Other",
  };

  const userKey =
    user?.id || user?.primaryEmailAddress?.emailAddress || "guest";

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("founderFlowTheme");
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.body.setAttribute("data-theme", savedTheme);
    } else {
      // Set default theme to dark
      setCurrentTheme("dark");
      document.body.setAttribute("data-theme", "dark");
    }
  }, []);

  // Define generateDailyQuote function before using it in useEffect
  const generateDailyQuote = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Use today's date as seed for consistent daily quote
    const seed = today.split("-").join("");

    // Use fallback quotes for consistent daily quotes (no API calls)
    const fallbackQuotes = [
      {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
      },
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      {
        text: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs",
      },
      {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
      },
      {
        text: "Don't watch the clock; do what it does. Keep going.",
        author: "Sam Levenson",
      },
      {
        text: "The only limit to our realization of tomorrow is our doubts of today.",
        author: "Franklin D. Roosevelt",
      },
      {
        text: "It does not matter how slowly you go as long as you do not stop.",
        author: "Confucius",
      },
      {
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
      },
      {
        text: "The best way to predict the future is to invent it.",
        author: "Alan Kay",
      },
      {
        text: "Your time is limited, don't waste it living someone else's life.",
        author: "Steve Jobs",
      },
      {
        text: "The only person you are destined to become is the person you decide to be.",
        author: "Ralph Waldo Emerson",
      },
      {
        text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
        author: "Zig Ziglar",
      },
      {
        text: "The mind is everything. What you think you become.",
        author: "Buddha",
      },
      {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi",
      },
      {
        text: "It always seems impossible until it's done.",
        author: "Nelson Mandela",
      },
      {
        text: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins",
      },
      {
        text: "Success is walking from failure to failure with no loss of enthusiasm.",
        author: "Winston Churchill",
      },
      {
        text: "The difference between ordinary and extraordinary is that little extra.",
        author: "Jimmy Johnson",
      },
      {
        text: "Don't count the days, make the days count.",
        author: "Muhammad Ali",
      },
      {
        text: "The only way to achieve the impossible is to believe it is possible.",
        author: "Charles Kingsleigh",
      },
    ];

    // Use the seed to consistently select the same quote for the day
    const index = parseInt(seed) % fallbackQuotes.length;
    const selectedQuote = fallbackQuotes[index];

    console.log(
      `📅 Generated daily quote for ${today}: "${selectedQuote.text}" - ${selectedQuote.author}`
    );

    setDailyQuote(selectedQuote);
    setLastQuoteDate(today);
    setIsDailyQuoteLoading(false);
  };

  // Initialize daily quote and check if it needs refreshing
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const savedDailyQuote = localStorage.getItem("founderFlowDailyQuote");
    const savedLastQuoteDate = localStorage.getItem("founderFlowLastQuoteDate");

    // Check if we have a saved quote and if it's from today
    if (savedDailyQuote && savedLastQuoteDate === today) {
      try {
        const parsedQuote = JSON.parse(savedDailyQuote);
        setDailyQuote(parsedQuote);
        setLastQuoteDate(today);
        setIsDailyQuoteLoading(false);
        console.log("📅 Using saved daily quote from today:", parsedQuote.text);
      } catch (error) {
        console.error("Error parsing saved daily quote:", error);
        // If parsing fails, generate a new quote
        console.log("🔄 Parsing failed, generating new daily quote");
        generateDailyQuote();
      }
    } else {
      // No saved quote or it's from a different day, generate a new one
      console.log(
        "🔄 No saved quote or different day, generating new daily quote"
      );
      generateDailyQuote();
    }
  }, []); // Only run once on component mount

  // Load habits from Supabase for the logged-in user
  useEffect(() => {
    if (!isSignedIn) {
      setHabits([]);
      return;
    }
    const fetchHabits = async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);
      if (!error) setHabits(data || []);
    };
    fetchHabits();
  }, [isSignedIn, user]);

  // Load favorites from Supabase for the logged-in user
  useEffect(() => {
    if (!isSignedIn) {
      setFavorites([]);
      return;
    }
    const fetchFavorites = async () => {
      setIsFavoritesLoading(true);
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setFavorites(data || []);
      setIsFavoritesLoading(false);
    };
    fetchFavorites();
  }, [isSignedIn, user]);

  // Theme, daily quote, lastQuoteDate localStorage logic
  useEffect(() => {
    localStorage.setItem("founderFlowTheme", currentTheme);
    if (dailyQuote) {
      localStorage.setItem("founderFlowDailyQuote", JSON.stringify(dailyQuote));
    }
    if (lastQuoteDate) {
      const dateObj =
        typeof lastQuoteDate === "string"
          ? new Date(lastQuoteDate)
          : lastQuoteDate;
      localStorage.setItem("founderFlowLastQuoteDate", dateObj.toISOString());
    }
  }, [currentTheme, dailyQuote, lastQuoteDate]);

  // Add useEffect to initialize quoteCount from localStorage (daily reset):
  // Remove quoteCount state and all localStorage logic
  // Remove useEffect for quoteCount
  // Update handleGenerateQuote to handle 403 from backend

  // Theme toggle functionality
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    document.body.setAttribute("data-theme", newTheme);
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
    const { data, error } = await supabase
      .from("habits")
      .insert([newHabit])
      .select();
    if (error) {
      alert("Error adding habit: " + error.message);
      return;
    }
    if (data) setHabits((prev) => [...prev, ...data]);
    setShowHabitModal(false);
  };

  // Toggle habit completion in Supabase
  const toggleHabitCompletion = async (habitId) => {
    const today = new Date().toISOString().split("T")[0];
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    console.log(`🔄 Toggling completion for habit: ${habit.name}`);
    console.log(`📅 Today's date: ${today}`);
    console.log(
      `📅 Current completed dates:`,
      getCompletedDates(habit.completed_dates)
    );

    const isCompleted = getCompletedDates(habit.completed_dates).includes(
      today
    );

    console.log(`✅ Is already completed today: ${isCompleted}`);

    const updatedDates = isCompleted
      ? getCompletedDates(habit.completed_dates).filter(
          (date) => date !== today
        )
      : [...getCompletedDates(habit.completed_dates), today];

    console.log(`📅 Updated completed dates:`, updatedDates);

    const { data, error } = await supabase
      .from("habits")
      .update({ completed_dates: updatedDates })
      .eq("id", habitId)
      .eq("user_id", user.id)
      .select();

    if (!error && data) {
      console.log(`💾 Successfully updated habit in database`);
      setHabits(
        habits.map((h) =>
          h.id === habitId ? { ...h, completed_dates: updatedDates } : h
        )
      );
    } else {
      console.error(`❌ Error updating habit:`, error);
    }
  };

  // Delete habit from Supabase
  const deleteHabit = async (habitId) => {
    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", user.id);
    if (!error) setHabits(habits.filter((habit) => habit.id !== habitId));
  };

  // Filter habits by category
  const filterHabitsByCategory = (category) => {
    setActiveCategory(category);
  };

  const generateQuote = async () => {
    console.log("generateQuote called");
    if (!isSignedIn) {
      alert("Please sign in to generate quotes");
      return;
    }
    const token = await getToken();
    console.log("Token value:", token);
    console.log("Sending fetch with headers:", {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });
    try {
      console.log("Generating quote...");
      const response = await fetch("/api/generate-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: "Network or server error", details: e.message };
        }
        console.error("API Error:", errorData);
        alert(
          `Failed to generate quote: ${errorData.error || "Unknown error"}`
        );
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

  // Add to favorites
  const addToFavorites = async (quote, author) => {
    if (!isSignedIn) {
      alert("Please sign in to save favorites");
      return;
    }

    const newFavorite = {
      user_id: user.id,
      quote,
      author,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("favorites")
      .insert([newFavorite])
      .select();

    if (error) {
      console.error("Error adding favorite:", error);
      alert("Failed to save favorite. Please try again.");
      return;
    }

    if (data) {
      setFavorites((prevFavorites) => [...prevFavorites, ...data]);
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (id) => {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing favorite:", error);
      alert("Failed to remove favorite. Please try again.");
      return;
    }

    setFavorites((prevFavorites) =>
      prevFavorites.filter((fav) => fav.id !== id)
    );
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (currentQuote) {
      const isFavorited = favorites.some(
        (fav) =>
          fav.quote === currentQuote.text && fav.author === currentQuote.author
      );

      if (isFavorited) {
        await removeFromFavorites(
          favorites.find(
            (fav) =>
              fav.quote === currentQuote.text &&
              fav.author === currentQuote.author
          ).id
        );
      } else {
        await addToFavorites(currentQuote.text, currentQuote.author);
      }
    }
  };

  // Check if current quote is favorited
  const isCurrentQuoteFavorited = () => {
    if (!currentQuote) return false;
    return favorites.some(
      (fav) =>
        fav.quote === currentQuote.text && fav.author === currentQuote.author
    );
  };

  // Calendar navigation
  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (displayedMonth === 0) {
        setDisplayedMonth(11);
        setDisplayedYear((prev) => prev - 1);
      } else {
        setDisplayedMonth((prev) => prev - 1);
      }
    } else {
      if (displayedMonth === 11) {
        setDisplayedMonth(0);
        setDisplayedYear((prev) => prev + 1);
      } else {
        setDisplayedMonth((prev) => prev + 1);
      }
    }
  };

  const goToToday = () => {
    setDisplayedMonth(new Date().getMonth());
    setDisplayedYear(new Date().getFullYear());
  };

  const getCurrentMonthName = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${months[displayedMonth]} ${displayedYear}`;
  };

  const getHabitsForDay = (date) => {
    return habits.filter((habit) =>
      getCompletedDates(habit.completed_dates).includes(date)
    );
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const firstDay = new Date(displayedYear, displayedMonth, 1);
    const lastDay = new Date(displayedYear, displayedMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dateString = currentDate.toISOString().split("T")[0];
      const isCurrentMonth = currentDate.getMonth() === displayedMonth;
      const isToday = dateString === today;
      const isPast = dateString < today;
      const isFuture = dateString > today;

      const dayHabits = getHabitsForDay(dateString);
      const hasHabits = dayHabits.length > 0;

      // Get habits that were active on this date (created before or on this date)
      const activeHabits = habits.filter((habit) => {
        const habitStartDate = new Date(habit.created_at)
          .toISOString()
          .split("T")[0];
        return dateString >= habitStartDate;
      });

      // Check if all active habits for this day are completed
      const allHabitsCompleted =
        activeHabits.length > 0 &&
        activeHabits.every((habit) =>
          getCompletedDates(habit.completed_dates).includes(dateString)
        );

      // Check if any active habits were missed (not completed)
      const hasMissedHabits = activeHabits.some(
        (habit) =>
          !getCompletedDates(habit.completed_dates).includes(dateString)
      );

      // Determine day status
      let dayStatus = "normal";
      if (isFuture) {
        dayStatus = "future";
      } else if (isPast) {
        if (activeHabits.length === 0) {
          dayStatus = "no-habits"; // Grey - no habits created yet
        } else if (allHabitsCompleted) {
          dayStatus = "completed"; // Green - all habits completed
        } else if (hasMissedHabits) {
          dayStatus = "missed"; // Red - missed habits
        } else {
          dayStatus = "no-habits"; // Grey - no habits created yet
        }
      } else {
        // Today
        if (activeHabits.length === 0) {
          dayStatus = "no-habits";
        } else if (allHabitsCompleted) {
          dayStatus = "completed";
        } else if (hasMissedHabits) {
          dayStatus = "missed";
        } else {
          dayStatus = "normal";
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
        activeHabits,
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
    const today = new Date().toISOString().split("T")[0];
    const todayHabits = habits.filter((habit) => {
      const habitDate = new Date(habit.created_at).toISOString().split("T")[0];
      return habitDate <= today;
    });

    const completedToday = todayHabits.filter((habit) =>
      getCompletedDates(habit.completed_dates).includes(today)
    ).length;

    return {
      completed: completedToday,
      total: todayHabits.length,
    };
  };

  const getStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    let completedThisWeek = 0;
    let totalCompletions = 0;

    habits.forEach((habit) => {
      let completedDates = [];
      if (Array.isArray(habit.completed_dates)) {
        completedDates = habit.completed_dates;
      } else if (typeof habit.completed_dates === "string") {
        try {
          completedDates = JSON.parse(habit.completed_dates);
        } catch {
          completedDates = [];
        }
      }
      completedDates.forEach((date) => {
        if (date >= weekAgo.toISOString().split("T")[0]) {
          completedThisWeek++;
        }
        totalCompletions++;
      });
    });

    const successRate =
      habits.length > 0
        ? Math.round((completedThisWeek / (habits.length * 7)) * 100)
        : 0;

    return {
      completed: completedThisWeek,
      successRate,
      streak: getCurrentStreak(),
    };
  };

  // Get category breakdown for donut chart
  const getCategoryBreakdown = () => {
    const categories = {
      health: { name: "Health & Fitness", count: 0, color: "#10b981" },
      work: { name: "Work & Productivity", count: 0, color: "#6366f1" },
      learning: { name: "Learning & Growth", count: 0, color: "#f59e0b" },
      personal: { name: "Personal Development", count: 0, color: "#f472b6" },
      other: { name: "Other", count: 0, color: "#64748b" },
    };

    const today = new Date().toISOString().split("T")[0];

    habits.forEach((habit) => {
      const habitStartDate = new Date(habit.created_at)
        .toISOString()
        .split("T")[0];
      if (today >= habitStartDate) {
        categories[habit.category].count++;
      }
    });

    // Filter out categories with no habits and calculate percentages
    const totalHabits = Object.values(categories).reduce(
      (sum, cat) => sum + cat.count,
      0
    );

    const breakdown = Object.values(categories)
      .filter((cat) => cat.count > 0)
      .map((cat) => ({
        ...cat,
        percentage: Math.round((cat.count / totalHabits) * 100),
      }));

    return breakdown;
  };

  // Get current streak for a specific habit
  const getHabitStreak = (habit) => {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    let streak = 0;
    let currentDate = new Date(today);
    let daysChecked = 0;
    const maxDaysToCheck = 365; // Prevent infinite loops
    const completedDates = getCompletedDates(habit.completed_dates);
    const habitStartDate = new Date(habit.created_at)
      .toISOString()
      .split("T")[0];

    console.log(`🔍 Streak calculation for habit: ${habit.name}`);
    console.log(`📅 Completed dates:`, completedDates);
    console.log(`📅 Habit start date:`, habitStartDate);
    console.log(`📅 Today:`, todayString);

    // Check if today is completed
    const isTodayCompleted = completedDates.includes(todayString);
    console.log(`✅ Is today completed: ${isTodayCompleted}`);

    // If today is not completed, start from yesterday to show the previous streak
    if (!isTodayCompleted) {
      currentDate.setDate(currentDate.getDate() - 1);
      console.log(`📅 Starting from yesterday since today is not completed`);
    }

    while (daysChecked < maxDaysToCheck) {
      try {
        const dateString = currentDate.toISOString().split("T")[0];

        // If we've gone before the habit was created, stop
        if (dateString < habitStartDate) {
          console.log(`⏹️  Stopping at ${dateString} - before habit creation`);
          break;
        }

        // Check if this habit was completed on this date
        if (completedDates.includes(dateString)) {
          streak++;
          console.log(`✅ ${dateString} - completed (streak: ${streak})`);
          currentDate.setDate(currentDate.getDate() - 1);
          daysChecked++;
        } else {
          // If the habit wasn't completed on this date, break the streak
          console.log(`❌ ${dateString} - not completed, breaking streak`);
          break;
        }
      } catch (error) {
        console.warn("Invalid date encountered in streak calculation:", error);
        break;
      }
    }

    console.log(`🔥 Final streak for ${habit.name}: ${streak}`);
    return streak;
  };

  // Get current streak for warnings (overall streak across all habits)
  const getCurrentStreak = () => {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    let streak = 0;
    let currentDate = new Date(today);
    let daysChecked = 0;
    const maxDaysToCheck = 365; // Prevent infinite loops

    // Check if today is completed
    const todayHabits = habits.filter((habit) => {
      const habitStartDate = new Date(habit.created_at)
        .toISOString()
        .split("T")[0];
      return todayString >= habitStartDate;
    });

    const isTodayCompleted =
      todayHabits.length > 0 &&
      todayHabits.every((habit) =>
        getCompletedDates(habit.completed_dates).includes(todayString)
      );

    // If today is not completed, start from yesterday to show the previous streak
    if (!isTodayCompleted) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (daysChecked < maxDaysToCheck) {
      try {
        const dateString = currentDate.toISOString().split("T")[0];
        const dayHabits = habits.filter((habit) => {
          const habitStartDate = new Date(habit.created_at)
            .toISOString()
            .split("T")[0];
          return dateString >= habitStartDate;
        });

        if (dayHabits.length === 0) {
          // No habits for this day, streak continues
          currentDate.setDate(currentDate.getDate() - 1);
          daysChecked++;
          continue;
        }

        const allCompleted = dayHabits.every((habit) =>
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
        console.warn("Invalid date encountered in streak calculation:", error);
        break;
      }
    }

    return streak;
  };

  // Get streak warning message
  const getStreakWarning = () => {
    const streak = getCurrentStreak();
    const today = new Date().toISOString().split("T")[0];
    const todayHabits = habits.filter((habit) => {
      const habitStartDate = new Date(habit.created_at)
        .toISOString()
        .split("T")[0];
      return today >= habitStartDate;
    });

    if (todayHabits.length === 0) return null;

    const todayCompleted = todayHabits.filter((habit) =>
      getCompletedDates(habit.completed_dates).includes(today)
    ).length;

    if (streak > 0 && todayCompleted < todayHabits.length) {
      const remaining = todayHabits.length - todayCompleted;
      const hoursLeft = 24 - new Date().getHours();

      if (hoursLeft <= 4) {
        return `🔥 ${streak}-day streak at risk! Complete ${remaining} more habit${
          remaining > 1 ? "s" : ""
        } in the next ${hoursLeft} hour${hoursLeft > 1 ? "s" : ""}!`;
      } else if (hoursLeft <= 8) {
        return `⚡ Don't break your ${streak}-day streak! ${remaining} habit${
          remaining > 1 ? "s" : ""
        } remaining today.`;
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
        .from("users")
        .select("is_premium")
        .eq("email", user.primaryEmailAddress?.emailAddress)
        .single();

      if (!error && data) {
        setIsPremium(data.is_premium || false);
      }
    };

    checkPremiumStatus();

    // Also check premium status when returning from Stripe (check URL params)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      // User just returned from successful payment, refresh premium status
      setTimeout(() => {
        checkPremiumStatus();
      }, 1000); // Small delay to ensure webhook has processed
    }
  }, [isSignedIn, user]);

  // Handle subscription checkout
  const handleSubscribe = async () => {
    if (!isSignedIn) {
      alert("Please sign in to subscribe");
      return;
    }

    setIsLoadingSubscription(true);
    try {
      console.log("🔄 Starting subscription process...");

      // Try secure V2 API first, fallback to simple API if needed
      let response = await fetch("/api/create-checkout-session-secure-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: includes Clerk session cookies
      });

      // If secure API fails with auth error, try simple API
      if (response.status === 401) {
        console.log("⚠️ Secure V2 API failed, trying simple API...");
        response = await fetch("/api/create-checkout-session-simple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userEmail:
              user.primaryEmailAddress?.emailAddress ||
              user.emailAddresses?.[0]?.emailAddress,
          }),
        });
      }

      console.log("📡 Subscription API response status:", response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: "Network or server error", details: e.message };
        }

        console.error("❌ Subscription API Error:", errorData);

        if (response.status === 401) {
          alert("Please sign in again to subscribe");
        } else if (response.status === 500) {
          alert(
            `Subscription error: ${
              errorData.error || "Server configuration issue"
            }`
          );
        } else {
          alert(
            `Failed to start subscription: ${
              errorData.error || "Unknown error"
            }`
          );
        }
        return;
      }

      const { url } = await response.json();
      console.log("✅ Checkout session created, redirecting to:", url);
      window.location.href = url;
    } catch (error) {
      console.error("💥 Subscription error:", error);
      alert("Failed to start subscription process. Please try again.");
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
      console.log("🔍 Starting quote generation...");
      console.log("User signed in:", isSignedIn);
      console.log("User object:", user);

      const response = await fetch("/api/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      console.log("📡 API Response status:", response.status);

      if (response.status === 403) {
        const errorData = await response.json();
        console.log(
          `Quote limit reached: ${errorData.used}/${errorData.limit} quotes used today`
        );
        setShowUpgradeModal(true);
        return;
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: "Network or server error", details: e.message };
        }
        console.error("❌ API Error:", errorData);
        // Don't show alert, just log the error
        return;
      }

      const data = await response.json();
      console.log("✅ Quote generated successfully:", data);
      setCurrentQuote({ text: data.quote, author: data.author });
    } catch (error) {
      console.error("💥 Error generating quote:", error);
      // Don't show alert, just log the error
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

  // Manual refresh premium status (for testing)
  const refreshPremiumStatus = async () => {
    if (!isSignedIn || !user) return;

    const { data, error } = await supabase
      .from("users")
      .select("is_premium")
      .eq("email", user.primaryEmailAddress?.emailAddress)
      .single();

    if (!error && data) {
      setIsPremium(data.is_premium || false);
      console.log("Premium status refreshed:", data.is_premium);
    } else {
      console.error("Error refreshing premium status:", error);
    }
  };

  return (
    <>
      {/* Header with Logo and Theme Toggle */}
      <header
        style={{
          background: "#18191c",
          color: "white",
          padding: "1rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Left: Theme toggle - positioned absolutely to touch left edge */}
        <button
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            color: "white",
            padding: "0.5rem",
            borderRadius: "50%",
            cursor: "pointer",
            transition: "all 0.3s ease",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            left: "1rem",
          }}
          onClick={toggleTheme}
        >
          <i
            className={currentTheme === "dark" ? "fas fa-sun" : "fas fa-moon"}
          ></i>
        </button>

        {/* Logo - positioned next to theme toggle */}
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "700",
            color: "#ffffff",
            margin: 0,
            marginLeft: "4rem",
          }}
        >
          FounderFlow
        </h1>

        {/* Right: User controls - positioned absolutely to touch right edge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            position: "absolute",
            right: "1rem",
          }}
        >
          {isSignedIn && !isPremium && (
            <button
              style={{
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontWeight: "600",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onClick={() => setShowUpgradeModal(true)}
            >
              <i className="fas fa-crown"></i>
              Upgrade to Premium
            </button>
          )}
          {isSignedIn && isPremium && (
            <div
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                fontWeight: "600",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <i className="fas fa-crown"></i>
              Premium
            </div>
          )}

          <span style={{ color: "#fff", fontWeight: 500, fontSize: "1rem" }}>
            {isSignedIn ? user?.primaryEmailAddress?.emailAddress : "Guest"}
          </span>
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button
                style={{
                  background: "#6c47ff",
                  color: "white",
                  borderRadius: "9999px",
                  fontWeight: "500",
                  fontSize: "1rem",
                  height: "40px",
                  padding: "0 1.5rem",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                Login / Sign Up
              </button>
            </SignInButton>
          ) : (
            <SignOutButton>
              <button
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  borderRadius: "9999px",
                  fontWeight: "500",
                  fontSize: "1rem",
                  height: "40px",
                  padding: "0 1.5rem",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                Sign Out
              </button>
            </SignOutButton>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          style={{
            background: "transparent",
            border: "none",
            color:
              activeTab === "dashboard"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : currentTheme === "dark"
                ? "#b3b3b3"
                : "#666666",
            padding: "1rem 1.5rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            borderRadius: "0.5rem 0.5rem 0 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
            borderBottom: `3px solid ${
              activeTab === "dashboard"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : "transparent"
            }`,
            minWidth: "fit-content",
          }}
          onClick={() => switchTab("dashboard")}
        >
          <i className="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </button>
        <button
          style={{
            background: "transparent",
            border: "none",
            color:
              activeTab === "habits"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : currentTheme === "dark"
                ? "#b3b3b3"
                : "#666666",
            padding: "1rem 1.5rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            borderRadius: "0.5rem 0.5rem 0 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
            borderBottom: `3px solid ${
              activeTab === "habits"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : "transparent"
            }`,
            minWidth: "fit-content",
          }}
          onClick={() => switchTab("habits")}
        >
          <i className="fas fa-tasks"></i>
          <span>Habit Tracker</span>
        </button>
        <button
          style={{
            background: "transparent",
            border: "none",
            color:
              activeTab === "calendar"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : currentTheme === "dark"
                ? "#b3b3b3"
                : "#666666",
            padding: "1rem 1.5rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            borderRadius: "0.5rem 0.5rem 0 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
            borderBottom: `3px solid ${
              activeTab === "calendar"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : "transparent"
            }`,
            minWidth: "fit-content",
          }}
          onClick={() => switchTab("calendar")}
        >
          <i className="fas fa-calendar-alt"></i>
          <span>Calendar</span>
        </button>
        <button
          style={{
            background: "transparent",
            border: "none",
            color:
              activeTab === "quotes"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : currentTheme === "dark"
                ? "#b3b3b3"
                : "#666666",
            padding: "1rem 1.5rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            borderRadius: "0.5rem 0.5rem 0 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
            borderBottom: `3px solid ${
              activeTab === "quotes"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : "transparent"
            }`,
            minWidth: "fit-content",
          }}
          onClick={() => switchTab("quotes")}
        >
          <i className="fas fa-quote-left"></i>
          <span>Quote Generator</span>
        </button>
        <button
          style={{
            background: "transparent",
            border: "none",
            color:
              activeTab === "library"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : currentTheme === "dark"
                ? "#b3b3b3"
                : "#666666",
            padding: "1rem 1.5rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            borderRadius: "0.5rem 0.5rem 0 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
            borderBottom: `3px solid ${
              activeTab === "library"
                ? currentTheme === "dark"
                  ? "#ffffff"
                  : "#18191c"
                : "transparent"
            }`,
            minWidth: "fit-content",
          }}
          onClick={() => switchTab("library")}
        >
          <i className="fas fa-heart"></i>
          <span>My Library</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem 1rem",
          minHeight: "calc(100vh - 140px)",
        }}
      >
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div style={{ display: "block", animation: "fadeIn 0.3s ease" }}>
            {/* Daily Quote Section - Full Width */}
            <div
              style={{
                background: "#232428",
                borderRadius: "1rem",
                padding: "2rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                border: "1px solid #232428",
                transition: "all 0.3s ease",
                marginBottom: "2rem",
              }}
            >
              <h2
                style={{
                  color: "#fff",
                  marginBottom: "1.5rem",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Today's Motivation
              </h2>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "1.3rem",
                    fontStyle: "italic",
                    marginBottom: "1.5rem",
                    lineHeight: "1.6",
                    color: "#fff",
                    maxWidth: "800px",
                    margin: "0 auto 1.5rem",
                  }}
                >
                  {!isDailyQuoteLoading && dailyQuote
                    ? dailyQuote.text
                    : "Loading today's motivation..."}
                </p>
                <span
                  style={{
                    fontWeight: "600",
                    color: "#b3b3b3",
                    fontSize: "1.1rem",
                  }}
                >
                  —{" "}
                  {!isDailyQuoteLoading && dailyQuote
                    ? dailyQuote.author
                    : "Loading..."}
                </span>
              </div>
            </div>

            {/* Bottom Row - Two Columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {/* Habit Overview */}
              <div
                style={{
                  background: "#232428",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  border: "1px solid #232428",
                  transition: "all 0.3s ease",
                }}
              >
                <h2
                  style={{
                    color: "#fff",
                    marginBottom: "1rem",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                  }}
                >
                  Today's Habits
                </h2>
                <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "#232428",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1rem",
                      color: "#fff",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                    }}
                  >
                    <span>
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                  <p style={{ color: "#b3b3b3" }}>
                    {progress.total === 0
                      ? "No habits set"
                      : `${progress.completed} of ${progress.total} completed`}
                  </p>
                </div>
                <button
                  style={{
                    background: "#232428",
                    color: "#fff",
                    border: "none",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontWeight: "600",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                  onClick={() => switchTab("habits")}
                >
                  <i className="fas fa-plus"></i> Add Habits
                </button>
              </div>

              {/* Analytics & Streak Section */}
              <div
                style={{
                  background: "#232428",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  border: "1px solid #232428",
                  transition: "all 0.3s ease",
                }}
              >
                <h2
                  style={{
                    color: "#fff",
                    marginBottom: "1rem",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                  }}
                >
                  Analytics & Streak
                </h2>

                {/* Streak Warning */}
                {streakWarning && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #f97316)",
                      color: "#fff",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      marginBottom: "1rem",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    {streakWarning}
                  </div>
                )}

                {/* Donut Chart */}
                {categoryBreakdown.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <h3
                      style={{
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: "600",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Habit Distribution by Category
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Donut Chart */}
                      <div
                        style={{
                          position: "relative",
                          width: "120px",
                          height: "120px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
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
                            const totalPercentage = categoryBreakdown.reduce(
                              (sum, cat, i) =>
                                i < index ? sum + cat.percentage : sum,
                              0
                            );
                            const startAngle = (totalPercentage / 100) * 360;
                            const endAngle =
                              ((totalPercentage + category.percentage) / 100) *
                              360;

                            const x1 =
                              60 +
                              50 *
                                Math.cos(((startAngle - 90) * Math.PI) / 180);
                            const y1 =
                              60 +
                              50 *
                                Math.sin(((startAngle - 90) * Math.PI) / 180);
                            const x2 =
                              60 +
                              50 * Math.cos(((endAngle - 90) * Math.PI) / 180);
                            const y2 =
                              60 +
                              50 * Math.sin(((endAngle - 90) * Math.PI) / 180);

                            const largeArcFlag =
                              category.percentage > 50 ? 1 : 0;

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
                        <div
                          style={{
                            position: "absolute",
                            textAlign: "center",
                            color: "#fff",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "700",
                            }}
                          >
                            {
                              habits.filter((habit) => {
                                const today = new Date()
                                  .toISOString()
                                  .split("T")[0];
                                const habitStartDate = new Date(
                                  habit.created_at
                                )
                                  .toISOString()
                                  .split("T")[0];
                                return today >= habitStartDate;
                              }).length
                            }
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "#b3b3b3",
                            }}
                          >
                            Total
                          </div>
                        </div>
                      </div>

                      {/* Category Legend */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: "150px",
                        }}
                      >
                        {categoryBreakdown.map((category) => (
                          <div
                            key={category.name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "0.5rem",
                              fontSize: "0.8rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "50%",
                                  backgroundColor: category.color,
                                }}
                              ></div>
                              <span style={{ color: "#fff" }}>
                                {category.name}
                              </span>
                            </div>
                            <span
                              style={{ color: "#b3b3b3", fontWeight: "600" }}
                            >
                              {category.count} ({category.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      padding: "0.75rem",
                      background: "#374151",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "700",
                        color: "#fff",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {stats.completed}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#b3b3b3",
                      }}
                    >
                      This Week
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "0.75rem",
                      background: "#374151",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "700",
                        color: "#fff",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {stats.successRate}%
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#b3b3b3",
                      }}
                    >
                      Success Rate
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: "0.75rem",
                      background: "#374151",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "700",
                        color: "#fff",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {currentStreak}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#b3b3b3",
                      }}
                    >
                      Day Streak
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Habit Tracker Tab */}
        {activeTab === "habits" && (
          <div className="tab-content active">
            <div className="habits-container">
              <div className="habits-header">
                <h2>Daily Habit Tracker</h2>
                <div className="habits-actions">
                  <button
                    className="view-calendar-btn habit-action-btn"
                    onClick={() => switchTab("calendar")}
                  >
                    <i className="fas fa-calendar-alt"></i> View Calendar
                  </button>
                  <button
                    className="add-habit-btn habit-action-btn"
                    onClick={() => setShowHabitModal(true)}
                  >
                    <i className="fas fa-plus"></i> Add New Habit
                  </button>
                </div>
              </div>

              <div className="category-icons">
                <div
                  className={`category-icon ${
                    activeCategory === "all" ? "active" : ""
                  }`}
                  onClick={() => filterHabitsByCategory("all")}
                >
                  <i className="fas fa-th-large"></i>
                  <span>All</span>
                </div>
                <div
                  className={`category-icon ${
                    activeCategory === "health" ? "active" : ""
                  }`}
                  onClick={() => filterHabitsByCategory("health")}
                >
                  <i className="fas fa-dumbbell"></i>
                  <span>Health & Fitness</span>
                </div>
                <div
                  className={`category-icon ${
                    activeCategory === "work" ? "active" : ""
                  }`}
                  onClick={() => filterHabitsByCategory("work")}
                >
                  <i className="fas fa-briefcase"></i>
                  <span>Work & Productivity</span>
                </div>
                <div
                  className={`category-icon ${
                    activeCategory === "learning" ? "active" : ""
                  }`}
                  onClick={() => filterHabitsByCategory("learning")}
                >
                  <i className="fas fa-graduation-cap"></i>
                  <span>Learning & Growth</span>
                </div>
                <div
                  className={`category-icon ${
                    activeCategory === "personal" ? "active" : ""
                  }`}
                  onClick={() => filterHabitsByCategory("personal")}
                >
                  <i className="fas fa-user-graduate"></i>
                  <span>Personal Development</span>
                </div>
                <div
                  className={`category-icon ${
                    activeCategory === "other" ? "active" : ""
                  }`}
                  onClick={() => filterHabitsByCategory("other")}
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
                    <p>
                      Start building your daily routine by adding your first
                      habit!
                    </p>
                  </div>
                ) : (
                  habits
                    .filter(
                      (habit) =>
                        activeCategory === "all" ||
                        habit.category === activeCategory
                    )
                    .map((habit) => {
                      const today = new Date().toISOString().split("T")[0];
                      const isCompleted = getCompletedDates(
                        habit.completed_dates
                      ).includes(today);
                      const streak = getHabitStreak(habit);
                      return (
                        <div
                          key={habit.id}
                          className={`habit-item ${
                            isCompleted ? "completed" : ""
                          }`}
                        >
                          {/* Left: Info */}
                          <div className="habit-info">
                            <div className="habit-title-row">
                              <span className="habit-title">{habit.name}</span>
                            </div>
                            <div
                              className={`category-badge category-${habit.category}`}
                            >
                              {categoryNames[habit.category]}
                            </div>
                            <div className="habit-meta-row">
                              <span className="habit-meta">
                                <i className="fas fa-clock"></i> {habit.time}
                              </span>
                              <span className="habit-meta">
                                <i className="fas fa-calendar"></i>{" "}
                                {habit.frequency}
                              </span>
                            </div>
                          </div>
                          {/* Center: Flame and Streak */}
                          <div className="habit-flame-center">
                            <span className="flame-icon">
                              <i className="fas fa-fire"></i>
                            </span>
                            <span className="streak-text">
                              {streak} day streak
                            </span>
                          </div>
                          {/* Right: Actions */}
                          <div className="habit-actions">
                            <button
                              className={`habit-btn complete-btn${
                                isCompleted ? " checked" : ""
                              }`}
                              onClick={() => toggleHabitCompletion(habit.id)}
                              title={
                                isCompleted
                                  ? "Mark as incomplete"
                                  : "Mark as complete"
                              }
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
        {activeTab === "calendar" && (
          <div className="tab-content active">
            <div className="calendar-container">
              <div className="calendar-header">
                <h2>Habit Calendar</h2>
                <div className="calendar-controls">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => navigateMonth("prev")}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <h3>{getCurrentMonthName()}</h3>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => navigateMonth("next")}
                  >
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
                        !day.isCurrentMonth ? "other-month" : ""
                      } ${day.isToday ? "today" : ""} ${
                        day.hasHabits ? "has-habits" : ""
                      } ${day.dayStatus === "completed" ? "completed" : ""} ${
                        day.dayStatus === "missed" ? "missed" : ""
                      } ${day.dayStatus === "no-habits" ? "no-habits" : ""} ${
                        day.dayStatus === "future" ? "future" : ""
                      }`}
                      onClick={() => handleDayClick(day)}
                      title={`${day.date.toLocaleDateString()} - ${
                        day.activeHabits.length
                      } active habits, ${day.dayHabits.length} completed`}
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
        {activeTab === "quotes" && (
          <div className="tab-content active">
            <div className="quote-generator">
              <div className="quote-generator-header">
                <h2>
                  <i className="fas fa-sparkles"></i> Motivational Quote
                  Generator
                </h2>
                <p className="quote-generator-subtitle">
                  Get inspired with powerful quotes from legendary entrepreneurs
                  and leaders
                </p>
              </div>

              <div className="quote-display-container">
                <div className="quote-box">
                  {currentQuote ? (
                    <div className="quote-content">
                      <div className="quote-icon">
                        <i className="fas fa-quote-left"></i>
                      </div>
                      <p className="quote-text">{currentQuote.text}</p>
                      <div className="quote-author-section">
                        <span className="quote-author">
                          — {currentQuote.author}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="quote-placeholder">
                      <div className="placeholder-icon">
                        <i className="fas fa-lightbulb"></i>
                      </div>
                      <h3>Ready for Inspiration?</h3>
                      <p>
                        Click the button below to generate a powerful
                        motivational quote!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="quote-actions">
                <button
                  className="generate-btn"
                  onClick={handleGenerateQuote}
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    padding: "1rem 2rem",
                    borderRadius: "50px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontWeight: "600",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                    minWidth: "200px",
                    justifyContent: "center",
                  }}
                >
                  <i className="fas fa-magic"></i> Generate Quote
                </button>

                {currentQuote && (
                  <button
                    className="favorite-btn"
                    onClick={toggleFavorite}
                    style={{
                      background: isCurrentQuoteFavorited()
                        ? "linear-gradient(135deg, #ff6b6b, #ee5a52)"
                        : "rgba(255, 255, 255, 0.1)",
                      border: "2px solid",
                      borderColor: isCurrentQuoteFavorited()
                        ? "#ff6b6b"
                        : "rgba(255, 255, 255, 0.2)",
                      color: isCurrentQuoteFavorited() ? "white" : "#b3b3b3",
                      padding: "1rem",
                      borderRadius: "50%",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      width: "50px",
                      height: "50px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                    }}
                  >
                    <i
                      className={
                        isCurrentQuoteFavorited()
                          ? "fas fa-heart"
                          : "far fa-heart"
                      }
                    ></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Library Tab */}
        {activeTab === "library" && (
          <div className="tab-content active">
            <div className="library-container">
              <h2>My Quote Library</h2>
              <div id="favorites-container">
                {!isSignedIn ? (
                  <div className="empty-state">
                    <i className="fas fa-sign-in-alt"></i>
                    <h3>Sign in to access your favorites</h3>
                    <p>Your saved quotes will be available once you sign in!</p>
                  </div>
                ) : isFavoritesLoading ? (
                  <div className="empty-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <h3>Loading your favorites...</h3>
                    <p>Please wait while we fetch your saved quotes.</p>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-heart-broken"></i>
                    <h3>No favorites yet</h3>
                    <p>Generate some quotes and save your favorites here!</p>
                    <button
                      className="secondary-btn"
                      onClick={() => switchTab("quotes")}
                    >
                      <i className="fas fa-magic"></i> Generate Quotes
                    </button>
                  </div>
                ) : (
                  <div className="favorites-list">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="favorite-item">
                        <div className="favorite-quote">{favorite.quote}</div>
                        <div className="favorite-author">
                          — {favorite.author}
                        </div>
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
              <button
                className="close-modal"
                onClick={() => setShowHabitModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddHabit(
                  formData.get("habit-name"),
                  formData.get("habit-category"),
                  formData.get("habit-time"),
                  formData.get("habit-frequency")
                );
              }}
            >
              <div className="form-group">
                <label htmlFor="habit-name">Habit Name</label>
                <input
                  type="text"
                  id="habit-name"
                  name="habit-name"
                  placeholder="e.g., Morning Exercise"
                  required
                />
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
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowHabitModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Habit
                </button>
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
              <button
                className="close-modal"
                onClick={() => setShowDayModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="day-habits-content">
              {habits.length === 0 ? (
                <p>No habits created yet. Add some habits to see them here!</p>
              ) : (
                habits.map((habit) => {
                  const habitStartDate = new Date(habit.created_at)
                    .toISOString()
                    .split("T")[0];
                  const isActive = selectedDay.dateString >= habitStartDate;
                  const isCompleted = getCompletedDates(
                    habit.completed_dates
                  ).includes(selectedDay.dateString);

                  if (!isActive) {
                    return null; // Don't show habits that haven't started yet
                  }

                  return (
                    <div
                      key={habit.id}
                      className={`day-habit-item ${
                        isCompleted ? "completed" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="day-habit-checkbox"
                        checked={isCompleted}
                        onChange={() => toggleHabitCompletion(habit.id)}
                      />
                      <div className="day-habit-name">{habit.name}</div>
                      <div className="day-habit-category">
                        {categoryNames[habit.category]}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowDayModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal show">
          <div
            className="modal-content"
            style={{
              maxWidth: "600px",
              background: "#18191c",
              color: "#ffffff",
            }}
          >
            <div
              className="modal-header"
              style={{
                background: "#18191c",
                color: "#ffffff",
                borderBottom: "1px solid #333",
              }}
            >
              <h3 style={{ color: "#ffffff" }}>
                Upgrade to FounderFlow Premium
              </h3>
              <button
                className="close-modal"
                onClick={() => setShowUpgradeModal(false)}
                style={{ color: "#ffffff" }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: "2rem", background: "#18191c" }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h1
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    margin: "0 auto 1rem",
                    textAlign: "center",
                  }}
                >
                  FounderFlow
                </h1>
                <h2 style={{ color: "#ffffff", marginBottom: "1rem" }}>
                  Unlock Premium Features
                </h2>
                <p style={{ color: "#b3b3b3", fontSize: "1.1rem" }}>
                  Take your productivity to the next level with exclusive
                  premium features
                </p>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ color: "#ffffff", marginBottom: "1rem" }}>
                  Premium Features:
                </h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <i
                      className="fas fa-infinity"
                      style={{ color: "#10b981", fontSize: "1.2rem" }}
                    ></i>
                    <span style={{ color: "#ffffff" }}>
                      Unlimited Quote Generation
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <i
                      className="fas fa-list-check"
                      style={{ color: "#10b981", fontSize: "1.2rem" }}
                    ></i>
                    <span style={{ color: "#ffffff" }}>
                      Unlimited Habit Creation
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#2a2b2e",
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  textAlign: "center",
                  marginBottom: "2rem",
                  border: "1px solid #333",
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#ffffff",
                    marginBottom: "0.5rem",
                  }}
                >
                  $9.99/month
                </div>
                <div style={{ color: "#b3b3b3" }}>
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
                    background: "linear-gradient(135deg, #f59e0b, #f97316)",
                    color: "white",
                    border: "none",
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
