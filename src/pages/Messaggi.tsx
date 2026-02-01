import { useState, useEffect, useRef } from 'react';
import { BottomNav } from "@/components/layout/BottomNav";
import { MessageCircle, ArrowLeft, Send, Loader2, ImagePlus, X, CheckCircle, Check } from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useChats, Chat } from "@/hooks/useChats";
import { ChatListSkeleton } from "@/components/skeletons/ChatListSkeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

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
  const { theme, isEmployer } = useAppTheme();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Use React Query for cached chat list
  const { data: chats = [], isLoading: loading, refetch: refetchChats } = useChats(user?.id);
  
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [completingJob, setCompletingJob] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle URL param for direct chat open
  useEffect(() => {
    const chatIdParam = searchParams.get('chat');
    if (chatIdParam && chats.length > 0) {
      const targetChat = chats.find(c => c.id === chatIdParam);
      if (targetChat) {
        setSelectedChat(targetChat);
      }
    }
  }, [searchParams, chats]);

  // Ref to track current selected chat without re-subscribing
  const selectedChatRef = useRef<Chat | null>(null);
  selectedChatRef.current = selectedChat;

  // Subscribe to new messages for notifications - STABLE subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`global-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // If message is not from current user and not in current chat (use ref for stable reference)
          if (newMsg.sender_id !== user.id && (!selectedChatRef.current || newMsg.chat_id !== selectedChatRef.current.id)) {
            // Find sender name
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .single();
            
            toast.info(`Nuovo messaggio da ${sender?.full_name || 'Utente'}`, { duration: 3000 });
            
            // Invalidate chats cache to update unread count
            queryClient.invalidateQueries({ queryKey: ['chats'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Load messages for selected chat and mark as read
  useEffect(() => {
    if (!selectedChat || !user) {
      setMessages([]);
      setApplicationStatus(null);
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
        
        // Invalidate cache to update badge
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    };

    // Fetch application status for this chat
    const fetchApplicationStatus = async () => {
      const { data: applicationData } = await supabase
        .from('applications')
        .select('status')
        .eq('job_id', selectedChat.job_id)
        .eq('applicant_id', selectedChat.worker_id)
        .single();
      
      setApplicationStatus(applicationData?.status || null);
    };

    fetchMessages();
    fetchApplicationStatus();

    // Subscribe to new messages and updates
    const chatId = selectedChat.id;
    const userId = user.id;
    
    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            // Use functional update to avoid stale closure
            setMessages(prev => {
              const existingReply = newMsg.reply_to_id 
                ? prev.find(m => m.id === newMsg.reply_to_id) 
                : null;
              return [...prev, { ...newMsg, reply_to: existingReply || null }];
            });
            
            // Mark as read if not from current user
            if (newMsg.sender_id !== userId) {
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
  }, [selectedChat?.id, user?.id, queryClient]);

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

  // Handle job completion
  const handleCompleteJob = async () => {
    if (!selectedChat) return;
    
    setCompletingJob(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'completed' })
        .eq('job_id', selectedChat.job_id)
        .eq('applicant_id', selectedChat.worker_id);

      if (error) throw error;
      
      setApplicationStatus('completed');
      
      // Invalidate chats cache to update status
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      toast.success('Lavoro concluso con successo!', { duration: 2000 });
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Errore nella chiusura del lavoro', { duration: 2000 });
    } finally {
      setCompletingJob(false);
    }
  };

  // Chat detail view
  if (selectedChat) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Chat header with safe area padding */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-8 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedChat(null);
                setReplyingTo(null);
                setPendingAttachment(null);
                setApplicationStatus(null);
                navigate('/messaggi', { replace: true });
              }}
              className="rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/profile/${selectedChat.other_user?.id}`)}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={selectedChat.other_user?.avatar_url || undefined} />
                <AvatarFallback className={`${theme.accentBg} ${theme.primaryText}`}>
                  {(selectedChat.other_user?.full_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate text-sm">
                  {selectedChat.other_user?.full_name || 'Utente'}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedChat.job?.title}
                </p>
              </div>
            </div>
            
            {/* Complete job button / badge for Employer */}
            {isEmployer && applicationStatus === 'accepted' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-blue-600 border-blue-600 hover:bg-blue-50"
                    disabled={completingJob}
                  >
                    {completingJob ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Concludi</span>
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Concludi Lavoro</AlertDialogTitle>
                    <AlertDialogDescription>
                      Confermi che il lavoro è stato svolto? Questo aggiornerà lo storico del lavoratore.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCompleteJob}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Conferma
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {/* Completed badge */}
            {applicationStatus === 'completed' && (
              <Badge variant="outline" className="shrink-0 text-green-600 border-green-600">
                <Check className="h-3 w-3 mr-1" />
                Concluso
              </Badge>
            )}
          </div>
        </header>

        {/* Messages area with calculated height */}
        <main className="flex-1 overflow-y-auto px-4 py-4" style={{ height: 'calc(100vh - 160px)' }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">
                Inizia la conversazione...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                  isEmployer={isEmployer}
                  onReply={handleReply}
                  formatTime={formatMessageTime}
                />
              ))}
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

        {/* Message input with safe area padding */}
        <div className="sticky bottom-0 bg-background border-t px-4 py-3 pb-8">
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
              className={`rounded-full ${isEmployer ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary hover:bg-primary/90'}`}
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
      {/* Simple Header with safe area */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-8 pb-3">
        <h1 className={`text-2xl font-bold ${isEmployer ? "text-blue-600" : "text-primary"}`}>Messaggi</h1>
      </header>

      <main className="flex-1 px-4 pb-20 overflow-y-auto">
        {loading ? (
          <ChatListSkeleton count={5} />
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
            {chats.map((chat) => {
              const isCompleted = chat.application_status === 'completed';
              
              return (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`material-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow ${
                    isCompleted ? 'bg-muted/50 opacity-80' : ''
                  }`}
                >
                  <Avatar 
                    className="h-12 w-12 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${chat.other_user?.id}`);
                    }}
                  >
                    <AvatarImage src={chat.other_user?.avatar_url || undefined} />
                    <AvatarFallback className={`${theme.accentBg} ${theme.primaryText}`}>
                      {(chat.other_user?.full_name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {chat.other_user?.full_name || 'Utente'}
                      </h3>
                      {isCompleted && (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs shrink-0">
                          <Check className="h-3 w-3 mr-0.5" />
                          Concluso
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.job?.title}
                    </p>
                  </div>
                  {/* Unread badge with dynamic color */}
                  {chat.unread_count && chat.unread_count > 0 && (
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isEmployer ? 'bg-blue-600' : 'bg-primary'}`}>
                      <span className="text-xs text-white font-bold">
                        {chat.unread_count > 9 ? '9+' : chat.unread_count}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Messaggi;
