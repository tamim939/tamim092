import React from "react";
import { Movie } from "../types";
import { Heart, Star, Clock, Lock } from "lucide-react";
import { motion } from "motion/react";

interface MovieGridProps {
  movies: Movie[];
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenUnlock: (movie: Movie) => void;
  isBangla?: boolean;
}

export default function MovieGrid({ movies, favorites, onToggleFavorite, onOpenUnlock, isBangla = false }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="w-full py-16 text-center select-none bg-slate-900/20 rounded-2xl border border-white/5">
        <p className="text-slate-400 text-sm">
          {isBangla ? "কোনো মুভি পাওয়া যায়নি" : "No movies found."}
        </p>
      </div>
    );
  }

  return (
    <div id="movie-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {movies.map((movie, index) => {
        const isFav = favorites.includes(movie.id);

        return (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-slate-950/60 border border-white/10 hover:border-red-500/50 transition-all duration-300 shadow-lg cursor-pointer"
            onClick={() => onOpenUnlock(movie)}
          >
            {/* Image section with premium custom status badges */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
              <img
                src={movie.imageUrl}
                alt={movie.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Black gradient on bottom of image */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent"></div>

              {/* 4K Badge / Tags on Top Left */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                <span className="bg-amber-500/90 text-slate-950 font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  4K UHD
                </span>
                {movie.isUpcoming && (
                  <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </div>

              {/* Star Rating Badge on image bottom-right */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-950/70 backdrop-blur-md px-1.5 py-0.5 rounded-lg text-[10px] text-amber-400 font-mono font-bold">
                <Star size={10} fill="currentColor" />
                {movie.rating}
              </div>

              {/* Hover lock badge overlay */}
              <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="p-3 bg-red-600/90 rounded-full text-white transform scale-90 group-hover:scale-100 transition-transform shadow-lg shadow-red-600/20">
                  <Lock size={18} />
                </div>
              </div>

              {/* Favorite Heart Trigger - Placed after overlay with z-20 for clickability */}
              <button
                id={`fav-btn-${movie.id}`}
                onClick={(e) => onToggleFavorite(movie.id, e)}
                className="absolute top-2 right-2 p-1.5 bg-slate-950/60 backdrop-blur-md rounded-full text-slate-300 hover:text-red-500 transition-colors cursor-pointer z-20"
              >
                <Heart size={15} className={isFav ? "fill-red-500 text-red-500" : ""} />
              </button>
            </div>

            {/* Movie Description Info */}
            <div className="p-3 flex flex-col flex-grow">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-slate-400">
                {/* User initials circle */}
                <span className="w-5 h-5 flex items-center justify-center text-[9px] font-bold text-slate-100 bg-red-600 rounded-full shrink-0 uppercase">
                  {movie.initials || "FA"}
                </span>
                <span className="truncate">{movie.category}</span>
                <span className="text-slate-600/60">•</span>
                <span>{movie.timerSeconds || 10}s</span>
              </div>

              <h3 className="text-white text-xs font-medium tracking-tight line-clamp-2 leading-snug group-hover:text-red-400 transition-colors flex-grow">
                {movie.banglaTitle || movie.title}
              </h3>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{movie.releaseDate}</span>
                <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                  ✓ {isBangla ? "ভিডিও লিংক" : "Active Link"}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
