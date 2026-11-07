import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cerchioImperfetto } from "@/lib/formaCerchio";

/**
 * LA LINEA DEL TEMPO della durata, in Crea annuncio (7 novembre).
 *
 * Le cinque durate (Una tantum → Continuativo) sono una SCALA, dalla più
 * corta alla più lunga, e la griglia di bottoni la nascondeva: due per riga,
 * «Continuativo» da solo in fondo, nessun ordine leggibile. Qui sono cinque
 * tappe su una linea disegnata, e la linea si colora fino alla durata scelta:
 * più il lavoro è lungo, più è lunga la linea piena.
 *
 * - Si TOCCA una tappa (tutta la colonna, ~70 × 64 px) o si TRASCINA lungo
 *   la linea. Il trascinamento parte solo se il dito va di lato: in
 *   verticale la pagina scorre (`touch-action: pan-y`) e non sceglie niente.
 *   La scelta col tocco è al `click`, che dopo uno scorrimento non arriva.
 * - Tutte le etichette sempre visibili: è una scelta fra cinque nomi, non un
 *   valore da indovinare (il difetto classico degli slider).
 * - `role="radiogroup"`, le frecce spostano la scelta.
 * - Sotto il titolo, una riga che spiega la durata scelta (`descrizioni`).
 */
const DIAMETRO_TAPPA = 12;
const DIAMETRO_SCELTA = 24;
const TAPPA = cerchioImperfetto(DIAMETRO_TAPPA - 2, "tappa");
const SCELTA = cerchioImperfetto(DIAMETRO_SCELTA - 2, "tappa-scelta");

export function LineaDurata({
  opzioni,
  valore,
  onScegli,
  etichetta,
}: {
  opzioni: string[];
  valore: string;
  onScegli: (v: string) => void;
  etichetta: string;
}) {
  const { theme, isEmployer } = useAppTheme();
  const rif = useRef<HTMLDivElement>(null);
  const trascina = useRef<{ x: number; y: number; attivo: boolean } | null>(null);
  const n = opzioni.length;
  const indice = opzioni.indexOf(valore);
  // Il colore pieno del ruolo, come testo: lo usano i cerchi (`currentColor`)
  // e la linea piena (`bg-current`).
  const pieno = isEmployer ? "text-employer-700" : "text-primary";

  /** La tappa sotto il dito: la colonna in cui cade. */
  const tappaA = (x: number) => {
    const r = rif.current!.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((x - r.left) / r.width) * n)));
  };

  const giu = (e: PointerEvent) => {
    trascina.current = { x: e.clientX, y: e.clientY, attivo: false };
  };
  const muovi = (e: PointerEvent) => {
    const t = trascina.current;
    if (!t) return;
    if (!t.attivo) {
      const dx = Math.abs(e.clientX - t.x);
      if (dx < 6 || dx < Math.abs(e.clientY - t.y)) return;
      t.attivo = true;
      rif.current?.setPointerCapture(e.pointerId);
    }
    const i = tappaA(e.clientX);
    if (opzioni[i] !== valore) onScegli(opzioni[i]);
  };
  const su = () => {
    trascina.current = null;
  };

  const tasto = (e: KeyboardEvent) => {
    const passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const prossimo = Math.min(n - 1, Math.max(0, (indice < 0 ? -1 : indice) + passo));
    onScegli(opzioni[prossimo]);
    rif.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[prossimo]?.focus();
  };

  // La linea va dal centro della prima colonna al centro dell'ultima.
  const margine = 50 / n; // in % della larghezza
  const pienaFino = indice < 0 ? 0 : indice / (n - 1);

  return (
    <div
      ref={rif}
      role="radiogroup"
      aria-label={etichetta}
      onKeyDown={tasto}
      onPointerDown={giu}
      onPointerMove={muovi}
      onPointerUp={su}
      onPointerCancel={su}
      className="relative select-none touch-pan-y"
    >
      {/* La linea: quella disegnata delle divisorie, stirata; sopra, la
          stessa colorata, ritagliata fino alla tappa scelta. */}
      <span
        aria-hidden="true"
        className="linea-tempo absolute top-[13px] h-[4px] bg-[hsl(var(--paper-edge)/0.7)]"
        style={{ left: `${margine}%`, right: `${margine}%` }}
      />
      <span
        aria-hidden="true"
        className={cn(
          "linea-tempo absolute top-[13px] h-[4px] bg-current transition-[clip-path] [transition-duration:240ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          pieno,
        )}
        style={{
          left: `${margine}%`,
          right: `${margine}%`,
          clipPath: `inset(0 ${(1 - pienaFino) * 100}% 0 0)`,
        }}
      />
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {opzioni.map((o, i) => {
          const scelta = i === indice;
          const passata = indice >= 0 && i < indice;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={scelta}
              tabIndex={scelta || (indice < 0 && i === 0) ? 0 : -1}
              onClick={() => onScegli(o)}
              className="group flex flex-col items-center gap-2 pb-1 focus-visible:outline-none"
            >
              <span className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full group-focus-visible:ring-2 group-focus-visible:ring-ring">
                {/* La tappa piccola: piena se è già passata, vuota se no. */}
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 ${DIAMETRO_TAPPA} ${DIAMETRO_TAPPA}`}
                  className={cn(
                    "absolute transition-[transform,opacity] duration-200 group-active:scale-90",
                    passata ? pieno : "text-paper-sheet",
                    scelta && "scale-50 opacity-0",
                  )}
                  style={{ width: DIAMETRO_TAPPA, height: DIAMETRO_TAPPA }}
                >
                  <path
                    d={TAPPA}
                    transform="translate(1 1)"
                    fill="currentColor"
                    stroke={passata ? "none" : "hsl(var(--paper-edge))"}
                    strokeWidth={1.1}
                  />
                </svg>
                {/* La scelta: un cerchio grande pieno, col bordo di carta che
                    lo stacca dalla linea. */}
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 ${DIAMETRO_SCELTA} ${DIAMETRO_SCELTA}`}
                  className={cn(
                    "absolute transition-[transform,opacity] [transition-duration:240ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
                    pieno,
                    scelta ? "scale-100 opacity-100" : "scale-50 opacity-0",
                  )}
                  style={{ width: DIAMETRO_SCELTA, height: DIAMETRO_SCELTA }}
                >
                  <path
                    d={SCELTA}
                    transform="translate(1 1)"
                    fill="currentColor"
                    stroke="hsl(var(--paper))"
                    strokeWidth={2}
                    paintOrder="stroke"
                  />
                </svg>
              </span>
              <span
                className={cn(
                  "text-center text-[13px] leading-tight transition-colors duration-200",
                  scelta ? cn(theme.primaryText, "font-semibold") : "text-ink-soft",
                )}
              >
                {o}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
