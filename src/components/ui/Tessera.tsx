import { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";
import { IndietroIcon } from "@/components/icons/uiIcons";

/**
 * LA TESSERA — il quadratino col margine tagliato che contiene un'icona
 * (Messaggi, Profilo, il mestiere). Nata nella scheda del lavoro del worker,
 * poi estesa al resto dell'app su richiesta di Tommaso.
 *
 * ⚠️ La forma viene da `.sagoma-tag` su un quadrato PICCOLO. Gli angoli del
 * disegno sono larghi 33 px: su 48–56 px non ci stanno (33 + 33 = 66), il
 * browser li riduce finché il quadrato è fatto solo dei quattro angoli, e il
 * risultato è il «sasso» arrotondato. Sopra i ~66 px compaiono i lati dritti
 * e diventa un'altra cosa (le tessere grandi dei ruoli in modifica profilo):
 * per questo le misure sono solo queste due.
 *
 * Colori: PIENO CHIARO del ruolo (arancio / blu pastello) con l'icona in
 * INCHIOSTRO — come i giorni selezionati nella scheda del lavoro.
 * ⚠️ Prima era fondo `accent` con l'icona nell'inchiostro del ruolo
 * (`#A7531B`): due arancioni nella stessa scheda, chiaro e scuro, e Tommaso
 * ha chiesto «tutto tono worker chiaro». L'arancio chiaro però non può stare
 * sull'icona (su accent fa ~1,6:1, sparisce): per questo si rovescia, il
 * chiaro va sul fondo e l'icona in inchiostro (6,45:1 su arancio, 4,41 su blu).
 */

type Icona = ComponentType<SVGProps<SVGSVGElement>>;

const MISURE = {
  md: { box: "h-12 w-12", icona: "h-6 w-6" },
  lg: { box: "h-14 w-14", icona: "h-8 w-8" },
};

/**
 * `evidenziata`: l'annuncio corrisponde alla ricerca o ai filtri della mappa
 * (Tommaso, 22 ottobre). Prende i colori del pin EVIDENZIATO sulla mappa —
 * l'inchiostro del ruolo (`primary-strong` #A7531B / `employer-800`) — pieno,
 * con l'icona color carta: così il legame «questo è quello che hai cercato»
 * si vede tra mappa e lista. Carta su #A7531B ≈ 4,7:1. Token e non `white`,
 * così in tema scuro si rovescia da sé.
 */
function useColoriTessera(evidenziata = false) {
  const { isEmployer } = useAppTheme();
  // Colori come variabili (index.css, «la gerarchia»): con la gerarchia
  // scura il pieno di ruolo diventa scuro e l'evidenza pastello.
  if (evidenziata)
    return cn(
      isEmployer ? "bg-[hsl(var(--evidenza-employer))]" : "bg-[hsl(var(--evidenza-worker))]",
      "text-[hsl(var(--su-evidenza))]"
    );
  return cn(isEmployer ? "bg-employer" : "bg-primary", "text-[hsl(var(--su-ruolo))]");
}

/** Solo il disegno, senza azione (es. l'icona del ruolo). */
export function TesseraIcona({
  icona: I,
  misura = "md",
  evidenziata = false,
  className,
}: {
  icona: Icona;
  misura?: keyof typeof MISURE;
  evidenziata?: boolean;
  className?: string;
}) {
  const colori = useColoriTessera(evidenziata);
  return (
    <div
      aria-hidden="true"
      className={cn("sagoma-tag flex shrink-0 items-center justify-center rounded-xl", MISURE[misura].box, colori, className)}
    >
      <I className={MISURE[misura].icona} />
    </div>
  );
}

/**
 * La tessera come BOTTONE. Con `didascalia` il nome sta sotto, visibile (es.
 * l'anteprima del profilo in chat); senza, solo l'icona con `etichetta` per
 * gli screen reader e il tooltip.
 */
export function Tessera({
  icona: I,
  etichetta,
  didascalia,
  onClick,
  disabled,
  misura = "md",
  classeIcona,
  type = "button",
  spenta = false,
}: {
  icona: Icona;
  etichetta: string;
  didascalia?: string;
  onClick?: () => void;
  disabled?: boolean;
  misura?: keyof typeof MISURE;
  /** Per esempio `animate-spin` sull'icona di caricamento. */
  classeIcona?: string;
  type?: "button" | "submit";
  /**
   * SPENTA: carta incavata e icona tenue, invece del pieno del ruolo al 40%.
   * Per il bottone d'invio a campo vuoto: l'arancio slavato sembrava un
   * bottone rotto, non uno che aspetta (Tommaso, 22 ottobre).
   */
  spenta?: boolean;
}) {
  const coloriRuolo = useColoriTessera();
  const colori = spenta ? "bg-paper-sunken text-ink-soft" : coloriRuolo;
  const disegno = (
    <span className={cn("sagoma-tag flex shrink-0 items-center justify-center rounded-xl", MISURE[misura].box, colori)}>
      <I className={cn(MISURE[misura].icona, classeIcona)} />
    </span>
  );
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={didascalia ? undefined : etichetta}
      title={etichetta}
      className={cn(
        "group flex shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95",
        !spenta && "disabled:opacity-40"
      )}
    >
      {disegno}
      {didascalia && <span className="text-xs text-muted-foreground">{didascalia}</span>}
    </button>
  );
}

/**
 * LA FRECCIA INDIETRO — una sola in tutta l'app, nella tessera, senza
 * scritta. Prima erano sei diverse: con e senza «Indietro», a cerchio, a
 * pillola, ghost, di misure diverse.
 */
export function TesseraIndietro({ onClick }: { onClick: () => void }) {
  return <Tessera icona={IndietroIcon} etichetta="Indietro" onClick={onClick} />;
}

