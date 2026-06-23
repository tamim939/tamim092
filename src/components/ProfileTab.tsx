import React, { useState } from "react";
import { UserState, AppSettings } from "../types";
import {
  Coins, Users, User, Shield, Share2, Facebook, MessageCircle, Settings,
  Globe2, Moon, AppWindow, LogIn, LogOut, Check, Star, ExternalLink, RefreshCw, Send, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileTabProps {
  userState: UserState;
  settings: AppSettings;
  onUpdateUserState: (update: Partial<UserState>) => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  isBangla?: boolean;
}

export default function ProfileTab({
  userState,
  settings,
  onUpdateUserState,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onAdminLogout,
  isBangla = false
}: ProfileTabProps) {
  const [successMsg, setSuccessMsg] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  const cleanUser = (userState.username || "").trim().toLowerCase();
  const cleanUserNoAt = cleanUser.startsWith("@") ? cleanUser.slice(1) : cleanUser;

  const allowedUsernames = (settings.allowedTelegramUsernames || "")
    .split(",")
    .map(u => u.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

  const isUserAdminPrivileged = cleanUserNoAt === "bio_matrixs";

  const handleClaimReward = () => {
    setIsClaiming(true);
    setTimeout(() => {
      onUpdateUserState({ coins: userState.coins + 10 });
      setSuccessMsg(isBangla ? "১০ কয়েন জমানো হয়েছে! 🎉" : "+10 Coins Claimed! 🎉");
      setIsClaiming(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }, 800);
  };

  const handleLinkClick = (url: string) => {
    try {
      window.open(url, "_blank");
    } catch (e) {
      console.warn("window.open blocked, falling back to location.href", e);
      try {
        window.location.href = url;
      } catch (locErr) {
        console.error("Location fallback failed:", locErr);
      }
    }
  };

  return (
    <div id="profile-tab" className="space-y-6 select-none max-w-lg mx-auto pb-10">
      {/* 1. Header Profile Info */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full filter blur-xl"></div>
        {/* Rounded FA profile avatar wrapper */}
        <div className="w-16 h-16 rounded-full border-2 border-amber-400 p-0.5 shadow-xl shrink-0 overflow-hidden">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl font-display uppercase overflow-hidden">
            {userState.profilePicUrl ? (
              <img src={userState.profilePicUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover animate-fade-in" alt="Profile" />
            ) : (
              userState.fullName.slice(0, 2).toUpperCase()
            )}
          </div>
        </div>

        <div className="flex-grow min-w-0">
          <h3 className="text-white font-bold text-base font-display truncate">
            {userState.fullName}
          </h3>
          <p className="text-slate-400 font-mono text-xs truncate">
            {userState.username ? userState.username : (() => {
              const name = userState.fullName || "User";
              let hash = 0;
              for (let i = 0; i < name.length; i++) {
                hash = (hash << 5) - hash + name.charCodeAt(i);
                hash |= 0;
              }
              const code = Math.abs(hash) % 900000 + 100000;
              return `guest_${code}`;
            })()}
          </p>
          <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-bold rounded-full border border-indigo-500/20 cursor-pointer">
            <Shield size={10} />
            MovieGO Member
          </span>
        </div>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-600 text-white text-xs font-bold p-2.5 rounded-xl text-center"
        >
          {successMsg}
        </motion.div>
      )}

      {/* 2. Coins, Referrals, VIP Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 text-center shadow-lg hover:border-amber-500/30 transition-all">
          <div className="text-amber-400 font-display font-extrabold text-xl font-mono">
            {userState.coins}
          </div>
          <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5 uppercase tracking-wide">
            🪙 {isBangla ? "কয়েন" : "Coins"}
          </p>
        </div>

        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 text-center shadow-lg hover:border-purple-500/30 transition-all">
          <div className="text-purple-400 font-display font-extrabold text-xl font-mono">
            {userState.referrals}
          </div>
          <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5 uppercase tracking-wide">
            👥 {isBangla ? "রেফারাল" : "Referrals"}
          </p>
        </div>

        <div className="bg-slate-900/40 p-3 rounded-2xl border border-white/5 text-center shadow-lg hover:border-red-500/30 transition-all">
          <div className="text-red-400 font-display font-extrabold text-xs uppercase font-mono mt-1 select-none">
            {userState.vipStatus}
          </div>
          <p className="text-[10px] text-slate-400 font-medium font-mono mt-1.5 uppercase tracking-wide">
            ⭐ {isBangla ? "ভিআইপি স্ট্যাটাস" : "VIP Status"}
          </p>
        </div>
      </div>

      {/* 3. Coloured Grid Actions buttons as seen in Image 2 */}
      <div>
        <a
          id="movie-request-btn"
          href={settings.telegramBotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold p-3 text-left shadow-lg relative overflow-hidden group active:scale-95 transition cursor-pointer flex flex-col justify-center"
        >
          <div className="absolute right-4 bottom-1 text-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all">
            <AppWindow size={44} />
          </div>
          <span className="block text-xs text-white/80 font-mono">Interactive</span>
          <span className="block text-sm font-semibold mt-0.5">Movie Request 🎬</span>
        </a>
      </div>

      {/* 4. JOIN MY COMMUNITY LINKS SECTION */}
      <div className="space-y-2.5">
        <h4 className="text-slate-400 text-xs font-mono font-bold tracking-wider uppercase pl-1">
          🌐 JOIN MY COMMUNITY / জয়েন হোন
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <a
            id="join-fb-group"
            href={settings.facebookGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900 px-3 py-2.5 rounded-xl border border-white/5 hover:border-blue-500/40 text-left text-xs text-slate-200 transition font-medium cursor-pointer"
          >
            <Facebook size={16} className="text-blue-500 shrink-0" fill="currentColor" />
            <span className="truncate">Facebook Group</span>
          </a>

          <a
            id="join-main-ch"
            href={settings.mainChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900 px-3 py-2.5 rounded-xl border border-white/5 hover:border-blue-500/40 text-left text-xs text-slate-200 transition font-medium cursor-pointer"
          >
            <Send size={16} className="text-blue-400 shrink-0" />
            <span className="truncate">Main Channel</span>
          </a>

          <a
            id="join-chat-group"
            href={settings.chatGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900 px-3 py-2.5 rounded-xl border border-white/5 hover:border-green-500/30 text-left text-xs text-slate-200 transition font-medium cursor-pointer"
          >
            <MessageCircle size={16} className="text-emerald-500 shrink-0" />
            <span className="truncate">Chat Group</span>
          </a>

          <a
            id="join-backup-channel"
            href={settings.adultChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900 px-3 py-2.5 rounded-xl border border-white/5 hover:border-blue-500/40 text-left text-xs text-slate-200 transition font-medium cursor-pointer"
          >
            <Send size={16} className="text-blue-400 shrink-0" />
            <span className="truncate">{isBangla ? "ব্যাকআপ চ্যানেল" : "Backup Channel"}</span>
          </a>

          <a
            id="join-livetv-channel"
            href={settings.livetvChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900 px-3 py-2.5 rounded-xl border border-white/5 hover:border-blue-500/40 text-left text-xs text-slate-200 transition font-medium cursor-pointer"
          >
            <Send size={16} className="text-blue-400 shrink-0" />
            <span className="truncate">{isBangla ? "লাইভ টিভি চ্যানেল" : "LiveTV Channel"}</span>
          </a>
        </div>
      </div>

      {/* 5. SETTINGS LAYER */}
      <div className="bg-slate-900/40 p-4 rounded-3xl border border-white/5 shadow-2xl space-y-4">
        <h4 className="text-slate-400 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
          <Settings size={14} />
          ⚙ Settings & Preferences
        </h4>

        {/* Dark Mode Option Toggle */}
        <div className="flex items-center justify-between py-1 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${userState.isDarkMode ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-600"}`}>
              <Moon size={16} />
            </div>
            <div>
              <span className={`text-xs block font-semibold ${userState.isDarkMode ? "text-white" : "text-slate-900"}`}>
                {isBangla ? "Dark Theme / ডার্ক মুড" : "Dark Theme / ডার্ক মুড"}
              </span>
              <span className="text-slate-500 text-[10px] block">
                {userState.isDarkMode 
                  ? (isBangla ? "ডার্ক সিনেমা থিম সক্রিয় আছে" : "Cinema Slate Dark is ACTIVE")
                  : (isBangla ? "লাইট থিম সক্রিয় আছে" : "Premium Day Light is ACTIVE")
                }
              </span>
            </div>
          </div>
          {/* Custom Switch Toggle */}
          <div 
            id="theme-switch-btn"
            onClick={() => onUpdateUserState({ isDarkMode: !userState.isDarkMode })}
            className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 cursor-pointer shadow-md ${
              userState.isDarkMode ? "bg-amber-400 justify-end" : "bg-slate-300 justify-start"
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md transform active:scale-95 transition-transform"></div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between py-1 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Globe2 size={16} />
            </div>
            <div>
              <span className="text-white text-xs block font-semibold">
                {isBangla ? "অ্যাপের ভাষা" : "App Language"}
              </span>
              <span className="text-slate-500 text-[10px] block">
                {isBangla ? "ইংরেজি বা বাংলা" : "Toggle translate"}
              </span>
            </div>
          </div>

          <button
            id="toggle-lang"
            onClick={() => onUpdateUserState({ isBangla: !userState.isBangla })}
            className="bg-slate-950 text-slate-300 font-mono font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-white/10 hover:border-red-500 hover:text-white transition cursor-pointer"
          >
            {userState.isBangla ? "GB English" : "BD Bangla"}
          </button>
        </div>


        {/* Admin Login Trigger Button */}
        {isUserAdminPrivileged && (
          <div className="pt-2">
            {isAdminLoggedIn ? (
              <div className="flex justify-between items-center bg-red-500/10 p-3 rounded-2xl border border-red-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-xs text-red-400 font-bold font-mono">
                    Admin Active Session
                  </span>
                </div>
                <button
                  id="admin-logout-btn"
                  onClick={onAdminLogout}
                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            ) : (
              <button
                id="open-admin-login-modal"
                onClick={onOpenAdminLogin}
                className="w-full bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 border border-white/10 hover:border-red-500 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <LogIn size={14} className="text-red-500 animate-pulse" />
                {isBangla ? "অ্যাডমিন প্যানেল লগইন" : "Admin Panel"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
