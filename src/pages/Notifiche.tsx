import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TesseraIcona, TesseraIndietro } from "@/components/ui/Tessera";
import { NotificheIcon } from "@/components/icons/uiIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNotifiche } from "@/hooks/useNotifiche";
import { apriNotifica } from "@/lib/notifiche/link";
import { iconaNotifica } from "@/lib/notifiche/icone";
import { quandoArrivata, type Notifica } from "@/lib/notifiche/notifiche";
import { chiaveGiorno, etichettaGiorno, oraMessaggio } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * IL CENTRO NOTIFICHE (5 novembre 2026) — tutte, lette e non lette, dalla
 * più recente, divise per giorno come la chat («Oggi», «Ieri», «lunedì»,
 * poi la data). Toccandone una si segna letta e si va dove dice
 * (`apriNotifica`: chat, annuncio, candidature, recensione…).
 *
 * Righe piatte, non card, come la lista delle chat: sono avvisi da scorrere,
 * non oggetti da scegliere. Una non letta: tessera nel pieno del ruolo,
 * titolo in grassetto e il pallino; letta: tessera incavata e tenue.
 */
const Notifiche = () => {
  const navigate = useNavigate();
  const { isEmployer } = useAppTheme();
  const { notifiche, nonLette, caricate, segnaLetta, segnaTutteLette } = useNotifiche();

  const giorni = useMemo(() => {
    const gruppi: { chiave: string; etichetta: string; righe: Notifica[] }[] = [];
    for (const n of notifiche) {
      const quando = quandoArrivata(n);
      const k = chiaveGiorno(quando);
      const ultimo = gruppi[gruppi.length - 1];
      if (ultimo?.chiave === k) ultimo.righe.push(n);
      else gruppi.push({ chiave: k, etichetta: etichettaGiorno(quando), righe: [n] });
    }
    return gruppi;
  }, [notifiche]);

  const apri = (n: Notifica) => {
    if (!n.letta_il) segnaLetta(n.id);
    apriNotifica(n, navigate);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background px-4 pb-3 pt-8">
        <div className="flex items-center gap-3">
          <TesseraIndietro onClick={() => navigate(-1)} />
          <h1 className="titolo-sezione min-w-0 flex-1 truncate text-2xl">Notifiche</h1>
          {nonLette > 0 && (
            <button
              type="button"
              onClick={segnaTutteLette}
              className={cn(
                "shrink-0 py-2 text-sm font-semibold transition-opacity active:opacity-60",
                isEmployer ? "text-employer-800" : "text-primary-strong"
              )}
            >
              Segna tutte come lette
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-8">
        {caricate && notifiche.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="material-card-elevated max-w-sm p-8 text-center">
              <TesseraIcona icona={NotificheIcon} misura="lg" className="mx-auto mb-4" />
              <h2 className="titolo-vuoto mb-2">Nessuna notifica</h2>
              <p className="text-sm text-muted-foreground">
                {isEmployer
                  ? "Qui troverai le candidature, i messaggi e gli avvisi sui tuoi annunci."
                  : "Qui troverai chi ti sceglie, i messaggi e i lavori in evidenza vicino a te."}
              </p>
            </div>
          </div>
        ) : (
          giorni.map((g) => (
            <section key={g.chiave} className="mb-2">
              <h2 className="titolo-mini pb-1 pt-3 first-letter:uppercase">{g.etichetta}</h2>
              {g.righe.map((n) => {
                const nuova = !n.letta_il;
                const Icona = iconaNotifica(n.tipo);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => apri(n)}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors active:bg-accent/50"
                  >
                    <TesseraIcona icona={Icona} className={nuova ? undefined : "bg-paper-sunken text-ink-soft"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className={cn("min-w-0 flex-1 text-[15px] leading-snug text-ink", nuova ? "font-bold" : "font-medium")}>
                          {n.titolo}
                        </p>
                        <span className="shrink-0 text-xs text-ink-soft">{oraMessaggio(quandoArrivata(n))}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="line-clamp-2 min-w-0 flex-1 text-sm text-ink-soft">{n.testo}</p>
                        {nuova && (
                          <span
                            aria-label="Da leggere"
                            className={cn("h-2.5 w-2.5 shrink-0 rounded-full", isEmployer ? "bg-employer-700" : "bg-primary-strong")}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>
          ))
        )}
      </main>
    </div>
  );
};

export default Notifiche;
