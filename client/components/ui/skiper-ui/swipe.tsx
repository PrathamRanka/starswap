"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { X, Star } from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import { FeedItem } from "@/types/api";

/* ─── Constants ──────────────────────────────────────────── */
const SWIPE_THRESHOLD = 100; // px from center to commit a swipe
const SWIPE_COOLDOWN = 1200; // ms lock between swipes
const EXIT_DURATION = 0.45; // seconds card flies off screen

/* ─── Single draggable card ──────────────────────────────── */
function SwipeCard({
  repo,
  isTop,
  onSwipedLeft,
  onSwipedRight,
}: {
  repo: FeedItem;
  isTop: boolean;
  onSwipedLeft: (repo: FeedItem) => void;
  onSwipedRight: (repo: FeedItem) => void;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Rotate the card ±15° during drag
  const rotate = useTransform(x, [-250, 0, 250], [-15, 0, 15]);

  // Green overlay opacity (right drag)
  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.55]);
  // Red overlay opacity (left drag)
  const redOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.55, 0]);

  // STAR badge opacity
  const starOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  // SKIP badge opacity
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  const handleDragEnd = useCallback(
    async (_: unknown, info: { offset: { x: number } }) => {
      const offsetX = info.offset.x;

      if (offsetX > SWIPE_THRESHOLD) {
        // Commit RIGHT swipe
        await controls.start({
          x: 600,
          opacity: 0,
          transition: { duration: EXIT_DURATION, ease: [0.32, 0, 0.67, 0] },
        });
        onSwipedRight(repo);
      } else if (offsetX < -SWIPE_THRESHOLD) {
        // Commit LEFT swipe
        await controls.start({
          x: -600,
          opacity: 0,
          transition: { duration: EXIT_DURATION, ease: [0.32, 0, 0.67, 0] },
        });
        onSwipedLeft(repo);
      } else {
        // Snap back
        controls.start({
          x: 0,
          transition: { type: "spring", stiffness: 300, damping: 28 },
        });
      }
    },
    [controls, repo, onSwipedLeft, onSwipedRight]
  );

  return (
    <motion.div
      style={{ x, rotate, position: "absolute", inset: 0 }}
      animate={controls}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      className="select-none cursor-grab active:cursor-grabbing"
    >
      {/* Card */}
      <div className="relative w-[320px] h-[480px] rounded-3xl bg-[#111] border border-white/10 shadow-2xl overflow-hidden flex flex-col">

        {/* Green glow overlay (right) */}
        <motion.div
          style={{ opacity: greenOpacity }}
          className="absolute inset-0 bg-green-500/60 z-10 pointer-events-none rounded-3xl"
        />
        {/* Red glow overlay (left) */}
        <motion.div
          style={{ opacity: redOpacity }}
          className="absolute inset-0 bg-red-500/60 z-10 pointer-events-none rounded-3xl"
        />

        {/* STAR badge */}
        <motion.div
          style={{ opacity: starOpacity }}
          className="absolute top-5 right-5 z-20 border-[3px] border-green-400 text-green-400 font-black tracking-widest uppercase py-1 px-3 text-xl rounded-xl rotate-12"
        >
          ⭐ STAR
        </motion.div>
        {/* SKIP badge */}
        <motion.div
          style={{ opacity: skipOpacity }}
          className="absolute top-5 left-5 z-20 border-[3px] border-red-400 text-red-400 font-black tracking-widest uppercase py-1 px-3 text-xl rounded-xl -rotate-12"
        >
          SKIP
        </motion.div>

        {/* Card content */}
        <div className="flex-1 flex flex-col items-center text-center justify-center space-y-4 p-6">
          {repo.owner?.avatarUrl ? (
            <Image
              src={repo.owner.avatarUrl}
              alt="Owner Avatar"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full border-2 border-white/20 shadow-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 border-2 border-white/20 flex items-center justify-center text-2xl font-bold font-mono">
              {repo.owner?.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">{repo.name}</h2>
            <p className="text-white/50 text-sm font-medium">by @{repo.owner?.username}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full h-32 overflow-hidden flex items-center justify-center text-white/80 italic text-sm">
            &quot;{repo.pitch || repo.description || "No pitch provided."}&quot;
          </div>
        </div>

        <div className="px-6 pb-5 mt-auto border-t border-white/10 flex justify-between items-center w-full pt-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-white/70 text-sm font-semibold">{repo.languages?.[0] || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/70 font-mono text-sm">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            {repo.githubStars}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Card Stack ─────────────────────────────────────────── */
export const Carousel_002 = ({
  feed,
  onSwipeLeft,
  onSwipeRight,
  onReachEnd,
}: {
  feed: FeedItem[];
  className?: string;
  onSwipeLeft?: (item: FeedItem) => void;
  onSwipeRight?: (item: FeedItem) => void;
  onReachEnd?: () => void;
  loop?: boolean;
}) => {
  const [cards, setCards] = useState<FeedItem[]>(feed);
  const isSwiping = useRef(false);
  const [isSwipingState, setIsSwipingState] = useState(false);

  // Sync when the parent feed changes (new pages loaded)
  useEffect(() => {
    setCards(feed);
  }, [feed]);

    const dismiss = useCallback(
    async (repo: FeedItem, direction: "left" | "right") => {
      if (isSwiping.current) return;
      isSwiping.current = true;
      setIsSwipingState(true);

      // Notify parent immediately so toast fires right away
      if (direction === "right") {
        onSwipeRight?.(repo);
      } else {
        onSwipeLeft?.(repo);
      }

      // Wait one frame then pop the card from state
      await new Promise((r) => setTimeout(r, EXIT_DURATION * 1000 + 50));
      setCards((prev) => {
        const next = prev.filter((c) => c.id !== repo.id);
        if (next.length === 0) onReachEnd?.();
        return next;
      });

      // 1.2s cooldown before the user can swipe again
      await new Promise((r) => setTimeout(r, SWIPE_COOLDOWN - EXIT_DURATION * 1000 - 50));
      isSwiping.current = false;
      setIsSwipingState(false);
    },
    [onSwipeLeft, onSwipeRight, onReachEnd]
  );

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative w-[320px] h-[480px]">
        {/* Empty State shown when internal cards array is empty but we are still in Carousel */}
        {cards.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-3xl bg-white/5"
          >
              <span className="text-4xl mb-4">🚀</span>
              <h3 className="text-xl font-bold text-white mb-2">You&apos;re caught up!</h3>
              <p className="text-white/50 text-sm">You have seen all available repositories. Check back later for more.</p>
          </motion.div>
        )}

        {/* Desktop Navigation Arrows */}
        {cards.length > 0 && (
           <>
             {/* Left Skip Button */}
             <button 
                onClick={() => dismiss(cards[cards.length - 1], "left")}
                disabled={isSwipingState}
                className="hidden md:flex absolute top-1/2 -left-24 -translate-y-1/2 w-16 h-16 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-full items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] z-50 cursor-pointer"
             >
                <X size={32} strokeWidth={3} />
             </button>

             {/* Right Star Button */}
             <button 
                onClick={() => dismiss(cards[cards.length - 1], "right")}
                disabled={isSwipingState}
                className="hidden md:flex absolute top-1/2 -right-24 -translate-y-1/2 w-16 h-16 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-500 rounded-full items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] z-50 cursor-pointer"
             >
                <Star size={28} strokeWidth={3} />
             </button>
           </>
        )}

        <AnimatePresence>
        {cards
          .slice()
          .reverse()
          .map((repo, reverseIdx) => {
            const idx = cards.length - 1 - reverseIdx; // actual index in rendering order
            const isTop = idx === cards.length - 1;
            const stackOffset = (cards.length - 1 - idx) * 8;

            return (
              <motion.div
                key={repo.id}
                initial={{ scale: 0.92, y: 30, opacity: 0 }}
                animate={{
                  scale: 1 - stackOffset * 0.008,
                  y: -stackOffset,
                  opacity: 1,
                  zIndex: idx,
                }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 30,
                  delay: isTop ? 0 : 0.05,
                }}
                style={{ position: "absolute", inset: 0, zIndex: idx }}
              >
                <SwipeCard
                  repo={repo}
                  isTop={isTop}
                  onSwipedLeft={(r) => dismiss(r, "left")}
                  onSwipedRight={(r) => dismiss(r, "right")}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export { Carousel_002 as SwipeControls };
