import { Fragment, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { MessageCircle, ArrowLeft, Send, Loader2, ImagePlus, X, CheckCircle, Check } from "lucide-react";
import { InvioIcon, ImmaginiIcon, MessaggiVuotaIcon } from "@/components/icons/uiIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import { Tessera, TesseraIcona, TesseraIndietro } from "@/components/ui/Tessera";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarPreview } from "@/components/profile/AvatarPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useChats, Chat } from "@/hooks/useChats";
import { ChatListSkeleton } from "@/components/skeletons/ChatListSkeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
 import { SwipeNavigator } from "@/components/layout/SwipeNavigator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bacheca } from "@/components/bacheca/Bacheca";
import { SchedaCartellino } from "@/components/bacheca/SchedaCartellino";
import { BachecaWorker } from "@/components/bacheca/BachecaWorker";
import { useLavoriWorker } from "@/hooks/useLavoriWorker";
import { useCartellini, CHIAVE_CARTELLINI } from "@/hooks/useCartellini";
import { eScaduto, chiudiAnnuncioSeNessunoResta } from "@/lib/bacheca";
import { formatOrarioChat, anteprimaMessaggio, chiaveGiorno, etichettaGiorno } from "@/lib/dates";
import { MESSAGGIO_ASSUNZIONE, testoDiSistema, tipoDiSistema } from "@/lib/messaggiSistema";
import { JobDetailsSheet } from "@/components/map/JobDetailsSheet";
import type { Job } from "@/hooks/useJobs";
import { GenericoIcon } from "@/components/icons/roleIcons";
import { OrologioIcon, InfoIcon } from "@/components/icons/uiIcons";
import { ChevronRight } from "lucide-react";
import { useAttachmentUrl } from "@/hooks/useAttachmentUrl";
import { useMessaggi, inserisciMessaggio, aggiornaMessaggio, type Messaggio } from "@/hooks/useMessaggi";

/** Il messaggio di una chat: vedi `hooks/useMessaggi.ts`. */
type Message = Messaggio;

const Messaggi = () => {
  const { theme, isEmployer } = useAppTheme();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Use React Query for cached chat list
  const { data: chats = [], isLoading: loading, refetch: refetchChats } = useChats(user?.id);
  
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  /* I messaggi della chat aperta, dalla cache (useMessaggi): riaprendo una
     chat ci sono al primo fotogramma, niente più lista vuota e poi il salto. */
  const { data: messages = [], isFetched: messaggiCaricati } = useMessaggi(selectedChat?.id);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null);
  const pendingAttachmentUrl = useAttachmentUrl(pendingAttachment);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  // Dopo «Assumi»: il cartellino da compilare (vedi handleHireWorker).
  const [compilaPer, setCompilaPer] = useState<{ jobId: string; workerId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Bacheca: per tutti e due i ruoli — l'employer ci appende chi lavora con
     lui, il worker ci vede i lavori in cui è stato preso. La scheda attiva sta
     nell'URL (`?vista=`) e non in uno state: aprendo un profilo dal cartellino
     si esce dalla pagina, e al ritorno si deve ritrovare la bacheca. */
  const vista = searchParams.get('vista') === 'bacheca' ? 'bacheca' : 'chat';
  const cambiaVista = (v: string) =>
    setSearchParams(v === 'bacheca' ? { vista: 'bacheca' } : {}, { replace: true });
  const { data: cartellini = [] } = useCartellini(isEmployer ? user?.id : undefined);
  const cartellinoDaCompilare = compilaPer
    ? cartellini.find((c) => c.jobId === compilaPer.jobId && c.workerId === compilaPer.workerId) ?? null
    : null;
  const { data: lavori = [] } = useLavoriWorker(!isEmployer ? user?.id : undefined);
  /* Il pallino: qualcosa da decidere (employer: una data di fine passata) o
     da fare (worker: un lavoro da recensire). */
  const daFare = isEmployer
    ? cartellini.filter(eScaduto).length
    : lavori.filter((l) => l.stato === 'da-recensire').length;

  const apriChatDaBacheca = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) setSelectedChat(chat);
    else toast.error('Chat non trovata');
  };

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

          // La lista va aggiornata SEMPRE, a ogni messaggio: cambiano ordine,
          // anteprima e contatore. Prima questa riga stava dentro l'if qui
          // sotto, quindi non scattava per i messaggi scritti da me ne' per
          // quelli ricevuti mentre ero dentro quella chat — e la lista si
          // riordinava solo al refresh della pagina.
          queryClient.invalidateQueries({ queryKey: ['chats'] });

          // Il toast invece resta condizionato: ha senso solo per un messaggio
          // altrui arrivato in una conversazione che NON sto guardando.
          if (newMsg.sender_id !== user.id && (!selectedChatRef.current || newMsg.chat_id !== selectedChatRef.current.id)) {
            // Find sender name
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .maybeSingle();

            toast.info(`Nuovo messaggio da ${sender?.full_name || 'Utente'}`, { duration: 3000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Chat aperta: stato della candidatura + messaggi in tempo reale, scritti
  // direttamente nella cache di useMessaggi.
  useEffect(() => {
    const chatId = selectedChat?.id;
    const workerId = selectedChat?.worker_id;
    const jobId = selectedChat?.job_id;
    const userId = user?.id;

    if (!chatId || !userId) {
      setApplicationStatus(null);
      return;
    }

    let isMounted = true;

    const fetchApplicationStatus = async () => {
      if (!jobId || !workerId) return;
      // ⚠️ maybeSingle e non single: con zero righe single() dà 406 (§12).
      const { data: applicationData } = await supabase
        .from('applications')
        .select('status')
        .eq('job_id', jobId)
        .eq('applicant_id', workerId)
        .maybeSingle();
      if (isMounted) setApplicationStatus(applicationData?.status || null);
    };
    fetchApplicationStatus();

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            // Se è un mio messaggio già comparso (stesso id), lo conferma.
            inserisciMessaggio(queryClient, chatId, { ...(payload.new as Messaggio), stato: undefined });
          } else if (payload.eventType === 'UPDATE') {
            aggiornaMessaggio(queryClient, chatId, payload.new.id as string, payload.new as Partial<Messaggio>);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [selectedChat?.id, selectedChat?.job_id, selectedChat?.worker_id, user?.id, queryClient]);

  // Letti: i messaggi ricevuti nella chat aperta, una volta sola ciascuno —
  // all'apertura e quando ne arrivano di nuovi.
  const giaSegnatiLetti = useRef(new Set<string>());
  useEffect(() => {
    if (!selectedChat?.id || !user?.id) return;
    const ids = messages
      .filter((m) => !m.is_read && m.sender_id !== user.id && !giaSegnatiLetti.current.has(m.id))
      .map((m) => m.id);
    if (ids.length === 0) return;
    ids.forEach((id) => giaSegnatiLetti.current.add(id));
    supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', ids)
      .then(({ error }) => {
        if (!error) queryClient.invalidateQueries({ queryKey: ['chats'] });
      });
  }, [messages, selectedChat?.id, user?.id, queryClient]);

  // Scroll management (stile WhatsApp): all'apertura la chat va in fondo (messaggio
  // più recente) senza animazione; sui nuovi messaggi scrolla in fondo in modo fluido.
  // Con pochi messaggi il contenuto non riempie l'area, quindi restano in alto (nessuno
  // scroll necessario) — esattamente come WhatsApp.
  const prevMessagesCountRef = useRef(0);
  const statoUltimo = messages[messages.length - 1]?.stato;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length === 0) {
      prevMessagesCountRef.current = 0;
      return;
    }
    const container = messagesContainerRef.current;
    if (!container) return;

    const isInitialLoad = prevMessagesCountRef.current === 0;
    const hasNewMessages = messages.length > prevMessagesCountRef.current;

    if (isInitialLoad) {
      // rAF per assicurarsi che il layout sia calcolato prima di scrollare
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight });
      });
    } else if (hasNewMessages || statoUltimo === 'errore') {
      // Anche quando l'ultimo messaggio NON PARTE: sotto la bolla compare
      // «Non inviato · Tocca per riprovare», e senza questo restava sotto il
      // bordo, invisibile (visto in anteprima).
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages.length, statoUltimo]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedChat) return;

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
      const filePath = `${selectedChat.id}/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setPendingAttachment(filePath);
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

  /* INVIO ISTANTANEO (Tommaso, 22 ottobre: «poco responsiva»). Prima il
     messaggio compariva solo dopo DUE viaggi di rete — il salvataggio e il
     ritorno col tempo reale — col testo fermo nel campo e la rotellina sul
     bottone. Ora compare subito, il campo si svuota subito, e l'orologio
     sulla bolla dice «in invio» finché il database non conferma. L'id lo
     generiamo noi: quando il messaggio torna col tempo reale ha lo stesso
     id, e prende il posto di quello istantaneo invece di raddoppiarlo. */
  const inviaAlDatabase = async (m: Messaggio) => {
    const { error } = await supabase.from('messages').insert({
      id: m.id,
      chat_id: m.chat_id,
      sender_id: m.sender_id,
      content: m.content,
      reply_to_id: m.reply_to_id,
      attachment_url: m.attachment_url,
    });
    // 23505 = c'è già: il primo tentativo era arrivato, si era perso solo la risposta.
    if (error && error.code !== '23505') {
      console.error('Error sending message:', error);
      aggiornaMessaggio(queryClient, m.chat_id, m.id, { stato: 'errore' });
      return;
    }
    aggiornaMessaggio(queryClient, m.chat_id, m.id, { stato: undefined });
  };

  const handleSendMessage = () => {
    if ((!newMessage.trim() && !pendingAttachment) || !selectedChat || !user) return;
    const m: Messaggio = {
      id: crypto.randomUUID(),
      chat_id: selectedChat.id,
      sender_id: user.id,
      content: newMessage.trim() || (pendingAttachment ? '📷 Foto' : ''),
      created_at: new Date().toISOString(),
      is_read: false,
      reply_to_id: replyingTo?.id || null,
      attachment_url: pendingAttachment,
      reply_to: replyingTo,
      stato: 'invio',
    };
    inserisciMessaggio(queryClient, m.chat_id, m);
    setNewMessage('');
    setReplyingTo(null);
    setPendingAttachment(null);
    void inviaAlDatabase(m);
  };

  const riprovaMessaggio = (m: Messaggio) => {
    aggiornaMessaggio(queryClient, m.chat_id, m.id, { stato: 'invio' });
    void inviaAlDatabase(m);
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

  // Handle hiring worker (accepted -> hired) - use refs to avoid re-render loops
  const pendingHireRef = useRef(false);
  
  const handleHireWorker = async () => {
    if (!selectedChat || !user || pendingHireRef.current) return;
    pendingHireRef.current = true;

    // Capture values BEFORE any state changes
    const chatId = selectedChat.id;
    const jobId = selectedChat.job_id;
    const workerId = selectedChat.worker_id;
    const userId = user.id;

    // 1. Close dialog FIRST and wait for animation to complete
    setShowHireDialog(false);
    await new Promise(resolve => setTimeout(resolve, 150));
    setApplicationStatus('hired');

    try {
      /* ⚠️ ASPETTATO, non più «fire and forget»: subito dopo si apre il
         cartellino da compilare, e il cartellino lo crea il database (trigger
         `appendi_assunto`) proprio su questo cambio di stato. */
      const { error } = await supabase
        .from('applications')
        .update({ status: 'hired' })
        .eq('job_id', jobId)
        .eq('applicant_id', workerId);
      if (error) throw error;

      await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: userId,
        // Testo NEUTRO: in chat si riscrive per chi legge (lib/messaggiSistema.ts).
        content: MESSAGGIO_ASSUNZIONE,
        // Va marcato in SCRITTURA. La migration ha riempito le righe esistenti
        // confrontando il testo, ma quello e' un backfill una tantum: senza
        // questa riga ogni nuova assunzione tornerebbe indistinguibile da un
        // messaggio scritto da una persona.
        is_system: true,
      });

      /* Il flusso (Tommaso, 21 ottobre): dopo l'assunzione l'app fa compilare
         il cartellino — durata, paga, giorni. Prima qui si chiedeva solo se
         togliere l'annuncio dalla mappa: ora quella domanda sta nel modulo. */
      await queryClient.invalidateQueries({ queryKey: [CHIAVE_CARTELLINI] });
      setCompilaPer({ jobId, workerId });
      toast.success('Assunzione fatta: compila il cartellino', { duration: 2500 });
    } catch (e) {
      console.error('Error hiring:', e);
      setApplicationStatus('accepted');
      toast.error('Errore nell\'assunzione');
    } finally {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      pendingHireRef.current = false;
    }
  };

  // Handle job completion (hired -> completed) - use refs to avoid re-render loops
  const pendingCompleteRef = useRef(false);
  
  const handleCompleteJob = async () => {
    if (!selectedChat || pendingCompleteRef.current) return;
    pendingCompleteRef.current = true;
    
    // Capture values BEFORE any state changes
    const jobId = selectedChat.job_id;
    const workerId = selectedChat.worker_id;
    
    // 1. Close dialog FIRST and wait for animation
    setShowCompleteDialog(false);
    
    // 2. Wait for dialog close animation to finish
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 3. Now safe to update UI
    setApplicationStatus('completed');
    toast.success('Lavoro concluso!', { duration: 2000 });
    
    // 4. DB operations in background
    supabase
      .from('applications')
      .update({ status: 'completed' })
      .eq('job_id', jobId)
      .eq('applicant_id', workerId)
      .then(({ error }) => {
        if (error) {
          console.error('Error completing job:', error);
          setApplicationStatus('hired');
          toast.error('Errore nella chiusura del lavoro');
        }
      });

    // 5. Chiude l'annuncio SOLO se non resta nessun altro al lavoro: prima lo
    //    chiudeva sempre, anche con un secondo assunto sullo stesso annuncio.
    chiudiAnnuncioSeNessunoResta(jobId, workerId);

    // 6. Invalidate queries later
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: [CHIAVE_CARTELLINI] });
      pendingCompleteRef.current = false;
    }, 1000);
  };

  /* ---- LA CHAT ENTRA DA DESTRA ----
     Prima `if (selectedChat) return …` sostituiva lo schermo di colpo. Ora la
     chat è un pannello SOPRA la lista (che resta montata sotto): entra
     scorrendo da destra e al ritorno esce dallo stesso lato, come in ogni app
     di messaggi. È un'animazione che accompagna un gesto (§12). Animazione
     nativa e non framer: dentro le pagine `AnimatePresence initial={false}`
     spegne gli ingressi (§12). */
  const pannelloChat = useRef<HTMLDivElement>(null);
  const chiusuraInCorso = useRef(false);
  const movimentoRidotto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useLayoutEffect(() => {
    const el = pannelloChat.current;
    if (!el || !selectedChat?.id || movimentoRidotto()) return;
    el.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], {
      duration: 280,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }, [selectedChat?.id]);

  const chiudiChat = () => {
    const fine = () => {
      chiusuraInCorso.current = false;
      setSelectedChat(null);
      setReplyingTo(null);
      setPendingAttachment(null);
      setApplicationStatus(null);
      navigate('/messaggi', { replace: true });
    };
    const el = pannelloChat.current;
    if (!el || movimentoRidotto()) return fine();
    if (chiusuraInCorso.current) return;
    chiusuraInCorso.current = true;
    const uscita = el.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      fill: 'forwards',
    });
    uscita.onfinish = fine;
  };

  // L'annuncio di cui si parla, riaperto dal titolo in testa alla chat.
  const [annuncioChat, setAnnuncioChat] = useState<Job | null>(null);
  const apriAnnuncio = async () => {
    if (!selectedChat?.job_id) return;
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles(full_name, avatar_url, address_text, photos)')
      .eq('id', selectedChat.job_id)
      .maybeSingle();
    if (error || !data) {
      toast.error('Annuncio non più disponibile', { duration: 2000 });
      return;
    }
    setAnnuncioChat({ ...data, tags: data.tags || [] } as unknown as Job);
  };

  // Chat detail view
  const vistaChat = selectedChat ? (
      // Fullscreen chat container - covers entire viewport including navbar
      // z-[60] to be ABOVE the BottomNav which is z-50
      <div
        ref={pannelloChat}
        className="fixed inset-0 flex flex-col bg-background z-[60]"
        style={{ height: '100dvh' }}
      >
        {/* Chat header - shrink-0 so it doesn't compress */}
        <header className="shrink-0 z-40 bg-background px-4 pt-8 pb-3">
          <div className="flex items-center gap-2">
            <TesseraIndietro onClick={chiudiChat} />
            <button
              type="button"
              className="shrink-0"
              onClick={() => navigate(`/profile/${selectedChat.other_user?.id}`)}
              aria-label={`Profilo di ${selectedChat.other_user?.full_name || 'utente'}`}
            >
              <Avatar seme={selectedChat.other_user?.id} className="h-10 w-10">
                <AvatarImage src={selectedChat.other_user?.avatar_url || undefined} />
                <AvatarFallback className={`${theme.accentBg} ${theme.primaryText}`}>
                  {(selectedChat.other_user?.full_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1 min-w-0">
              <button
                type="button"
                className="block max-w-full truncate text-left font-semibold text-[15px] leading-tight"
                onClick={() => navigate(`/profile/${selectedChat.other_user?.id}`)}
              >
                {selectedChat.other_user?.full_name || 'Utente'}
              </button>
              {/* Di che lavoro si parla: toccandolo si riapre la scheda. */}
              {selectedChat.job?.title && (
                <button
                  type="button"
                  onClick={apriAnnuncio}
                  className="mt-0.5 flex max-w-full items-center gap-0.5 text-left text-xs text-muted-foreground active:opacity-70"
                >
                  <span className="truncate">{selectedChat.job.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              )}
            </div>

            {/* HIRE button for Employer when status is 'accepted' (in colloquio) */}
            {isEmployer && applicationStatus === 'accepted' && (
              <Button
                size="sm"
                className="shrink-0 bg-employer-700 hover:bg-employer-800 text-employer-foreground"
                onClick={() => setShowHireDialog(true)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Assumi</span>
              </Button>
            )}
            
            {/* COMPLETE JOB button for Employer when status is 'hired' */}
            {isEmployer && applicationStatus === 'hired' && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-success border-success hover:bg-success-soft"
                onClick={() => setShowCompleteDialog(true)}
              >
                <Check className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Concludi Lavoro</span>
                <span className="sm:hidden">Concludi</span>
              </Button>
            )}
            
            {/* Hired badge for Worker */}
            {!isEmployer && applicationStatus === 'hired' && <StatusBadge stato="hired" />}

            {/* Completed badge */}
            {applicationStatus === 'completed' && <StatusBadge stato="completed" />}
          </div>
        </header>
        {/* La linea disegnata al posto del bordo CSS da 1 px. */}
        <div aria-hidden="true" className="linea-divisoria-sopra shrink-0" />

        {/* Messages area - stile WhatsApp: i messaggi partono dall'alto; lo scroll
            va in fondo (messaggio più recente) all'apertura e sui nuovi messaggi via JS */}
        <main
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 flex flex-col"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {messaggiCaricati && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">
                Inizia la conversazione...
              </p>
            </div>
          ) : (
            /* `mt-auto`: la conversazione sta IN FONDO, vicino a dove si
               scrive, e lo spazio vuoto va sopra — come in ogni app di chat.
               Prima partiva dall'alto e lasciava mezzo schermo vuoto in mezzo. */
            <div className="mt-auto pb-3 pt-1">
              {messages.map((msg, i) => {
                const prec = messages[i - 1];
                const succ = messages[i + 1];
                const nuovoGiorno = !prec || chiaveGiorno(prec.created_at) !== chiaveGiorno(msg.created_at);
                /* Stesso gruppo = stessa persona, stesso giorno, a meno di
                   5 minuti: le bolle si stringono e solo l'ultima ha l'angolo
                   dal lato di chi parla. */
                const stessoGruppo = (a?: Message, b?: Message) =>
                  !!a && !!b && !a.is_system && !b.is_system &&
                  a.sender_id === b.sender_id &&
                  chiaveGiorno(a.created_at) === chiaveGiorno(b.created_at) &&
                  Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < 5 * 60_000;

                const separatore = nuovoGiorno && (
                  <div role="separator" className="flex items-center gap-3 pb-1 pt-4">
                    <span aria-hidden="true" className="linea-divisoria-sopra h-0 flex-1" />
                    <span className="text-xs font-medium text-ink-soft first-letter:uppercase">
                      {etichettaGiorno(msg.created_at)}
                    </span>
                    <span aria-hidden="true" className="linea-divisoria-sopra h-0 flex-1" />
                  </div>
                );

                if (msg.is_system) {
                  /* I messaggi dell'app come TIMBRO, non come bolla: non li ha
                     scritti nessuno dei due. L'assunzione nel verde di
                     «Assunto», con la valigetta: è il momento da ritrovare
                     scorrendo. Il testo è scritto per chi legge. */
                  const tipo = tipoDiSistema(msg.content);
                  const Icona = tipo === 'assunzione' ? GenericoIcon : tipo === 'chiusura' ? OrologioIcon : InfoIcon;
                  return (
                    <Fragment key={msg.id}>
                      {separatore}
                      <div className="flex justify-center py-2">
                        <span
                          className={cn(
                            'sagoma-chip inline-flex max-w-[88%] items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium',
                            tipo === 'assunzione'
                              ? 'bg-success-soft text-success-soft-foreground'
                              : 'bg-paper-sunken text-ink-soft'
                          )}
                        >
                          <Icona className="h-4 w-4 shrink-0" />
                          <span>{testoDiSistema(msg.content, { isEmployer, nomeAltro: selectedChat.other_user?.full_name })}</span>
                        </span>
                      </div>
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={msg.id}>
                    {separatore}
                    <MessageBubble
                      message={msg}
                      isOwn={msg.sender_id === user?.id}
                      isEmployer={isEmployer}
                      onReply={handleReply}
                      continuaGruppo={!nuovoGiorno && stessoGruppo(prec, msg)}
                      chiudeGruppo={!stessoGruppo(msg, succ)}
                      onRiprova={riprovaMessaggio}
                    />
                  </Fragment>
                );
              })}
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
            {pendingAttachmentUrl && <img src={pendingAttachmentUrl} alt="Allegato" className="h-12 w-12 rounded-lg object-cover" />}
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

        {/* Message input - shrink-0 stays at bottom, never compressed */}
        <div
          className="linea-divisoria-sopra shrink-0 bg-background px-4 pt-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          <div className="flex items-center gap-2">
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {/* Allegato e invio sono due tessere gemelle ai lati del campo. */}
            <Tessera
              icona={uploadingImage ? Loader2 : ImmaginiIcon}
              classeIcona={uploadingImage ? "animate-spin" : undefined}
              etichetta="Allega una foto"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            />

            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              className="flex-1 rounded-full h-12 text-base"
            />
            {/* L'invio è una TESSERA (ui/Tessera), come la freccia indietro in
                alto: pieno chiaro del ruolo e icona in inchiostro, per worker
                ed employer. La coppia fondo+icona la decide la tessera —
                niente più `bg-` scritti a mano (il bug ricorrente numero uno). */}
            {/* Niente rotellina: il messaggio compare subito (vedi
                handleSendMessage). A campo vuoto la tessera è SPENTA, non
                slavata. */}
            <Tessera
              icona={InvioIcon}
              etichetta="Invia"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !pendingAttachment}
              spenta={!newMessage.trim() && !pendingAttachment}
            />
          </div>
        </div>
        
        {/* Dialog: Hire confirmation */}
        <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assumere Candidato</DialogTitle>
              <DialogDescription>
                Confermi di voler assumere questo candidato per l'incarico?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHireDialog(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleHireWorker}
                className={isEmployer ? "bg-employer-700 hover:bg-employer-800 text-employer-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"}
              >
                Conferma Assunzione
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog: Complete job confirmation */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Concludi Lavoro</DialogTitle>
              <DialogDescription>
                Confermi che il lavoro è stato svolto? Questo aggiornerà lo storico del lavoratore.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleCompleteJob}
                className={isEmployer ? "bg-employer-700 hover:bg-employer-800 text-employer-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"}
              >
                Conferma
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <JobDetailsSheet
          job={annuncioChat}
          isOpen={!!annuncioChat}
          onClose={() => setAnnuncioChat(null)}
          showMiniMap
          sopraChat
        />

        {/* Dopo l'assunzione: «Compila il cartellino», sopra la chat. */}
        {cartellinoDaCompilare && (
          <SchedaCartellino
            cartellino={cartellinoDaCompilare}
            compila
            sopraChat
            onClose={() => setCompilaPer(null)}
            onApriChat={() => setCompilaPer(null)}
          />
        )}
      </div>
  ) : null;

  // Chats list view
  const listaChat = (
    <>
           {loading ? (
             <ChatListSkeleton count={5} />
           ) : chats.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12">
               <div className="material-card-elevated p-8 text-center max-w-sm animate-scale-in">
                 <TesseraIcona icona={MessaggiVuotaIcon} misura="lg" className="mx-auto mb-4" />
                 <h2 className="titolo-vuoto mb-2">Nessun Messaggio</h2>
                 <p className="text-muted-foreground text-sm">
                   Quando contatterai un employer o riceverai messaggi, appariranno qui.
                 </p>
              </div>
            </div>
           ) : (
             /* RIGHE PIATTE, non card (Tommaso, 22 ottobre). Le card sono per
                gli OGGETTI da scegliere (annunci, cartellini); le chat sono
                conversazioni da ritrovare scorrendo in fretta: la cornice
                ripetuta pesava più del contenuto, e ne stavano 5 per schermo.
                Divise dalla linea disegnata, come la scheda annuncio. */
             <div>
               {chats.map((chat, i) => {
                 const isCompleted = chat.application_status === 'completed';
                 const isHired = chat.application_status === 'hired';
                 const nonLetti = chat.unread_count ?? 0;
                 const ultimo = chat.last_message;
                 const anteprima = ultimo
                   ? anteprimaMessaggio(
                       ultimo.content,
                       ultimo.has_attachment,
                       ultimo.sender_id === user?.id,
                       { isEmployer, nomeAltro: chat.other_user?.full_name }
                     )
                   : '';
                 const apri = () => setSelectedChat(chat);

                 return (
                   <div key={chat.id} className={cn(i > 0 && 'linea-divisoria-sottile')}>
                     <div
                       role="button"
                       tabIndex={0}
                       onClick={apri}
                       onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && apri()}
                       className="-mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-2 py-3 transition-colors active:bg-accent/50"
                     >
                       <AvatarPreview
                         imageUrl={chat.other_user?.avatar_url}
                         userName={chat.other_user?.full_name}
                         userId={chat.other_user?.id || ""}
                         onMessageClick={apri}
                         chatId={chat.id}
                       />
                       <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-2">
                           <h3 className={cn('truncate text-[15px]', nonLetti > 0 ? 'font-bold' : 'font-semibold')}>
                             {chat.other_user?.full_name || 'Utente'}
                           </h3>
                           {isHired && <StatusBadge stato="hired" />}
                           {isCompleted && <StatusBadge stato="completed" />}
                           {ultimo && (
                             <span
                               className={cn(
                                 'ml-auto shrink-0 text-xs',
                                 // Non letti: l'ora nell'INCHIOSTRO del ruolo, mai il pastello.
                                 nonLetti > 0
                                   ? cn('font-semibold', isEmployer ? 'text-employer-800' : 'text-primary-strong')
                                   : 'text-muted-foreground'
                               )}
                             >
                               {formatOrarioChat(ultimo.created_at)}
                             </span>
                           )}
                         </div>

                         {/* Di che lavoro si parla: è l'unica cosa che distingue
                             due chat con la stessa persona (una per annuncio). */}
                         {chat.job?.title && (
                           <p className="mt-0.5 truncate text-[13px] text-ink-soft">{chat.job.title}</p>
                         )}

                         <div className="mt-0.5 flex items-center gap-2">
                           <p
                             className={cn(
                               'min-w-0 flex-1 truncate text-sm',
                               anteprima
                                 ? nonLetti > 0
                                   ? 'font-medium text-foreground'
                                   : 'text-muted-foreground'
                                 : 'italic text-muted-foreground'
                             )}
                           >
                             {anteprima || 'Nessun messaggio'}
                           </p>
                           {/* nonLetti > 0 e non `nonLetti &&`: con 0 React stampava lo zero.
                               ⚠️ Prima `text-white` sull'arancio pastello: 2,07:1 (§5). */}
                           {nonLetti > 0 && (
                             <span
                               className={cn(
                                 'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                                 isEmployer ? 'bg-employer-700 text-employer-foreground' : 'bg-primary text-primary-foreground'
                               )}
                             >
                               {nonLetti > 9 ? '9+' : nonLetti}
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
    </>
  );

  return (
    <>
     <SwipeNavigator>
       <div className="flex flex-col h-full bg-background">
         {/* Simple Header with safe area */}
         <header className="sticky top-0 z-40 bg-background px-4 pt-8 pb-3">
           <img
             src={isEmployer ? "/images/logo-employer-v2.svg" : "/images/logo-worker-v2.svg"}
             alt="Politask"
             className="h-14 w-auto -ml-1"
           />
         </header>
 
         <main className="flex-1 px-4 pt-2 pb-4 overflow-y-auto">
           <Tabs value={vista} onValueChange={cambiaVista} className="w-full">
               {/* Stesse schede di Lista («Esplora | Candidature»): chi le ha
                   usate là sa già come funzionano. */}
               <TabsList className="w-full h-12 p-1 mb-4 bg-muted sagoma-quartiere rounded-[19px]">
                 <TabsTrigger
                   value="chat"
                   className="linguetta flex-1 h-full rounded-[15px] font-[Shinjo,Outfit,sans-serif] [font-synthesis:none] tracking-[-0.04em] text-[15px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                 >
                   Chat
                 </TabsTrigger>
                 <TabsTrigger
                   value="bacheca"
                   className="linguetta flex-1 h-full rounded-[15px] font-[Shinjo,Outfit,sans-serif] [font-synthesis:none] tracking-[-0.04em] text-[15px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                 >
                   Bacheca
                   {daFare > 0 && (
                     <span className="ml-1.5 h-2 w-2 rounded-full bg-danger" aria-label={`${daFare} da ${isEmployer ? 'decidere' : 'recensire'}`} />
                   )}
                 </TabsTrigger>
               </TabsList>
               <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
                 {listaChat}
               </TabsContent>
               <TabsContent value="bacheca" className="mt-0 focus-visible:outline-none">
                 {isEmployer ? (
                   <Bacheca onApriChat={apriChatDaBacheca} />
                 ) : (
                   <BachecaWorker onApriChat={apriChatDaBacheca} />
                 )}
               </TabsContent>
             </Tabs>
         </main>
       </div>
     </SwipeNavigator>
     {vistaChat}
    </>
  );
};

export default Messaggi;
