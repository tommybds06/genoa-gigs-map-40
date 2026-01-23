import { useState, useEffect, useRef } from 'react';
import { BottomNav } from "@/components/layout/BottomNav";
import { MessageCircle, ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        // Fetch other user's profile for each chat (include photos for avatar)
        const chatsWithUsers = await Promise.all(
          (data || []).map(async (chat) => {
            const otherUserId = chat.worker_id === user.id ? chat.employer_id : chat.worker_id;
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, photos')
              .eq('id', otherUserId)
              .single();

            // Use first photo as avatar if available
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
            };
          })
        );

        setChats(chatsWithUsers);

        // Check if we need to open a specific chat
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
  }, [user, searchParams]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
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

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('it-IT', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Message input */}
        <div className="sticky bottom-0 bg-background border-t px-4 py-3 safe-bottom">
          <div className="flex items-center gap-2">
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
              disabled={!newMessage.trim() || sending}
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