"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { repositoryApi } from "@/services/repository";
import { swipeApi } from "@/services/swipe";
import { FeedItem } from "@/types/api";
import { Carousel_002 } from "@/components/ui/skiper-ui/swipe";
import { motion, AnimatePresence } from "framer-motion";

export default function SwipePage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  const showToast = (message: string) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => {
      setToast(current => current?.id === id ? null : current);
    }, 3000);
  };

  const fetchFeed = async (currentCursor: string | null = null) => {
    try {
      const result = await repositoryApi.getFeed(currentCursor || undefined, 10);
      if (result.success) {
        setFeed(prev => {
           const newItems = result.data.filter(item => !prev.some(p => p.id === item.id));
           return [...prev, ...newItems];
        });
        setCursor(result.meta?.nextCursor || null);
      }
    } catch (err) {
      console.error("Failed to fetch feed", err);
    } finally {
      if (!currentCursor) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user]);

  const handleSwipeLeft = (repo: FeedItem) => {
    swipeApi.submitSwipe(repo.id, 'SKIP');
  };

  const handleSwipeRight = (repo: FeedItem) => {
    swipeApi.submitSwipe(repo.id, 'STAR');
    showToast(`⭐ Starred ${repo.name} on GitHub!`);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-white/50 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black/95 flex flex-col items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-gray-900 via-black to-black"></div>
        
        <div className="z-10 w-full max-w-md px-4 flex flex-col items-center">
           <h1 className="text-white/50 text-sm font-semibold tracking-widest uppercase mb-8 text-center flex flex-col gap-2">
              <span>Discover Open Source</span>
              <span className="text-xs font-normal text-white/30 lowercase bg-white/5 px-4 py-1.5 rounded-full border border-white/10 w-fit self-center">
                 swipe right to star, left to skip
              </span>
           </h1>
           
           {feed.length > 0 ? (
             <Carousel_002 
               feed={feed} 
               onSwipeLeft={handleSwipeLeft} 
               onSwipeRight={handleSwipeRight} 
               onReachEnd={() => {
                  if (cursor) fetchFeed(cursor);
               }}
             />
           ) : (
             <div className="text-white/50 text-center py-20 border border-dashed border-white/10 rounded-3xl w-full bg-white/5">
                No more repositories to discover right now.<br/>Check back later!
             </div>
           )}

           {/* Custom Toast Notification */}
           <AnimatePresence>
             {toast && (
               <motion.div 
                 key={toast.id}
                 initial={{ opacity: 0, y: 50, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 20, scale: 0.9 }}
                 className="fixed bottom-10 bg-[#111] border border-yellow-400/30 text-white text-sm px-6 py-3 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)] z-50 flex items-center gap-2 font-medium"
               >
                 {toast.message}
               </motion.div>
             )}
           </AnimatePresence>
        </div>
    </div>
  );
}
