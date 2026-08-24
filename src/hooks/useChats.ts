import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Chat {
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
  application_status?: string;
  last_message?: {
    content: string | null;
    created_at: string;
    sender_id: string;
    has_attachment: boolean;
  } | null;
}

const STALE_TIME = 1000 * 60 * 2; // 2 minutes cache (reduced for faster updates)

/**
 * Lista conversazioni — UNA query.
 *
 * Prima erano 4 query PER OGNI conversazione (profilo dell'altro utente,
 * conteggio non letti, ultimo messaggio, stato candidatura): con 20 chat
 * significava 81 richieste all'apertura della schermata, e cresceva in modo
 * lineare col numero di conversazioni.
 *
 * Ora la vista `chat_overview` fa il lavoro nel database. La vista e'
 * `security_invoker`, quindi le RLS delle tabelle sottostanti restano in
 * vigore: non e' una scorciatoia sui permessi.
 *
 * L'ordinamento e' tornato al database (`updated_at`), perche' un trigger
 * aggiorna quella colonna a ogni messaggio. Prima si ordinava lato client, il
 * che funziona solo finche' si scarica tutto in una volta.
 */
export function useChats(userId: string | undefined) {
  return useQuery({
    queryKey: ["chats", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("chat_overview")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((r): Chat => {
        // La vista restituisce ENTRAMBI i profili e ENTRAMBI i conteggi: chi
        // sono "io" lo decide il client. E' voluto — cosi' la vista non dipende
        // da auth.uid() nel proprio corpo ed e' piu' facile da ragionare.
        const sonoIlWorker = r.worker_id === userId;

        const nome = sonoIlWorker ? r.employer_full_name : r.worker_full_name;
        const foto = sonoIlWorker ? r.employer_photos : r.worker_photos;
        const avatar = sonoIlWorker ? r.employer_avatar_url : r.worker_avatar_url;

        return {
          id: r.id as string,
          job_id: r.job_id as string,
          worker_id: r.worker_id as string,
          employer_id: r.employer_id as string,
          created_at: r.created_at as string,
          job: r.job_title ? { title: r.job_title } : undefined,
          other_user: {
            id: (sonoIlWorker ? r.employer_id : r.worker_id) as string,
            full_name: nome,
            // Stessa regola di prima: la prima foto vince sull'avatar.
            avatar_url: foto && foto.length > 0 ? foto[0] : avatar,
          },
          unread_count:
            (sonoIlWorker ? r.unread_for_worker : r.unread_for_employer) ?? 0,
          application_status: r.application_status || "pending",
          last_message: r.last_message_created_at
            ? {
                content: r.last_message_content,
                created_at: r.last_message_created_at,
                sender_id: r.last_message_sender_id as string,
                has_attachment: !!r.last_message_has_attachment,
              }
            : null,
        };
      });
    },
    staleTime: STALE_TIME,
    enabled: !!userId,
  });
}
