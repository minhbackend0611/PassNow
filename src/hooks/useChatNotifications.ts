import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToConversations } from '../services/chatService';
import { useToastStore } from '../store/useToastStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useChatNotifications = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const previousConvsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Request browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, (conversations) => {
      conversations.forEach(conv => {
        const prevLastMessageAt = previousConvsRef.current[conv.id];
        const isNewMessage = prevLastMessageAt && conv.metadata.lastMessageAt > prevLastMessageAt;
        const hasUnread = conv.metadata.unreadCount?.[user.uid] && conv.metadata.unreadCount[user.uid] > 0;
        
        // If we are currently on the chat page for this conversation, we don't want an annoying system push notification
        // because the user is actively chatting. However, if they are on a different page, we show it.
        const isCurrentChatPage = window.location.pathname === `/chat/${conv.id}`;

        if (isNewMessage && hasUnread && !isCurrentChatPage) {
          const showNotification = async () => {
            const participants = Object.keys(conv.metadata.participants || {});
            const senderId = participants.find(id => id !== user.uid) || participants[0];
            
            let senderName = 'Ai đó';
            if (senderId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', senderId));
                if (userDoc.exists()) {
                  senderName = userDoc.data().displayName || 'Ai đó';
                }
              } catch (e) {
                console.error("Failed to fetch sender name for notification", e);
              }
            }

            const text = conv.metadata.lastMessage;
            const displayMsg = text === 'Đã gửi một ảnh' ? '📷 Đã gửi một ảnh' : text;
            
            // In-app toast
            addToast(`Tin nhắn từ ${senderName}: ${displayMsg.substring(0, 30)}${displayMsg.length > 30 ? '...' : ''}`, 'info');
            
            // Browser push notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(`PassNow - Tin nhắn từ ${senderName}`, {
                body: displayMsg,
                icon: '/vite.svg', // generic icon
                tag: `chat-${conv.id}`
              });
              
              notification.onclick = () => {
                window.focus();
                window.location.href = `/chat/${conv.id}`;
              };
            }
          };
          showNotification();
        }
        
        // Update ref with new timestamp
        previousConvsRef.current[conv.id] = conv.metadata.lastMessageAt;
      });
    });

    return () => unsubscribe();
  }, [user, addToast]);
};
