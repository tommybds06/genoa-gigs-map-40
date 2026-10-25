import { useEffect, useRef, type ComponentType } from "react";
import { PUNTINE } from "@/components/icons/puntine";
import { cn } from "@/lib/utils";

/** A 12 fotogrammi al secondo: le pose dello stop motion (§«Lo scotch»). */
const FOTOGRAMMA = 1000 / 12;
/* La puntina si alza, si pianta un filo più in basso e torna: [y px, scala, gradi]. */
const POSE_PIANTA: [number, number, number][] = [
  [0, 1, 0],
  [-7, 1.14, -8],
  [-3, 1.08, -4],
  [2, 0.92, 3],
  [0, 1, 0],
];

/**
 * LA TESSERA DEL RUOLO in registrazione e in «Scegli ruolo» (Tommaso, 24
 * ottobre). Prima erano due rettangoli col bordo CSS, scritti due volte
 * (Auth e ScegliRuolo), e la tessera scelta aveva un fondo grigio-verde: il
 * 15% del blu SCURO della gerarchia scura su carta.
 *
 * - Contorno disegnato delle card (`.material-card`); scelta, il fondo
 *   tenue del ruolo (`employer-50` / `accent`).
 * - Al posto del pallino, una PUNTINA della bacheca, fuori dalla maschera
 *   (la taglierebbe): grigia finché la tessera non è scelta; scelta, prende
 *   il colore del ruolo — ruggine il worker, blu l'employer, come il resto
 *   della pagina — e si pianta con uno scatto in stop motion.
 */
export function TesseraRuolo({
  ruolo,
  scelto,
  onScegli,
  icona: Icona,
  titolo,
  sotto,
  misura = "normale",
  puntina: quale,
}: {
  /** Il colore: ruggine il worker, blu l'employer. */
  ruolo: "worker" | "employer";
  scelto: boolean;
  onScegli: () => void;
  icona: ComponentType<{ className?: string }>;
  titolo: string;
  sotto?: string;
  /** `piccola`: la seconda scelta, Attività o Privato, sotto «Offro impiego». */
  misura?: "normale" | "piccola";
  /** Quale delle tre puntine disegnate (di serie: 1 il worker, 2 l'employer). */
  puntina?: 0 | 1 | 2;
}) {
  const employer = ruolo === "employer";
  const piccola = misura === "piccola";
  const Puntina = PUNTINE[quale ?? (employer ? 1 : 0)];
  const puntina = useRef<HTMLSpanElement>(null);
  const primaVolta = useRef(true);

  useEffect(() => {
    // Solo quando la scelta CAMBIA, non al primo disegno della pagina.
    if (primaVolta.current) {
      primaVolta.current = false;
      return;
    }
    if (!scelto || !puntina.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    puntina.current.animate(
      POSE_PIANTA.map(([y, s, g]) => ({
        transform: `translateY(${y}px) scale(${s}) rotate(${g}deg)`,
        easing: "steps(1, end)",
      })),
      { duration: FOTOGRAMMA * (POSE_PIANTA.length - 1) }
    );
  }, [scelto]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onScegli}
        aria-pressed={scelto}
        className={cn(
          "material-card relative block w-full text-left transition-colors duration-300 touch-feedback",
          piccola ? "flex items-center gap-2.5 px-2.5 py-3" : "p-4",
          // Le tinte pensate per i fondi di ruolo. Un pastello velato sulla
          // carta calda si spegneva in un grigio.
          scelto && (employer ? "bg-employer-50" : "bg-[hsl(var(--accent-worker))]")
        )}
      >
        <div
          className={cn(
            "sagoma-tag flex shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
            piccola ? "h-9 w-9" : "mb-3 h-12 w-12",
            scelto
              ? employer
                ? "bg-employer-700 text-employer-foreground"
                : "bg-primary text-primary-foreground"
              : employer
                ? "bg-employer-50 text-employer-800"
                : // Fissa, non `accent`: con la pagina blu la valigetta diventava blu.
                  "bg-[hsl(var(--accent-worker))] text-primary-strong"
          )}
        >
          <Icona className={piccola ? "h-5 w-5" : "h-6 w-6"} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{titolo}</h3>
          {sotto && (
            <p className={cn("mt-0.5 text-xs text-muted-foreground", piccola && "whitespace-nowrap")}>{sotto}</p>
          )}
        </div>
      </button>

      <span
        ref={puntina}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute z-10 block origin-bottom",
          piccola ? "-top-2.5 right-3 w-[18px]" : "-top-3 right-4 w-[22px]"
        )}
      >
        <Puntina
          className={cn(
            "h-auto w-full drop-shadow-[0_1px_0_hsl(var(--ink)/0.15)] transition-colors duration-300",
            scelto ? (employer ? "text-employer-700" : "text-primary") : "text-paper-line"
          )}
        />
      </span>
    </div>
  );
}
