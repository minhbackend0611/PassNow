import { create } from 'zustand';
import { subscribeToConversations } from '../services/chatService';
import type { Conversation } from '../types';

interface ChatStore {
  conversations: Conversation[];
  totalUnreadCount: number;
  isInitialized: boolean;
  initializeChatListener: (userId: string) => () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  totalUnreadCount: 0,
  isInitialized: false,

  initializeChatListener: (userId: string) => {
    if (get().isInitialized) return () => {};

    set({ isInitialized: true });
    
    const unsubscribe = subscribeToConversations(userId, (convs) => {
      let total = 0;
      convs.forEach(conv => {
        if (conv.metadata.unreadCount && conv.metadata.unreadCount[userId]) {
          total += conv.metadata.unreadCount[userId];
        }
      });
      
      set({ conversations: convs, totalUnreadCount: total });
    });

    return () => {
      unsubscribe();
      set({ isInitialized: false, conversations: [], totalUnreadCount: 0 });
    };
  }
}));
