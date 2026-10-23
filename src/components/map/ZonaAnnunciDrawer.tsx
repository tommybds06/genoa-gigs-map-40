import { useMemo } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useUser } from "@/contexts/UserContext";
import { JobsList } from "@/pages/Lista";
import type { Job } from "@/hooks/useJobs";

interface ZonaAnnunciDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  annunci: Job[];
  onJobSelect: (job: Job) => void;
  /**
   * Gli annunci che corrispondono alla ricerca o ai filtri della mappa, se
   * ce n'è una attiva: vanno IN CIMA, con la tessera evidenziata.
   */
  evidenziati?: Set<string>;
}

/**
 * LA LISTA DI UNA ZONA — si apre toccando un pin con la valigetta.
 *
 * Le card sono quelle della Lista (`JobsList`): è lo stesso oggetto, quindi si
 * presenta allo stesso modo — mestiere, titolo, zona, paga a destra. Toccando
 * un annuncio la lista si chiude e si apre la scheda, come dal drawer di un
 * locale con più annunci.
 *
 * Titolo: il quartiere se gli annunci sono tutti nello stesso, se no «In
 * questa zona». Ordine: dal più recente, come la Lista.
 */
export function ZonaAnnunciDrawer({ isOpen, onClose, annunci, onJobSelect, evidenziati }: ZonaAnnunciDrawerProps) {
  const { isEmployer } = useUser();
  /* Prima chi corrisponde alla ricerca, poi gli altri; dentro ciascun gruppo
     resta l'ordine di arrivo (dal più recente). `sort` è stabile. */
  const ordinati = useMemo(
    () =>
      evidenziati && evidenziati.size > 0
        ? [...annunci].sort((a, b) => Number(evidenziati.has(b.id)) - Number(evidenziati.has(a.id)))
        : annunci,
    [annunci, evidenziati]
  );
  if (annunci.length === 0) return null;

  const quartieri = new Set(annunci.map((j) => j.neighborhood).filter(Boolean));
  const titolo = quartieri.size === 1 ? [...quartieri][0]! : "In questa zona";

  const scegli = (job: Job) => {
    onClose();
    // Lascia finire la chiusura della lista prima di aprire la scheda: due
    // drawer vaul che si animano insieme si contendono il fuoco.
    setTimeout(() => onJobSelect(job), 150);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="flex max-h-[calc(85vh-28px)] min-h-0 flex-col">
          {/* ⚠️ Misure ripetute come utility: DrawerTitle porta di suo
              `text-lg leading-none font-semibold` (§15). */}
          <DrawerHeader className="shrink-0 gap-0.5 p-0 px-4 pb-3 text-left">
            <DrawerTitle className="titolo-sezione text-2xl font-normal leading-[1.9375rem] tracking-[-0.05em]">
              {titolo}
            </DrawerTitle>
            <DrawerDescription className="text-[14px]">
              {annunci.length} annunci
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
            {/* Quartiere unico → è già nel titolo: sotto ogni annuncio, chi lo offre. */}
            <JobsList
              jobs={ordinati}
              loading={false}
              isEmployer={isEmployer}
              hasTags
              onJobClick={scegli}
              sottoTitolo={quartieri.size === 1 ? "attivita" : "zona"}
              evidenziati={evidenziati}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
