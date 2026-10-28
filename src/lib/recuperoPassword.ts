import { isAuthWeakPasswordError, type AuthError } from "@supabase/supabase-js";

/**
 * IL RECUPERO DELLA PASSWORD (27 ottobre) — due regole che il primo giro
 * non aveva, scoperte da Tommaso provando.
 *
 * 1. Il link dell'email È UN ACCESSO: Supabase apre una sessione appena lo si
 *    tocca. Se il salvataggio della password non andava, bastava cambiare
 *    pagina per ritrovarsi dentro, e per un account mai completato (entrato
 *    una volta con Google) partiva la scelta del ruolo. Ora finché la
 *    password non è salvata, o il recupero annullato, ProtectedRoute e Auth
 *    rimandano a /reimposta-password. Il segno sta in `sessionStorage`: vale
 *    nella scheda aperta dal link e sopravvive a un ricaricamento.
 *
 * 2. Il server ha le SUE regole sulla password (lunghezza, caratteri
 *    obbligatori, password uscite in furti di dati), impostate in Lovable
 *    Cloud, e le rifiuta con `weak_password` e i motivi. Prima diventava
 *    tutto «Non sono riuscito a salvarla».
 */
const CHIAVE = "politask.recupero-password";

export function segnaRecupero() {
  try {
    sessionStorage.setItem(CHIAVE, "1");
  } catch {
    /* niente storage: non si trattiene nessuno, come prima */
  }
}

export function recuperoInCorso(): boolean {
  try {
    return sessionStorage.getItem(CHIAVE) === "1";
  } catch {
    return false;
  }
}

export function chiudiRecupero() {
  try {
    sessionStorage.removeItem(CHIAVE);
  } catch {
    /* niente */
  }
}

/** «a, b e c» */
function elenco(parti: string[]) {
  return parti.length < 2 ? parti.join("") : `${parti.slice(0, -1).join(", ")} e ${parti[parti.length - 1]}`;
}

/**
 * Il messaggio in italiano per un rifiuto della password da parte del
 * server, o `null` se l'errore non riguarda la password.
 */
export function messaggioErrorePassword(error: AuthError | null | undefined): string | null {
  if (!error) return null;
  if (error.code === "same_password" || /different from the old|same/i.test(error.message)) {
    return "È uguale a quella di prima: scegline una diversa";
  }
  if (!isAuthWeakPasswordError(error) && error.code !== "weak_password") return null;

  const motivi = isAuthWeakPasswordError(error) ? error.reasons : [];
  if (motivi.includes("pwned")) {
    return "Questa password è comparsa in un furto di dati online: scegline un'altra";
  }
  if (motivi.includes("characters")) {
    // «…at least one character of each: abc…, ABC…, 0123456789, !@#…»
    const m = error.message;
    const servono = [
      /abcdefghijklmnopqrstuvwxyz/.test(m) && "una minuscola",
      /ABCDEFGHIJKLMNOPQRSTUVWXYZ/.test(m) && "una maiuscola",
      /0123456789/.test(m) && "un numero",
      /[!@#$%^&*]/.test(m) && "un simbolo",
    ].filter(Boolean) as string[];
    return servono.length ? `Serve almeno ${elenco(servono)}` : "Serve qualche tipo di carattere in più";
  }
  const lunghezza = /at least (\d+)/i.exec(error.message)?.[1];
  return lunghezza ? `La password deve avere almeno ${lunghezza} caratteri` : "Questa password non va bene: provane un'altra";
}
