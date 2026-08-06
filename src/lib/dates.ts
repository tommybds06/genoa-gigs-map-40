/**
 * Formattazione date — sorgente unica per tutta l'app.
 *
 * Prima esistevano quattro copie di `getTimeAgo` (ApplicationCard, Annunci,
 * PublicProfile, Lista) con gli stessi tre difetti: "0 min fa" appena inviato,
 * "1 ore fa" / "1 giorni fa" senza singolare, e il relativo che continuava
 * all'infinito fino a "187 giorni fa", che nessuno converte in una data.
 */

const MIN = 60_000;
const ORA = 3_600_000;
const GIORNO = 86_400_000;

/** Oltre questa soglia il relativo smette di essere informativo. */
const SOGLIA_ASSOLUTA_GIORNI = 30;

function valida(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 feb" nell'anno corrente, "12 feb 2025" negli anni passati. */
export function formatDataAssoluta(date: Date): string {
  const stessoAnno = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    ...(stessoAnno ? {} : { year: "numeric" }),
  });
}

/**
 * Distanza dal presente in forma leggibile.
 * Sotto i 30 giorni è relativa ("3 giorni fa"), sopra diventa assoluta
 * ("12 feb"). Pensata per essere preceduta da un verbo: "Inviata {…}".
 */
export function formatTempoTrascorso(dateString: string | null | undefined): string {
  const date = valida(dateString);
  if (!date) return "";

  const diff = Date.now() - date.getTime();

  // Data futura (fuso orario, orologio sfasato): non dire "-2 giorni fa".
  if (diff < 0) return formatDataAssoluta(date);

  const minuti = Math.floor(diff / MIN);
  if (minuti < 1) return "adesso";
  if (minuti < 60) return `${minuti} min fa`;

  const ore = Math.floor(diff / ORA);
  if (ore < 24) return ore === 1 ? "1 ora fa" : `${ore} ore fa`;

  const giorni = Math.floor(diff / GIORNO);
  if (giorni === 1) return "ieri";
  if (giorni < SOGLIA_ASSOLUTA_GIORNI) return `${giorni} giorni fa`;

  return formatDataAssoluta(date);
}

/**
 * Timestamp compatto per la lista conversazioni, allineato a destra.
 * Oggi → "14:32" · ieri → "ieri" · questa settimana → "lun" · oltre → "12/02".
 */
export function formatOrarioChat(dateString: string | null | undefined): string {
  const date = valida(dateString);
  if (!date) return "";

  const ora = date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  const oggi = new Date();
  const inizioOggi = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  const inizioGiornoData = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const giorniDiCalendario = Math.round(
    (inizioOggi.getTime() - inizioGiornoData.getTime()) / GIORNO
  );

  if (giorniDiCalendario <= 0) return ora;
  if (giorniDiCalendario === 1) return "ieri";
  if (giorniDiCalendario < 7) {
    // "lun", "mar", … senza punto finale
    return date.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
  }
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}

/**
 * Testi generati dall'app, non scritti da una persona.
 *
 * NOTA: riconoscerli per stringa è una toppa. La soluzione giusta è una colonna
 * `is_system` sulla tabella `messages` (serve una migration). Finché non c'è,
 * questa lista evita almeno che l'anteprima dica «Tu: 🎉 Complimenti! Sei stato
 * assunto» a chi quel messaggio non l'ha scritto.
 */
const SEGNAPOSTO_ALLEGATO = "📷 Foto";
const MESSAGGI_DI_SISTEMA = [
  "🎉 Complimenti! Sei stato assunto per questo incarico.",
];

/**
 * Anteprima dell'ultimo messaggio in lista.
 * Gli allegati senza testo diventano un'etichetta, altrimenti la riga
 * resterebbe vuota e sembrerebbe un errore.
 */
export function anteprimaMessaggio(
  contenuto: string | null | undefined,
  haAllegato: boolean,
  inviatoDaMe: boolean
): string {
  const testo = (contenuto || "").trim();

  // Il segnaposto degli allegati è salvato con l'emoji dentro al DB. In lista
  // mostriamo l'etichetta pulita, coerente col resto dell'app.
  if (testo === SEGNAPOSTO_ALLEGATO) {
    return inviatoDaMe ? "Tu: Foto" : "Foto";
  }

  // I messaggi automatici non sono "tuoi", anche se risultano inviati da te.
  if (MESSAGGI_DI_SISTEMA.includes(testo)) {
    return testo.replace(/^\p{Extended_Pictographic}️?\s*/u, "");
  }

  const corpo = testo || (haAllegato ? "Foto" : "");
  if (!corpo) return "";
  return inviatoDaMe ? `Tu: ${corpo}` : corpo;
}
