import { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/useAppTheme";
import { PUNTINE } from "@/components/icons/puntine";
import { EuroIcon, OrologioIcon } from "@/components/icons/uiIcons";
import {
  Cartellino,
  GIORNI,
  avvisoScadenza,
  formatPaga,
  varieta,
} from "@/lib/bacheca";

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
 * ⚠️ La puntina sta FUORI dalla card mascherata: la maschera la taglierebbe.
 */
export function CartellinoCard({ c, onClick }: CartellinoCardProps) {
  const { isEmployer } = useAppTheme();
  const v = varieta(c.id);
  const Puntina = PUNTINE[v.puntina];
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
      <Puntina
        className={cn(
          "absolute -top-[13px] z-10 h-auto w-[21px] drop-shadow-[0_1px_0_hsl(var(--ink)/0.15)]",
          isEmployer ? "text-employer-700" : "text-primary"
        )}
        style={{ left: `calc(50% + ${v.spostamento}% - 10px)` }}
      />

      {/* `pb-4`: il margine tagliato a mano entra di qualche pixel nel
          cartellino, e con il solo p-2.5 l'ultima riga toccava il bordo. */}
      <div className="material-card flex h-full w-full flex-col p-2.5 pb-4">
        <div className="sagoma-foto relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-paper-sunken">
          {c.foto ? (
            <img src={c.foto} alt="" className="h-full w-full object-cover" loading="lazy" />
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

        <p className="titolo-mini mt-2 truncate">{c.nome}</p>
        <p className="truncate text-[12px] leading-tight text-muted-foreground">{c.mestiere}</p>

        <div className="mt-auto space-y-1.5 pt-1.5">
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

          {avviso ? (
            <p
              className={cn(
                "truncate text-[12px] font-medium",
                avviso.urgente ? "text-danger" : "text-warning"
              )}
            >
              {avviso.testo}
            </p>
          ) : c.giorni && c.giorni.length > 0 ? (
            <FilaGiorni giorni={c.giorni} />
          ) : c.orari ? (
            <div className="flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
              <OrologioIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{c.orari}</span>
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}
