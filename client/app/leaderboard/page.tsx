"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { leaderboardApi, TopRepo } from "@/api/leaderboard";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [repos, setRepos] = useState<TopRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const result = await leaderboardApi.getTopRepos(50);
        if (result.success) {
          setRepos(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLeaderboard();
    }
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-white/50 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black/95 text-white flex flex-col items-center py-12 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-900/40 via-black to-black opacity-60 z-0"></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            Top Repositories
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Discover the most starred projects pushed on StarSwap. Build reputation, get discovered.
          </p>
        </div>

        <div className="w-full bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/5 text-xs uppercase tracking-widest text-white/40 font-semibold sticky top-0 z-20 backdrop-blur-md">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-6">Repository</div>
            <div className="col-span-3 text-center">Language</div>
            <div className="col-span-2 text-right">Stars</div>
          </div>

          {/* List */}
          <div className="flex flex-col">
            {repos.length === 0 ? (
               <div className="text-center py-20 text-white/40 italic">
                 No repositories found. Start Swiping!
               </div>
            ) : (
               repos.map((repo, idx) => (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   key={repo.id}
                   className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-white/5 last:border-0 items-center hover:bg-white/5 transition-colors group relative"
                 >
                   
                   {/* Rank */}
                   <div className="col-span-1 flex justify-center text-center">
                     <span className={`text-xl font-bold font-mono ${repo.rank <= 3 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/30'}`}>
                       #{repo.rank}
                     </span>
                   </div>

                   {/* Repo Info */}
                   <div className="col-span-6 flex items-center gap-4">
                     {repo.owner?.avatarUrl ? (
                        <div className="relative">
                          {repo.rank === 1 && <div className="absolute -top-3 -left-2 text-2xl rotate-[-15deg]">👑</div>}
                          <Image src={repo.owner.avatarUrl} alt="Avatar" width={48} height={48} className={`w-12 h-12 rounded-xl object-cover border-2 shadow-lg ${repo.rank === 1 ? 'border-yellow-400' : repo.rank === 2 ? 'border-gray-300' : repo.rank === 3 ? 'border-amber-700' : 'border-white/10'}`} />
                        </div>
                     ) : (
                        <div className={`w-12 h-12 rounded-xl bg-white/10 border-2 flex items-center justify-center font-bold font-mono ${repo.rank === 1 ? 'border-yellow-400 text-yellow-400' : repo.rank === 2 ? 'border-gray-300 text-gray-300' : repo.rank === 3 ? 'border-amber-700 text-amber-700' : 'border-white/10 text-white/50'}`}>
                          {repo.owner?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                     )}
                     <div className="flex flex-col">
                       <h3 className="font-semibold text-white/90 truncate max-w-[200px] md:max-w-xs">{repo.name}</h3>
                       <span className="text-xs text-blue-400 hover:underline cursor-pointer">@{repo.owner?.username}</span>
                     </div>
                   </div>

                   {/* Mobile Language & Stars */}
                   <div className="md:hidden flex items-center gap-4 mt-2 pl-12">
                     <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 opacity-80"></span>
                        {repo.language || 'Unknown'}
                     </div>
                     <div className="flex flex-1 items-center gap-1 text-yellow-400/90 font-mono text-sm ml-auto">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                        {repo.githubStars}
                     </div>
                   </div>

                   {/* Desktop Language */}
                   <div className="col-span-3 hidden md:flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 opacity-80"></span>
                      <span className="text-sm text-white/50">{repo.language || 'Unknown'}</span>
                   </div>

                   {/* Desktop Stars */}
                   <div className="col-span-2 hidden md:flex items-center justify-end gap-1.5 text-yellow-400/90 font-mono text-lg font-medium pr-2">
                       {repo.githubStars}
                       <svg className="w-5 h-5 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                   </div>
                 </motion.div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
