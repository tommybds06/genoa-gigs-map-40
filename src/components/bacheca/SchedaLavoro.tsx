import { ComponentType, ReactNode, SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tessera, TesseraIcona } from "@/components/ui/Tessera";
import {
  CalendarioIcon,
  EuroIcon,
  MessaggiIcon,
  OrologioIcon,
  ProfiloIcon,
} from "@/components/icons/uiIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { LavoroWorker } from "@/hooks/useLavoriWorker";
import { formatData, formatPaga, giorniA, GIORNI, modoGiorni, quantoManca } from "@/lib/bacheca";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Iniziali } from "./CartellinoCard";
import { badgeLavoro } from "./statiLavoro";

interface SchedaLavoroProps {
  lavoro: LavoroWorker | null;
  onClose: () => void;
  onApriChat: (chatId: string) => void;
  onRecensisci: (l: LavoroWorker) => void;
}

/** Una riga d'informazione: icona, etichetta, valore. Separate dalla linea disegnata. */
function Riga({
  icona: Icona,
  etichetta,
  children,
}: {
  icona: ComponentType<SVGProps<SVGSVGElement>>;
  etichetta: string;
  children: ReactNode;
}) {
  return (
    <div className="linea-divisoria-sopra flex gap-3 py-3.5">
      <Icona className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-muted-foreground">{etichetta}</p>
        <div className="mt-0.5 text-[15px] text-foreground">{children}</div>
      </div>
    </div>
  );
}

function periodo(l: LavoroWorker): string {
  if (modoGiorni(l.giorni, l.dataInizio, l.dataFine) === "uno") return `Il ${formatData(l.dataInizio)}, un giorno solo`;
  if (l.dataInizio && l.dataFine) return `Dal ${formatData(l.dataInizio)} al ${formatData(l.dataFine)}`;
  if (l.dataInizio) return `Dal ${formatData(l.dataInizio)}, nessuna data di fine`;
  if (l.dataFine) return `Fino al ${formatData(l.dataFine)}`;
  return "Date non fissate";
}

/** Cosa dire in fondo, quando non c'è un'azione ma c'è qualcosa da sapere. */
function notaFinale(l: LavoroWorker): string | null {
  if (l.stato === "finito") return "I giorni previsti sono finiti: l'attività deve ancora chiudere il lavoro.";
  if (l.stato === "concluso") return "Lavoro concluso e recensito.";
  return null;
}

/**
 * LA SCHEDA DI UN LAVORO, lato worker — si apre toccando la card.
 *
 * Tutto quello che la card non dice: il ruolo con l'icona del mestiere, la
 * paga, il periodo con quanto manca, i giorni e gli orari. Sola lettura: gli
 * accordi li ha scritti l'attività (RLS: il worker legge i cartellini, non li
 * modifica).
 *
 * ⚠️ La card NON apre più la chat direttamente (Tommaso: «è un bottone di
 * distanza, non ha senso»). La chat diretta con l'attività è la tessera
 * Messaggi in alto; accanto, il profilo dell'attività.
 */
export function SchedaLavoro({ lavoro: l, onClose, onApriChat, onRecensisci }: SchedaLavoroProps) {
  const { theme, isEmployer } = useAppTheme();
  const navigate = useNavigate();
  if (!l) return null;

  const b = badgeLavoro(l.stato, theme.btnFilled);
  const IconaMestiere = getJobIconFromTags(l.tags);
  const paga = formatPaga(l.pagaImporto, l.pagaUnita);
  const attivo = l.stato === "prova" || l.stato === "assunto";
  const fineVicina = attivo && !!l.dataFine && giorniA(l.dataFine) <= 3;
  const nota = notaFinale(l);

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[88vh]">
        <div className="min-h-0 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {/* ---- CHI ---- */}
          <DrawerHeader className="flex items-center gap-3 p-0 pt-1 text-left">
            <Avatar seme={l.employerId} className="h-14 w-14">
              <AvatarImage src={l.foto || undefined} alt="" />
              <AvatarFallback className="bg-transparent p-0">
                {/* Pieno chiaro + inchiostro, come le tessere: in questa scheda
                    un solo arancio, quello chiaro (Tommaso, 20 ottobre). */}
                <Iniziali nome={l.attivita} className={cn("text-lg text-ink", isEmployer ? "bg-employer" : "bg-primary")} />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              {/* ⚠️ Misure ripetute come utility: DrawerTitle porta di suo
                  `text-lg leading-none font-semibold` e batterebbe la classe. */}
              <DrawerTitle className="titolo-sezione truncate text-2xl font-normal leading-[1.9375rem] tracking-[-0.05em]">
                {l.attivita}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {l.ruolo}, {b.testo.toLowerCase()}
              </DrawerDescription>
              <span className={cn("sagoma-badge mt-1 inline-block px-2 py-0.5 text-[11px] font-medium", b.classe)}>
                {b.testo}
              </span>
            </div>
            <div className="flex shrink-0 gap-2">
              <Tessera
                icona={MessaggiIcon}
                etichetta={`Scrivi a ${l.attivita}`}
                disabled={!l.chatId}
                onClick={() => l.chatId && onApriChat(l.chatId)}
              />
              <Tessera
                icona={ProfiloIcon}
                etichetta={`Profilo di ${l.attivita}`}
                onClick={() => navigate(`/profile/${l.employerId}`)}
              />
            </div>
          </DrawerHeader>

          {/* ---- IL LAVORO: il ruolo, con l'icona del mestiere ---- */}
          <div className="mt-5 flex items-center gap-3">
            <TesseraIcona icona={IconaMestiere} misura="lg" />
            <div className="min-w-0">
              <p className="text-[13px] text-muted-foreground">Ruolo</p>
              {/* ⚠️ Un <p> normale, non `DrawerDescription asChild`: le sue
                  classi (`text-sm text-muted-foreground`) si fondevano con
                  queste e il ruolo usciva piccolo e grigio. */}
              <p className="titolo-mini text-foreground">{l.ruolo}</p>
            </div>
          </div>

          {/* ---- GLI ACCORDI ---- */}
          <div className="mt-4">
            <Riga icona={EuroIcon} etichetta="Paga">
              {paga ? (
                <span className="font-medium">{paga}</span>
              ) : l.pagaAnnuncio ? (
                <span>
                  {l.pagaAnnuncio} <span className="text-muted-foreground">· dall'annuncio</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Da definire con l'attività</span>
              )}
            </Riga>

            <Riga icona={CalendarioIcon} etichetta="Periodo">
              <p>{periodo(l)}</p>
              {/* Solo per i lavori in corso: per quelli finiti la data è
                  già nella riga sopra, ripeterla è rumore. */}
              {l.dataFine && attivo && (
                <p className={cn("text-[13px]", fineVicina ? "font-medium text-warning" : "text-muted-foreground")}>
                  {quantoManca(l.dataFine)}
                </p>
              )}
            </Riga>

            <Riga icona={OrologioIcon} etichetta="Giorni e orari">
              {l.giorni && l.giorni.length > 0 ? (
                <div className="mt-1 flex gap-1.5" aria-label={GIORNI.filter((g) => l.giorni!.includes(g.n)).map((g) => g.nome).join(", ")}>
                  {GIORNI.map((g) => {
                    const acceso = l.giorni!.includes(g.n);
                    return (
                      <span
                        key={g.n}
                        aria-hidden="true"
                        className={cn(
                          "sagoma-chip flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
                          acceso ? theme.btnFilled : "bg-paper-sunken text-ink-soft/60"
                        )}
                      >
                        {g.lettera}
                      </span>
                    );
                  })}
                </div>
              ) : modoGiorni(l.giorni, l.dataInizio, l.dataFine) === "uno" ? (
                <p>Un giorno solo</p>
              ) : modoGiorni(l.giorni, l.dataInizio, l.dataFine) === "variabili" ? (
                <p>Turni variabili</p>
              ) : (
                <p className="text-muted-foreground">Giorni non fissati</p>
              )}
              {l.orari && <p className="mt-2">{l.orari}</p>}
            </Riga>
          </div>

          {/* ---- AZIONE o NOTA ---- */}
          {l.stato === "da-recensire" ? (
            <Button
              size="lg"
              className={cn("mt-4 w-full", theme.btnFilled, theme.btnFilledHover)}
              onClick={() => onRecensisci(l)}
            >
              Recensisci {l.attivita}
            </Button>
          ) : nota ? (
            <p className="linea-divisoria-sopra pt-3.5 text-[13px] text-muted-foreground">{nota}</p>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
