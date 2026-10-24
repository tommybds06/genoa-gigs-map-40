import { useState } from "react";
import { MessaggiIcon, MezzaStellaIcon, StellaIcon, StellaVuotaIcon } from "@/components/icons/uiIcons";
import { formatTempoTrascorso } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Recensione } from "@/hooks/useRecensioni";

/** Quante se ne vedono all'inizio, e quante se ne aggiungono a ogni tocco. */
const PASSO = 3;

/**
 * L'ELENCO DELLE RECENSIONI di un'attività (Tommaso, 24 ottobre): le ultime
 * tre, poi «Mostra altre» ne aggiunge tre alla volta. Con tutte in fila il
 * profilo pubblico di un'attività recensita diventava un lungo scorrimento.
 * Lo stesso elenco sta nel proprio profilo dell'employer, che prima le sue
 * recensioni non poteva vederle.
 *
 * Solo il contenuto: la card, il titolo e lo scotch li mette chi lo usa.
 */
export function RecensioniRicevute({
  recensioni,
  vuoto = "Nessuna recensione ancora",
}: {
  recensioni: Recensione[];
  /** Il testo quando non ce n'è nessuna. */
  vuoto?: string;
}) {
  const [visibili, setVisibili] = useState(PASSO);

  if (recensioni.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessaggiIcon className="mb-2 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{vuoto}</p>
      </div>
    );
  }

  const mostrate = recensioni.slice(0, visibili);
  const restanti = recensioni.length - mostrate.length;
  const prossime = Math.min(PASSO, restanti);

  return (
    <div>
      {/* La linea disegnata sottile, come gli annunci: due separatori diversi
          nella stessa schermata non vanno. */}
      {mostrate.map((review, i) => (
        <div key={review.id} className={cn("pb-4 last:pb-0", i > 0 && "linea-divisoria-sottile pt-4")}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{review.worker_name}</span>
            <div className="flex items-center gap-1" aria-label={`${review.rating} su 5`}>
              {[1, 2, 3, 4, 5].map((star) => {
                const Stella =
                  star <= review.rating
                    ? StellaIcon
                    : review.rating >= star - 0.5
                      ? MezzaStellaIcon
                      : StellaVuotaIcon;
                return <Stella key={star} className="h-3.5 w-3.5 text-employer-800" />;
              })}
            </div>
          </div>
          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
          <p className="mt-1 text-xs text-muted-foreground/60">{formatTempoTrascorso(review.created_at)}</p>
        </div>
      ))}

      {recensioni.length > PASSO && (
        <button
          type="button"
          onClick={() => setVisibili(restanti > 0 ? visibili + PASSO : PASSO)}
          className="linea-divisoria-sottile flex min-h-[44px] w-full items-center justify-center pt-2 text-sm font-semibold text-employer-800"
        >
          {restanti > 0
            ? prossime === 1
              ? "Mostra un'altra recensione"
              : `Mostra altre ${prossime} recensioni`
            : "Mostra meno"}
        </button>
      )}
    </div>
  );
}
