import { Checkbox } from "@/components/ui/checkbox";
import { CampoData } from "@/components/ui/CampoData";
import { Label } from "@/components/ui/label";
import { ETA_MINIMA } from "@/lib/registrazione";

/**
 * DATA DI NASCITA + «HO ALMENO 18 ANNI» per i worker (Tommaso, 24 ottobre).
 * La data va in `profili_riservati`, che legge solo il proprietario: in
 * `profiles` la leggerebbe chiunque. Il database rifiuta comunque una data
 * da minorenne: il controllo qui serve a dirlo con gentilezza prima.
 */
export function CampoMaggiorenne({
  nascita,
  onNascita,
  confermato,
  onConferma,
  errori,
}: {
  nascita: string;
  onNascita: (v: string) => void;
  confermato: boolean;
  onConferma: (v: boolean) => void;
  errori: { nascita?: string; conferma?: string };
}) {
  // Il massimo selezionabile è oggi: niente date future nel calendario.
  const oggi = new Date();
  const massimo = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, "0")}-${String(oggi.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="nascita" className="text-sm font-medium text-foreground">
          Data di nascita <span className="text-destructive">*</span>
        </Label>
        <CampoData id="nascita" value={nascita} onChange={onNascita} max={massimo} />
        {errori.nascita && <p className="text-xs text-destructive">{errori.nascita}</p>}
      </div>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-foreground">
        <Checkbox checked={confermato} onCheckedChange={(v) => onConferma(v === true)} />
        Confermo di avere almeno {ETA_MINIMA} anni
      </label>
      {errori.conferma && <p className="-mt-2 text-xs text-destructive">{errori.conferma}</p>}
    </div>
  );
}
