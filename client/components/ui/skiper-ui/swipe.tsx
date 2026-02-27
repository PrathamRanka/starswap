"use client";

//import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Autoplay, EffectCards, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/effect-cards";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css";

import { cn } from "@/lib/utils";

// Removed static dev component Skiper48

import { FeedItem } from "@/types/api";

const Carousel_002 = ({
  feed,
  className,
  onSwipeLeft,
  onSwipeRight,
  onReachEnd,
  loop = true,
}: {
  feed: FeedItem[];
  className?: string;
  onSwipeLeft?: (item: FeedItem) => void;
  onSwipeRight?: (item: FeedItem) => void;
  onReachEnd?: () => void;
  loop?: boolean;
}) => {
  const css = `
  .Carousal_002 {
    padding-bottom: 50px !important;
  }
  .swiper-slide {
    background-color: #111;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 1.5rem;
    overflow: hidden;
  }
  `;

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn("relative w-full max-w-sm", className)}
    >
      <style>{css}</style>

      <Swiper
        effect="cards"
        grabCursor={true}
        loop={loop}
        onSlideNextTransitionStart={(swiper) => {
          // Swiping Left (Next Slide)
          const prevIndex = swiper.previousIndex;
          if (onSwipeLeft && feed[prevIndex]) {
             onSwipeLeft(feed[prevIndex]);
          }
        }}
        onSlidePrevTransitionStart={(swiper) => {
          // Swiping Right (Prev Slide)
          const prevIndex = swiper.previousIndex;
          if (onSwipeRight && feed[prevIndex]) {
             onSwipeRight(feed[prevIndex]);
          }
        }}
        onReachEnd={() => {
          if (onReachEnd) onReachEnd();
        }}
        className="Carousal_002 h-[480px] w-[320px]"
        modules={[EffectCards, Autoplay, Pagination, Navigation]}
      >
        {feed.map((repo, index) => (
          <SwiperSlide key={`${repo.id}-${index}`} className="flex flex-col p-6 shadow-2xl relative">
            
            <div className="flex-1 flex flex-col items-center text-center justify-center space-y-4">
              {repo.owner?.avatar ? (
                <Image src={repo.owner.avatar} alt="Owner Avatar" width={80} height={80} className="w-20 h-20 rounded-full border-2 border-white/20 shadow-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 border-2 border-white/20 flex items-center justify-center text-2xl font-bold font-mono">
                  {repo.owner?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              
              <div className="space-y-1">
                 <h2 className="text-2xl font-bold tracking-tight text-white">{repo.name}</h2>
                 <p className="text-white/50 text-sm font-medium">by @{repo.owner?.username}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full h-32 overflow-hidden flex items-center justify-center text-white/80 italic text-sm">
                 &quot;{repo.pitch || repo.description || 'No pitch provided.'}&quot;
              </div>
            </div>

            <div className="pt-4 mt-auto border-t border-white/10 flex justify-between items-center w-full pb-2">
               <div className="flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                 <span className="text-white/70 text-sm font-semibold">{repo.languages?.[0] || 'Unknown'}</span>
               </div>
               <div className="flex items-center gap-1.5 text-white/70 font-mono text-sm group">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                  {repo.githubStars}
               </div>
            </div>

            {/* Absolute Badges indicating swipe action on drag */}
            <div className="absolute top-4 left-4 border-2 border-red-500 text-red-500 font-black tracking-widest uppercase py-1 px-3 text-2xl rounded-xl opacity-0 transition-opacity duration-200" id="skip-badge">NOPE</div>
            <div className="absolute top-4 right-4 border-2 border-green-500 text-green-500 font-black tracking-widest uppercase py-1 px-3 text-2xl rounded-xl opacity-0 transition-opacity duration-200" id="star-badge">STAR</div>
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.div>
  );
};

export { Carousel_002 };

/**
 * Skiper 48 Carousel_002 — React + Swiper
 * Built with Swiper.js - Read docs to learn more https://swiperjs.com/
 * Illustrations by AarzooAly - https://x.com/AarzooAly
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.in
 * Twitter: https://x.com/Gur__vi
 */
