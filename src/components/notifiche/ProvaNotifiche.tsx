import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { canaleAttivo, entro } from "@/lib/notifiche/canale";

/**
 * «MANDAMI UNA NOTIFICA DI PROVA» (11 novembre) — in Impostazioni, sotto
 * «Su questo telefono».
 *
 * Tommaso: «non arrivano le notifiche, né Android né iOS». Fra il database
 * che le crea e il telefono ci sono cinque anelli, e un errore in uno
 * qualunque non si vedeva. La prova fa il giro VERO (`notifica_di_prova`, migration
 * 20261111120000) e poi legge cosa ha scritto la funzione che manda i push
 * (`push_esito`): la dice in una frase, e sotto lascia la riga grezza, che
 * da uno screenshot basta per capire dove si rompe.
 *
 * Il telefono mostra la prova anche con l'app aperta (public/sw.js, `prova`):
 * è lì apposta per vederla.
 *
 * ⚠️ LA PRIMA VERSIONE NON PARTIVA (11 novembre, Tommaso: «non c'è scritto
 * nulla sotto»). Per aggirare i tipi non ancora rigenerati faceva
 * `const rpc = supabase.rpc; rpc(…)`: staccato dal client, dentro `rpc`
 * `this` è vuoto (`return this.rest.rpc(…)`), quindi TypeError subito, la
 * richiesta non partiva e l'errore spariva (c'era `finally` senza `catch`).
 * Regola: un metodo del client si chiama SEMPRE sul client. E qui ogni
 * errore finisce a schermo, e ogni passo ha un tempo massimo.
 */
type Esito = { tono: "ok" | "male" | "attesa"; frase: string; grezzo?: string };

const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

function leggiEsito(esito: string | null, inviata: string | null): Esito | null {
  if (esito) {
    // Scritto dal DATABASE quando non riesce nemmeno a chiamare la funzione
    // (manca pg_net o il segreto: migration 20261111130000).
    if (/^server:/.test(esito))
      return { tono: "male", frase: "Il database non riesce a chiamare la funzione che invia le notifiche: va sistemato su Lovable.", grezzo: esito };
    if (/^configurazione:/.test(esito))
      return { tono: "male", frase: "Il server non ha le chiavi per mandare le notifiche: va sistemato su Lovable.", grezzo: esito };
    if (/^nessun dispositivo/.test(esito))
      return { tono: "male", frase: "Questo telefono non risulta iscritto al tuo account. Riprova la prova; se si ripete, tocca «Attiva» di nuovo.", grezzo: esito };
    if (/: 20\d\b/.test(esito) && !/errore/.test(esito))
      return {
        tono: "ok",
        frase: "Consegnata al servizio del telefono. Se non è comparsa, sono le impostazioni del telefono a bloccarla (notifiche di Chrome o dell'app).",
        grezzo: esito,
      };
    return { tono: "male", frase: "Il servizio del telefono l'ha rifiutata.", grezzo: esito };
  }
  if (inviata) return { tono: "ok", frase: "Mandata dal server (senza il dettaglio dell'esito: la funzione non è ancora aggiornata)." };
  return null;
}

export function ProvaNotifiche() {
  const [inCorso, setInCorso] = useState(false);
  const [esito, setEsito] = useState<Esito | null>(null);

  const prova = async () => {
    setInCorso(true);
    setEsito({ tono: "attesa", frase: "Registro questo telefono…" });
    try {
      // Prima si rinnova l'iscrizione di questo telefono per questo account:
      // dopo un cambio di account potrebbe essere ancora dell'altro.
      await entro(canaleAttivo.sincronizza(), 8000);
      setEsito({ tono: "attesa", frase: "Chiedo la notifica al server…" });
      const risposta = await entro(supabase.rpc("notifica_di_prova"), 10000);
      if (!risposta) {
        setEsito({ tono: "male", frase: "Il server non ha risposto entro 10 secondi." });
        return;
      }
      const { data: id, error } = risposta;
      if (error) {
        const frase = /troppo_presto/.test(error.message)
          ? "Aspetta qualche secondo prima di riprovare."
          : /notifica_di_prova|function|schema cache/i.test(error.message)
            ? "Al database manca ancora l'aggiornamento per la prova (la migration del 11 novembre)."
            : "Non sono riuscito a chiederla al server.";
        setEsito({ tono: "male", frase, grezzo: error.message });
        return;
      }
      if (!id) {
        // `crea_notifica` restituisce NULL se la categoria è spenta: 'account'
        // non si spegne, quindi qui non si dovrebbe mai arrivare.
        setEsito({ tono: "male", frase: "Il server non ha creato la notifica di prova." });
        return;
      }
      setEsito({ tono: "attesa", frase: "Mandata: dovrebbe arrivare tra pochi secondi…" });
      // L'esito lo scrive la funzione appena ha provato a consegnarla.
      for (let i = 0; i < 16; i++) {
        await attesa(1500);
        const { data } = await supabase
          .from("notifiche")
          .select("push_esito, push_inviata_il")
          .eq("id", id)
          .maybeSingle();
        const letto = leggiEsito(data?.push_esito ?? null, data?.push_inviata_il ?? null);
        if (letto) {
          setEsito(letto);
          return;
        }
      }
      setEsito({
        tono: "male",
        frase: "Dopo 24 secondi il server non l'ha ancora mandata: il database non chiama la funzione che invia (il segreto o pg_net). Va sistemato su Lovable.",
      });
    } catch (e) {
      setEsito({ tono: "male", frase: "Errore imprevisto nella prova.", grezzo: e instanceof Error ? e.message : String(e) });
    } finally {
      setInCorso(false);
    }
  };

  return (
    <div className="border-b border-border px-4 pb-4">
      <Button size="sm" variant="outline" className="w-full" onClick={prova} disabled={inCorso}>
        {inCorso && <Loader2 className="animate-spin" />}
        Mandami una notifica di prova
      </Button>
      {esito && (
        <div className="mt-3 space-y-1" aria-live="polite">
          <p className={esito.tono === "male" ? "text-sm text-danger" : "text-sm text-ink"}>{esito.frase}</p>
          {esito.grezzo && <p className="break-all font-mono text-[11px] leading-snug text-ink-soft">{esito.grezzo}</p>}
        </div>
      )}
    </div>
  );
}
