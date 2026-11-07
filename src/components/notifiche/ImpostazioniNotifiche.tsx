import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { NotificheIcon, MessaggiIcon, MappaIcon, CalendarioIcon, OrologioIcon } from "@/components/icons/uiIcons";
import { GenericoIcon } from "@/components/icons/roleIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useUser } from "@/contexts/UserContext";
import { usePreferenzeNotifiche, type CategoriaNotifiche } from "@/hooks/usePreferenzeNotifiche";
import { canaleAttivo, installata, suIos, type StatoPermesso } from "@/lib/notifiche/canale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Voce {
  categoria: CategoriaNotifiche;
  titolo: string;
  riga: string;
  icona: ComponentType<SVGProps<SVGSVGElement>>;
}

const VOCI_WORKER: Voce[] = [
  { categoria: "candidature", titolo: "Candidature e selezioni", riga: "Quando un'attività ti sceglie, e com'è andato un lavoro", icona: GenericoIcon },
  { categoria: "messaggi", titolo: "Messaggi", riga: "Quando qualcuno ti scrive in chat", icona: MessaggiIcon },
  { categoria: "vicini", titolo: "Lavori in evidenza vicino a te", riga: "Annunci del tuo ruolo entro 2 km, al massimo 2 al giorno", icona: MappaIcon },
  { categoria: "promemoria", titolo: "Promemoria dei lavori", riga: "La sera prima del primo giorno di lavoro", icona: CalendarioIcon },
];
const VOCI_EMPLOYER: Voce[] = [
  { categoria: "candidature", titolo: "Candidature e selezioni", riga: "Quando qualcuno si candida ai tuoi annunci", icona: GenericoIcon },
  { categoria: "messaggi", titolo: "Messaggi", riga: "Quando qualcuno ti scrive in chat", icona: MessaggiIcon },
  { categoria: "scadenze", titolo: "Scadenze e stato degli annunci", riga: "Annunci in scadenza o scaduti, lavori da segnare conclusi", icona: OrologioIcon },
];

const STATO_DISPOSITIVO: Record<StatoPermesso, string> = {
  concesso: "Attive su questo dispositivo",
  da_chiedere: "Non ancora attive su questo dispositivo",
  negato: "Bloccate: si riattivano dalle impostazioni del browser",
  non_disponibile: "Questo browser non riceve notifiche",
};

/**
 * LE NOTIFICHE IN IMPOSTAZIONI (§28) — il dispositivo (le ricevo qui?) e
 * un interruttore per categoria, diverse per worker ed employer. Le
 * preferenze valgono per tutti i canali (app, push, email): spegnere
 * «Messaggi» toglie anche la notifica nel centro notifiche, ma NON i
 * messaggi in chat. L'esito della verifica e le recensioni ricevute non si
 * spengono: sono poche e riguardano l'account.
 */
export function ImpostazioniNotifiche() {
  const { isEmployer, theme } = useAppTheme();
  const { isWorker } = useUser();
  const { preferenze, cambia } = usePreferenzeNotifiche();
  const [stato, setStato] = useState<StatoPermesso>(() => canaleAttivo.stato());
  const iphoneDaInstallare = suIos() && !installata();

  // Il permesso si può cambiare dalle impostazioni del browser e tornare.
  useEffect(() => {
    const aggiorna = () => document.visibilityState === "visible" && setStato(canaleAttivo.stato());
    document.addEventListener("visibilitychange", aggiorna);
    return () => document.removeEventListener("visibilitychange", aggiorna);
  }, []);

  const attiva = async () => {
    const esito = await canaleAttivo.attiva();
    setStato(esito);
    if (esito === "concesso") toast.success("Notifiche attive", { duration: 1900 });
  };

  const voci = isWorker ? VOCI_WORKER : VOCI_EMPLOYER;

  return (
    <div className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notifiche</h2>
      <div className="material-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <NotificheIcon className={`h-5 w-5 shrink-0 ${theme.primaryText}`} />
          <div className="min-w-0 flex-1">
            <p className="titolo-mini">Su questo telefono</p>
            <p className="text-sm text-ink-soft">
              {iphoneDaInstallare ? "Su iPhone arrivano solo con l'app sulla schermata Home" : STATO_DISPOSITIVO[stato]}
            </p>
          </div>
          {stato === "da_chiedere" && (
            <Button size="sm" className={`shrink-0 ${theme.btnFilled}`} onClick={attiva}>
              Attiva
            </Button>
          )}
        </div>

        {voci.map((v, i) => (
          /* Tutta la riga accende e spegne (bersaglio grande). Un `div` e non
             un `<label>`: le etichette hanno lo stile dei campi dei form, e la
             riga sotto il titolo usciva spaziata e in grassetto. */
          <div
            key={v.categoria}
            onClick={(e) => !(e.target as HTMLElement).closest("button") && cambia(v.categoria, !preferenze[v.categoria])}
            className={cn("flex cursor-pointer items-center gap-3 p-4", i < voci.length - 1 && "border-b border-border")}
          >
            <v.icona className={`h-5 w-5 shrink-0 ${theme.primaryText}`} />
            <div className="min-w-0 flex-1">
              <p className="titolo-mini">{v.titolo}</p>
              <p className="text-sm text-ink-soft">{v.riga}</p>
            </div>
            <Switch
              checked={preferenze[v.categoria]}
              onCheckedChange={(acceso) => cambia(v.categoria, acceso)}
              aria-label={v.titolo}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
