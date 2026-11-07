import { supabase } from "@/integrations/supabase/client";

/**
 * UNA NOTIFICA come la vede l'app (tabella `notifiche`, migration
 * 20261105140000_notifiche.sql). La scrive SOLO il database; l'app la legge
 * e la segna letta (`letta_il`, l'unica colonna che può cambiare).
 */
export interface Notifica {
  id: string;
  tipo: TipoNotifica;
  categoria: string;
  titolo: string;
  testo: string;
  /** Dove porta il tocco: vedi `apriNotifica` (link.ts). */
  azione: string | null;
  riferimento: string | null;
  conteggio: number;
  creata_il: string;
  aggiornata_il: string;
  mostra_dal: string;
  letta_il: string | null;
}

export type TipoNotifica =
  | "scelto"
  | "candidatura"
  | "messaggio"
  | "recensione_da_fare"
  | "lavoro_confermato"
  | "lavoro_vicino"
  | "promemoria"
  | "in_scadenza"
  | "scaduto"
  | "lavoro_finito"
  | "recensione_ricevuta"
  | "verifica_piva";

export const CAMPI_NOTIFICA =
  "id, tipo, categoria, titolo, testo, azione, riferimento, conteggio, creata_il, aggiornata_il, mostra_dal, letta_il";

/** La data che conta per chi legge: quando è arrivata (o è stata aggiornata,
 *  se raggruppa: «3 nuovi messaggi» è nuova quanto l'ultimo). Una rimandata
 *  dalla fascia di silenzio è arrivata alle 7, non a mezzanotte. */
export const quandoArrivata = (n: Pick<Notifica, "aggiornata_il" | "mostra_dal">) =>
  n.mostra_dal > n.aggiornata_il ? n.mostra_dal : n.aggiornata_il;

export const chiaveNotifiche = (utenteId: string | undefined) => ["notifiche", utenteId] as const;

export async function segnaLette(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("notifiche").update({ letta_il: new Date().toISOString() }).in("id", ids).is("letta_il", null);
  if (error) console.warn("[Politask] notifiche non segnate lette", error.message);
}

/* LA CHAT APERTA — la tiene Messaggi. Una notifica di messaggio per la chat
   che si sta guardando non è una notizia: si segna letta e niente toast. */
let chatAperta: string | null = null;
export const impostaChatAperta = (id: string | null) => {
  chatAperta = id;
};
export const chatApertaOra = () => chatAperta;

/** Aprendo una chat si leggono anche le sue notifiche (anche se la si è
 *  aperta dalla lista e non dalla campanella). */
export async function segnaLetteDellaChat(chatId: string, utenteId: string) {
  const { error } = await supabase
    .from("notifiche")
    .update({ letta_il: new Date().toISOString() })
    .eq("utente_id", utenteId)
    .eq("azione", "chat")
    .eq("riferimento", chatId)
    .is("letta_il", null);
  if (error) console.warn("[Politask] notifiche della chat non segnate", error.message);
}
