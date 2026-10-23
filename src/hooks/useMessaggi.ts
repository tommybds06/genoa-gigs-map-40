import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * I MESSAGGI DI UNA CHAT — in react-query, non in uno `useState`.
 *
 * ⚠️ Prima all'apertura di una chat la lista si azzerava e si riscaricava ogni
 * volta: per un attimo «Inizia la conversazione...», poi i messaggi saltavano
 * dentro, anche riaprendo una chat vista un minuto prima. Ora dalla seconda
 * apertura (entro lo `staleTime` globale) ci sono al primo fotogramma, e si
 * rileggono in background. Il tempo reale scrive direttamente nella cache.
 */

/** Solo per i messaggi MIEI appena scritti, finché il database non conferma. */
export type StatoInvio = "invio" | "errore";

export interface Messaggio {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  reply_to_id: string | null;
  attachment_url: string | null;
  is_system?: boolean;
  reply_to?: Messaggio | null;
  stato?: StatoInvio;
}

export const chiaveMessaggi = (chatId: string | undefined) => ["messaggi", chatId] as const;

function conRisposte(righe: Messaggio[]): Messaggio[] {
  const perId = new Map(righe.map((m) => [m.id, m]));
  return righe.map((m) => ({ ...m, reply_to: m.reply_to_id ? perId.get(m.reply_to_id) ?? null : null }));
}

export function useMessaggi(chatId: string | undefined) {
  return useQuery({
    queryKey: chiaveMessaggi(chatId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return conRisposte((data ?? []) as Messaggio[]);
    },
    enabled: !!chatId,
    // Sempre rilette all'apertura (in background): i messaggi li scrivono
    // anche gli altri, e il tempo reale copre solo da quando la chat è aperta.
    refetchOnMount: "always",
  });
}

/**
 * Mette un messaggio nella cache. Se c'è già (stesso id: il mio messaggio
 * istantaneo che torna dal database col tempo reale) lo sostituisce e toglie
 * lo stato «in invio»; se no lo aggiunge in fondo.
 */
export function inserisciMessaggio(qc: QueryClient, chatId: string, m: Messaggio) {
  qc.setQueryData<Messaggio[]>(chiaveMessaggi(chatId), (prima = []) => {
    const risposta = m.reply_to_id ? prima.find((x) => x.id === m.reply_to_id) ?? null : null;
    const nuovo = { ...m, reply_to: m.reply_to ?? risposta };
    const i = prima.findIndex((x) => x.id === m.id);
    if (i === -1) return [...prima, nuovo];
    const copia = [...prima];
    // `stato` esplicito: la riga che torna dal database non ce l'ha, e lo
    // spread lascerebbe appiccicato il vecchio «in invio».
    copia[i] = { ...copia[i], ...nuovo, stato: m.stato, reply_to: copia[i].reply_to ?? nuovo.reply_to };
    return copia;
  });
}

export function aggiornaMessaggio(qc: QueryClient, chatId: string, id: string, cambi: Partial<Messaggio>) {
  qc.setQueryData<Messaggio[]>(chiaveMessaggi(chatId), (prima = []) =>
    prima.map((m) => (m.id === id ? { ...m, ...cambi } : m))
  );
}
