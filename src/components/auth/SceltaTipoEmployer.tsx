import { TesseraRuolo } from "@/components/auth/TesseraRuolo";
import { AnnunciIcon, ProfiloIcon } from "@/components/icons/uiIcons";
import type { TipoEmployer } from "@/lib/registrazione";

/**
 * LA SECONDA SCELTA di chi offre lavoro (Tommaso, 24 ottobre): compare sotto
 * le due tessere appena si tocca «Offro impiego». Stesse tessere (bordo
 * disegnato, puntina), più piccole, tutte e due blu: sono due modi dello
 * stesso ruolo.
 */
export function SceltaTipoEmployer({
  valore,
  onScegli,
  errore,
}: {
  valore: TipoEmployer | null;
  onScegli: (t: TipoEmployer) => void;
  errore?: string;
}) {
  return (
    <div className="space-y-2 pt-1 animate-fade-in">
      <p className="text-sm text-muted-foreground">Offri lavoro come…</p>
      <div className="grid grid-cols-2 gap-3">
        <TesseraRuolo
          ruolo="employer"
          misura="piccola"
          puntina={2}
          scelto={valore === "attivita"}
          onScegli={() => onScegli("attivita")}
          icona={AnnunciIcon}
          titolo="Attività"
          sotto="Bar, negozi"
        />
        <TesseraRuolo
          ruolo="employer"
          misura="piccola"
          puntina={0}
          scelto={valore === "privato"}
          onScegli={() => onScegli("privato")}
          icona={ProfiloIcon}
          titolo="Privato"
          sotto="Una persona"
        />
      </div>
      {errore && <p className="text-xs text-destructive">{errore}</p>}
    </div>
  );
}
