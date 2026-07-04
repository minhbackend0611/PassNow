import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from './useChatStore';
import * as chatService from '../services/chatService';

vi.mock('../services/chatService', () => ({
  subscribeToConversations: vi.fn(),
}));

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ conversations: [], totalUnreadCount: 0, isInitialized: false });
    vi.clearAllMocks();
  });

  it('initializes chat listener and calculates total unread count correctly', () => {
    const mockUnsubscribe = vi.fn();
    let callback: any = null;

    vi.mocked(chatService.subscribeToConversations).mockImplementation((_userId, cb) => {
      callback = cb;
      return mockUnsubscribe;
    });

    const unsubscribe = useChatStore.getState().initializeChatListener('user1');
    expect(useChatStore.getState().isInitialized).toBe(true);

    // Trigger callback with mock conversations
    callback([
      {
        id: 'conv1',
        metadata: {
          unreadCount: { user1: 2, user2: 0 }
        }
      },
      {
        id: 'conv2',
        metadata: {
          unreadCount: { user1: 5 }
        }
      },
      {
        id: 'conv3',
        metadata: {
          unreadCount: { user2: 3 } // user1 should not count this
        }
      }
    ]);

    expect(useChatStore.getState().totalUnreadCount).toBe(7);
    expect(useChatStore.getState().conversations).toHaveLength(3);

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(useChatStore.getState().isInitialized).toBe(false);
    expect(useChatStore.getState().totalUnreadCount).toBe(0);
  });
});
