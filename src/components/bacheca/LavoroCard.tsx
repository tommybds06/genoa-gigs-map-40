import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";
import { SPAZIO_SOPRA_NEGOZIO } from "@/lib/formaNegozio";
import type { LavoroWorker } from "@/hooks/useLavoriWorker";
import { Iniziali } from "./CartellinoCard";
import { SagomaNegozio } from "./SagomaNegozio";
import { badgeLavoro } from "./statiLavoro";

/**
 * LA CARD DI UN LAVORO, lato worker — la «vetrina» dell'attività per cui
 * lavora, a forma di NEGOZIO (lib/formaNegozio.ts).
 *
 * ⚠️ Fuori solo l'indispensabile per riconoscerla: foto con lo stato,
 * attività, ruolo. Paga, durata, giorni e orari stanno nella scheda che si
 * apre toccandola (SchedaLavoro) — decisione di Tommaso: la card è
 * un'etichetta, non il riassunto.
 *
 * ⚠️ DRITTA, non storta come i cartellini: un cartellino è appeso con una
 * puntina e può pendere, una vetrina no. (Non si imposta `--storto`, quindi
 * `.cartellino` resta a 0°.)
 *
 * Proporzione fissa come il cartellino; la foto prende lo spazio che resta.
 */

interface LavoroCardProps {
  l: LavoroWorker;
  onClick: () => void;
}

export function LavoroCard({ l, onClick }: LavoroCardProps) {
  const { theme } = useAppTheme();
  const b = badgeLavoro(l.stato, theme.btnFilled);
  const concluso = l.stato === "concluso";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cartellino block w-full text-left touch-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl",
        // Storico: resta in bacheca, ma arretra.
        concluso && "opacity-60"
      )}
      aria-label={`${l.attivita}, ${l.ruolo}, ${b.testo}. Apri i dettagli`}
    >
      <SagomaNegozio seme={l.id} />

      <div
        className="relative flex h-full w-full flex-col px-2.5 pb-4"
        style={{ paddingTop: SPAZIO_SOPRA_NEGOZIO }}
      >
        <div className="sagoma-foto relative min-h-0 w-full flex-1 overflow-hidden bg-paper-sunken">
          {l.foto ? (
            <img src={l.foto} alt="" className="h-full w-full object-cover object-[center_30%]" loading="lazy" />
          ) : (
            <Iniziali nome={l.attivita} className="text-3xl" />
          )}
          <span
            className={cn(
              "sagoma-badge absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 text-[11px] font-medium",
              b.classe
            )}
          >
            {b.testo}
          </span>
        </div>

        <p className="titolo-mini mt-2 shrink-0 truncate">{l.attivita}</p>
        <p className="shrink-0 truncate text-[12px] leading-tight text-muted-foreground">{l.ruolo}</p>
      </div>
    </button>
  );
}
