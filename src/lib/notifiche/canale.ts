import { supabase } from "@/integrations/supabase/client";
import { CHIAVE_PUBBLICA_PUSH } from "@/config/notifiche";

/**
 * IL CANALE DEL PUSH (5 novembre 2026) — chi consegna le notifiche al
 * telefono quando l'app è chiusa.
 *
 * La logica (chi riceve cosa, quando, raggruppato come) sta TUTTA nel
 * database; il server la consegna con `invia-notifiche`. L'app deve solo
 * dire «questo dispositivo vuole le notifiche» → una riga in
 * `iscrizioni_push`. Per questo il canale è un'interfaccia sola:
 *
 *   - `web`: Web Push del browser (service worker + VAPID). Android/Chrome
 *     ovunque; su iPhone SOLO con l'app aggiunta alla schermata Home
 *     (iOS 16.4+): in Safari normale `PushManager` non c'è.
 *   - `despia`: l'app nativa, quando ci sarà. Si scrive `canaleDespia`
 *     (token del dispositivo → `registra_dispositivo('despia', token)`) e la
 *     si sceglie in `canaleAttivo`. Niente altro cambia: né i trigger, né il
 *     centro notifiche, né le impostazioni.
 */
export type StatoPermesso =
  | "concesso"
  | "negato" // bloccate dall'utente: si riaccendono solo dalle impostazioni del browser
  | "da_chiedere"
  | "non_disponibile"; // browser senza push (Safari fuori dalla schermata Home)

export interface CanalePush {
  nome: "web" | "despia";
  stato(): StatoPermesso;
  /** Chiede il permesso (se serve) e registra il dispositivo. */
  attiva(): Promise<StatoPermesso>;
  /** Con il permesso già dato: rinnova la registrazione (l'endpoint può cambiare). */
  sincronizza(): Promise<void>;
  /** All'uscita: il telefono smette di ricevere le notifiche di questo account. */
  scollega(): Promise<void>;
}

const supportaWebPush = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

/** Il service worker si registra una volta, all'avvio (main.tsx). Non dentro
 *  l'anteprima di Lovable, che apre l'app in un iframe di un altro sito. */
export function registraServiceWorker() {
  if (!supportaWebPush()) return;
  if (window.self !== window.top) return;
  navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("[Politask] service worker non registrato", e));
}

function chiaveInByte(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** `p`, oppure `null` se non risponde entro `ms`. Anche le richieste di
 *  supabase, che non sono Promise ma «thenable» (`Promise.race` le apre). */
export const entro = <T,>(p: PromiseLike<T>, ms: number) =>
  Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);

async function iscrizioneWeb(crea: boolean) {
  // ⚠️ MAI `navigator.serviceWorker.ready` senza limite: se il service
  // worker non c'è (anteprima di Lovable, registrazione fallita) non
  // risponde MAI, e chi lo aspetta resta appeso per sempre. L'uscita
  // dall'account lo aspettava: «Esci» girava all'infinito.
  // Per leggere basta la registrazione che c'è già; per crearne una si
  // aspetta, ma al massimo 5 s.
  const reg = crea ? await entro(navigator.serviceWorker.ready, 5000) : await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  const esistente = await reg.pushManager.getSubscription();
  if (esistente || !crea) return esistente;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiaveInByte(CHIAVE_PUBBLICA_PUSH) });
}

async function salva(i: PushSubscription) {
  const j = i.toJSON();
  const { error } = await supabase.rpc("registra_dispositivo", {
    p_piattaforma: "web",
    p_endpoint: i.endpoint,
    p_p256dh: j.keys?.p256dh,
    p_auth: j.keys?.auth,
  });
  if (error) console.warn("[Politask] dispositivo non registrato", error.message);
}

const canaleWeb: CanalePush = {
  nome: "web",
  stato() {
    if (!supportaWebPush()) return "non_disponibile";
    const p = Notification.permission;
    return p === "granted" ? "concesso" : p === "denied" ? "negato" : "da_chiedere";
  },
  async attiva() {
    if (!supportaWebPush()) return "non_disponibile";
    const p = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (p !== "granted") return this.stato();
    try {
      const i = await iscrizioneWeb(true);
      if (i) await salva(i);
    } catch (e) {
      console.warn("[Politask] iscrizione push fallita", e);
    }
    return "concesso";
  },
  async sincronizza() {
    if (this.stato() !== "concesso") return;
    try {
      // Il permesso c'è ma l'iscrizione no (dati del sito cancellati, chiavi
      // cambiate): la si rifà senza chiedere niente.
      const i = await iscrizioneWeb(true);
      if (i) await salva(i);
    } catch (e) {
      console.warn("[Politask] iscrizione push non rinnovata", e);
    }
  },
  async scollega() {
    if (!supportaWebPush()) return;
    try {
      const i = await iscrizioneWeb(false);
      if (!i) return;
      await supabase.from("iscrizioni_push").delete().eq("endpoint", i.endpoint);
    } catch {
      /* uscire non deve mai fallire per questo */
    }
  },
};

/** Il canale di questo dispositivo. Con Despia: se l'app gira lì dentro,
 *  il suo canale; altrimenti il web. */
export const canaleAttivo: CanalePush = canaleWeb;

/** iPhone o iPad (anche gli iPad che si presentano come Mac). */
export const suIos = () =>
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/** Aperta dalla schermata Home (installata), non nel browser. */
export const installata = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
