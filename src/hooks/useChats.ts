import { useQuery, type QueryClient } from "@tanstack/react-query";
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
  /** Fissata in cima / nascosta dalla lista: solo per me (`chat_utente`). */
  fissata_il?: string | null;
  nascosta_il?: string | null;
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

      /* Insieme alla vista, le MIE scelte (fissata, nascosta). Una tabella a
         parte e non una colonna della vista: la vista non dipende da chi
         guarda (vedi sotto), queste sì.
         ⚠️ Se questa lettura fallisce la lista si mostra lo stesso, senza
         scelte: meglio una chat nascosta che ricompare di una lista vuota.
         Ma lo si dice in console, non in silenzio (§2, lezione 7). */
      const [{ data, error }, scelte] = await Promise.all([
        supabase.from("chat_overview").select("*").order("updated_at", { ascending: false }),
        supabase.from("chat_utente").select("chat_id, fissata_il, nascosta_il").eq("user_id", userId),
      ]);

      if (error) throw error;
      if (scelte.error) console.warn("[Politask] chat fissate e nascoste non lette:", scelte.error.message);
      const sceltaDi = new Map((scelte.data ?? []).map((r) => [r.chat_id, r]));

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
          fissata_il: sceltaDi.get(r.id as string)?.fissata_il ?? null,
          nascosta_il: sceltaDi.get(r.id as string)?.nascosta_il ?? null,
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

/**
 * FISSARE e NASCONDERE una chat — per me soltanto (13 novembre).
 *
 * La lista cambia SUBITO (cache), poi si scrive. Le due date vere le mette il
 * database (trigger `prepara_chat_utente`): qui si manda «adesso» solo per
 * dire «sì». Se la scrittura fallisce la lista torna com'era e l'errore sale
 * a chi ha chiamato, che lo mostra.
 */
export async function scegliPerChat(
  qc: QueryClient,
  userId: string,
  chatId: string,
  cambi: { fissata?: boolean; nascosta?: boolean }
) {
  const adesso = new Date().toISOString();
  const riga: { fissata_il?: string | null; nascosta_il?: string | null } = {};
  if (cambi.fissata !== undefined) riga.fissata_il = cambi.fissata ? adesso : null;
  if (cambi.nascosta !== undefined) riga.nascosta_il = cambi.nascosta ? adesso : null;

  const chiave = ["chats", userId];
  const prima = qc.getQueryData<Chat[]>(chiave);
  qc.setQueryData<Chat[]>(chiave, (lista) =>
    lista?.map((c) => {
      if (c.id !== chatId) return c;
      // ⚠️ In cache, «nascosta» mai PRIMA dell'ultimo messaggio: con l'orologio
      // del telefono indietro la chat non sparirebbe finché non si rilegge.
      const ultimo = c.last_message?.created_at;
      const nascosta_il =
        riga.nascosta_il && ultimo && new Date(ultimo) > new Date(riga.nascosta_il) ? ultimo : riga.nascosta_il;
      return { ...c, ...riga, ...(riga.nascosta_il !== undefined ? { nascosta_il } : {}) };
    })
  );

  const { error } = await supabase
    .from("chat_utente")
    .upsert({ chat_id: chatId, user_id: userId, ...riga }, { onConflict: "chat_id,user_id" });
  if (error) {
    qc.setQueryData(chiave, prima);
    throw error;
  }
}
