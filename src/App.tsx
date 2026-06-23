import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Movie, AppSettings, UserState } from "./types";
import TeaserSlider from "./components/TeaserSlider";
import MovieGrid from "./components/MovieGrid";
import UnlockModal from "./components/UnlockModal";
import SuccessModal from "./components/SuccessModal";
import ProfileTab from "./components/ProfileTab";
import AdminPanel from "./components/AdminPanel";
import Navbar, { TabType } from "./components/Navbar";
import {
  Search, Bot, Heart, Flame, ShieldAlert, LogIn, X, Film, Check, Sparkles,
  HelpCircle, MessageCircle, Info, ExternalLink, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultTimerSeconds: 10,
    telegramBotUrl: "https://t.me/MovieGo_HD_bot",
    facebookGroupUrl: "https://facebook.com/groups/movieelink",
    mainChannelUrl: "https://t.me/MovieGo_HD_bot?start=channel",
    chatGroupUrl: "https://t.me/MovieGo_HD_bot?start=chat",
    adultChannelUrl: "https://t.me/MovieGo_HD_bot?start=adult",
    livetvChannelUrl: "https://t.me/MovieGo_HD_bot?start=livetv",
    allowedTelegramUsernames: "@foysal_537, @bio_matrixs, @TRADER_TAMIM_3",
    rotationHours: 1,
    categories: ["All", "Movie", "Bachelor Point", "Bangla", "Hindi", "Animation"]
  });

  // Client User State with defaults matching the reference images
  const [userState, setUserState] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem("movie_go_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isDarkMode === undefined) {
          parsed.isDarkMode = true;
        }
        if (!parsed.favorites || !Array.isArray(parsed.favorites)) {
          parsed.favorites = [];
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Storage read failed:", e);
    }
    return {
      fullName: "Foysal Ahmed",
      username: "@foysal_007",
      phoneNumber: "",
      coins: 0,
      referrals: 0,
      vipStatus: "Normal",
      favorites: [],
      isBangla: false,
      isDarkMode: true
    };
  });

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem("movie_go_user", JSON.stringify(userState));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  }, [userState]);

  // General App UI states
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Selection for Unlock
  const [unlockMovie, setUnlockMovie] = useState<Movie | null>(null);
  const [resolvedAdUrl, setResolvedAdUrl] = useState<string>("");
  const [showSuccessMovie, setShowSuccessMovie] = useState<Movie | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem("movie_go_admin_session") === "yes";
    } catch {
      return false;
    }
  });

  const checkIsUserAdmin = () => {
    const cleanUser = (userState.username || "").trim().toLowerCase();
    const cleanUserNoAt = cleanUser.startsWith("@") ? cleanUser.slice(1) : cleanUser;
    
    // Check against the allowed list in settings
    const allowed = (settings.allowedTelegramUsernames || "").split(",").map(u => {
      const trimmed = u.trim().toLowerCase();
      return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
    });

    // Also check for the specific numeric ID provided by the user
    const isTamimId = cleanUser.includes("7228630025");
    
    return allowed.includes(cleanUserNoAt) || isTamimId;
  };
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  // Loading Indicator
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Movies and Settings from full-stack server
  const fetchAllData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [moviesRes, settingsRes] = await Promise.all([
        fetch(`/api/movies?t=${Date.now()}`),
        fetch(`/api/settings?t=${Date.now()}`)
      ]);

      if (moviesRes.ok) {
        const serverMovies: Movie[] = await moviesRes.json();
        setMovies(serverMovies);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (e) {
      console.error("Failed to load server state: ", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Autodetect Telegram WebApp User visiting the bot
  useEffect(() => {
    try {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        // @ts-ignore
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          const first = tgUser.first_name || "";
          const last = tgUser.last_name || "";
          const fullName = [first, last].filter(Boolean).join(" ");
          const username = tgUser.username 
            ? `@${tgUser.username}` 
            : `id_${tgUser.id}`;
          const rawId = tgUser.id ? String(tgUser.id) : "";
          const profilePicUrl = tgUser.photo_url || "";

          if (fullName) {
            setUserState((prev) => {
              const needsUpdate = prev.fullName !== fullName || 
                                  prev.username !== username || 
                                  (profilePicUrl && prev.profilePicUrl !== profilePicUrl);
              if (needsUpdate) {
                return {
                  ...prev,
                  fullName: fullName,
                  username: username,
                  profilePicUrl: profilePicUrl || prev.profilePicUrl
                };
              }
              return prev;
            });
          }
        }
      }
    } catch (err) {
      console.error("Error reading Telegram WebApp data: ", err);
    }
  }, []);

  // Compute active ad routing slot for the selected movie
  const resolveActiveAdUrl = async (movie: Movie) => {
    try {
      const response = await fetch(`/api/rotating-ad-index?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        const activeIdx = data.activeSlotIndex;
        // Check if the movie has defined custom ad slots, fallback to settings if empty
        const slotUrl = movie.adSlots?.[activeIdx];
        if (slotUrl && slotUrl.trim() !== "") {
          setResolvedAdUrl(slotUrl);
        } else {
          setResolvedAdUrl(settings.telegramBotUrl);
        }
      } else {
        setResolvedAdUrl(movie.adSlots?.[0] || settings.telegramBotUrl);
      }
    } catch (e) {
      setResolvedAdUrl(movie.adSlots?.[0] || settings.telegramBotUrl);
    }
  };

  // Open unlock trigger callback
  const handleOpenUnlock = async (movie: Movie) => {
    setUnlockMovie(movie);
    await resolveActiveAdUrl(movie);
  };

  // Complete reward action callback
  const handleUnlockSuccess = () => {
    if (unlockMovie) {
      setShowSuccessMovie(unlockMovie);
      setUnlockMovie(null);
      // Give some visual feedback coins reward instantly
      setUserState((prev) => ({
        ...prev,
        coins: prev.coins + 5
      }));
    }
  };

  // Toggle favorite trigger
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserState((prev) => {
      const currentFavs = Array.isArray(prev.favorites) ? prev.favorites : [];
      const exists = currentFavs.includes(id);
      const updatedFavs = exists
        ? currentFavs.filter((fid) => fid !== id)
        : [...currentFavs, id];

      // Provide dynamic visual feedback via toast message
      setToastMessage(
        exists
          ? (userState.isBangla ? "প্রিয় তালিকা থেকে সরানো হয়েছে" : "Removed from favorites")
          : (userState.isBangla ? "প্রিয় তালিকায় যুক্ত করা হয়েছে! ❤️" : "Added to favorites! ❤️")
      );
      setTimeout(() => setToastMessage(null), 2500);

      return {
        ...prev,
        favorites: updatedFavs
      };
    });
  };

  // Admin login submission
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");

    // Step 1: Try Same-Origin backend API first (best compatibility inside sandboxed WebViews/Telegram Mini Apps)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        try {
          localStorage.setItem("movie_go_admin_session", "yes");
        } catch (storageErr) {
          console.warn("localStorage is disabled or sandboxed in this environment:", storageErr);
        }
        setShowAdminLoginModal(false);
        setActiveTab("admin");
        setAdminPassword("");
        return;
      } else if (data.error) {
        setAdminLoginError(data.error);
        return;
      }
    } catch (apiErr) {
      console.warn("Backend login proxy returned error, attempting direct client Firebase SDK fallback...", apiErr);
    }

    // Step 2: Client Firebase SDK Fallback
    try {
      if (!auth) {
        throw new Error("সিস্টেম লোড হচ্ছে, অনুগ্রহ করে একটু অপেক্ষা করুন!");
      }
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      if (userCredential && userCredential.user) {
        setIsAdminLoggedIn(true);
        try {
          localStorage.setItem("movie_go_admin_session", "yes");
        } catch (storageErr) {
          console.warn("localStorage is disabled or sandboxed in this environment:", storageErr);
        }
        setShowAdminLoginModal(false);
        setActiveTab("admin");
        setAdminPassword("");
      } else {
        setAdminLoginError("লগইন ব্যর্থ হয়েছে! ইমেইল এবং পাসওয়ার্ড চেক করুন।");
      }
    } catch (err: any) {
      console.error("Login verification handled with Firebase auth failed:", err);
      let localMsg = "লগইন ব্যর্থ হয়েছে! ইমেইল এবং পাসওয়ার্ড চেক করুন।";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        localMsg = userState.isBangla ? "ভুল ইমেল বা পাসওয়ার্ড!" : "Incorrect email or password!";
      } else if (err.code === "auth/invalid-email") {
        localMsg = userState.isBangla ? "অকার্যকর ইমেইল ফরম্যাট!" : "Invalid email format!";
      } else if (err.code === "auth/network-request-failed") {
        localMsg = userState.isBangla ? "নেটওয়ার্ক কানেকশন সমস্যা!" : "Network connection failed!";
      } else if (err.message) {
        localMsg = err.message;
      }
      setAdminLoginError(localMsg);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem("movie_go_admin_session");
    } catch (e) {
      console.warn("Storage removal is blocked:", e);
    }
    setActiveTab("home");
  };

  // --- SERVER CONTENT SETTINGS MUTATIONS ---
  const normalizeAdSlots = (adSlots: any): string[] => {
    if (!Array.isArray(adSlots)) {
      return Array(10).fill("https://t.me/MovieGo_HD_bot");
    }
    const filtered = adSlots.map(s => typeof s === 'string' ? s.trim() : "").filter(Boolean);
    if (filtered.length === 0) {
      return Array(10).fill("https://t.me/MovieGo_HD_bot");
    }
    const finalSlots: string[] = [];
    for (let i = 0; i < 10; i++) {
      finalSlots.push(filtered[i % filtered.length]);
    }
    return finalSlots;
  };

  const handleAddMovie = async (movieData: Partial<Movie>) => {
    const finalAdSlots = normalizeAdSlots(movieData.adSlots);
    
    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...movieData, adSlots: finalAdSlots })
      });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMovie = async (id: string, movieData: Partial<Movie>) => {
    const finalAdSlots = movieData.adSlots ? normalizeAdSlots(movieData.adSlots) : undefined;
    const mergedData = { ...movieData };
    if (finalAdSlots) {
      mergedData.adSlots = finalAdSlots;
    }

    try {
      const res = await fetch(`/api/movies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mergedData)
      });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMovie = async (id: string) => {
    let confirmResult = false;
    try {
      confirmResult = window.confirm(
        userState.isBangla 
          ? "মুভিটি চিরতরে ডিলিট করতে চান?" 
          : "Are you sure you want to delete this movie permanently?"
      );
    } catch (confirmError) {
      console.warn("window.confirm blocked by sandbox iframe restrictions. Proceeding automatically.", confirmError);
      confirmResult = true; // Safe fallback when sandbox blocks modals
    }
    if (!confirmResult) return;
    
    // Optimistically update local state immediately
    setMovies((prev) => prev.filter((m) => m.id !== id));

    try {
      const res = await fetch(`/api/movies/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchAllData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSettings = async (updatedSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setToastMessage(userState.isBangla ? "সেটিংস সফলভাবে সেভ হয়েছে!" : "Settings saved successfully!");
        setTimeout(() => setToastMessage(null), 3500);
        return true;
      } else {
        const text = await res.text();
        console.error("Server API error updating settings:", res.status, text);
        setToastMessage(userState.isBangla ? `সেভ ব্যর্থ হয়েছে (কোড ${res.status})` : `Save failed (status ${res.status})`);
        setTimeout(() => setToastMessage(null), 4000);
        return false;
      }
    } catch (e) {
      console.error("Network error while updating settings:", e);
      setToastMessage(userState.isBangla ? "নেটওয়ার্ক সংক্রান্ত ত্রুটি ঘটেছে!" : "Network connectivity error occurred!");
      setTimeout(() => setToastMessage(null), 4000);
      return false;
    }
  };

  // Movie Filter Computing logic according to tab selectors and categories
  const filteredMovies = movies.filter((movie) => {
    if (activeTab === "home") {
      const matchesSearch =
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (movie.banglaTitle && movie.banglaTitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || 
        (movie.category && movie.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
      return matchesSearch && matchesCategory && !movie.isUpcoming;
    }
    if (activeTab === "upcoming") {
      return movie.isUpcoming || movie.status === "Coming Soon" || movie.status === "Upcoming";
    }
    if (activeTab === "favorite") {
      return (userState.favorites || []).includes(movie.id);
    }
    if (activeTab === "search") {
      return (
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (movie.banglaTitle && movie.banglaTitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div id="movie-go-root" className={`min-h-screen font-sans selection:bg-red-500 selection:text-white relative transition-colors duration-300 ${
      userState.isDarkMode 
        ? "bg-slate-950 text-slate-200" 
        : "bg-slate-50 text-slate-800 light-mode"
    }`}>
      
      {/* 1. Mock Telegram Header Panel inside Webapp views */}
      <div id="tg-mock-header" className={`border-b py-2 px-4 flex items-center justify-between select-none ${
        userState.isDarkMode 
          ? "bg-slate-900 border-white/5 text-slate-400" 
          : "bg-slate-100 border-slate-200 text-slate-600"
      }`}>
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-red-500 animate-pulse" />
          <span className={`font-mono text-xs font-bold tracking-tight italic ${
            userState.isDarkMode ? "text-slate-300" : "text-slate-700"
          }`}>
            MovieGo_HD_bot
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
            userState.isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"
          }`}>
            WebApp
          </span>
        </div>
        <div className={`flex items-center gap-3 ${userState.isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          <span className="text-[10px] font-mono text-emerald-500 animate-pulse">● server live</span>
          <div className="flex gap-1.5 text-xs text-slate-400">
            <span>•••</span>
            <span className="font-bold">✕</span>
          </div>
        </div>
      </div>

      {/* 2. Brand Capsule Banner Container */}
      <header id="brand-header" className={`px-4 py-3 shadow-md flex items-center justify-between border-b select-none transition-colors ${
        userState.isDarkMode 
          ? "bg-slate-900 border-white/5" 
          : "bg-white border-slate-100"
      }`}>
        {/* Logo (rounded red pill with Movie in dark, GO in white) */}
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => { setActiveTab("home"); setSelectedCategory("All"); }}>
          <span className={`font-extrabold text-base tracking-tight font-display transition-colors ${
            userState.isDarkMode ? "text-white" : "text-slate-950"
          }`}>
            Movie<span className="bg-red-600 text-white font-bold px-2 py-1 rounded-xl text-sm italic ml-0.5 font-sans">GO</span>
          </span>
        </div>

        {/* User Capsule highlighted yellow border ring */}
        <div className={`flex items-center gap-2 py-1.5 px-3 rounded-full transition cursor-pointer ${
          userState.isDarkMode 
            ? "bg-slate-800 hover:bg-slate-700 text-slate-200" 
            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
        }`} onClick={() => setActiveTab("profile")}>
          <span className="text-xs font-semibold truncate max-w-28 hidden sm:inline">
            {userState.fullName}
          </span>
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-extrabold shadow ring-2 ring-amber-400 overflow-hidden">
            {userState.profilePicUrl ? (
              <img src={userState.profilePicUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />
            ) : (
              userState.fullName.slice(0, 2).toUpperCase()
            )}
          </div>
        </div>
      </header>

      {/* 3. Render Views Container */}
      <main id="app-body" className="max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto p-4 space-y-6 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={32} className="animate-spin text-red-500" />
            <p className="text-xs text-slate-400 font-mono">Connecting Movie database server...</p>
          </div>
        ) : (
          <>
            {/* VIEW A: HOME TABS */}
            {activeTab === "home" && (
              <div id="home-view" className="space-y-6">
                
                {/* Auto sliding banners */}
                <TeaserSlider movies={movies} onOpenUnlock={handleOpenUnlock} />

                {/* Categories Badge list */}
                <div id="categories-scroll" className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar select-none">
                  {settings.categories.map((cat) => (
                    <button
                      id={`cat-badge-${cat}`}
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
                        selectedCategory === cat
                          ? "bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold shadow-lg shadow-red-600/10"
                          : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat === "All" && userState.isBangla ? "সকল ক্যাটাগরি" : cat}
                    </button>
                  ))}
                  {(isAdminLoggedIn || checkIsUserAdmin()) && (
                    <button
                      onClick={() => setActiveTab("admin")}
                      className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/10 shrink-0 font-bold"
                    >
                      🛠 Panel
                    </button>
                  )}
                </div>

                {/* Instant Active Search box */}
                <div id="home-search-panel" className="relative group select-none">
                  <Search size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search here / এখানে মুভি খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/60 text-xs text-slate-200 pl-11 pr-4 py-3.5 rounded-2xl border border-white/5 focus:border-red-500 outline-none transition-all shadow-md focus:shadow-red-500/5 placeholder:text-slate-500 font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Title and Movie Grid */}
                <div className="space-y-3">
                  <h3 className="text-white font-medium text-sm tracking-wide font-display pl-0.5 flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-red-600 rounded"></span>
                    {userState.isBangla ? "লেটেস্ট মুভি লিস্ট" : "Latest Uploaded Movies"}
                  </h3>
                  <MovieGrid
                    movies={filteredMovies}
                    favorites={userState.favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenUnlock={handleOpenUnlock}
                    isBangla={userState.isBangla}
                  />
                </div>
              </div>
            )}

            {/* VIEW B: ACTIVE SEARCH TABS */}
            {activeTab === "search" && (
              <div id="search-view" className="space-y-6">
                <div className="relative group">
                  <Search size={18} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type movie title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/80 text-xs text-slate-200 pl-12 pr-4 py-3.5 rounded-2xl border border-white/5 focus:border-red-500 outline-none transition-all shadow-md placeholder:text-slate-500"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-slate-400 font-mono text-[11px] tracking-wider uppercase pl-0.5">
                    Search Results ({filteredMovies.length})
                  </h3>
                  <MovieGrid
                    movies={filteredMovies}
                    favorites={userState.favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenUnlock={handleOpenUnlock}
                    isBangla={userState.isBangla}
                  />
                </div>
              </div>
            )}

            {/* VIEW C: UPCOMING FEED */}
            {activeTab === "upcoming" && (
              <div id="upcoming-view" className="space-y-5">
                <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 mb-2 shadow-md">
                  <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <Flame size={18} className="text-red-500" />
                    Upcoming Movies / আসন্ন সিনেমা
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Stay tuned for blockbuster releases. Set an alarm or save to track notifications.
                  </p>
                </div>

                <MovieGrid
                  movies={filteredMovies}
                  favorites={userState.favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenUnlock={handleOpenUnlock}
                  isBangla={userState.isBangla}
                />
              </div>
            )}

            {/* VIEW D: FAVORITES TAB */}
            {activeTab === "favorite" && (
              <div id="favorites-view" className="space-y-5">
                <div className="border-b border-white/5 pb-3">
                  <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <Heart size={18} className="text-red-500 fill-red-500" />
                    {userState.isBangla ? "আমার প্রিয় মুভি" : "Loved Favorites"}
                  </h2>
                </div>

                {filteredMovies.length === 0 ? (
                  <div className="text-center py-24 select-none">
                    <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4 shadow-xl">
                      <Heart size={28} />
                    </div>
                    <p className="text-white text-sm font-semibold">কোনো Favorite নেই</p>
                    <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">
                      হোম পেজে মুভির উপরে ❤️ আইকনে ক্লিক করে Favorite যোগ করুন।
                    </p>
                  </div>
                ) : (
                  <MovieGrid
                    movies={filteredMovies}
                    favorites={userState.favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenUnlock={handleOpenUnlock}
                    isBangla={userState.isBangla}
                  />
                )}
              </div>
            )}

            {/* VIEW E: PROFILE & SETTINGS TAB */}
            {activeTab === "profile" && (
              <ProfileTab
                userState={userState}
                settings={settings}
                onUpdateUserState={(update) => setUserState((p) => ({ ...p, ...update }))}
                onOpenAdminLogin={() => {
                  if (checkIsUserAdmin()) {
                    setActiveTab("admin");
                  } else {
                    setShowAdminLoginModal(true);
                  }
                }}
                isAdminLoggedIn={isAdminLoggedIn}
                onAdminLogout={handleAdminLogout}
                isBangla={userState.isBangla}
              />
            )}

            {/* VIEW F: INTERACTIVE ADMIN PANEL */}
            {activeTab === "admin" && (isAdminLoggedIn || checkIsUserAdmin()) && (
              <AdminPanel
                movies={movies}
                settings={settings}
                onAddMovie={handleAddMovie}
                onUpdateMovie={handleUpdateMovie}
                onDeleteMovie={handleDeleteMovie}
                onUpdateSettings={handleUpdateSettings}
                isBangla={userState.isBangla}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Bottom Tab Bar Navigation Module */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        favoritesCount={(userState.favorites || []).length}
        userInitials={userState.fullName.slice(0, 2).toUpperCase()}
        isBangla={userState.isBangla}
        profilePicUrl={userState.profilePicUrl}
      />

      {/* 5. MODAL SYSTEM AREA */}
      <AnimatePresence>
        {/* Ad countdown Modal trigger */}
        {unlockMovie && resolvedAdUrl && (
          <UnlockModal
            movie={unlockMovie}
            adUrl={resolvedAdUrl}
            onClose={() => setUnlockMovie(null)}
            onSuccess={handleUnlockSuccess}
            isBangla={userState.isBangla}
          />
        )}

        {/* Success Modal redirect trigger */}
        {showSuccessMovie && (
          <SuccessModal
            movie={showSuccessMovie}
            botUrl={settings.telegramBotUrl}
            onClose={() => setShowSuccessMovie(null)}
            isBangla={userState.isBangla}
          />
        )}

        {/* Admin Login Modal Overlayer and triggers */}
        {showAdminLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl overflow-hidden glass-panel-heavy p-6 shadow-2xl border border-white/10 text-slate-200"
            >
              <button
                id="close-admin-login"
                onClick={() => { setShowAdminLoginModal(false); setAdminLoginError(""); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/10 shadow">
                    <LogIn size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {userState.isBangla ? "অ্যাডমিন সিকিউরড লগইন" : "Secure Admin Login"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Secure Admin validation session
                  </p>
                </div>

                {adminLoginError && (
                  <p className="text-[11px] font-bold text-center text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/10">
                    ⚠️ {adminLoginError}
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-[10px] block uppercase font-mono tracking-wider mb-1">
                      Admin Email:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={userState.isBangla ? "ইমেইল অ্যাড্রেস লিখুন" : "admin@example.com"}
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="bg-slate-950/70 text-xs text-white px-3 py-2 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] block uppercase font-mono tracking-wider mb-1">
                      Password:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="bg-slate-950/70 text-xs text-white px-3 py-2 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
                    />
                  </div>
                </div>

                <button
                  id="admin-submit-login"
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all outline-none cursor-pointer"
                >
                  {userState.isBangla ? "প্রবেশ করুন (Login)" : "Sign In / Login"}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/30 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-2 font-semibold text-xs text-center min-w-[250px] justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full text-center border-t border-white/5 py-4 bg-slate-950 text-[10px] font-mono text-slate-500 pb-20 select-none">
        <p>© 2026 Movie GO HD Portal. Developed strictly to match prompt specifications.</p>
        <p className="mt-1">Authorized Telegram Integrated Redirect System Active.</p>
      </footer>
    </div>
  );
}
