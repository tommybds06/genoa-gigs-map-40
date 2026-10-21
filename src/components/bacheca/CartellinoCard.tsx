import { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";
import { PUNTINE, PUNTE_PUNTINE } from "@/components/icons/puntine";
import { EuroIcon, OrologioIcon } from "@/components/icons/uiIcons";
import {
  Cartellino,
  GIORNI,
  avvisoScadenza,
  formatData,
  formatPaga,
  modoGiorni,
  varieta,
} from "@/lib/bacheca";
import { FORO_Y, SPAZIO_SOPRA } from "@/lib/formaCartellino";
import { SagomaCartellino } from "./SagomaCartellino";

/** Larghezza della puntina: la stessa di prima. */
const PUNTINA_PX = 21;

/**
 * La fila dei giorni: lo SCHEMA settimanale, non un calendario. Vale uguale
 * per due settimane o sei mesi. Le lettere spente restano visibili perche'
 * la posizione e' l'informazione: senza, "L M" non direbbe quali due giorni.
 */
export function FilaGiorni({ giorni, className }: { giorni: number[]; className?: string }) {
  const nomi = GIORNI.filter((g) => giorni.includes(g.n)).map((g) => g.nome).join(", ");
  return (
    <div className={cn("flex gap-[3px]", className)} aria-label={`Giorni: ${nomi}`}>
      {GIORNI.map((g) => {
        const acceso = giorni.includes(g.n);
        return (
          <span
            key={g.n}
            aria-hidden="true"
            className={cn(
              "w-[15px] text-center text-[11px] leading-none",
              acceso ? "font-semibold text-ink" : "text-ink-soft/40"
            )}
          >
            {g.lettera}
          </span>
        );
      })}
    </div>
  );
}

export function Iniziali({ nome, className }: { nome: string; className?: string }) {
  const { theme } = useAppTheme();
  const iniziali = nome
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center font-[Shinjo,Outfit,sans-serif] [font-synthesis:none]",
        theme.accentBg,
        theme.accentText,
        className
      )}
    >
      {iniziali}
    </div>
  );
}

interface CartellinoCardProps {
  c: Cartellino;
  onClick: () => void;
}

/**
 * IL CARTELLINO — foto, nome, mestiere, paga, giorni.
 *
 * Proporzione fissa 176:248 (vedi `.cartellino` in index.css): il contenuto
 * deve stare dentro anche a 360px di schermo, dove il cartellino e' largo
 * 158. Per questo sotto il mestiere ci sono DUE righe e non tre: la paga, e
 * poi o l'avviso di scadenza (che ha la precedenza, e' l'unica cosa che
 * chiede di fare qualcosa) o i giorni.
 *
 * FORMA: cartellino da pacco — angoli in alto smussati, foro con anello di
 * rinforzo in alto al centro (vedi lib/formaCartellino.ts). La sagoma è
 * disegnata sotto al contenuto, che parte a 44 px per lasciare libero
 * l'anello.
 *
 * PUNTINA: l'ago entra esattamente nel centro del foro. Le coordinate della
 * punta di ogni disegno sono misurate (PUNTE_PUNTINE), quindi la puntina si
 * posiziona da lì; la testa resta a cavallo del bordo alto.
 */
export function CartellinoCard({ c, onClick }: CartellinoCardProps) {
  const { isEmployer } = useAppTheme();
  const v = varieta(c.id);
  const Puntina = PUNTINE[v.puntina];
  const punta = PUNTE_PUNTINE[v.puntina];
  const scala = PUNTINA_PX / punta.larghezza;
  const paga = formatPaga(c.pagaImporto, c.pagaUnita);
  const avviso = c.stato !== "concluso" ? avvisoScadenza(c.dataFine) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="cartellino block w-full text-left touch-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      style={{ "--storto": `${v.gradi}deg` } as CSSProperties}
      aria-label={`${c.nome}, ${c.mestiere}${c.stato === "prova" ? ", in prova" : ""}`}
    >
      {/* Testa nel colore del ruolo, ago in inchiostro (vedi puntine.tsx).
          Provati a 390px: arancio pastello e employer-700 reggono. */}
      <SagomaCartellino seme={c.id} variante="piena" />

      <Puntina
        className={cn(
          "absolute z-10 h-auto drop-shadow-[0_1px_0_hsl(var(--ink)/0.15)]",
          isEmployer ? "text-employer-700" : "text-primary"
        )}
        style={{
          width: PUNTINA_PX,
          left: `calc(50% - ${(punta.x * scala).toFixed(2)}px)`,
          top: FORO_Y - punta.y * scala,
        }}
      />

      {/* `pb-4`: il bordo irregolare entra di qualche pixel, e con meno
          l'ultima riga lo toccava. Sopra, lo spazio dell'anello. */}
      <div
        className="relative flex h-full w-full flex-col px-2.5 pb-4"
        style={{ paddingTop: SPAZIO_SOPRA }}
      >
        {/* ⚠️ La foto PRENDE LO SPAZIO CHE RESTA (`flex-1 min-h-0`), non ha
            più una proporzione sua. Con 44 px sopra per l'anello e la card a
            proporzione fissa, una foto 4:3 non lasciava posto ai testi, e il
            flexbox schiacciava nome e mestiere fino a farli sparire. Ora i
            testi sono `shrink-0` e la foto si adatta: ~137×70 a 360 px di
            schermo, ~152×90 a 390. `object-[center_30%]`: i volti stanno di
            solito nella metà alta, un taglio centrato li decapiterebbe. */}
        <div className="sagoma-foto relative min-h-0 w-full flex-1 overflow-hidden bg-paper-sunken">
          {c.foto ? (
            <img src={c.foto} alt="" className="h-full w-full object-cover object-[center_30%]" loading="lazy" />
          ) : (
            <Iniziali nome={c.nome} className="text-3xl" />
          )}
          {/* Sulla foto e non in una riga sua: una terza riga sotto il
              mestiere a 360px non entra nella proporzione fissa.
              ⚠️ In basso al CENTRO, non in un angolo: negli angoli la maschera
              della foto lo tagliava. */}
          {c.stato === "prova" && (
            <span className="sagoma-badge absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-soft-foreground">
              In prova
            </span>
          )}
        </div>

        <p className="titolo-mini mt-2 shrink-0 truncate">{c.nome}</p>
        <p className="shrink-0 truncate text-[12px] leading-tight text-muted-foreground">{c.mestiere}</p>

        <div className="shrink-0 space-y-1.5 pt-1.5">
          <div className="flex min-w-0 items-center gap-1 text-[13px]">
            <EuroIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
            {paga ? (
              <span className="truncate font-medium text-foreground">{paga}</span>
            ) : c.pagaAnnuncio ? (
              <span className="truncate text-muted-foreground">{c.pagaAnnuncio}</span>
            ) : (
              <span className="truncate text-muted-foreground">Da segnare</span>
            )}
          </div>

          {/* Altezza FISSA anche quando è vuota: la foto prende lo spazio che
              resta, e senza questo le foto di due card vicine avrebbero
              altezze diverse a seconda che qui ci siano giorni, orari o
              l'avviso. */}
          <div className="flex h-4 min-w-0 items-center">
            {avviso ? (
              <p
                className={cn(
                  "truncate text-[12px] font-medium",
                  avviso.urgente ? "text-danger" : "text-warning"
                )}
              >
                {avviso.testo}
              </p>
            ) : modoGiorni(c.giorni, c.dataInizio, c.dataFine) === "uno" ? (
              <p className="truncate text-[12px] text-muted-foreground">Il {formatData(c.dataInizio)}</p>
            ) : c.giorni && c.giorni.length > 0 ? (
              <FilaGiorni giorni={c.giorni} />
            ) : c.orari || modoGiorni(c.giorni, c.dataInizio, c.dataFine) === "variabili" ? (
              <div className="flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
                <OrologioIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.orari || "Turni variabili"}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
