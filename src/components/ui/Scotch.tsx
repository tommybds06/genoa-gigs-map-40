import type { CSSProperties } from "react";
import { PEZZI_SCOTCH, type NomeScotch } from "@/components/icons/scotch";
import { useAppTheme } from "@/hooks/useAppTheme";

/**
 * UN PEZZO DI SCOTCH — i disegni di Tommaso (`icons/scotch.tsx`), messi su un
 * bordo dell'oggetto che tengono. Va dentro un genitore `relative`: le
 * posizioni sono riferite al SUO riquadro.
 *
 * Usato da `Foglietto` (le card, dove il genitore è uno span alto zero sul
 * bordo alto), da `FotoStampata` (le foto) e dall'avatar del profilo pubblico.
 *
 * Semitrasparente ma DISEGNATO (Tommaso): il pastello del ruolo velato, con
 * il contorno nel suo inchiostro. Il pastello qui è decorazione, non testo:
 * può stare anche nella gerarchia scura, anzi è lì che porta il gioco.
 */

/**
 * Dove sta il pezzo.
 * - `centro`, `sopraSx`, `sopraDx`: sul bordo ALTO, quasi dritti. Sono le
 *   posizioni di serie (Tommaso, 23 ottobre: «troppo incasinato»).
 * - `sx`, `dx`, `sxBasso`, `dxBasso`: in diagonale sugli angoli. Escono dalla
 *   sagoma dell'oggetto e pesano molto: per ora non li usa nessuno.
 */
export type LatoScotch = "centro" | "sopraSx" | "sopraDx" | "sx" | "dx" | "sxBasso" | "dxBasso";

/** Dove cadono `sopraSx` / `sopraDx` lungo il bordo alto. */
export const SOPRA_SX = "22%";
export const SOPRA_DX = "78%";

export interface StrisciaScotch {
  pezzo: NomeScotch;
  lato: LatoScotch;
}

/* Dove sta il centro dello scotch sugli angoli, dal bordo (a scala 1).
   ⚠️ Misurato a 390 px: conta l'INGOMBRO del pezzo in diagonale (~55 px di
   largo), non il centro. A 10 px dentro arrivava a 0 dal bordo dello
   schermo, a 14 a 3; a 18 resta a ~7. Alzato a 6 px perché, spinto dentro,
   non copra l'icona del titolo. */
export const DENTRO_X = 18;
export const DENTRO_Y = 6;

export function numeroDa(testo: string): number {
  let h = 0;
  for (let i = 0; i < testo.length; i++) h = (h * 31 + testo.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function stile(striscia: StrisciaScotch, seme: number, scala: number): CSSProperties {
  const p = PEZZI_SCOTCH[striscia.pezzo];
  // Inclinazione: storta di poco al centro, in diagonale sugli angoli
  // (perpendicolare alla diagonale dell'angolo), mai due volte uguale.
  const scarto = (seme % 5) - 2;
  const { lato } = striscia;
  const gradi =
    lato === "centro"
      ? scarto * 1.2
      : lato === "sopraSx"
        ? -4 + scarto * 0.8
        : lato === "sopraDx"
          ? 4 - scarto * 0.8
          : lato === "sx" || lato === "dxBasso"
            ? -38 + scarto
            : 38 - scarto;
  const x = DENTRO_X * scala;
  const y = DENTRO_Y * scala;
  const basso = lato === "sxBasso" || lato === "dxBasso";
  const sinistra = lato === "sx" || lato === "sxBasso";
  const sopra = lato === "centro" || lato === "sopraSx" || lato === "sopraDx";
  return {
    position: "absolute",
    width: p.larghezza * scala,
    height: p.altezza * scala,
    top: sopra ? 0 : basso ? `calc(100% - ${y}px)` : y,
    left:
      lato === "centro"
        ? "50%"
        : lato === "sopraSx"
          ? SOPRA_SX
          : lato === "sopraDx"
            ? SOPRA_DX
            : sinistra
              ? x
              : `calc(100% - ${x}px)`,
    transform: `translate(-50%, -50%) rotate(${gradi}deg)`,
    overflow: "visible",
    pointerEvents: "none",
  };
}

export function Scotch({
  pezzo,
  lato,
  seme,
  employer,
  scala = 1,
}: StrisciaScotch & {
  /** Per variare l'inclinazione, sempre uguale per lo stesso oggetto. */
  seme: number;
  /** Il ruolo del PROFILO mostrato. Di serie quello di chi guarda. */
  employer?: boolean;
  /** Sulle foto piccole i pezzi si rimpiccioliscono, posizioni comprese. */
  scala?: number;
}) {
  const { isEmployer } = useAppTheme();
  const blu = employer ?? isEmployer;
  const p = PEZZI_SCOTCH[pezzo];
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${p.larghezza} ${p.altezza}`} style={stile({ pezzo, lato }, seme, scala)}>
      <path
        d={p.d}
        fill={blu ? "hsl(var(--brand-blue) / 0.5)" : "hsl(var(--brand-orange) / 0.5)"}
        stroke={blu ? "hsl(var(--brand-blue-ink) / 0.75)" : "hsl(var(--brand-orange-ink) / 0.75)"}
        strokeWidth={1.1}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
