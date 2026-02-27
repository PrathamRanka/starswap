import { create } from 'zustand';
import { FeedItem } from '../types/api';
import { repositoryApi } from '../api/repository';

interface FeedState {
  feed: FeedItem[];
  nextCursor: string | null;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  fetchNextPage: () => Promise<void>;
  resetFeed: () => void;
  removeRepoFromFeed: (id: string) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feed: [],
  nextCursor: null,
  isLoading: false,
  hasMore: true, // Initially assume we have more to fetch
  error: null,

  fetchNextPage: async () => {
    const { nextCursor, isLoading, hasMore } = get();
    
    // Guard against fetching if already loading or no more items
    if (isLoading || !hasMore) return;

    set({ isLoading: true, error: null });

    try {
      const response = await repositoryApi.getFeed(nextCursor || undefined, 10);
      
      if (response.success) {
        const newFeed = response.data.feed;
        const newCursor = response.data.nextCursor;
        
        set((state) => ({
          feed: [...state.feed, ...newFeed], // Append the new items logically for infinite scroll
          nextCursor: newCursor,
          hasMore: newCursor !== null, // Stop if cursor is null
          isLoading: false,
        }));
      } else {
        set({ error: response.error.message, isLoading: false });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch feed', isLoading: false });
    }
  },

  resetFeed: () => set({ feed: [], nextCursor: null, isLoading: false, hasMore: true, error: null }),
  
  removeRepoFromFeed: (id: string) => 
    set((state) => ({ feed: state.feed.filter((item) => item.id !== id) })),
}));
