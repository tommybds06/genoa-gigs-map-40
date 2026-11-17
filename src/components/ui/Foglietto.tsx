export type { LatoScotch, StrisciaScotch } from "@/components/ui/Scotch";
import {
  cloneElement,
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactElement,
} from "react";
import { DENTRO_X, DENTRO_Y, numeroDa, Scotch, SOPRA_DX, SOPRA_SX, type StrisciaScotch } from "@/components/ui/Scotch";
import { PUNTINE } from "@/components/icons/puntine";
import { useAppTheme } from "@/hooks/useAppTheme";

/**
 * UN FOGLIETTO ATTACCATO CON LO SCOTCH (Tommaso, 23 ottobre).
 *
 * Sulle card che NON si toccano (le sezioni del profilo): lo scotch dice
 * «attaccato fisso, da leggere», come la puntina dice «appeso, si stacca»
 * sui cartellini della bacheca. Al tocco il foglio oscilla attorno allo
 * scotch, a scatti: è un easter egg, non un comando.
 *
 * ⚠️ Lo scotch NON sta dentro la card, e la card NON viene avvolta:
 *  - la card è ritagliata con una maschera (§6), che taglierebbe lo scotch
 *    proprio dove deve uscire dal bordo;
 *  - le quattro sagome delle card si alternano con `nth-of-type` fra i `div`
 *    fratelli: un contenitore attorno le farebbe tornare tutte uguali.
 *  Quindi il componente restituisce DUE fratelli: uno `span` alto zero con lo
 *  scotch (uno span non conta per `nth-of-type` dei div) e la card stessa.
 *
 * Cautele (approvate da Tommaso):
 *  - nessun effetto «premuto»: non deve sembrare un bottone;
 *  - non parte mentre si scorre: sul telefono lo scorrimento manda un
 *    `pointercancel`, e comunque oltre gli 8 px di spostamento non vale;
 *  - non parte su link e bottoni dentro la card, né se si sta selezionando
 *    del testo; con «riduci movimento» non parte affatto.
 *
 * LA PUNTINA al posto dello scotch (`puntina`, 17 novembre): sulle sezioni
 * che si TOCCANO (Interessi con «Modifica», lo storico con le righe che
 * portano all'attività). Nel sistema dei segni la puntina vuol dire «appeso,
 * si maneggia» (§22): senza niente, quelle due card restavano un buco nel
 * ritmo del profilo, due fogli «da app» fra fogli attaccati. Il foglio
 * oscilla attorno a lei, come attorno a uno scotch solo.
 */

interface FogliettoProps {
  /** La card: un elemento solo (un `div` con `.material-card`). */
  children: ReactElement;
  /** Uno scotch in alto (centro o un angolo), o due sugli angoli. */
  scotch?: StrisciaScotch[];
  /** Una puntina invece dello scotch, sul bordo alto (al 22% o al 78%). */
  puntina?: "sopraSx" | "sopraDx";
  /** Per variare l'inclinazione da una card all'altra, sempre uguale per la stessa. */
  seme: string;
  /**
   * Il ruolo del PROFILO mostrato (il colore dello scotch). Di serie quello
   * di chi guarda.
   */
  employer?: boolean;
}

/** A 12 fotogrammi al secondo, «a due»: il passo dello stop motion. */
const FOTOGRAMMA = 1000 / 12;

/* Le pose, in gradi. Il foglio parte spinto, rimbalza e si ferma: ogni posa
   resta ferma per un fotogramma (niente interpolazione), come in stop motion. */
const POSE_PENDOLO = [0, 2.4, -1.8, 1.1, -0.6, 0.25, 0];
/* Con DUE scotch il foglio non può girare: si solleva e ricade dal basso
   (scala verticale dal bordo alto), con un filo di rotazione per non sembrare
   meccanico. [scala, gradi] */
const POSE_SVOLAZZO: [number, number][] = [
  [1, 0],
  [0.972, -0.2],
  [1.012, 0.3],
  [0.986, -0.15],
  [1.005, 0.05],
  [1, 0],
];

/** Il punto attorno a cui oscilla il foglio: lo scotch, se è uno solo. */
function perno(scotch: StrisciaScotch[], puntina?: "sopraSx" | "sopraDx"): string {
  if (puntina) return `${puntina === "sopraSx" ? SOPRA_SX : SOPRA_DX} 6px`;
  if (scotch.length !== 1) return "50% 0";
  const { lato } = scotch[0];
  if (lato === "sopraSx") return `${SOPRA_SX} 0`;
  if (lato === "sopraDx") return `${SOPRA_DX} 0`;
  if (lato === "sx") return `${DENTRO_X}px ${DENTRO_Y}px`;
  if (lato === "dx") return `calc(100% - ${DENTRO_X}px) ${DENTRO_Y}px`;
  return "50% 0";
}

const INTERATTIVI = 'a, button, input, textarea, select, label, [role="button"]';

export function Foglietto({ children, scotch = [], puntina, seme, employer }: FogliettoProps) {
  const nodo = useRef<HTMLElement | null>(null);
  const inizio = useRef<{ x: number; y: number; t: number } | null>(null);
  const animazione = useRef<Animation | null>(null);
  const n = numeroDa(seme);

  const scuoti = useCallback(
    (xTocco: number) => {
      const el = nodo.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const r = el.getBoundingClientRect();
      // Spinto dal lato in cui lo tocchi.
      const verso = xTocco >= r.left + r.width / 2 ? 1 : -1;
      const fotogrammi =
        scotch.length === 1 || puntina
          ? POSE_PENDOLO.map((g) => ({ rotate: `${g * verso}deg`, easing: "steps(1, end)" }))
          : POSE_SVOLAZZO.map(([s, g]) => ({
              scale: `1 ${s}`,
              rotate: `${g * verso}deg`,
              easing: "steps(1, end)",
            }));
      animazione.current?.cancel();
      // `rotate` e `scale` sono proprietà a parte da `transform`: l'oscillazione
      // si somma all'inclinazione di base della card (.tilt-l / .tilt-r)
      // invece di cancellarla.
      animazione.current = el.animate(fotogrammi, {
        duration: FOTOGRAMMA * (fotogrammi.length - 1),
      });
    },
    [scotch.length, puntina]
  );

  const props = children.props as {
    style?: CSSProperties;
    onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp?: (e: PointerEvent<HTMLElement>) => void;
    onPointerCancel?: (e: PointerEvent<HTMLElement>) => void;
  };

  const card = cloneElement(children as ReactElement<Record<string, unknown>>, {
    ref: (el: HTMLElement | null) => {
      nodo.current = el;
    },
    style: { ...props.style, transformOrigin: perno(scotch, puntina) },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      props.onPointerDown?.(e);
      inizio.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      props.onPointerCancel?.(e);
      inizio.current = null;
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      props.onPointerUp?.(e);
      const s = inizio.current;
      inizio.current = null;
      if (!s) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8 || e.timeStamp - s.t > 600) return;
      if ((e.target as Element).closest(INTERATTIVI)) return;
      if (window.getSelection()?.toString()) return;
      scuoti(e.clientX);
    },
  });

  return (
    <>
      <span aria-hidden="true" className="pointer-events-none relative z-10 block h-0">
        {scotch.map((s, i) => (
          <Scotch key={i} {...s} seme={n + i * 3} employer={employer} />
        ))}
        {puntina && <PuntinaFoglio dove={puntina} n={n} employer={employer} />}
      </span>
      {card}
    </>
  );
}

/** La puntina piantata nel bordo alto: testa nel colore del ruolo, ago in
    inchiostro (icons/puntine), larga 20 px come quella dei menu. */
function PuntinaFoglio({ dove, n, employer }: { dove: "sopraSx" | "sopraDx"; n: number; employer?: boolean }) {
  const { isEmployer } = useAppTheme();
  const P = PUNTINE[n % PUNTINE.length];
  const blu = employer ?? isEmployer;
  return (
    <P
      className={`absolute -top-3.5 h-auto w-5 drop-shadow-[0_1px_0_hsl(var(--ink)/0.15)] ${blu ? "text-employer-700" : "text-primary"}`}
      style={{ left: `calc(${dove === "sopraSx" ? SOPRA_SX : SOPRA_DX} - 10px)` }}
    />
  );
}
