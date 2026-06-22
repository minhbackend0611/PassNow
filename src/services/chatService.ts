import { ref, set, push, get, onValue, update, off } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import type { Conversation, Message } from '../types';

export const getConversationId = (userId1: string, userId2: string, listingId: string) => {
  const sortedUsers = [userId1, userId2].sort();
  return `${sortedUsers[0]}_${sortedUsers[1]}_${listingId}`;
};

export const startConversation = async (listingId: string, sellerId: string, buyerId: string) => {
  const conversationId = getConversationId(sellerId, buyerId, listingId);
  const metadataRef = ref(rtdb, `chats/${conversationId}/metadata`);
  
  const snapshot = await get(metadataRef);
  if (!snapshot.exists()) {
    await set(metadataRef, {
      participants: {
        [sellerId]: true,
        [buyerId]: true
      },
      unreadCount: {
        [sellerId]: 0,
        [buyerId]: 0
      },
      listingId,
      lastMessage: '',
      lastMessageAt: Date.now()
    });
  }
  return conversationId;
};

export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
  const messagesRef = ref(rtdb, `chats/${conversationId}/messages`);
  const newMessageRef = push(messagesRef);
  
  const now = Date.now();
  await set(newMessageRef, {
    senderId,
    text,
    createdAt: now
  });

  const metadataRef = ref(rtdb, `chats/${conversationId}/metadata`);
  const metaSnap = await get(metadataRef);
  let unreadCountUpdate: Record<string, number> = {};
  
  if (metaSnap.exists()) {
    const meta = metaSnap.val();
    const participants = Object.keys(meta.participants || {});
    
    if (senderId === 'system') {
      participants.forEach(id => {
        const currentCount = meta.unreadCount?.[id] || 0;
        unreadCountUpdate[`unreadCount/${id}`] = currentCount + 1;
      });
    } else {
      const receiverId = participants.find(id => id !== senderId) || participants[0];
      const currentCount = meta.unreadCount?.[receiverId] || 0;
      unreadCountUpdate[`unreadCount/${receiverId}`] = currentCount + 1;
    }
  }

  await update(metadataRef, {
    lastMessage: text,
    lastMessageAt: now,
    ...unreadCountUpdate
  });
};

export const sendSystemMessage = async (listingId: string, sellerId: string, buyerId: string, text: string) => {
  const conversationId = await startConversation(listingId, sellerId, buyerId);
  await sendMessage(conversationId, 'system', text);
};

export const markAsRead = async (conversationId: string, userId: string) => {
  const metadataRef = ref(rtdb, `chats/${conversationId}/metadata`);
  await update(metadataRef, {
    [`unreadCount/${userId}`]: 0
  });
};

export const subscribeToMessages = (conversationId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(rtdb, `chats/${conversationId}/messages`);
  
  const listener = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val() || {};
    const msgs: Message[] = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
    
    // Sort by createdAt ascending
    msgs.sort((a, b) => a.createdAt - b.createdAt);
    callback(msgs);
  });

  return () => off(messagesRef, 'value', listener);
};

export const subscribeToConversations = (userId: string, callback: (conversations: Conversation[]) => void) => {
  const chatsRef = ref(rtdb, 'chats');
  
  const listener = onValue(chatsRef, (snapshot) => {
    const allChats = snapshot.val() || {};
    const userConvs: Conversation[] = [];
    
    Object.keys(allChats).forEach(chatId => {
      const metadata = allChats[chatId].metadata;
      if (metadata && metadata.participants && metadata.participants[userId]) {
        userConvs.push({ id: chatId, metadata });
      }
    });
    
    userConvs.sort((a, b) => b.metadata.lastMessageAt - a.metadata.lastMessageAt);
    callback(userConvs);
  });

  return () => off(chatsRef, 'value', listener);
};

export const getConversationMetadata = async (conversationId: string) => {
  const metadataRef = ref(rtdb, `chats/${conversationId}/metadata`);
  const snapshot = await get(metadataRef);
  if (snapshot.exists()) {
    return snapshot.val() as Conversation['metadata'];
  }
  return null;
};
