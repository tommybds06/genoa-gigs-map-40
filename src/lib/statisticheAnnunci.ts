import { supabase } from "@/integrations/supabase/client";

/**
 * I DATI DEL TEST SUL POTENZIAMENTO (5 novembre): quante volte un annuncio
 * è stato VISTO in una lista e APERTO. Le candidature si contano dalla loro
 * tabella. Si leggono dalla vista `statistiche_annunci_test` (SQL di
 * Lovable), migration 20261105130000_potenziamento.sql.
 *
 * - Una vista = la card è comparsa sullo schermo per più di metà, UNA volta
 *   per sessione dell'app: scorrere su e giù non la gonfia.
 * - Le viste si mandano a gruppi (ogni 4 s, o quando l'app va in secondo
 *   piano): una lista da venti card non fa venti richieste.
 * - Chi ha pubblicato l'annuncio non conta (lo esclude il database).
 */
const giaViste = new Set<string>();
let coda = new Set<string>();
let timer: number | undefined;

function manda() {
  window.clearTimeout(timer);
  timer = undefined;
  if (coda.size === 0) return;
  const annunci = [...coda];
  coda = new Set();
  supabase.rpc("registra_viste", { annunci }).then(({ error }) => {
    if (error) console.warn("[Politask] viste non registrate", error.message);
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && manda());
}

export function registraVista(id: string) {
  if (giaViste.has(id)) return;
  giaViste.add(id);
  coda.add(id);
  timer ??= window.setTimeout(manda, 4000);
}

export function registraApertura(id: string) {
  supabase.rpc("registra_apertura", { annuncio: id }).then(({ error }) => {
    if (error) console.warn("[Politask] apertura non registrata", error.message);
  });
}
