import React from "react";
import { Home, Search, Calendar, Heart, User } from "lucide-react";

export type TabType = "home" | "search" | "upcoming" | "favorite" | "profile" | "admin";

interface NavbarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  favoritesCount: number;
  userInitials: string;
  isBangla?: boolean;
  profilePicUrl?: string;
}

export default function Navbar({ activeTab, onChangeTab, favoritesCount, userInitials, isBangla = false, profilePicUrl }: NavbarProps) {
  const tabs = [
    { id: "home", labelNoBangla: "Home", labelBangla: "হোম", icon: Home },
    { id: "search", labelNoBangla: "Search", labelBangla: "সার্চ", icon: Search },
    { id: "upcoming", labelNoBangla: "Upcoming", labelBangla: "আসন্ন", icon: Calendar },
    { id: "favorite", labelNoBangla: "Favorite", labelBangla: "প্রিয়", icon: Heart, badge: favoritesCount > 0 ? favoritesCount : undefined },
    { id: "profile", labelNoBangla: "Profile", labelBangla: "প্রোফাইল", icon: User }
  ];

  return (
    <nav id="bottom-navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-t border-white/5 pb-safe select-none">
      <div className="max-w-lg mx-auto px-4 h-15 flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              id={`nav-tab-${tab.id}`}
              key={tab.id}
              onClick={() => onChangeTab(tab.id as TabType)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 relative group cursor-pointer"
            >
              <div className="relative">
                {tab.id === "profile" ? (
                  // Customized initials circle as shown in references
                  <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-extrabold uppercase transition-all overflow-hidden ${
                    isActive ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20 ring-1 ring-red-500" : "bg-purple-600 text-white"
                  }`}>
                    {profilePicUrl ? (
                      <img src={profilePicUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />
                    ) : (
                      userInitials
                    )}
                  </div>
                ) : (
                  <Icon
                    size={20}
                    className={`transition-all ${
                      isActive ? "text-red-500 scale-110 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  />
                )}

                {/* Badge Indicator for count items (like favorites) */}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[8px] font-mono font-bold px-1 py-0.2 rounded-full min-w-4 text-center">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[9px] mt-1 transition-colors font-medium font-sans ${
                  isActive ? "text-red-500 font-bold" : "text-slate-500Group group-hover:text-slate-400 text-slate-400"
                }`}
              >
                {userStateLabel(tab.id, isBangla)}
              </span>

              {/* Little custom red dot under active element */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function userStateLabel(id: string, isBangla: boolean) {
  if (isBangla) {
    switch (id) {
      case "home": return "হোম";
      case "search": return "সার্চ";
      case "upcoming": return "আসন্ন";
      case "favorite": return "প্রিয়";
      case "profile": return "প্রোফাইল";
      default: return "";
    }
  } else {
    switch (id) {
      case "home": return "Home";
      case "search": return "Search";
      case "upcoming": return "Upcoming";
      case "favorite": return "Favorite";
      case "profile": return "Profile";
      default: return "";
    }
  }
}
