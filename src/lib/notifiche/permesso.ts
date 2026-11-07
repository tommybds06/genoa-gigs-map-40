import { canaleAttivo, installata, suIos } from "./canale";

/**
 * QUANDO SI CHIEDE IL PERMESSO DELLE NOTIFICHE — non all'apertura (un
 * permesso chiesto a freddo lo si rifiuta, e un rifiuto nel browser è quasi
 * per sempre), ma dopo il primo gesto per cui servono: la prima
 * CANDIDATURA (worker: «ti avvisiamo quando ti scelgono») o il primo
 * ANNUNCIO pubblicato (attività e privati: «… quando qualcuno si candida»).
 *
 * Il permesso del browser si chiede solo dal bottone della nostra scheda
 * (`ChiediPermesso`), dove una riga spiega a cosa serve. Con «Non ora» si
 * richiede dopo 7 giorni, al gesto successivo.
 *
 * Su iPhone, nel browser, il push non esiste: la scheda spiega come
 * aggiungere l'app alla schermata Home.
 */
export type MotivoPermesso = "candidatura" | "annuncio";
export const EVENTO_PERMESSO = "politask:chiedi-permesso-notifiche";
const RICORDA = "politask:permesso-notifiche-rimandato";
const SETTE_GIORNI = 7 * 24 * 3600_000;

export function chiediPermessoDopo(motivo: MotivoPermesso) {
  const stato = canaleAttivo.stato();
  const iphoneDaInstallare = suIos() && !installata();
  if (stato !== "da_chiedere" && !iphoneDaInstallare) return;
  try {
    const t = Number(localStorage.getItem(RICORDA) || 0);
    if (t && Date.now() - t < SETTE_GIORNI) return;
  } catch {
    /* senza memoria si chiede: al massimo una volta di troppo */
  }
  // Un attimo dopo: prima chiude la scheda dell'annuncio e passa il toast.
  window.setTimeout(() => window.dispatchEvent(new CustomEvent<MotivoPermesso>(EVENTO_PERMESSO, { detail: motivo })), 900);
}

export function rimandaPermesso() {
  try {
    localStorage.setItem(RICORDA, String(Date.now()));
  } catch {
    /* niente */
  }
}
