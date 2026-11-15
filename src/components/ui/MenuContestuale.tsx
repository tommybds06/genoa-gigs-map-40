import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScheda } from "@/hooks/useScheda";
import { cn } from "@/lib/utils";

/**
 * IL MENU DELLA PRESSIONE LUNGA — accanto a ciò che si è premuto (15 novembre).
 *
 * Prima la pressione lunga (su una chat, su un messaggio) apriva una SCHEDA
 * DAL BASSO con le righe divise dalla linea disegnata. Tommaso: «ripetitiva,
 * imita una gestualità già vista molto nell'app». Ed era anche peggio come
 * gesto: la scheda copriva la cosa premuta, e per sapere su cosa si agiva la
 * testata ripeteva nome e titolo.
 *
 * Ora è il menu contestuale di iOS, Telegram, Instagram: la cosa premuta
 * resta CHIARA (un buco nel velo, `clip-path` con `evenodd`), il resto si
 * scurisce, e un foglietto con le azioni compare subito sotto (o sopra, se
 * sotto non c'è posto). Niente intestazione: si vede già cosa si è premuto.
 *
 * - Il foglietto è una `.material-card`: la carta col margine a mano.
 * - Righe da 48 px, icona da 20 in inchiostro, nessuna linea fra le righe.
 * - Chiude: tocco fuori (anche sulla cosa premuta), tasto Esc, la pagina che
 *   smette di essere attiva. Entra scalando dal lato della cosa premuta
 *   (160 ms), esce sfumando (110 ms); fermo con «riduci movimento».
 * - Animazioni native: dentro le pagine framer non anima gli ingressi (§12).
 * - `z-[80]`: sopra la chat e le sue schede.
 * - ⚠️ Il dito che si ALZA dalla pressione lunga genera un `click`, e cade
 *   su ciò che c'è sotto in quel momento: il velo appena comparso (che lo
 *   prendeva per «tocco fuori» e richiudeva il menu all'istante) o una voce,
 *   se il foglietto è finito sotto il dito. Valgono solo i tocchi COMINCIATI
 *   dopo l'apertura (`toccatoDopo`).
 */
export interface VoceMenu {
  chiave: string;
  testo: string;
  icona: ReactNode;
  onScegli: () => void;
}

export interface AncoraMenu {
  /** Il rettangolo della cosa premuta, in coordinate dello schermo. */
  rett: DOMRect;
  /** Da che lato allineare il foglietto. */
  lato: "sx" | "dx";
  /** Raggio del buco nel velo. */
  raggio?: number;
}

const MARGINE = 16;
const STACCO = 8;
const LARGHEZZA = 232;
const fermo = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Il velo con un buco a rettangolo arrotondato sulla cosa premuta. */
function bucoNelVelo(r: DOMRect, raggio: number) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const x = Math.max(0, r.left - 4);
  const y = r.top - 4;
  const w = Math.min(W, r.right + 4) - x;
  const h = r.height + 8;
  const k = Math.min(raggio, w / 2, h / 2);
  return `path(evenodd, "M0 0H${W}V${H}H0Z M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z")`;
}

export function MenuContestuale({
  ancora,
  voci,
  onChiudi,
}: {
  ancora: AncoraMenu | null;
  voci: VoceMenu[];
  onChiudi: () => void;
}) {
  const { attiva } = useScheda();
  // Resta montato con l'ultima àncora finché non ha finito di sfumare.
  const [mostrato, setMostrato] = useState<{ ancora: AncoraMenu; voci: VoceMenu[] } | null>(null);
  const velo = useRef<HTMLDivElement>(null);
  const foglio = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; sotto: boolean } | null>(null);
  const toccatoDopo = useRef(false);

  useLayoutEffect(() => {
    if (ancora) {
      toccatoDopo.current = false;
      setMostrato({ ancora, voci });
      setPos(null);
      return;
    }
    if (!mostrato) return;
    const el = foglio.current;
    const v = velo.current;
    if (!el || !v || fermo()) {
      setMostrato(null);
      return;
    }
    const opz = { duration: 110, easing: "ease-in", fill: "forwards" as const };
    v.animate([{ opacity: 1 }, { opacity: 0 }], opz);
    el.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.96)" }], opz).onfinish = () => setMostrato(null);
    // `voci` cambia a ogni disegno del genitore: conta solo l'àncora.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancora]);

  // Posizione: misurato il foglietto, sotto la cosa premuta se ci sta, se no sopra.
  useLayoutEffect(() => {
    const el = foglio.current;
    if (!mostrato || !el || pos) return;
    const { rett, lato } = mostrato.ancora;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    const sotto = rett.bottom + STACCO + h <= H - MARGINE;
    const sopra = rett.top - STACCO - h >= MARGINE;
    const top = sotto ? rett.bottom + STACCO : sopra ? rett.top - STACCO - h : H - MARGINE - h;
    const desiderato = lato === "dx" ? rett.right - w : rett.left;
    const left = Math.min(Math.max(desiderato, MARGINE), W - MARGINE - w);
    setPos({ top, left, sotto: sotto || !sopra });
  }, [mostrato, pos]);

  // L'ingresso, una volta posizionato.
  useLayoutEffect(() => {
    if (!pos || !foglio.current || !velo.current || fermo()) return;
    velo.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
    foglio.current.animate([{ opacity: 0, transform: "scale(0.9)" }, { opacity: 1, transform: "none" }], {
      duration: 160,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
  }, [pos]);

  useEffect(() => {
    if (!ancora) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onChiudi();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [ancora, onChiudi]);

  useEffect(() => {
    if (!attiva && ancora) onChiudi();
  }, [attiva, ancora, onChiudi]);

  if (!mostrato) return null;
  const { rett, lato, raggio = 16 } = mostrato.ancora;
  const chiudendo = !ancora;

  return createPortal(
    <div
      className="fixed inset-0 z-[80]"
      onPointerDownCapture={() => {
        toccatoDopo.current = true;
      }}
    >
      {/* Chi raccoglie il tocco fuori: tutto lo schermo, buco compreso. */}
      <div
        className="absolute inset-0"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => toccatoDopo.current && !chiudendo && onChiudi()}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        ref={velo}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-ink/35"
        style={{ clipPath: bucoNelVelo(rett, raggio) }}
      />
      <div
        ref={foglio}
        role="menu"
        className="material-card absolute overflow-hidden bg-card py-1.5"
        style={{
          width: LARGHEZZA,
          top: pos?.top ?? -9999,
          left: pos?.left ?? 0,
          transformOrigin: `${lato === "dx" ? "right" : "left"} ${pos?.sotto === false ? "bottom" : "top"}`,
        }}
      >
        {mostrato.voci.map((v) => (
          <button
            key={v.chiave}
            type="button"
            role="menuitem"
            onClick={() => {
              if (!toccatoDopo.current || chiudendo) return;
              onChiudi();
              v.onScegli();
            }}
            className={cn(
              "flex h-12 w-full items-center gap-3 px-4 text-left text-[16px] text-ink transition-colors active:bg-accent"
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">{v.icona}</span>
            {v.testo}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
