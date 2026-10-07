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
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { CHIAVE_CARTELLINI, useCartellini } from "@/hooks/useCartellini";
import { cn } from "@/lib/utils";
import {
  Cartellino,
  eScaduto,
  estendiDa,
  formatData,
  salvaAccordi,
  stacca,
  terminaLavoro,
} from "@/lib/bacheca";

/** Rimandati con «Più tardi»: non si ripropongono fino al prossimo avvio. */
const rimandati = new Set<string>();

/**
 * LA «NOTIFICA» DI FINE LAVORO.
 *
 * Non esistono ancora le notifiche push (arrivano con Despia, Fase 10): questa
 * e' la versione dentro l'app. All'apertura, se un cartellino ha la data di
 * fine passata, l'employer sceglie: estendere, concludere, o pensarci dopo.
 * Uno alla volta, come `ReviewPrompt`.
 *
 * Scatta dal giorno DOPO la data di fine: l'ultimo giorno il lavoro c'e'
 * ancora.
 */
export function PromemoriaScadenza() {
  const { user } = useAuth();
  const { isEmployer, hasLoaded } = useUser();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { data: cartellini = [] } = useCartellini(hasLoaded && isEmployer ? user?.id : undefined);
  const [, ridisegna] = useState(0);
  const [inCorso, setInCorso] = useState<string | null>(null);

  const c: Cartellino | undefined = cartellini.find((x) => eScaduto(x) && !rimandati.has(x.id));
  if (!c || !user) return null;

  const prova = c.stato === "prova";

  const fai = async (azione: string, fn: () => Promise<void>, messaggio: string) => {
    setInCorso(azione);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: [CHIAVE_CARTELLINI] });
      if (azione === "concludi") {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
      }
      toast.success(messaggio, { duration: 2000 });
    } catch (e) {
      console.error("Promemoria scadenza:", e);
      toast.error("Qualcosa è andato storto, riprova");
    } finally {
      setInCorso(null);
    }
  };

  const rimanda = () => {
    rimandati.add(c.id);
    ridisegna((n) => n + 1);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !inCorso && rimanda()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="titolo-sezione font-normal">
            {prova ? `La prova di ${c.nome} è finita` : `Il lavoro con ${c.nome} è finito`}
          </DialogTitle>
          <DialogDescription>
            {c.mestiere}, fissato fino al {formatData(c.dataFine)}. Cosa vuoi fare?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={!!inCorso}
              onClick={() =>
                fai("settimana", () => salvaAccordi(c.id, { dataFine: estendiDa(c.dataFine, 7) }), "Esteso di una settimana")
              }
            >
              {inCorso === "settimana" && <Loader2 className="animate-spin" />}
              +1 settimana
            </Button>
            <Button
              variant="outline"
              disabled={!!inCorso}
              onClick={() =>
                fai("mese", () => salvaAccordi(c.id, { dataFine: estendiDa(c.dataFine, 0, 1) }), "Esteso di un mese")
              }
            >
              {inCorso === "mese" && <Loader2 className="animate-spin" />}
              +1 mese
            </Button>
          </div>

          <Button
            size="lg"
            className={cn("w-full", theme.btnFilled, theme.btnFilledHover)}
            disabled={!!inCorso}
            onClick={() =>
              prova
                ? fai("concludi", () => stacca(c.id), "Prova chiusa, tolto dalla bacheca")
                : fai("concludi", () => terminaLavoro(c.jobId, c.workerId), "Lavoro concluso")
            }
          >
            {inCorso === "concludi" && <Loader2 className="animate-spin" />}
            {prova ? "Chiudi la prova" : "Concludi il lavoro"}
          </Button>

          <Button variant="ghost" className="w-full" disabled={!!inCorso} onClick={rimanda}>
            Più tardi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
