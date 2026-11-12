import { Reply, Copy } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useUltimoAperto } from "@/hooks/useUltimoAperto";
import { eSegnaposto, etichettaMessaggio } from "@/lib/allegati";
import type { Messaggio } from "@/hooks/useMessaggi";

/**
 * IL MENU DI UN MESSAGGIO — tenendolo premuto (12 novembre).
 *
 * Una scheda dal basso, non una nuvoletta accanto alla bolla: le azioni
 * stanno sotto il pollice, hanno bersagli da 48 px e la scheda è la stessa di
 * tutto il resto dell'app. In cima il messaggio in una riga, per sapere su
 * quale si sta agendo.
 * - **Rispondi** — come il trascinamento verso destra, per chi non lo conosce.
 * - **Copia** — solo se c'è del testo scritto (non il segnaposto di una foto).
 *
 * Resta montata con l'ultimo messaggio (`useUltimoAperto`): chiudendo scende
 * invece di sparire (§16). `z-[70]`: sopra la chat aperta.
 * Le icone sono di lucide: per «rispondi» e «copia» non abbiamo un disegno (§21).
 */
export function MenuMessaggio({
  messaggio,
  mio,
  nomeAltro,
  onChiudi,
  onRispondi,
}: {
  messaggio: Messaggio | null;
  mio: boolean;
  nomeAltro: string;
  onChiudi: () => void;
  onRispondi: (m: Messaggio) => void;
}) {
  const [m, aperto] = useUltimoAperto(messaggio);
  if (!m) return null;
  const haTesto = !!m.content && !eSegnaposto(m.content);

  const copia = async () => {
    onChiudi();
    try {
      await navigator.clipboard.writeText(m.content);
      toast.success("Copiato", { duration: 1500 });
    } catch {
      toast.error("Non sono riuscito a copiare", { duration: 1900 });
    }
  };

  const riga = "flex h-12 w-full items-center gap-3 text-left text-[16px] active:opacity-60";

  return (
    <Drawer open={aperto} onOpenChange={(o) => !o && onChiudi()}>
      <DrawerContent className="z-[70]" overlayClassName="z-[70]">
        <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="p-0 pb-2 text-left">
            <DrawerTitle className="text-[13px] font-normal tracking-normal text-ink-soft [font-family:inherit]">
              {mio ? "Tu" : nomeAltro}
            </DrawerTitle>
            <DrawerDescription className="line-clamp-2 text-[15px] text-ink">{etichettaMessaggio(m)}</DrawerDescription>
          </DrawerHeader>
          <button
            type="button"
            className={`${riga} linea-divisoria-sottile`}
            onClick={() => {
              onChiudi();
              onRispondi(m);
            }}
          >
            <Reply className="h-5 w-5 text-ink-soft" />
            Rispondi
          </button>
          {haTesto && (
            <button type="button" className={`${riga} linea-divisoria-sottile`} onClick={copia}>
              <Copy className="h-5 w-5 text-ink-soft" />
              Copia
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
