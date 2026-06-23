import React, { useState, useEffect } from "react";
import { Movie, AppSettings } from "../types";
import {
  Save, Trash2, Edit2, PlusCircle, Settings, Film, Link, Clock, Check,
  AlertCircle, ShieldCheck, Eye, RefreshCw, Layers
} from "lucide-react";
import { motion } from "motion/react";

interface AdminPanelProps {
  movies: Movie[];
  settings: AppSettings;
  onAddMovie: (movie: Partial<Movie>) => void;
  onUpdateMovie: (id: string, movie: Partial<Movie>) => void;
  onDeleteMovie: (id: string) => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  isBangla?: boolean;
}

export default function AdminPanel({
  movies,
  settings,
  onAddMovie,
  onUpdateMovie,
  onDeleteMovie,
  onUpdateSettings,
  isBangla = false
}: AdminPanelProps) {
  // Tabs: 'settings', 'add_movie', 'manage_movies'
  const [activeSubTab, setActiveSubTab] = useState<"settings" | "add_movie" | "manage_movies">("manage_movies");

  // Selection for edit
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Movie>>({
    title: "",
    banglaTitle: "",
    category: "Movie",
    rating: "8.0",
    releaseDate: new Date().toLocaleDateString(),
    imageUrl: "",
    teaserImageUrl: "",
    downloadUrl: "",
    isBanner: false,
    isUpcoming: false,
    status: "Released",
    initials: "MB",
    timerSeconds: 10,
    adSlots: Array(10).fill("")
  });

  // Settings form state
  const [settingsFormData, setSettingsFormData] = useState<AppSettings>(settings);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load rotation status from server or calculate locally
  const [rotateDetails, setRotateDetails] = useState({ index: 0, minutesLeft: 180 });

  useEffect(() => {
    setSettingsFormData(settings);
  }, [settings]);

  useEffect(() => {
    // Poll the active ad-rotator index
    const fetchRotator = async () => {
      try {
        const response = await fetch("/api/rotating-ad-index");
        if (response.ok) {
          const data = await response.json();
          setRotateDetails({
            index: data.activeSlotIndex,
            minutesLeft: data.nextRotationMinutesLeft
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRotator();
    const interval = setInterval(fetchRotator, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEditSelect = (movie: Movie) => {
    setEditingMovieId(movie.id);
    setFormData(movie);
    setActiveSubTab("add_movie");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingMovieId) {
      onUpdateMovie(editingMovieId, formData);
      setEditingMovieId(null);
    } else {
      onAddMovie(formData);
    }

    // Reset formData
    setFormData({
      title: "",
      banglaTitle: "",
      category: "Movie",
      rating: "8.0",
      releaseDate: new Date().toLocaleDateString(),
      imageUrl: "",
      teaserImageUrl: "",
      downloadUrl: "",
      isBanner: false,
      isUpcoming: false,
      status: "Released",
      initials: "MB",
      timerSeconds: 10,
      adSlots: Array(10).fill("")
    });
    setActiveSubTab("manage_movies");
  };

  const handleAdSlotChange = (index: number, val: string) => {
    const slots = [...(formData.adSlots || Array(10).fill(""))];
    slots[index] = val;
    setFormData({ ...formData, adSlots: slots });
  };

  const handleAddCategory = async () => {
    setCategoryError("");
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    const exists = (settingsFormData.categories || []).some(
      (cat) => cat.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setCategoryError(isBangla ? "ক্যাটাগরি আগে থেকেই তৈরি করা আছে!" : "This category already exists!");
      return;
    }

    const updatedCategories = [...(settingsFormData.categories || []), trimmed];
    const newSettings = {
      ...settingsFormData,
      categories: updatedCategories
    };
    setSettingsFormData(newSettings);
    setNewCategoryInput("");
    
    // Auto-save category addition to database immediately
    setIsSaving(true);
    try {
      const success = await onUpdateSettings(newSettings);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    setCategoryError("");
    if (catToDelete === "All") {
      setCategoryError(isBangla ? "'All' ক্যাটাগরি ডিলেট করা যাবে না।" : "The 'All' category cannot be deleted.");
      return;
    }
    const updatedCategories = (settingsFormData.categories || []).filter((cat) => cat !== catToDelete);
    const newSettings = {
      ...settingsFormData,
      categories: updatedCategories
    };
    setSettingsFormData(newSettings);

    // Auto-save category deletion to database immediately
    setIsSaving(true);
    try {
      const success = await onUpdateSettings(newSettings);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    let finalSettings = { ...settingsFormData };
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      const exists = (finalSettings.categories || []).some(
        (cat) => cat.toLowerCase() === trimmed.toLowerCase()
      );
      if (!exists) {
        finalSettings.categories = [...(finalSettings.categories || []), trimmed];
        setSettingsFormData(finalSettings);
        setNewCategoryInput("");
      }
    }
    try {
      const success = await onUpdateSettings(finalSettings);
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="admin-panel" className="space-y-6 max-w-4xl mx-auto pb-10 select-none text-slate-200">
      {/* Header Badge */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 p-4 rounded-3xl border border-red-500/10 shadow-xl">
        <div className="p-3 bg-red-600/15 text-red-500 rounded-full">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight font-display flex items-center gap-2">
            Movie GO HD - Admin Dashboard
          </h2>
          <p className="text-slate-400 text-xs">
            Manage movie files, active countdown timers, community hooks, and ad slots.
          </p>
        </div>
      </div>

      {/* Dynamic Sub-Navigation Header tab options */}
      <div className="flex space-x-1.5 p-1 bg-slate-950/60 rounded-2xl border border-white/5">
        <button
          id="admin-subtab-settings"
          onClick={() => setActiveSubTab("settings")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl active:scale-98 transition ${
            activeSubTab === "settings" ? "bg-red-600 font-bold text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          ⚙ System Settings
        </button>
        <button
          id="admin-subtab-add"
          onClick={() => {
            setEditingMovieId(null);
            setActiveSubTab("add_movie");
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl active:scale-98 transition ${
            activeSubTab === "add_movie" ? "bg-red-600 font-bold text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          🎬 {editingMovieId ? "Edit Movie" : "Add New Movie"}
        </button>
        <button
          id="admin-subtab-manage"
          onClick={() => setActiveSubTab("manage_movies")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl active:scale-98 transition ${
            activeSubTab === "manage_movies" ? "bg-red-600 font-bold text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          📂 Manage Movies ({movies.length})
        </button>
      </div>

      {/* --- SUB TAB 1: SYSTEM SETTINGS --- */}
      {activeSubTab === "settings" && (
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl space-y-6 shadow-2xl">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-white font-bold text-sm tracking-wide font-display flex items-center gap-1.5">
              <Settings size={16} className="text-red-500" />
              Portal Control Configurations
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Tweak core constants used across the system globally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Default Countdown Seconds:
              </label>
              <input
                type="number"
                value={settingsFormData.defaultTimerSeconds || 10}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, defaultTimerSeconds: Number(e.target.value) })}
                className="bg-slate-950/60 font-mono text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Ad Rotation Interval Hours:
              </label>
              <select
                value={settingsFormData.rotationHours || 3}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, rotationHours: Number(e.target.value) })}
                className="bg-slate-950/60 font-mono text-xs text-white px-3 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              >
                <option value={1}>1 Hour (Hourly Cycle)</option>
                <option value={3}>3 Hours (3-Hourly Cycle)</option>
                <option value={6}>6 Hours (Slow cycle)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Telegram Bot Link URL:
              </label>
              <input
                type="text"
                value={settingsFormData.telegramBotUrl || ""}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, telegramBotUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Facebook Group URL:
              </label>
              <input
                type="text"
                value={settingsFormData.facebookGroupUrl || ""}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, facebookGroupUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Main Telegram Channel link:
              </label>
              <input
                type="text"
                value={settingsFormData.mainChannelUrl || ""}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, mainChannelUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Backup Channel Link:
              </label>
              <input
                type="text"
                value={settingsFormData.adultChannelUrl || ""}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, adultChannelUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                LiveTV Channel Link:
              </label>
              <input
                type="text"
                value={settingsFormData.livetvChannelUrl || ""}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, livetvChannelUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-300 text-xs font-semibold block mb-1.5 font-mono uppercase tracking-wider">
                Allowed Admin Telegram Usernames (comma separated):
              </label>
              <input
                type="text"
                placeholder="e.g. @foysal0, @foysalnet2"
                value={settingsFormData.allowedTelegramUsernames || ""}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, allowedTelegramUsernames: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Only Telegram users with usernames listed here can see and access the Admin Login trigger in their Profiles.
              </span>
            </div>

            {/* Category Management */}
            <div className="md:col-span-2 border-t border-white/5 pt-4">
              <label className="text-slate-300 text-xs font-semibold block mb-2 font-mono uppercase tracking-wider">
                🏷️ {isBangla ? "ক্যাটাগরি পরিবর্তন ও নিয়ন্ত্রণ" : "Manage Categories"}:
              </label>
              
              {/* Category tags displaying with remove options */}
              <div className="flex flex-wrap gap-2 mb-3 bg-slate-950/40 p-3.5 rounded-xl border border-white/5 animate-fade-in">
                {settingsFormData.categories?.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-white/10 text-white"
                  >
                    <span>{cat}</span>
                    {cat !== "All" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-white/5 cursor-pointer"
                        title={isBangla ? "ক্যাটাগরি ডিলিট করুন" : "Delete Category"}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {(!settingsFormData.categories || settingsFormData.categories.length === 0) && (
                  <span className="text-xs text-slate-500 font-mono">{isBangla ? "কোনো ক্যাটাগরি নেই" : "No categories active."}</span>
                )}
              </div>

              {/* Input for adding a new category */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={isBangla ? "নতুন ক্যাটাগরির নাম লিখুন (যেমন: অ্যাকশন, কমেডি, রোমান্টিক)" : "Enter new category name (e.g. Comic, Drama, South)"}
                    value={newCategoryInput}
                    onChange={(e) => {
                      setNewCategoryInput(e.target.value);
                      if (categoryError) setCategoryError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500 text-slate-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <PlusCircle size={14} />
                  {isBangla ? "যুক্ত করুন" : "Add"}
                </button>
              </div>

              {categoryError && (
                <p className="text-red-400 text-[11px] mt-1.5 font-mono flex items-center gap-1">
                  <AlertCircle size={12} />
                  {categoryError}
                </p>
              )}

              <span className="text-[10px] text-slate-500 block mt-2 font-mono leading-relaxed">
                {isBangla 
                  ? "* সফলভাবে ক্যাটাগরি যুক্ত বা পরিবর্তন করার পর নিচে 'Save Settings & Links' বাটনটিতে ক্লিক করে সিস্টেমে সেভ করতে হবে।" 
                  : "* Note: Click the 'Save Settings & Links' button below to apply and synchronize your category updates back to the database."}
              </span>
            </div>
          </div>

          {/* Ad rotation visual indicator info */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-red-500/10 space-y-3">
            <h4 className="text-white text-xs font-bold font-mono uppercase flex items-center gap-1">
              <Layers size={14} className="text-red-500" />
              Automated Rotator Diagnostics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 border border-white/5 p-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Current Server Slot</span>
                <span className="text-amber-400 font-bold font-mono text-base">Slot {rotateDetails.index + 1}</span>
              </div>
              <div className="bg-slate-900 border border-white/5 p-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Cycle Left</span>
                <span className="text-emerald-400 font-bold font-mono text-base">{rotateDetails.minutesLeft} mins</span>
              </div>
              <div className="col-span-2 md:col-span-1 bg-slate-900 border border-white/5 p-2 rounded-xl text-center flex items-center justify-center">
                <div className="text-[11px] text-slate-400 leading-tight">
                  Updates autonomously based on local hours!
                </div>
              </div>
            </div>
          </div>

          <button
            id="save-settings-btn"
            disabled={isSaving}
            onClick={saveSettings}
            className={`w-full bg-gradient-to-r ${
              saveSuccess 
                ? "from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700" 
                : "from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            } text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>{isBangla ? "সংরক্ষণ করা হচ্ছে..." : "Saving Settings..."}</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={16} />
                <span>{isBangla ? "সফলভাবে সেভ হয়েছে! ✓" : "Settings Saved Successfully! ✓"}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isBangla ? "সেটিংস ও লিংক সেভ করুন" : "Save Settings & Links"}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* --- SUB TAB 2: ADD / EDIT MOVIE --- */}
      {activeSubTab === "add_movie" && (
        <form onSubmit={handleFormSubmit} className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl space-y-6 shadow-2xl">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-white font-bold text-sm tracking-wide font-display flex items-center gap-1.5">
              <Film size={16} className="text-red-500" />
              {editingMovieId ? "Modify Movie Content" : "Create New Movie Entry"}
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Add a movie, configure custom countdown overrides, and define 10 custom ad targets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1">
                Movie Title (English/Standard ID):
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rockstar 2026 Movie HD"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1">
                Bangla Title / Custom Headline:
              </label>
              <input
                type="text"
                placeholder="e.g. রকস্টার মুভি। Rockstar 2026 Movie HD"
                value={formData.banglaTitle}
                onChange={(e) => setFormData({ ...formData, banglaTitle: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">
                  Category:
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-slate-950/60 text-xs text-white px-3 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
                >
                  {(settingsFormData.categories || settings.categories)
                    .filter((cat) => cat !== "All")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">
                  Rating (0.0 to 10.0):
                </label>
                <input
                  type="text"
                  placeholder="8.5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">
                  Publisher Initials:
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="MB / FA"
                  value={formData.initials}
                  onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                  className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">
                  Countdown Override:
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={formData.timerSeconds || ""}
                  onChange={(e) => setFormData({ ...formData, timerSeconds: e.target.value ? Number(e.target.value) : undefined })}
                  className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1">
                Release Date string:
              </label>
              <input
                type="text"
                placeholder="20 Jun 2026"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1">
                View/Download URL Callback:
              </label>
              <input
                type="text"
                placeholder="https://t.me/MovieGo_HD_bot?start=downloadLink"
                value={formData.downloadUrl}
                onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1">
                Card Cover Image URL:
              </label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-1">
                Wide Sliding Banner Teaser URL (Optional):
              </label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.teaserImageUrl}
                onChange={(e) => setFormData({ ...formData, teaserImageUrl: e.target.value })}
                className="bg-slate-950/60 text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/5 outline-none w-full focus:border-red-500"
              />
            </div>
          </div>

          {/* Banner / Upcoming options */}
          <div className="flex gap-4 p-4 bg-slate-950/40 rounded-2xl border border-white/5">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isBanner}
                onChange={(e) => setFormData({ ...formData, isBanner: e.target.checked })}
                className="accent-red-600 rounded"
              />
              Featured Banner Slider
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isUpcoming}
                onChange={(e) => setFormData({ ...formData, isUpcoming: e.target.checked })}
                className="accent-red-600 rounded"
              />
              Show in Upcoming
            </label>
          </div>

          {/* --- 10 AD SLOTS FOR THIS MOVIE --- */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-bold font-mono uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Link size={14} className="text-amber-500" />
              10 Ad Slot Rotators for this Movie Content
            </h4>
            <p className="text-[11px] text-slate-400">
              The system selects one link sequentially based on standard server hourly rotation. Configure clean target destinations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 10 }).map((_, index) => {
                const isCurrentActive = rotateDetails.index === index;
                return (
                  <div key={index} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${isCurrentActive ? "bg-amber-500/10 border border-amber-500/25" : "bg-slate-950/40 border border-white/5"}`}>
                    <span className="text-[11px] font-mono text-slate-400 w-16 shrink-0 flex items-center gap-1">
                      {isCurrentActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>}
                      Slot {index + 1}:
                    </span>
                    <input
                      type="text"
                      placeholder={`https://example.com/ad_path_target_${index + 1}`}
                      value={formData.adSlots?.[index] || ""}
                      onChange={(e) => handleAdSlotChange(index, e.target.value)}
                      className="bg-slate-950/70 text-xs text-white px-2 py-1.5 rounded-lg border border-white/5 outline-none flex-grow focus:border-amber-500 font-mono"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              id="submit-movie-btn"
              type="submit"
              className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2 text-xs"
            >
              <Check size={16} />
              {editingMovieId ? "Update Movie Details" : "Publish Movie Content"}
            </button>

            {editingMovieId && (
              <button
                id="cancel-edit-btn"
                type="button"
                onClick={() => {
                  setEditingMovieId(null);
                  setActiveSubTab("manage_movies");
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 rounded-xl text-xs transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* --- SUB TAB 3: MANAGE MOVIES --- */}
      {activeSubTab === "manage_movies" && (
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl space-y-4 shadow-2xl">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide font-display">
                Published Database Films
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Edit thumbnails, custom ad sets, status configurations, or delete.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm(isBangla ? "আপনি কি নিশ্চিত যে সব মুভি মুছে ফেলতে চান?" : "Are you sure you want to delete ALL movies? This cannot be undone.")) {
                    movies.forEach(m => onDeleteMovie(m.id));
                  }
                }}
                className="text-[10px] bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded-xl border border-red-500/10 font-mono transition-colors"
              >
                {isBangla ? "সব মুভি মুছুন" : "Clear All Movies"}
              </button>
              <span className="text-xs bg-red-600/10 text-red-500 px-3 py-1 rounded-xl border border-red-500/10 font-mono">
                Count: {movies.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {movies.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-white/5 hover:border-red-500/10 transition"
              >
                <img
                  src={m.imageUrl}
                  alt=""
                  className="w-10 h-14 object-cover rounded-lg"
                />
                <div className="flex-grow min-w-0">
                  <h4 className="text-white text-xs font-bold leading-snug truncate">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Category: <span className="text-red-400 font-bold">{m.category}</span> | Ad Slots Configured:{" "}
                    <span className="text-amber-400 font-bold">
                      {m.adSlots.filter((v) => v && v !== "").length}/10
                    </span>
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    {m.isBanner && (
                      <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase border border-red-500/10">
                        Banner
                      </span>
                    )}
                    {m.isUpcoming && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase border border-amber-500/10">
                        Upcoming
                      </span>
                    )}
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      ⏳ {m.timerSeconds || "Default"}s
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    id={`edit-movie-${m.id}`}
                    onClick={() => handleEditSelect(m)}
                    className="p-1.5 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                    title="Edit movie properties"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    id={`delete-movie-${m.id}`}
                    onClick={() => onDeleteMovie(m.id)}
                    className="p-1.5 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition"
                    title="Remove movie"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
