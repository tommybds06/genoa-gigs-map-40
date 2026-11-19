import { useLayoutEffect, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from "react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useMisure } from "@/hooks/useMisure";
import { semeDa } from "@/lib/tratto";
import { FOTOGRAMMA, movimentoRidotto } from "@/lib/aScatti";
import { cn } from "@/lib/utils";
import {
  POSTIT_A,
  POSTIT_ANGOLO,
  POSTIT_CONTORNO,
  POSTIT_FOGLIO,
  POSTIT_L,
  POSTIT_OMBRA,
} from "@/components/icons/postit";

/**
 * IL POST-IT (18 novembre) — il disegno di Tommaso (`icons/postit.ts`).
 *
 * LA REGOLA (decisa con Tommaso): il post-it è una NOTA o una COSA DA FARE,
 * provvisoria. Va solo dove l'app ha già un consiglio o una nota, o dove
 * serve davvero un promemoria; mai decorazione, mai più di uno per
 * schermata. Nel sistema dei segni: scotch = attaccato, da leggere;
 * puntina = appeso, si tocca; post-it = ricordati di questo.
 *
 * - COLORI come lo scotch e i toast: il foglio è il pastello del RUOLO al
 *   55% sul foglio (opaco: ci si legge sopra), il risvolto più carico, il
 *   contorno l'inchiostro del ruolo al 75%. Il testo in inchiostro.
 * - LA MISURA la fa il testo. L'altezza decide la scala del disegno; se il
 *   testo è più largo del quadrato, il disegno si allunga in TRE FETTE
 *   verticali: le due esterne (con l'angolo arricciato a destra) in scala
 *   uniforme, quella centrale stirata. Lì il bordo è quasi dritto, quindi
 *   allungato non si vede; l'angolo resta quello disegnato a ogni misura.
 *   La fetta centrale sborda di mezzo pixel sotto le altre: niente giunture.
 *   ⚠️ Ogni fetta è un `<svg>` con `overflow="hidden"`: con `visible` la
 *   fetta stirata disegnava anche il resto della tavola, allargato di 16
 *   volte, e il post-it diventava una fascia larga quanto lo schermo.
 * - Storto dal seme (±3°, `rotate`, che si somma a chi lo contiene).
 * - Entrando si «attacca»: tre pose a 12 fps, come le puntine. Ferma con
 *   «riduci movimento».
 * - `staccabile`: le NOTE (non le cose da fare) si tolgono toccandole: il
 *   post-it si stacca e CADE SVOLAZZANDO fino al fondo dello schermo, a
 *   scatti (Tommaso, 19 novembre). Toccarla vuol dire «letto»: per questa
 *   sessione non torna (un insieme nel modulo, non `window`, §2 lez. 8).
 *   I post-it che chiedono di FARE qualcosa (Manca la foto, Recensisci,
 *   Finito?) non si staccano: il tocco porta a farla.
 * - `misura`: «piccolo» per le parole sole sulle card (Recensisci, Finito?),
 *   «grande» per le frasi in riga, «quadrato» (con una larghezza `w-…`) per
 *   le note staccate dal flusso, che non devono spingere giù niente. Il margine destro e quello basso lasciano libero
 *   l'angolo arricciato: il testo non ci finisce mai sopra.
 */

/* Le tre fette, in unità della tavola: [0, A] e [B, L] restano in scala. */
const FETTA_A = 38;
const FETTA_B = 52;
const POSE_ATTACCA: [number, number][] = [
  [1.08, -2],
  [0.97, 1],
  [1, 0],
];

/** Le note già tolte in questa sessione (per seme). */
const staccati = new Set<string>();

/**
 * La caduta: prima si solleva (si stacca), poi scende accelerando e intanto
 * ondeggia di lato e gira, come un foglietto nell'aria. 12 pose al secondo.
 */
function poseCaduta(dy: number, gradi: number, verso: number) {
  const pose: Keyframe[] = [{ translate: "0 -6px", rotate: `${gradi - 4 * verso}deg`, scale: "1.05", easing: "steps(1, end)" }];
  const N = 11;
  for (let k = 1; k <= N; k++) {
    const t = k / N;
    const x = Math.sin(t * Math.PI * 2.4) * 16 * verso;
    const y = dy * Math.pow(t, 1.7);
    const g = gradi + Math.sin(t * Math.PI * 2.4 + 0.7) * 16 * verso;
    pose.push({ translate: `${x.toFixed(1)}px ${y.toFixed(1)}px`, rotate: `${g.toFixed(1)}deg`, scale: "1", easing: "steps(1, end)" });
  }
  return pose;
}

const MISURE = {
  /* Testo a 16 (Tommaso, 18 novembre: «un po' grossi»). È il minimo per
     Shinjo: sotto, l'irregolarità del tratto diventa rumore (§5). */
  piccolo: "pl-2 pr-3.5 pt-1.5 pb-2 text-[16px] leading-[1.1]",
  grande: "pl-3 pr-6 pt-2.5 pb-4 text-[16px] leading-[1.12]",
  /* Il QUADRATO a misura fissa (la larghezza la dà chi lo usa, l'altezza la
     proporzione della tavola). Il testo usa tutta la larghezza: l'angolo
     arricciato occupa solo l'ultimo quarto in basso, e lì c'è `pb`. */
  quadrato: "pl-2.5 pr-2 pt-2 pb-6 text-[16px] leading-[1.05]",
};

function Disegno({ colori }: { colori: { foglio: string; angolo: string; filo: string } }) {
  return (
    <>
      <path d={POSTIT_OMBRA} fill="hsl(var(--paper-line))" />
      <path d={POSTIT_CONTORNO} fill={colori.filo} stroke={colori.filo} strokeWidth={0.8} strokeLinejoin="round" />
      <path d={POSTIT_FOGLIO} fill={colori.foglio} />
      <path d={POSTIT_ANGOLO} fill={colori.angolo} />
    </>
  );
}

interface PostItProps {
  children: ReactNode;
  /** Per l'inclinazione: sempre la stessa per la stessa nota. */
  seme: string;
  /** Il ruolo di cui prendere i colori; di serie quello di chi guarda. */
  employer?: boolean;
  misura?: keyof typeof MISURE;
  /** L'inclinazione voluta, in gradi. Di serie viene dal seme (±3°); si fissa
      quando due post-it stanno nella stessa schermata e non devono pendere
      dallo stesso lato (Tommaso, 18 novembre). */
  gradi?: number;
  /** Una NOTA: toccandola si stacca e cade (vedi sopra). */
  staccabile?: boolean;
  /** Un post-it che si tocca (porta a fare la cosa). Altrimenti è solo una nota. */
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function PostIt({ children, seme, employer, misura = "grande", gradi: voluti, staccabile, onClick, className, style }: PostItProps) {
  const { isEmployer } = useAppTheme();
  const blu = employer ?? isEmployer;
  const { ref, misure } = useMisure<HTMLElement>();
  const nodo = useRef<HTMLElement | null>(null);
  const [minimo, setMinimo] = useState(0);
  const [via, setVia] = useState(() => staccabile && staccati.has(seme));
  const [cade, setCade] = useState(false);

  const pastello = blu ? "hsl(var(--brand-blue))" : "hsl(var(--brand-orange))";
  const inchiostro = blu ? "hsl(var(--brand-blue-ink))" : "hsl(var(--brand-orange-ink))";
  const colori = {
    foglio: `color-mix(in srgb, ${pastello} 55%, hsl(var(--paper-sheet)))`,
    angolo: `color-mix(in srgb, ${pastello} 85%, hsl(var(--paper-sheet)))`,
    filo: `color-mix(in srgb, ${inchiostro} 75%, hsl(var(--paper-sheet)))`,
  };
  const gradi = voluti ?? (((semeDa(seme) % 1000) / 1000) * 2 - 1) * 3;

  // Mai più stretto del quadrato: con un testo corto il disegno si
  // schiaccerebbe. Il minimo si sa solo dopo aver misurato l'altezza.
  // ⚠️ Non per il quadrato: lì la misura è fissa, e un minimo che dipende
  // dall'altezza (che dipende dalle righe) potrebbe rimbalzare.
  useLayoutEffect(() => {
    if (!misure || misura === "quadrato") return;
    const quadrato = Math.ceil((misure.h * POSTIT_L) / POSTIT_A);
    if (quadrato !== minimo) setMinimo(quadrato);
  }, [misure, minimo, misura]);

  useLayoutEffect(() => {
    const el = nodo.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      POSE_ATTACCA.map(([sc, g]) => ({ scale: `${sc}`, rotate: `${gradi + g}deg`, easing: "steps(1, end)" })),
      { duration: FOTOGRAMMA * POSE_ATTACCA.length }
    );
    // Solo al montaggio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let fette: ReactNode = null;
  if (misure && misure.h > 0) {
    const { w, h } = misure;
    const s = h / POSTIT_A;
    const extra = w - POSTIT_L * s;
    if (extra <= 0.5) {
      fette = (
        <svg x={0} width={w} height={h} viewBox={`0 0 ${POSTIT_L} ${POSTIT_A}`} preserveAspectRatio="none" overflow="hidden">
          <Disegno colori={colori} />
        </svg>
      );
    } else {
      const a = FETTA_A * s;
      const mezzo = (FETTA_B - FETTA_A) * s + extra;
      fette = (
        <>
          <svg x={a - 0.5} width={mezzo + 1} height={h} viewBox={`${FETTA_A} 0 ${FETTA_B - FETTA_A} ${POSTIT_A}`} preserveAspectRatio="none" overflow="hidden">
            <Disegno colori={colori} />
          </svg>
          <svg x={0} width={a} height={h} viewBox={`0 0 ${FETTA_A} ${POSTIT_A}`} preserveAspectRatio="none" overflow="hidden">
            <Disegno colori={colori} />
          </svg>
          <svg x={a + mezzo} width={(POSTIT_L - FETTA_B) * s} height={h} viewBox={`${FETTA_B} 0 ${POSTIT_L - FETTA_B} ${POSTIT_A}`} preserveAspectRatio="none" overflow="hidden">
            <Disegno colori={colori} />
          </svg>
        </>
      );
    }
  }

  const stacca = () => {
    const el = nodo.current;
    if (!el || cade) return;
    staccati.add(seme);
    if (movimentoRidotto()) return setVia(true);
    setCade(true);
    const r = el.getBoundingClientRect();
    const verso = semeDa(seme) % 2 ? 1 : -1;
    el.animate(poseCaduta(window.innerHeight - r.top + 40, gradi, verso), {
      duration: FOTOGRAMMA * 12,
      fill: "forwards",
    }).onfinish = () => setVia(true);
  };

  if (via) return null;

  const Tag = onClick || staccabile ? "button" : "span";
  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        nodo.current = el;
        (ref as MutableRefObject<HTMLElement | null>).current = el;
      }}
      type={onClick || staccabile ? "button" : undefined}
      onClick={staccabile ? stacca : onClick}
      aria-label={staccabile ? "Ho letto, togli la nota" : undefined}
      className={cn(
        "relative isolate inline-block text-left font-[Shinjo,Outfit,sans-serif] tracking-[-0.02em] text-ink [font-synthesis:none]",
        MISURE[misura],
        onClick && "active:scale-95 transition-transform",
        cade && "pointer-events-none !z-50",
        className
      )}
      style={{
        rotate: `${gradi}deg`,
        ...(misura === "quadrato" ? { aspectRatio: `${POSTIT_L} / ${POSTIT_A}` } : { minWidth: minimo || undefined }),
        ...style,
      }}
    >
      {fette && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible">
          {fette}
        </svg>
      )}
      {children}
    </Tag>
  );
}
