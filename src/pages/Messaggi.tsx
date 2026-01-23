import { useState, useEffect, useRef } from 'react';
import { BottomNav } from "@/components/layout/BottomNav";
import { MessageCircle, ArrowLeft, Send, Loader2, CheckCheck, ImagePlus, X, Reply } from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface Chat {
  id: string;
  job_id: string;
  worker_id: string;
  employer_id: string;
  created_at: string;
  job?: {
    title: string;
  };
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  unread_count?: number;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  reply_to_id: string | null;
  attachment_url: string | null;
  reply_to?: Message | null;
}

// Smart timestamp formatting
const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } else {
    return `${date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })} ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
  }
};

const Messaggi = () => {
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chats list
  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*, jobs(title)')
          .or(`worker_id.eq.${user.id},employer_id.eq.${user.id}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Fetch other user's profile and unread count for each chat
        const chatsWithUsers = await Promise.all(
          (data || []).map(async (chat) => {
            const otherUserId = chat.worker_id === user.id ? chat.employer_id : chat.worker_id;
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, photos')
              .eq('id', otherUserId)
              .single();

            // Count unread messages
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .eq('is_read', false)
              .neq('sender_id', user.id);

            const avatarUrl = profile?.photos && profile.photos.length > 0 
              ? profile.photos[0] 
              : profile?.avatar_url;

            return {
              ...chat,
              job: chat.jobs,
              other_user: profile ? { 
                id: profile.id, 
                full_name: profile.full_name, 
                avatar_url: avatarUrl 
              } : { id: otherUserId, full_name: null, avatar_url: null },
              unread_count: count || 0,
            };
          })
        );

        setChats(chatsWithUsers);

        const chatIdParam = searchParams.get('chat');
        if (chatIdParam) {
          const targetChat = chatsWithUsers.find(c => c.id === chatIdParam);
          if (targetChat) {
            setSelectedChat(targetChat);
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Subscribe to new messages for notifications
    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // If message is not from current user and not in current chat
          if (newMsg.sender_id !== user.id && (!selectedChat || newMsg.chat_id !== selectedChat.id)) {
            // Find sender name
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .single();
            
            toast.info(`Nuovo messaggio da ${sender?.full_name || 'Utente'}`, { duration: 3000 });
            
            // Update unread count in chats list
            setChats(prev => prev.map(chat => 
              chat.id === newMsg.chat_id 
                ? { ...chat, unread_count: (chat.unread_count || 0) + 1 }
                : chat
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, searchParams]);

  // Load messages for selected chat and mark as read
  useEffect(() => {
    if (!selectedChat || !user) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch reply_to messages
      const messagesWithReplies = await Promise.all(
        (data || []).map(async (msg) => {
          if (msg.reply_to_id) {
            const replyMsg = data?.find(m => m.id === msg.reply_to_id);
            return { ...msg, reply_to: replyMsg || null };
          }
          return { ...msg, reply_to: null };
        })
      );

      setMessages(messagesWithReplies);

      // Mark received messages as read
      const unreadMessageIds = data
        ?.filter(msg => !msg.is_read && msg.sender_id !== user.id)
        .map(msg => msg.id) || [];

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds);
      }

      // Clear unread count for this chat
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id ? { ...chat, unread_count: 0 } : chat
      ));
    };

    fetchMessages();

    // Subscribe to new messages and updates
    const channel = supabase
      .channel(`messages-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            // Fetch reply if exists
            if (newMsg.reply_to_id) {
              const existingReply = messages.find(m => m.id === newMsg.reply_to_id);
              setMessages(prev => [...prev, { ...newMsg, reply_to: existingReply || null }]);
            } else {
              setMessages(prev => [...prev, { ...newMsg, reply_to: null }]);
            }
            
            // Mark as read if not from current user
            if (newMsg.sender_id !== user.id) {
              await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo immagini sono permesse', { duration: 2000 });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Immagine troppo grande (max 5MB)', { duration: 2000 });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      setPendingAttachment(publicUrl);
      toast.success('Immagine pronta per l\'invio', { duration: 2000 });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Errore nel caricamento', { duration: 2000 });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingAttachment) || !selectedChat || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          content: newMessage.trim() || (pendingAttachment ? '📷 Foto' : ''),
          reply_to_id: replyingTo?.id || null,
          attachment_url: pendingAttachment,
        });

      if (error) throw error;
      setNewMessage('');
      setReplyingTo(null);
      setPendingAttachment(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Errore nell\'invio del messaggio', { duration: 2000 });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  // Chat detail view
  if (selectedChat) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Chat header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedChat(null);
                setReplyingTo(null);
                setPendingAttachment(null);
                navigate('/messaggi', { replace: true });
              }}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedChat.other_user?.avatar_url || undefined} />
              <AvatarFallback className={`${theme.accentBg} ${theme.primaryText}`}>
                {(selectedChat.other_user?.full_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">
                {selectedChat.other_user?.full_name || 'Utente'}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {selectedChat.job?.title}
              </p>
            </div>
          </div>
        </header>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">
                Inizia la conversazione...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className="flex flex-col max-w-[75%]">
                      {/* Reply preview */}
                      {msg.reply_to && (
                        <div 
                          className={`text-xs px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2 ${
                            isOwn 
                              ? 'bg-blue-700/50 border-blue-300 text-blue-100' 
                              : 'bg-muted/80 border-muted-foreground/50 text-muted-foreground'
                          }`}
                        >
                          <p className="font-medium truncate">
                            {msg.reply_to.content.substring(0, 50)}{msg.reply_to.content.length > 50 ? '...' : ''}
                          </p>
                        </div>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-2xl relative ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}
                        onClick={() => !isOwn && handleReply(msg)}
                      >
                        {/* Attachment image */}
                        {msg.attachment_url && (
                          <div className="mb-2 -mx-2 -mt-1">
                            <img 
                              src={msg.attachment_url} 
                              alt="Allegato" 
                              className="rounded-xl max-w-full h-auto object-cover max-h-64"
                            />
                          </div>
                        )}
                        
                        {msg.content && msg.content !== '📷 Foto' && (
                          <p className="text-sm">{msg.content}</p>
                        )}
                        
                        {/* Timestamp and read receipts */}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-200' : 'text-muted-foreground'}`}>
                          <span className="text-xs">{formatMessageTime(msg.created_at)}</span>
                          {isOwn && (
                            <CheckCheck className={`w-4 h-4 ${msg.is_read ? 'text-blue-300' : 'text-blue-200/60'}`} />
                          )}
                        </div>

                        {/* Reply button (visible on hover for own messages, always for others on mobile) */}
                        {!isOwn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReply(msg);
                            }}
                            className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Reply className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Reply preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Rispondendo a:</p>
              <p className="text-sm truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyingTo(null)}
              className="shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Pending attachment preview */}
        {pendingAttachment && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center gap-3">
            <img src={pendingAttachment} alt="Allegato" className="h-12 w-12 rounded-lg object-cover" />
            <p className="flex-1 text-sm text-muted-foreground">Immagine allegata</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPendingAttachment(null)}
              className="shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Message input */}
        <div className="sticky bottom-0 bg-background border-t px-4 py-3 safe-bottom">
          <div className="flex items-center gap-2">
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="shrink-0 rounded-full"
            >
              {uploadingImage ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              className="flex-1 rounded-full"
              disabled={sending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !pendingAttachment) || sending}
              size="icon"
              className="rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Chats list view
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top">
        <h1 className="text-2xl font-bold text-foreground">Messaggi</h1>
      </header>

      <main className="flex-1 px-4 pb-20 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="material-card-elevated p-8 text-center max-w-sm animate-scale-in">
              <div className={`w-16 h-16 ${theme.accentBg} ${theme.accentText} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <MessageCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Nessun Messaggio</h2>
              <p className="text-muted-foreground text-sm">
                Quando contatterai un employer o riceverai messaggi, appariranno qui.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className="material-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.other_user?.avatar_url || undefined} />
                  <AvatarFallback className={`${theme.accentBg} ${theme.primaryText}`}>
                    {(chat.other_user?.full_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {chat.other_user?.full_name || 'Utente'}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.job?.title}
                  </p>
                </div>
                {/* Unread badge */}
                {chat.unread_count && chat.unread_count > 0 && (
                  <div className="shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {chat.unread_count > 9 ? '9+' : chat.unread_count}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Messaggi;
