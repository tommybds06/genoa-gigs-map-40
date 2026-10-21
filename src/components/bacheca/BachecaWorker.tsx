import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnnunciVuotaIcon } from "@/components/icons/uiIcons";
import { apriRecensione } from "@/lib/recensione";
import { useAuth } from "@/hooks/useAuth";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLavoriWorker, type LavoroWorker } from "@/hooks/useLavoriWorker";
import { cn } from "@/lib/utils";
import { TesseraIcona } from "@/components/ui/Tessera";
import { LavoroCard } from "./LavoroCard";
import { SagomaNegozio } from "./SagomaNegozio";
import { SchedaLavoro } from "./SchedaLavoro";

interface BachecaWorkerProps {
  /** La chat si apre nella stessa pagina (Messaggi), non con un cambio di URL. */
  onApriChat: (chatId: string) => void;
}

/**
 * LA BACHECA DEL WORKER — i lavori in cui è stato preso.
 *
 * Solo quelli che un employer ha appeso alla SUA bacheca (in prova o
 * assunto): le candidature restano in Lista → Candidature. Gli stati si
 * leggono dagli stessi dati che l'employer modifica (lib/bacheca.ts,
 * `statoLavoro`). Due per riga come quella dell'employer; niente puntine e
 * niente «Aggiungi»: da qui il worker non appende niente.
 *
 * Tocco: apre la SCHEDA del lavoro (SchedaLavoro) con tutte le informazioni;
 * da lì la tessera Messaggi apre la chat con l'attività, e «Recensisci» la
 * recensione (la stessa finestra di ReviewPrompt). Prima il tocco apriva la
 * chat direttamente: bocciato, la chat è già a una scheda di distanza.
 */
export function BachecaWorker({ onApriChat }: BachecaWorkerProps) {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const navigate = useNavigate();
  const { data: lavori = [], isLoading, error } = useLavoriWorker(user?.id);
  const [apertoId, setApertoId] = useState<string | null>(null);
  // Dalla query, non da una copia: dopo una recensione lo stato è quello vero.
  const aperto = lavori.find((l) => l.id === apertoId) ?? null;

  if (isLoading) {
    return (
      <div className="bacheca" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="cartellino animate-pulse">
            <SagomaNegozio seme={`attesa-${i}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    console.error("Bacheca worker:", error);
    return (
      <div className="material-card-elevated p-6 text-center">
        <h2 className="titolo-vuoto mb-2">Bacheca non disponibile</h2>
        <p className="text-sm text-muted-foreground">Non riesco a caricarla adesso. Riprova tra poco.</p>
      </div>
    );
  }

  if (lavori.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="material-card-elevated max-w-sm p-8 text-center">
          <TesseraIcona icona={AnnunciVuotaIcon} misura="lg" className="mx-auto mb-4" />
          <h2 className="titolo-vuoto mb-2">Ancora nessun lavoro</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Qui troverai i lavori in cui sei stato preso. Intanto, guarda cosa c'è vicino a te.
          </p>
          <Button className={cn("w-full", theme.btnFilled, theme.btnFilledHover)} onClick={() => navigate("/")}>
            Vai alla mappa
          </Button>
        </div>
      </div>
    );
  }

  const recensisci = (l: LavoroWorker) => {
    // Prima si chiude la scheda: la recensione è un Dialog, non le va sopra.
    setApertoId(null);
    apriRecensione({
      applicationId: l.applicationId,
      jobId: l.jobId,
      employerId: l.employerId,
      employerName: l.attivita,
      jobTitle: l.ruolo,
    });
  };

  return (
    <>
      <div className="bacheca">
        {lavori.map((l) => (
          <LavoroCard key={l.id} l={l} onClick={() => setApertoId(l.id)} />
        ))}
      </div>
      <SchedaLavoro
        lavoro={aperto}
        onClose={() => setApertoId(null)}
        onApriChat={(id) => {
          setApertoId(null);
          onApriChat(id);
        }}
        onRecensisci={recensisci}
      />
    </>
  );
}
