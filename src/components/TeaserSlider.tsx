import React, { useState, useEffect } from "react";
import { Movie } from "../types";
import { Flame, Play, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TeaserSliderProps {
  movies: Movie[];
  onOpenUnlock: (movie: Movie) => void;
}

export default function TeaserSlider({ movies, onOpenUnlock }: TeaserSliderProps) {
  const bannerMovies = movies.filter((m) => m.isBanner);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (bannerMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerMovies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerMovies.length]);

  if (bannerMovies.length === 0) return null;

  const current = bannerMovies[currentIndex];

  return (
    <div id="teaser-slider" className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-xl select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Movie Image Backdrop */}
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${current.teaserImageUrl || current.imageUrl})` }}></div>
          {/* Ambient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent"></div>

          {/* Absolute content details overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col justify-end h-full">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded-md w-max mb-2">
              <Flame size={12} className="animate-pulse" />
              {current.status === "Coming Soon" ? "Coming Soon" : "Trending Now"}
            </span>

            <h2 className="font-display font-bold text-lg md:text-2xl text-white tracking-tight drop-shadow">
              {current.banglaTitle || current.title}
            </h2>

            <p className="text-xs text-slate-300 line-clamp-2 mt-1 max-w-lg mb-3">
              {current.title} is exclusive inside Movie GO HD. Unlock now to save to your Telegram bot.
            </p>

            <div className="flex items-center gap-3">
              <button
                id={`banner-play-btn-${current.id}`}
                onClick={() => onOpenUnlock(current)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-semibold text-xs md:text-sm px-4 py-2 rounded-xl active:scale-95 transition glow-button cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                {current.status === "Coming Soon" ? "Join Telegram / জয়েন হোন" : "Watch & Unlock / আনলক করুন"}
              </button>

              {current.timerSeconds && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                  <Clock size={12} />
                  {current.timerSeconds}s
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Pagination Dots */}
      {bannerMovies.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
          {bannerMovies.map((_, i) => (
            <button
              id={`banner-dot-${i}`}
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? "bg-red-500 w-4" : "bg-white/40 hover:bg-white/60"
              }`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
}
