/**
 * Dove mandare una persona appena autenticata.
 *
 * Sorgente UNICA della regola: la usano sia Auth (dopo il login) sia
 * ProtectedRoute (per chi atterra da qualsiasi altra parte). Tenerla in due
 * posti significherebbe vederle divergere, come e' gia' successo con le date
 * e con i tag.
 *
 * ⚠️ IL PUNTO NON OVVIO — perche' non basta guardare il ruolo.
 * Nel database c'e' un trigger (`handle_new_user`) che crea la riga in
 * `profiles` appena nasce l'utente, e se nei metadati non trova un ruolo ci
 * mette `'worker'` d'ufficio. Con l'iscrizione via email il ruolo c'e', perche'
 * lo passiamo noi; con Google e Apple non c'e' mai. Risultato: chi entra con
 * Google si ritrova gia' etichettato come worker senza aver scelto niente, e
 * un controllo del tipo "manca il ruolo?" non scatta mai.
 *
 * Quindi il segnale e' un altro: il **quartiere**. Viene sempre chiesto, sia
 * nell'iscrizione via email sia nella schermata di scelta ruolo. Se un utente
 * arrivato dai social non ce l'ha, vuol dire che quella schermata non l'ha mai
 * vista.
 */

interface UtenteMinimo {
  app_metadata?: { provider?: string };
}

interface ProfiloMinimo {
  role?: string | null;
  neighborhood?: string | null;
  is_onboarded?: boolean | null;
}

/** Vero se l'utente e' entrato con Google/Apple invece che con email. */
export function arrivaDaSocial(user: UtenteMinimo | null | undefined): boolean {
  const provider = user?.app_metadata?.provider;
  return !!provider && provider !== "email";
}

/**
 * Restituisce il percorso dove mandare la persona, oppure `null` se puo'
 * restare dov'e'.
 */
export function doveMandare(
  user: UtenteMinimo | null | undefined,
  profilo: ProfiloMinimo | null | undefined
): "/scegli-ruolo" | "/onboarding" | "/" | null {
  if (!user) return null;

  // Nessuna riga, oppure ruolo mancante: non sappiamo nemmeno chi e'.
  if (!profilo || !profilo.role) return "/scegli-ruolo";

  // Riga creata dal trigger con il ruolo indovinato: manca la scelta vera.
  if (arrivaDaSocial(user) && !profilo.neighborhood && !profilo.is_onboarded) {
    return "/scegli-ruolo";
  }

  if (!profilo.is_onboarded) return "/onboarding";

  return "/";
}
