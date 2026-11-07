import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { TesseraIcona } from "@/components/ui/Tessera";
import { NotificheIcon } from "@/components/icons/uiIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { canaleAttivo, installata, suIos } from "@/lib/notifiche/canale";
import { EVENTO_PERMESSO, rimandaPermesso, type MotivoPermesso } from "@/lib/notifiche/permesso";
import { toast } from "sonner";

const TESTI: Record<MotivoPermesso, { titolo: string; riga: string }> = {
  candidatura: {
    titolo: "Vuoi sapere subito se ti scelgono?",
    riga: "Ti avvisiamo quando un'attività ti sceglie o ti scrive, anche con l'app chiusa.",
  },
  annuncio: {
    titolo: "Vuoi sapere subito chi si candida?",
    riga: "Ti avvisiamo quando qualcuno si candida al tuo annuncio o ti scrive, anche con l'app chiusa.",
  },
};

/**
 * La scheda che chiede il permesso delle notifiche (vedi lib/notifiche/
 * permesso.ts). Montata una volta in App. Il permesso del browser parte
 * SOLO dal bottone: è il gesto dell'utente che lo rende possibile su iPhone.
 */
export function ChiediPermesso() {
  const { theme } = useAppTheme();
  const [motivo, setMotivo] = useState<MotivoPermesso | null>(null);
  const [inCorso, setInCorso] = useState(false);
  const daInstallare = suIos() && !installata();

  useEffect(() => {
    const ascolta = (e: Event) => setMotivo((e as CustomEvent<MotivoPermesso>).detail);
    window.addEventListener(EVENTO_PERMESSO, ascolta);
    return () => window.removeEventListener(EVENTO_PERMESSO, ascolta);
  }, []);

  const chiudi = (rimanda: boolean) => {
    if (rimanda) rimandaPermesso();
    setMotivo(null);
  };

  const attiva = async () => {
    setInCorso(true);
    const esito = await canaleAttivo.attiva();
    setInCorso(false);
    chiudi(esito !== "concesso");
    if (esito === "concesso") toast.success("Notifiche attive", { duration: 1900 });
    else if (esito === "negato")
      toast("Le notifiche sono bloccate", { description: "Si riattivano dalle impostazioni del browser.", duration: 3000 });
  };

  const t = motivo ? TESTI[motivo] : TESTI.candidatura;

  return (
    <Drawer open={motivo !== null} onOpenChange={(o) => !o && chiudi(true)}>
      <DrawerContent>
        <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="flex flex-col items-center gap-3 p-0 pt-2 text-center">
            <TesseraIcona icona={NotificheIcon} misura="lg" />
            <DrawerTitle className="titolo-sezione text-2xl font-normal">{t.titolo}</DrawerTitle>
            <DrawerDescription className="text-[15px] text-ink-soft">{t.riga}</DrawerDescription>
          </DrawerHeader>

          {daInstallare ? (
            <>
              {/* Su iPhone il push c'è solo con l'app sulla schermata Home. */}
              <p className="mt-4 rounded-xl bg-paper-sunken p-3 text-center text-sm text-ink">
                Su iPhone le notifiche arrivano solo se aggiungi Politask alla schermata Home: tocca{" "}
                <Share className="inline h-4 w-4 -translate-y-0.5" aria-label="Condividi" /> in basso e poi
                «Aggiungi a schermata Home».
              </p>
              <Button size="lg" className={`mt-5 w-full ${theme.btnFilled}`} onClick={() => chiudi(true)}>
                Ho capito
              </Button>
            </>
          ) : (
            <div className="mt-6 flex flex-col gap-2">
              <Button size="lg" className={`w-full ${theme.btnFilled}`} onClick={attiva} disabled={inCorso}>
                Attiva le notifiche
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={() => chiudi(true)}>
                Non ora
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
