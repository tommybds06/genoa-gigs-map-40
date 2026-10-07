import { CSSProperties, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PiuIcon } from "@/components/icons/uiIcons";
import { useAuth } from "@/hooks/useAuth";
import { useCartellini } from "@/hooks/useCartellini";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/bacheca";
import { CartellinoCard, Iniziali } from "./CartellinoCard";
import { SchedaCartellino } from "./SchedaCartellino";
import { AggiungiCartellino } from "./AggiungiCartellino";

interface BachecaProps {
  /** La chat si apre nella stessa pagina (Messaggi), non con un cambio di URL. */
  onApriChat: (chatId: string) => void;
}

/**
 * LA BACHECA DELL'EMPLOYER — chi lavora con te, e chi stai provando.
 *
 * Due cartellini per riga, appesi con una puntina e un po' storti. L'ultimo
 * posto e' sempre il «+». Sotto, chiusa, la sezione dei conclusi: restano
 * consultabili ma non occupano la bacheca.
 */
export function Bacheca({ onApriChat }: BachecaProps) {
  const { user } = useAuth();
  const { data: cartellini = [], isLoading, error } = useCartellini(user?.id);
  const [apertoId, setApertoId] = useState<string | null>(null);
  const [aggiungi, setAggiungi] = useState(false);

  const attivi = cartellini.filter((c) => c.stato !== "concluso");
  const conclusi = cartellini.filter((c) => c.stato === "concluso");
  // La scheda legge dalla query, non da una copia: dopo un salvataggio o
  // un'assunzione mostra subito lo stato vero.
  const aperto = cartellini.find((c) => c.id === apertoId) ?? null;

  if (isLoading) {
    return (
      <div className="bacheca" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="cartellino-vuoto animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error("Bacheca:", error);
    return (
      <div className="material-card-elevated p-6 text-center">
        <h2 className="titolo-vuoto mb-2">Bacheca non disponibile</h2>
        <p className="text-sm text-muted-foreground">Non riesco a caricarla adesso. Riprova tra poco.</p>
      </div>
    );
  }

  return (
    <>
      {attivi.length === 0 && (
        <p className="mb-3 text-[15px] text-muted-foreground">
          Appendi qui chi lavora con te, o chi stai provando. Chi assumi in chat compare da solo.
        </p>
      )}

      <div className="bacheca">
        {attivi.map((c) => (
          <CartellinoCard key={c.id} c={c} onClick={() => setApertoId(c.id)} />
        ))}

        <button
          type="button"
          onClick={() => setAggiungi(true)}
          className="cartellino-vuoto flex flex-col items-center justify-center gap-2 text-muted-foreground touch-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
          style={{ "--storto": attivi.length % 2 === 0 ? "-0.8deg" : "1deg" } as CSSProperties}
        >
          <PiuIcon className="h-7 w-7" />
          <span className="font-[Shinjo,Outfit,sans-serif] text-[17px] tracking-[-0.04em] [font-synthesis:none]">
            Aggiungi
          </span>
        </button>
      </div>

      {conclusi.length > 0 && (
        <Collapsible className="mt-8">
          <CollapsibleTrigger className="group linea-divisoria-sopra flex w-full items-center justify-between pt-4 text-left">
            <span className="titolo-mini">Conclusi · {conclusi.length}</span>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2">
              {conclusi.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setApertoId(c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 py-2.5 text-left active:bg-accent/40",
                      i > 0 && "linea-divisoria-sopra"
                    )}
                  >
                    <div className="sagoma-foto h-10 w-10 shrink-0 overflow-hidden bg-paper-sunken">
                      {c.foto ? (
                        <img src={c.foto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Iniziali nome={c.nome} className="text-sm" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{c.nome}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {c.mestiere}
                        {c.dataInizio && ` · dal ${formatData(c.dataInizio)}`}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      <SchedaCartellino
        cartellino={aperto}
        onClose={() => setApertoId(null)}
        onApriChat={(id) => {
          setApertoId(null);
          onApriChat(id);
        }}
      />
      <AggiungiCartellino aperto={aggiungi} onClose={() => setAggiungi(false)} />
    </>
  );
}
