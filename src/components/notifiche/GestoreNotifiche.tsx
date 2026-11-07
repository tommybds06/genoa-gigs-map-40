import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { canaleAttivo } from "@/lib/notifiche/canale";
import { apriNotifica } from "@/lib/notifiche/link";
import { nomeCanale } from "@/lib/tempoReale";
import {
  CAMPI_NOTIFICA,
  chatApertaOra,
  chiaveNotifiche,
  segnaLette,
  type Notifica,
} from "@/lib/notifiche/notifiche";

/**
 * IL GESTORE DELLE NOTIFICHE — montato una volta in App, dentro il router.
 * Non disegna niente (i toast li disegna sonner).
 *
 * - TEMPO REALE: una notifica nuova (o raggruppata di nuovo: «3 nuovi
 *   messaggi») entra nella cache della campanella e, se l'app è in vista,
 *   diventa un toast col nastro e «Apri». Stesso id del toast per la stessa
 *   notifica: il raggruppamento AGGIORNA il toast invece di impilarne due.
 *   Un messaggio della chat che si sta guardando si segna letto e basta.
 * - IL TOCCO SUL PUSH: con l'app aperta lo dice il service worker
 *   (`notifica-toccata`); con l'app chiusa la si apre su `/?notifica=<id>`
 *   (lo stesso indirizzo del link nelle email). In tutti e due i casi: la si
 *   segna letta e si va dove porta.
 * - IL DISPOSITIVO: a ogni accesso, se il permesso c'è, si rinnova
 *   l'iscrizione push (l'endpoint può cambiare, o l'account sul telefono).
 */
/** Toglie dal telefono le notifiche silenziose mostrate con l'app in vista
 *  (solo quelle: una arrivata nel frattempo con l'app chiusa resta). */
async function chiudiNotificheInVista(tag: string) {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const aperte = (await reg?.getNotifications({ tag })) ?? [];
    aperte.forEach((n) => n.data?.inVista && n.close());
  } catch {
    /* niente: resta nel centro notifiche del telefono, nessun danno */
  }
}

export function GestoreNotifiche() {
  const { user } = useAuth();
  // L'id, non l'oggetto: `user` cambia identità a ogni evento della sessione
  // (rinnovo del token ogni ora, ritorno in primo piano) e ogni effetto qui
  // sotto ripartiva — iscrizione push rifatta, tempo reale riabbonato.
  const uid = user?.id;
  const qc = useQueryClient();
  const location = useLocation();
  // In un ref: `navigate` cambia a ogni navigazione, e il tempo reale si
  // riabbonerebbe a ogni cambio di pagina.
  const vai = useNavigate();
  const navigate = useRef(vai);
  navigate.current = vai;
  const giaAperte = useRef(new Set<string>());

  const apriDaId = useRef(async (id: string) => {
    if (giaAperte.current.has(id)) return;
    giaAperte.current.add(id);
    const { data } = await supabase.from("notifiche").select(CAMPI_NOTIFICA).eq("id", id).maybeSingle();
    if (!data) return;
    segnaLette([id]);
    qc.invalidateQueries({ queryKey: ["notifiche"] });
    apriNotifica(data as Notifica, navigate.current);
  });

  // Il dispositivo.
  useEffect(() => {
    if (uid) canaleAttivo.sincronizza();
  }, [uid]);

  // `/?notifica=<id>`: dal push con l'app chiusa, o dall'email.
  useEffect(() => {
    if (!uid) return;
    const id = new URLSearchParams(location.search).get("notifica");
    if (!id) return;
    navigate.current(location.pathname, { replace: true });
    apriDaId.current(id);
  }, [uid, location.search, location.pathname]);

  // Il tocco sul push con l'app già aperta.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const ascolta = (e: MessageEvent) => {
      if (e.data?.tipo === "notifica-toccata" && e.data.notifica) apriDaId.current(e.data.notifica);
      if (e.data?.tipo === "notifica-arrivata") {
        qc.invalidateQueries({ queryKey: ["notifiche"] });
        // Su Android il service worker la mostra anche con l'app in vista,
        // silenziosa, se no Chrome ne metterebbe una sua vuota (public/sw.js).
        // Qui c'è già il toast: la si toglie. Dopo 2 s, perché Chrome
        // controlla che ci sia DOPO che il service worker ha finito.
        if (e.data.tag) setTimeout(() => chiudiNotificheInVista(e.data.tag), 2000);
      }
    };
    navigator.serviceWorker.addEventListener("message", ascolta);
    return () => navigator.serviceWorker.removeEventListener("message", ascolta);
  }, [qc]);

  // Il tempo reale.
  useEffect(() => {
    if (!uid) return;
    const chiave = chiaveNotifiche(uid);

    const arriva = (n: Notifica) => {
      const prima = qc.getQueryData<Notifica[]>(chiave)?.find((x) => x.id === n.id);
      qc.setQueryData<Notifica[]>(chiave, (v) => {
        const resto = (v ?? []).filter((x) => x.id !== n.id);
        return [n, ...resto].sort((a, b) => (a.aggiornata_il < b.aggiornata_il ? 1 : -1));
      });
      // Novità = non c'era, o è stata raggruppata di nuovo (aggiornata_il
      // cambia solo lì: segnarla letta non lo tocca).
      const nuova = !n.letta_il && (!prima || prima.aggiornata_il !== n.aggiornata_il);
      if (!nuova) return;
      if (n.azione === "chat" && n.riferimento && n.riferimento === chatApertaOra()) {
        segnaLette([n.id]);
        return;
      }
      if (document.visibilityState !== "visible") return;
      toast(n.titolo, {
        id: `notifica-${n.id}`,
        description: n.testo,
        duration: 5000,
        action: {
          label: "Apri",
          onClick: () => {
            segnaLette([n.id]);
            qc.setQueryData<Notifica[]>(chiave, (v) =>
              v?.map((x) => (x.id === n.id ? { ...x, letta_il: new Date().toISOString() } : x))
            );
            apriNotifica(n, navigate.current);
          },
        },
      });
    };

    const canale = supabase
      .channel(nomeCanale(`notifiche-${uid}`))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifiche", filter: `utente_id=eq.${uid}` },
        (p) => {
          if (p.eventType === "DELETE") return;
          arriva(p.new as Notifica);
        }
      )
      .subscribe();

    // Il resto della app non rilegge al ritorno in primo piano
    // (`refetchOnWindowFocus: false`): le notifiche sì, sono la cosa che si
    // torna a vedere. Anche quelle rimandate dalla notte, alle 7.
    const torna = () => document.visibilityState === "visible" && qc.invalidateQueries({ queryKey: chiave });
    document.addEventListener("visibilitychange", torna);

    return () => {
      supabase.removeChannel(canale);
      document.removeEventListener("visibilitychange", torna);
    };
  }, [uid, qc]);

  return null;
}
