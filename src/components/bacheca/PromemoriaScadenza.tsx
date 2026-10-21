import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CuoreIcon } from "@/components/icons/uiIcons";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { CHIAVE_CARTELLINI, useCartellini } from "@/hooks/useCartellini";
import { cn } from "@/lib/utils";
import {
  Cartellino,
  confermaAncoraAttivo,
  estendiDa,
  formatData,
  salvaAccordi,
  segnaEsito,
  stacca,
  terminaLavoro,
  testoChiusuraAutomatica,
  prossimoPromemoria,
  type TipoPromemoria,
} from "@/lib/bacheca";

/** Rimandati con «Più tardi»: non si ripropongono fino al prossimo avvio. */
const rimandati = new Set<string>();

interface FinestraPromemoriaProps {
  tipo: TipoPromemoria;
  c: Cartellino;
  /** Esegue un'azione; `chiave` serve a mostrare la rotellina sul bottone giusto. */
  fai: (chiave: string, fn: () => Promise<void>, messaggio: string) => void;
  inCorso: string | null;
  rimanda: () => void;
}

/** La finestra vera e propria: separata dal contenitore per poterla vedere con dati finti. */
export function FinestraPromemoria({ tipo, c, fai, inCorso, rimanda }: FinestraPromemoriaProps) {
  const { theme } = useAppTheme();
  const prova = c.stato === "prova";
  const occupato = !!inCorso;
  const rotella = (k: string) => inCorso === k && <Loader2 className="animate-spin" />;

  const concludi = () =>
    prova
      ? fai("concludi", () => stacca(c.id), "Prova chiusa, tolto dalla bacheca")
      : fai("concludi", () => terminaLavoro(c.jobId, c.workerId), "Lavoro concluso");

  if (tipo === "cuore") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="titolo-sezione font-normal">Com'è andata con {c.nome}?</DialogTitle>
          <DialogDescription>
            {c.mestiere}: il lavoro è concluso. Se è andato bene, lascia il cuore a {c.nome}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-2">
          <Button
            size="lg"
            className={cn("w-full", theme.btnFilled, theme.btnFilledHover)}
            disabled={occupato}
            onClick={() => fai("cuore", () => segnaEsito(c.id, true), `Cuore lasciato a ${c.nome}`)}
          >
            {rotella("cuore") || <CuoreIcon className="h-5 w-5" />}
            Metti il cuore
          </Button>
          {/* «Non mettere direttamente nulla»: si salva come risposta, così la
              card non torna. Nessun cuore ≠ voto negativo: non si mostra. */}
          <Button
            variant="ghost"
            className="w-full"
            disabled={occupato}
            onClick={() => fai("salta", () => segnaEsito(c.id, false), "Va bene")}
          >
            {rotella("salta")}
            Salta
          </Button>
        </div>
      </>
    );
  }

  if (tipo === "trimestrale") {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="titolo-sezione font-normal">Il lavoro con {c.nome} è ancora attivo?</DialogTitle>
          {/* Niente descrizione (Tommaso): la domanda basta. La descrizione
              resta per gli screen reader, che altrimenti non sanno di che lavoro si parla. */}
          <DialogDescription className="sr-only">{c.mestiere}, senza data di fine.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-2">
          <Button
            size="lg"
            className={cn("w-full", theme.btnFilled, theme.btnFilledHover)}
            disabled={occupato}
            onClick={() => fai("attivo", () => confermaAncoraAttivo(c.id), "Perfetto, te lo richiediamo fra tre mesi")}
          >
            {rotella("attivo")}
            Sì, è ancora attivo
          </Button>
          <Button variant="outline" className="w-full" disabled={occupato} onClick={concludi}>
            {rotella("concludi")}
            Concludi il lavoro
          </Button>
          <Button variant="ghost" className="w-full" disabled={occupato} onClick={rimanda}>
            Più tardi
          </Button>
        </div>
      </>
    );
  }

  // SCADENZA
  return (
    <>
      <DialogHeader>
        <DialogTitle className="titolo-sezione font-normal">
          {prova ? `La prova di ${c.nome} è finita` : `Il lavoro con ${c.nome} è finito`}
        </DialogTitle>
        <DialogDescription>
          {c.mestiere}, fissato fino al {formatData(c.dataFine)}. Vuoi estenderlo o concluderlo?
        </DialogDescription>
      </DialogHeader>

      {/* Il conto alla rovescia solo per gli assunti: sono loro a chiudersi da soli. */}
      {!prova && c.dataFine && (
        <p className="rounded-xl bg-warning-soft px-3 py-2 text-[13px] font-medium text-warning-soft-foreground">
          {testoChiusuraAutomatica(c.dataFine)}.
        </p>
      )}

      <div className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={occupato}
            onClick={() => fai("settimana", () => salvaAccordi(c.id, { dataFine: estendiDa(c.dataFine, 7) }), "Esteso di una settimana")}
          >
            {rotella("settimana")}
            +1 settimana
          </Button>
          <Button
            variant="outline"
            disabled={occupato}
            onClick={() => fai("mese", () => salvaAccordi(c.id, { dataFine: estendiDa(c.dataFine, 0, 1) }), "Esteso di un mese")}
          >
            {rotella("mese")}
            +1 mese
          </Button>
        </div>
        <Button
          size="lg"
          className={cn("w-full", theme.btnFilled, theme.btnFilledHover)}
          disabled={occupato}
          onClick={concludi}
        >
          {rotella("concludi")}
          {prova ? "Chiudi la prova" : "Concludi il lavoro"}
        </Button>
        <Button variant="ghost" className="w-full" disabled={occupato} onClick={rimanda}>
          Più tardi
        </Button>
      </div>
    </>
  );
}

/**
 * LE DOMANDE DELL'APP ALL'EMPLOYER, all'avvio — montato in App.tsx accanto a
 * ReviewPrompt. Non ci sono push (arrivano con Despia, Fase 10): questa è la
 * versione dentro l'app. Vedi `prossimoPromemoria` per cosa chiede e quando.
 */
export function PromemoriaScadenza() {
  const { user } = useAuth();
  const { isEmployer, hasLoaded } = useUser();
  const queryClient = useQueryClient();
  const { data: cartellini = [] } = useCartellini(hasLoaded && isEmployer ? user?.id : undefined);
  const [, ridisegna] = useState(0);
  const [inCorso, setInCorso] = useState<string | null>(null);

  const prossimo = prossimoPromemoria(cartellini, rimandati);
  if (!prossimo || !user) return null;
  const { tipo, c } = prossimo;

  const fai = async (chiave: string, fn: () => Promise<void>, messaggio: string) => {
    setInCorso(chiave);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: [CHIAVE_CARTELLINI] });
      if (chiave === "concludi") {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
      }
      toast.success(messaggio, { duration: 2000 });
    } catch (e) {
      console.error("Promemoria:", e);
      toast.error("Qualcosa è andato storto, riprova");
    } finally {
      setInCorso(null);
    }
  };

  const rimanda = () => {
    rimandati.add(`${tipo}:${c.id}`);
    ridisegna((n) => n + 1);
  };

  // Chiudere col tocco fuori = «Più tardi». Per il cuore no: lì «Salta» è
  // una risposta da salvare, chiudere la finestra la ripropone al prossimo avvio.
  return (
    <Dialog open onOpenChange={(o) => !o && !inCorso && rimanda()}>
      <DialogContent>
        <FinestraPromemoria tipo={tipo} c={c} fai={fai} inCorso={inCorso} rimanda={rimanda} />
      </DialogContent>
    </Dialog>
  );
}
