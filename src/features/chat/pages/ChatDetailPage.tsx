import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useToastStore } from '../../../store/useToastStore';
import { subscribeToMessages, getConversationMetadata, sendMessage, markAsRead, uploadChatImage } from '../../../services/chatService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Message, Conversation } from '../../../types';
import StudentBadge from '../../../components/ui/StudentBadge';

export default function ChatDetailPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [metadata, setMetadata] = useState<Conversation['metadata'] | null>(null);
  const [otherUser, setOtherUser] = useState<{ id: string; displayName: string; avatarUrl: string | null; email: string | null } | null>(null);
  const [listingData, setListingData] = useState<{ title: string; image: string | null } | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setOtherUser({ id: otherUserId, displayName: uData.displayName, avatarUrl: uData.avatarUrl, email: uData.email || null });
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !user) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadChatImage(file);
      await sendMessage(conversationId, user.uid, 'Đã gửi một ảnh', imageUrl);
    } catch (err) {
      console.error(err);
      addToast('Failed to upload image', 'error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user || !conversationId) return null;

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-margin-mobile md:px-gutter py-stack-md md:py-stack-lg flex flex-col h-[calc(100vh-80px)]">
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden flex-1 h-full relative">
        
        {/* Header */}
        <div className="bg-surface-container-lowest border-b border-outline-variant/30 p-stack-sm md:p-stack-md flex items-center gap-stack-md shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center">
            {otherUser?.avatarUrl ? (
              <img src={otherUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-title-md font-title-md text-on-surface truncate">
                  {otherUser ? otherUser.displayName : 'Loading...'}
                </h2>
                <StudentBadge email={otherUser?.email} variant="minimal" className="shadow-sm" />
              </div>
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
                        className={
                          msg.imageUrl && msg.text === 'Đã gửi một ảnh'
                            ? 'px-0 py-0'
                            : `px-4 py-2.5 rounded-2xl ${
                                isMine 
                                  ? 'bg-primary text-on-primary rounded-tr-sm' 
                                  : 'bg-surface-container-high text-on-surface rounded-tl-sm'
                              }`
                        }
                      >
                        {msg.imageUrl && (
                          <div className={`w-full max-w-[250px] overflow-hidden rounded-2xl shadow-sm border ${isMine ? 'border-primary/20' : 'border-surface-container-high'}`}>
                            <img src={msg.imageUrl} alt="Chat image" className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.imageUrl, '_blank')} />
                          </div>
                        )}
                        {!(msg.imageUrl && msg.text === 'Đã gửi một ảnh') && (
                          <p className="text-body-md font-body-md whitespace-pre-wrap break-words">{msg.text}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-on-surface-variant px-1">{timeString}</span>
                        {isMine && index === messages.length - 1 && otherUser?.id && metadata?.lastRead?.[otherUser.id] && msg.createdAt <= metadata.lastRead[otherUser.id] && (
                          <span className="text-[11px] text-primary font-medium flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">done_all</span>
                            Đã xem
                          </span>
                        )}
                      </div>
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
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={isUploadingImage || isSending}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || isSending}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors disabled:opacity-50 shrink-0"
            >
              {isUploadingImage ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined">image</span>
              )}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending || isUploadingImage}
              className="flex-1 bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high outline-none px-4 py-3 rounded-full text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending || isUploadingImage}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
            >
              {isSending ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined translate-x-[1px]">send</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
