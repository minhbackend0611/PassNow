import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { subscribeToConversations } from '../../../services/chatService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Conversation } from '../../../types';
import StudentBadge from '../../../components/ui/StudentBadge';

interface ChatPreviewProps {
  conversation: Conversation;
  currentUserId: string;
}

const ChatPreview = ({ conversation, currentUserId }: ChatPreviewProps) => {
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<{ displayName: string; avatarUrl: string | null; email: string | null } | null>(null);
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [listingImage, setListingImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const participants = Object.keys(conversation.metadata.participants);
      const otherUserId = participants.find(id => id !== currentUserId) || participants[0]; // fallback to self if chatting with self
      
      const userSnap = await getDoc(doc(db, 'users', otherUserId));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setOtherUser({
          displayName: data.displayName || 'Unknown User',
          avatarUrl: data.avatarUrl || null,
          email: data.email || null,
        });
      }

      if (conversation.metadata.listingId) {
        const listingSnap = await getDoc(doc(db, 'listings', conversation.metadata.listingId));
        if (listingSnap.exists()) {
          const lData = listingSnap.data();
          setListingTitle(lData.title);
          if (lData.images && lData.images.length > 0) {
            setListingImage(lData.images[0]);
          }
        } else {
          setListingTitle('Deleted Item');
        }
      }
    };
    fetchData();
  }, [conversation, currentUserId]);

  const date = new Date(conversation.metadata.lastMessageAt);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const unreadCount = conversation.metadata.unreadCount?.[currentUserId] || 0;

  return (
    <div 
      onClick={() => navigate(`/chat/${conversation.id}`)}
      className={`flex items-center gap-stack-md p-stack-md rounded-xl cursor-pointer transition-colors border ${unreadCount > 0 ? 'bg-primary/5 border-primary/30 hover:bg-primary/10' : 'hover:bg-surface-container border-outline-variant/30'}`}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center border-2 border-surface">
          {otherUser?.avatarUrl ? (
            <img src={otherUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          )}
        </div>
        {/* Small thumbnail for the listing */}
        {listingImage ? (
           <img src={listingImage} alt="item" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md object-cover border-2 border-surface shadow-sm" />
        ) : (
           <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-surface-variant flex items-center justify-center border-2 border-surface shadow-sm">
             <span className="material-symbols-outlined text-[12px] text-on-surface-variant">inventory_2</span>
           </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className={`text-label-lg font-label-lg truncate flex items-center gap-2 ${unreadCount > 0 ? 'text-primary' : 'text-on-surface'}`}>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">{otherUser ? otherUser.displayName : 'Loading...'}</span>
              <StudentBadge email={otherUser?.email} variant="minimal" />
            </div>
            <span className="text-on-surface-variant/50 text-[10px]">●</span>
            <span className="text-body-sm font-normal text-on-surface-variant truncate">{listingTitle || 'Loading item...'}</span>
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
            <span className={`text-label-sm font-label-sm shrink-0 ${unreadCount > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
              {timeString}
            </span>
          </div>
        </div>
        <p className={`text-body-md font-body-md truncate ${unreadCount > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
          {conversation.metadata.lastMessage || 'No messages yet'}
        </p>
      </div>
    </div>
  );
};

export default function ChatListPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <main className="flex-grow w-full max-w-3xl mx-auto px-margin-mobile md:px-gutter py-stack-lg flex flex-col gap-stack-lg">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Messages</h1>
      
      <div className="bg-surface rounded-2xl p-4 md:p-6 shadow-sm border border-outline-variant/30 min-h-[50vh] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant">
            <span className="animate-pulse">Loading conversations...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-4">
            <span className="material-symbols-outlined text-[48px] opacity-20">chat_bubble</span>
            <p>You have no messages yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => (
              <ChatPreview key={conv.id} conversation={conv} currentUserId={user.uid} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
