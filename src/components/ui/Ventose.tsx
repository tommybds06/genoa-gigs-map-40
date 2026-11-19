import { cerchioImperfetto } from "@/lib/formaCerchio";
import { cn } from "@/lib/utils";

/**
 * IL CARICAMENTO: TRE VENTOSE (19 novembre) — al posto della rotellina
 * generica di lucide (`Loader2`), in tutta l'app.
 *
 * Il polpo entra nel brand per tracce, mai come personaggio (§30): il
 * tentacolo, le VENTOSE, l'inchiostro. Qui sono le ventose della P del logo,
 * tre in fila su un arco leggero (come lungo un tentacolo), che si accendono
 * una dopo l'altra. Tommaso: «solo questa, per tutto» — le attese lunghe
 * nell'app non ci sono, un tentacolo grande per caricare non serviva.
 *
 * - A SCATTI, come tutta la carta dell'app (la regola del movimento: la carta
 *   va a scatti, il dito va liscio): ogni ventosa resta accesa 250 ms, senza
 *   sfumare (`steps`). CSS in fondo a `index.css` («LE VENTOSE»).
 * - Cerchi IMPERFETTI, lo stesso tratto degli avatar (`cerchioImperfetto`).
 * - Colore `currentColor`: nel bottone prende il colore del testo del bottone.
 * - Misura: l'ALTEZZA la dà la classe (`h-4`, `h-8`…), la larghezza segue la
 *   proporzione (1,6:1). Un `w-…` passato da chi la usa viene ignorato: era
 *   la misura del cerchio della rotellina e schiaccerebbe la fila.
 * - Con «riduci movimento» restano ferme, a metà tinta.
 */

const D = 12; // diametro di una ventosa, in unità della tavola
const PUNTI: [number, number][] = [
  [8, 19],
  [26, 14],
  [44, 19],
];
const FORME = PUNTI.map((_, i) => cerchioImperfetto(D, `ventosa-${i}`));

export function Ventose({
  className,
  etichetta = "Caricamento in corso",
}: {
  className?: string;
  /** Per chi non vede. Vuota se il bottone dice già cosa sta succedendo. */
  etichetta?: string;
}) {
  return (
    <svg
      viewBox="0 0 52 32"
      role={etichetta ? "status" : undefined}
      aria-label={etichetta || undefined}
      aria-hidden={etichetta ? undefined : true}
      // `w-auto` DOPO la classe di chi la usa: vince sul suo `w-…`.
      className={cn("ventose inline-block h-4 shrink-0", className, "w-auto animate-none")}
      fill="currentColor"
    >
      {PUNTI.map(([x, y], i) => (
        <path key={i} className="ventosa" d={FORME[i]} transform={`translate(${x - D / 2} ${y - D / 2})`} />
      ))}
    </svg>
  );
}
