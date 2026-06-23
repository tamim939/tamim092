import React, { useState, useEffect } from "react";
import { Movie } from "../types";
import { X, Lock, Play, Hourglass, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UnlockModalProps {
  movie: Movie;
  adUrl: string;
  onClose: () => void;
  onSuccess: () => void;
  isBangla?: boolean;
}

export default function UnlockModal({ movie, adUrl, onClose, onSuccess, isBangla = false }: UnlockModalProps) {
  const [timerLeft, setTimerLeft] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [hasClickedAd, setHasClickedAd] = useState<boolean>(false);

  const duration = movie.timerSeconds || 10;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCounting && timerLeft > 0) {
      interval = setInterval(() => {
        setTimerLeft((prev) => prev - 1);
      }, 1000);
    } else if (isCounting && timerLeft === 0) {
      setIsCounting(false);
      onSuccess(); // Triggers success modal view!
    }
    return () => clearInterval(interval);
  }, [isCounting, timerLeft, onSuccess]);

  const handleWatchAd = () => {
    // Let the native anchor link handle window opening safely, but we add a try-catch fallback just in case
    try {
      // Some environments might still require programmatic help, but native clicks generally suffice.
    } catch (e) {
      console.warn("Could not handle programmatic window hook:", e);
    }
    setTimerLeft(duration);
    setIsCounting(true);
    setHasClickedAd(true);
  };

  return (
    <div id={`unlock-modal-${movie.id}`} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden glass-panel-heavy p-6 shadow-2xl border border-white/10"
      >
        {/* Header Close button */}
        <button
          id="close-unlock-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-white/5 rounded-full hover:bg-white/10 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-3">
          {/* Animated Lock/Timer Logo */}
          <div className="relative mb-4">
            <div className={`p-4 rounded-full ${isCounting ? "bg-amber-500/20 text-amber-400 animate-pulse" : "bg-red-500/15 text-red-500"} flex items-center justify-center shadow-lg`}>
              {isCounting ? <Hourglass size={32} className="animate-spin" /> : <Lock size={32} />}
            </div>
            {isCounting && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900">
                {timerLeft}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {isBangla ? "ভিডিও আনলক করুন" : "Unlock Your Video"}
          </h2>
          <p className="text-sm font-semibold text-red-400 mt-1">
            {isBangla ? "স্পন্সর বিজ্ঞাপন দেখুন" : "Watch Sponsor Ad to Unlock"}
          </p>

          {/* Video Poster Preview Block */}
          <div className="w-full mt-4 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
            <img
              src={movie.imageUrl}
              alt=""
              className="w-12 h-16 object-cover rounded-md"
            />
            <div className="text-left flex-grow">
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">
                {movie.category}
              </span>
              <p className="text-sm text-slate-200 font-medium line-clamp-1">
                {movie.banglaTitle || movie.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-300 font-mono">
                  {isBangla ? `টাইমার: ${duration} সেকেন্ড` : `Timer: ${duration}s`}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-green-400 font-bold">★ Active Server</span>
              </div>
            </div>
          </div>

          {!isCounting && !hasClickedAd ? (
            /* Ad prompt text layout */
            <div className="mt-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm px-2">
                {isBangla ? (
                  <>
                    <span className="text-amber-400 font-bold">⏱ {duration} সেকেন্ডের</span> একটি বিজ্ঞাপন দেখতে হবে। 
                    যদি না দেখেন, আপনার কাঙ্ক্ষিত ভিডিও পাবেন না।
                  </>
                ) : (
                  <>
                    You must watch a <span className="text-amber-400 font-bold">⏱ {duration}-second</span> sponsor ad. 
                    If you do not, you will not receive your video.
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-400 leading-normal max-w-xs bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                {isBangla ? (
                  <>
                    নিচের বাটনে ক্লিক করুন এবং কমপক্ষে <span className="text-amber-400 font-bold font-mono">{duration} সেকেন্ড</span> সেই পেজে থাকুন, তারপর ফিরে আসুন।
                  </>
                ) : (
                  <>
                    Click the button below and stay on that page for at least <span className="text-amber-400 font-bold font-mono">{duration} seconds</span>, then return here.
                  </>
                )}
              </p>
              <p className="text-[10px] text-amber-500 flex items-center justify-center gap-1.5 px-3">
                <AlertTriangle size={12} className="shrink-0" />
                {isBangla ? (
                  <>{duration} সেকেন্ডের আগে ফিরে আসলে ভিডিও পাঠানো হবে না এবং আবার শুরু করতে হবে।</>
                ) : (
                  <>If you return before the {duration}s countdown, the video won't unlock and you must restart.</>
                )}
              </p>

              <a
                id="watch-ad-button"
                href={adUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWatchAd}
                className="w-full mt-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-xl glow-button active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Play size={16} fill="currentColor" />
                {isBangla ? "🎬 বিজ্ঞাপন দেখুন & ভিডিও আনলক করুন" : "🎬 Watch Ad & Unlock Video"}
              </a>
            </div>
          ) : (
            /* Countdown Display rendering state */
            <div className="mt-6 w-full space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/10">
                <div className="flex justify-between text-xs text-amber-300 font-mono mb-2">
                  <span>{isBangla ? "বিজ্ঞাপন চালু হয়েছে" : "Watching Sponsor Ad"}</span>
                  <span className="font-bold">{Math.round((timerLeft / duration) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(timerLeft / duration) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 text-center text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <p className="animate-pulse text-slate-300">
                  {isBangla ? "দয়া করে অপেক্ষা করুন..." : "Redirected to sponsor site! Countdown in progress..."}
                </p>
                <p className="text-[11px]">
                  {isBangla ? "বিজ্ঞাপন উইন্ডোটি বন্ধ করবেন না।" : "Do NOT exit the newly opened ad window yet!"}
                </p>
                <p className="text-amber-500 font-mono text-sm font-bold mt-1">
                  ⏳ {timerLeft}s remaining
                </p>
              </div>

              <div className="flex justify-center w-full text-xs">
                <button
                  id="reset-counter-btn"
                  onClick={() => {
                    setIsCounting(false);
                    setHasClickedAd(false);
                  }}
                  className="w-full border border-white/10 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl transition cursor-pointer font-semibold font-mono"
                >
                  {isBangla ? "↺ পুনরায় লোড করুন" : "↺ Restart Ad Timer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
