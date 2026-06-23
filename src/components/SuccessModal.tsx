import React from "react";
import { Movie } from "../types";
import { CheckCircle, ArrowRight, ExternalLink, Bot } from "lucide-react";
import { motion } from "motion/react";

interface SuccessModalProps {
  movie: Movie;
  botUrl: string;
  onClose: () => void;
  isBangla?: boolean;
}

export default function SuccessModal({ movie, botUrl, onClose, isBangla = false }: SuccessModalProps) {
  // Compute final redirect URL emphasizing the custom download link entered by the admin to send the correct movie back to user's Telegram
  const finalBotUrl = (() => {
    const dlUrl = (movie.downloadUrl || "").trim();
    if (dlUrl) {
      if (dlUrl.startsWith("http://") || dlUrl.startsWith("https://")) {
        return dlUrl;
      }
      if (dlUrl.toLowerCase().startsWith("start=")) {
        return `https://t.me/MovieGo_HD_bot?${dlUrl}`;
      }
      return `https://t.me/MovieGo_HD_bot?start=${dlUrl}`;
    }
    const baseBot = botUrl.startsWith("http") ? botUrl : "https://t.me/MovieGo_HD_bot";
    return `${baseBot}?start=unlock_${movie.id}`;
  })();

  const handleReturnToBot = () => {
    try {
      onClose();
    } catch (e) {
      console.warn("SuccessModal closure error handled:", e);
    }
  };

  return (
    <div id="success-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden glass-panel-heavy p-6 shadow-2xl border border-emerald-500/20"
      >
        <div className="flex flex-col items-center text-center py-4">
          {/* Pulsing check animation */}
          <div className="relative mb-6">
            <div className="p-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg relative z-10 animate-bounce">
              <CheckCircle size={44} className="stroke-2" />
            </div>
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full filter blur-md animate-ping"></div>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isBangla ? "সফল হয়েছে!" : "Success!"}
          </h2>
          <p className="text-emerald-400 font-medium text-sm mt-1">
            ✓ {isBangla ? "আনলক সম্পন্ন হয়েছে" : "Unlock Completed Successfully"}
          </p>

          <div className="my-6 p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/10 space-y-3 w-full text-left">
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span>
              <p className="leading-snug">
                {isBangla 
                  ? "ভিডিওটি আপনার ইনবক্সে পাঠানো হয়েছে।"
                  : "The video link was delivered back to your inbox."}
              </p>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span>
              <p className="leading-snug">
                {isBangla
                  ? "নিচের বাটনে একটি ক্লিক করুন এবং বটে ফিরে যান — আপনার ভিডিওটি ইনবক্সে চলে গেছে।"
                  : "Click the button below to resume your chatbot session."}
              </p>
            </div>
          </div>

          {/* Return to Bot Main Trigger */}
          <a
            id="return-to-bot-btn"
            href={finalBotUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleReturnToBot}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold py-3.5 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer text-center"
          >
            <Bot size={18} fill="currentColor" />
            {isBangla ? "🤖 বটে ফিরে যান" : "🤖 Return to Bot"}
            <ArrowRight size={16} />
          </a>

          <button
            id="close-success-flat"
            onClick={onClose}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition underline font-mono cursor-pointer"
          >
            {isBangla ? "ফিরে যান (Close)" : "Close and Back to Home"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
