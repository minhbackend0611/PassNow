import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useToastStore } from '../../../store/useToastStore';
import { subscribeToMessages, getConversationMetadata, sendMessage, markAsRead } from '../../../services/chatService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Message, Conversation } from '../../../types';

export default function ChatDetailPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [metadata, setMetadata] = useState<Conversation['metadata'] | null>(null);
  const [otherUser, setOtherUser] = useState<{ displayName: string; avatarUrl: string | null } | null>(null);
  const [listingData, setListingData] = useState<{ title: string; image: string | null } | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    // Load metadata & associated info
    const loadInfo = async () => {
      const meta = await getConversationMetadata(conversationId);
      if (!meta) return;
      setMetadata(meta);

      const participants = Object.keys(meta.participants);
      const otherUserId = participants.find(uid => uid !== user.uid) || participants[0];

      // Fetch other user
      const userSnap = await getDoc(doc(db, 'users', otherUserId));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        setOtherUser({ displayName: uData.displayName, avatarUrl: uData.avatarUrl });
      }

      // Fetch listing
      const listingSnap = await getDoc(doc(db, 'listings', meta.listingId));
      if (listingSnap.exists()) {
        const lData = listingSnap.data();
        setListingData({ 
          title: lData.title, 
          image: lData.images && lData.images.length > 0 ? lData.images[0] : null 
        });
      }
      
      markAsRead(conversationId, user.uid).catch(console.error);
    };
    
    loadInfo();

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      if (msgs.length > 0) {
        markAsRead(conversationId, user.uid).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationId || !user) return;

    try {
      setIsSending(true);
      await sendMessage(conversationId, user.uid, inputText.trim());
      setInputText('');
    } catch (err) {
      console.error(err);
      addToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!user || !conversationId) return null;

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-margin-mobile md:px-gutter py-stack-md md:py-stack-lg flex flex-col h-[calc(100vh-80px)]">
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden flex-1 h-full relative">
        
        {/* Header */}
        <div className="bg-surface-container-lowest border-b border-outline-variant/30 p-stack-sm md:p-stack-md flex items-center gap-stack-md shrink-0">
          <button 
            onClick={() => navigate('/chat')}
            className="p-2 -ml-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center">
            {otherUser?.avatarUrl ? (
              <img src={otherUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-title-md font-title-md text-on-surface truncate">
                {otherUser ? otherUser.displayName : 'Loading...'}
              </h2>
            </div>
            {listingData && (
              <div 
                onClick={() => navigate(`/listings/${metadata?.listingId}`)}
                className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high p-2 rounded-lg cursor-pointer transition-colors max-w-[200px]"
              >
                {listingData.image ? (
                  <img src={listingData.image} alt="listing" className="w-8 h-8 object-cover rounded-md shrink-0" />
                ) : (
                  <div className="w-8 h-8 bg-surface-variant rounded-md flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">inventory_2</span>
                  </div>
                )}
                <span className="text-label-sm font-label-sm text-on-surface truncate">
                  {listingData.title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-stack-md md:p-stack-lg flex flex-col gap-3 bg-surface-container-lowest/50">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-2 opacity-50">
              <span className="material-symbols-outlined text-[48px]">forum</span>
              <p>No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.senderId === user.uid;
              const date = new Date(msg.createdAt);
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // simple logic to show date divider if new day
              const prevMsg = messages[index - 1];
              const isNewDay = !prevMsg || new Date(prevMsg.createdAt).toDateString() !== date.toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {isNewDay && (
                    <div className="flex justify-center my-4">
                      <span className="bg-surface-container px-3 py-1 rounded-full text-label-sm font-label-sm text-on-surface-variant">
                        {date.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {msg.senderId === 'system' ? (
                    <div className="flex justify-center my-2 w-full">
                      <div className="bg-surface-container/50 border border-outline-variant/30 px-4 py-2 rounded-2xl max-w-[85%] text-center backdrop-blur-sm shadow-sm">
                        <p className="text-label-sm italic text-on-surface-variant">{msg.text}</p>
                        <span className="text-[10px] text-on-surface-variant/50 mt-0.5 block">{timeString}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[75%] md:max-w-[60%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMine 
                            ? 'bg-primary text-on-primary rounded-tr-sm' 
                            : 'bg-surface-container-high text-on-surface rounded-tl-sm'
                        }`}
                      >
                        <p className="text-body-md font-body-md whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      <span className="text-[11px] text-on-surface-variant px-1">{timeString}</span>
                    </div>
                  </div>
                  )}
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-surface-container-lowest p-stack-sm md:p-stack-md border-t border-outline-variant/30 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 bg-surface-container rounded-full px-5 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/50 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant"
            >
              <span className="material-symbols-outlined ml-1">send</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
