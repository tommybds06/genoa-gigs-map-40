import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessaggiIcon, ProfiloIcon } from "@/components/icons/uiIcons";
import { useAuth } from "@/hooks/useAuth";
import { useAppTheme } from "@/hooks/useAppTheme";
import { CHIAVE_CANDIDATI, CHIAVE_CARTELLINI } from "@/hooks/useCartellini";
import { cn } from "@/lib/utils";
import {
  Cartellino,
  GIORNI,
  UNITA,
  UnitaPaga,
  assumi,
  avvisoScadenza,
  estendiDa,
  formatData,
  leggiPagaDaTesto,
  salvaAccordi,
  stacca,
  terminaLavoro,
} from "@/lib/bacheca";
import { Iniziali } from "./CartellinoCard";

interface SchedaCartellinoProps {
  cartellino: Cartellino | null;
  onClose: () => void;
  onApriChat: (chatId: string) => void;
}

type Conferma = "assumi" | "stacca" | "termina" | null;

interface Modulo {
  importo: string;
  unita: UnitaPaga | null;
  giorni: number[];
  orari: string;
  dataInizio: string;
  dataFine: string;
}

function moduloDa(c: Cartellino): Modulo {
  // Paga vuota → si precompila dal testo dell'annuncio ("9€/h" → 9, ora).
  // Non e' salvata: il bottone Salva si accende e l'employer conferma.
  const dallAnnuncio =
    c.pagaImporto === null ? leggiPagaDaTesto(c.pagaAnnuncio) : { importo: null, unita: null };
  const importo = c.pagaImporto ?? dallAnnuncio.importo;
  return {
    importo: importo === null ? "" : String(importo).replace(".", ","),
    unita: c.pagaUnita ?? dallAnnuncio.unita,
    giorni: c.giorni ?? [],
    orari: c.orari ?? "",
    dataInizio: c.dataInizio ?? "",
    dataFine: c.dataFine ?? "",
  };
}

function moduloSalvato(c: Cartellino): Modulo {
  return {
    importo: c.pagaImporto === null ? "" : String(c.pagaImporto).replace(".", ","),
    unita: c.pagaUnita,
    giorni: c.giorni ?? [],
    orari: c.orari ?? "",
    dataInizio: c.dataInizio ?? "",
    dataFine: c.dataFine ?? "",
  };
}

function uguali(a: Modulo, b: Modulo) {
  return (
    a.importo.trim() === b.importo.trim() &&
    a.unita === b.unita &&
    [...a.giorni].sort().join() === [...b.giorni].sort().join() &&
    a.orari.trim() === b.orari.trim() &&
    a.dataInizio === b.dataInizio &&
    a.dataFine === b.dataFine
  );
}

/** Chip selezionabile, nello stesso linguaggio dei tag (sagoma-chip). */
function Chip({
  attiva,
  onClick,
  children,
  disabled,
  className,
}: {
  attiva: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { theme } = useAppTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={attiva}
      className={cn(
        "sagoma-chip rounded-full text-sm font-medium transition-colors disabled:opacity-50",
        attiva ? theme.btnFilled : "bg-paper-sunken text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * SCHEDA DEL CARTELLINO — si apre toccando un cartellino.
 *
 * In alto chi e' e cosa fa, poi gli ACCORDI (paga, giorni, date) e in fondo
 * le azioni. Gli accordi sono promemoria nell'app, non un contratto: niente
 * campi obbligatori, niente validazioni oltre il buon senso.
 *
 * ⚠️ I dati arrivano dalla query `cartellini` e non da una copia locale: dopo
 * un salvataggio la scheda mostra quello che c'e' davvero nel database.
 */
export function SchedaCartellino({ cartellino: c, onClose, onApriChat }: SchedaCartellinoProps) {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [conferma, setConferma] = useState<Conferma>(null);
  const [agendo, setAgendo] = useState(false);

  // Il modulo si ricarica quando cambia cartellino, non a ogni refetch: se no
  // un aggiornamento in background cancellerebbe quello che stai scrivendo.
  useEffect(() => {
    setModulo(c ? moduloDa(c) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id]);

  const sporco = useMemo(() => !!c && !!modulo && !uguali(modulo, moduloSalvato(c)), [c, modulo]);
  const solaLettura = c?.stato === "concluso";

  const aggiorna = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [CHIAVE_CARTELLINI] }),
      queryClient.invalidateQueries({ queryKey: [CHIAVE_CANDIDATI] }),
      queryClient.invalidateQueries({ queryKey: ["chats"] }),
      queryClient.invalidateQueries({ queryKey: ["jobs"] }),
    ]);

  if (!c || !modulo) return null;

  const imposta = <K extends keyof Modulo>(k: K, v: Modulo[K]) =>
    setModulo((m) => (m ? { ...m, [k]: v } : m));

  const importoNumero = modulo.importo.trim() === "" ? null : Number(modulo.importo.replace(",", "."));
  const importoValido = importoNumero === null || (Number.isFinite(importoNumero) && importoNumero >= 0);
  const dateValide = !modulo.dataFine || !modulo.dataInizio || modulo.dataFine >= modulo.dataInizio;

  const salva = async () => {
    if (!importoValido || !dateValide) return;
    setSalvando(true);
    try {
      await salvaAccordi(c.id, {
        pagaImporto: importoNumero,
        pagaUnita: importoNumero === null ? null : modulo.unita,
        giorni: modulo.giorni,
        orari: modulo.orari,
        dataInizio: modulo.dataInizio || null,
        dataFine: modulo.dataFine || null,
      });
      await aggiorna();
      toast.success("Salvato", { duration: 1500 });
    } catch (e) {
      console.error("Salvataggio accordi:", e);
      toast.error("Non sono riuscito a salvare");
    } finally {
      setSalvando(false);
    }
  };

  const esegui = async () => {
    if (!conferma || !user) return;
    setAgendo(true);
    try {
      if (conferma === "assumi") {
        await assumi(c, user.id);
        toast.success(`${c.nome} è assunto`, { duration: 2000 });
      } else if (conferma === "stacca") {
        await stacca(c.id);
        toast.success("Tolto dalla bacheca", { duration: 2000 });
        onClose();
      } else if (conferma === "termina") {
        await terminaLavoro(c.jobId, c.workerId);
        toast.success("Lavoro concluso", { duration: 2000 });
        onClose();
      }
      await aggiorna();
    } catch (e) {
      console.error("Azione sul cartellino:", e);
      toast.error("Qualcosa è andato storto, riprova");
    } finally {
      setAgendo(false);
      setConferma(null);
    }
  };

  const avviso = !solaLettura ? avvisoScadenza(c.dataFine) : null;
  const etichettaStato =
    c.stato === "prova" ? "In prova" : c.stato === "assunto" ? "Assunto" : "Concluso";
  const classeStato =
    c.stato === "prova"
      ? "bg-warning-soft text-warning-soft-foreground"
      : c.stato === "assunto"
        ? "bg-success text-success-foreground"
        : "bg-neutral-soft text-neutral-soft-foreground";

  const testiConferma: Record<Exclude<Conferma, null>, { titolo: string; testo: string; azione: string }> = {
    assumi: {
      titolo: `Assumere ${c.nome}?`,
      testo: "In chat arriverà il messaggio di assunzione, come dal bottone «Assumi».",
      azione: "Assumi",
    },
    stacca: {
      titolo: "Togliere dalla bacheca?",
      testo: "Si stacca solo il cartellino: la candidatura e la chat restano come sono.",
      azione: "Togli",
    },
    termina: {
      titolo: `Terminare il lavoro con ${c.nome}?`,
      testo: "Il cartellino passa tra i conclusi e potrà lasciarti una recensione. L'annuncio si chiude solo se non resta nessun altro al lavoro.",
      azione: "Termina",
    },
  };

  return (
    <>
      <Drawer open onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="max-h-[92vh]">
          <div className="min-h-0 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {/* ---- CHI ---- */}
            <DrawerHeader className="flex items-center gap-3 p-0 pt-1 text-left">
              <div className="sagoma-foto h-16 w-16 shrink-0 overflow-hidden bg-paper-sunken">
                {c.foto ? (
                  <img src={c.foto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Iniziali nome={c.nome} className="text-xl" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {/* ⚠️ Misure ripetute come utility: DrawerTitle porta di suo
                    `text-lg leading-none font-semibold` e batterebbe la classe. */}
                <DrawerTitle className="titolo-sezione truncate text-2xl font-normal leading-[1.9375rem] tracking-[-0.05em]">
                  {c.nome}
                </DrawerTitle>
                <DrawerDescription className="truncate text-[13px] text-muted-foreground">
                  {c.mestiere}
                </DrawerDescription>
                <span className={cn("sagoma-badge mt-1 inline-block px-2 py-0.5 text-[11px] font-medium", classeStato)}>
                  {etichettaStato}
                </span>
              </div>
            </DrawerHeader>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={!c.chatId}
                onClick={() => c.chatId && onApriChat(c.chatId)}
              >
                <MessaggiIcon />
                Chat
              </Button>
              <Button variant="outline" onClick={() => navigate(`/profile/${c.workerId}`)}>
                <ProfiloIcon />
                Profilo
              </Button>
            </div>

            {avviso && (
              <p className={cn("mt-4 text-[15px] font-medium", avviso.urgente ? "text-danger" : "text-warning")}>
                {avviso.testo}
              </p>
            )}

            {/* ---- PAGA ---- */}
            <section className="linea-divisoria-sopra mt-4 pt-4">
              <h3 className="titolo-mini mb-2">Paga</h3>
              <div className="flex items-center gap-2">
                <div className="w-28 shrink-0">
                  <Input
                    inputMode="decimal"
                    placeholder="0"
                    value={modulo.importo}
                    disabled={solaLettura}
                    onChange={(e) => imposta("importo", e.target.value)}
                    aria-label="Importo in euro"
                    aria-invalid={!importoValido}
                  />
                </div>
                <span className="text-[15px] text-muted-foreground">€</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {UNITA.map((u) => (
                  <Chip
                    key={u.valore}
                    attiva={modulo.unita === u.valore}
                    disabled={solaLettura}
                    onClick={() => imposta("unita", modulo.unita === u.valore ? null : u.valore)}
                    className="px-3.5 py-2"
                  >
                    {u.etichetta}
                  </Chip>
                ))}
              </div>
              {!importoValido && <p className="mt-1.5 text-[13px] text-danger">Scrivi un numero, tipo 9 o 9,50</p>}
              {c.pagaAnnuncio && (
                <p className="mt-2 text-[13px] text-muted-foreground">Sull'annuncio: {c.pagaAnnuncio}</p>
              )}
            </section>

            {/* ---- QUANDO ---- */}
            <section className="linea-divisoria-sopra mt-4 pt-4">
              <h3 className="titolo-mini mb-2">Giorni</h3>
              <div className="flex justify-between gap-1">
                {GIORNI.map((g) => (
                  <Chip
                    key={g.n}
                    attiva={modulo.giorni.includes(g.n)}
                    disabled={solaLettura}
                    onClick={() =>
                      imposta(
                        "giorni",
                        modulo.giorni.includes(g.n)
                          ? modulo.giorni.filter((x) => x !== g.n)
                          : [...modulo.giorni, g.n]
                      )
                    }
                    className="h-10 w-10 shrink-0 p-0"
                  >
                    <span aria-hidden="true">{g.lettera}</span>
                    <span className="sr-only">{g.nome}</span>
                  </Chip>
                ))}
              </div>
              <div className="mt-2.5">
                <Input
                  placeholder="Orari e turni, es. 18–23"
                  value={modulo.orari}
                  maxLength={200}
                  disabled={solaLettura}
                  onChange={(e) => imposta("orari", e.target.value)}
                  aria-label="Orari e turni"
                />
              </div>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Se i giorni cambiano di settimana in settimana, lascia i giorni vuoti e scrivi qui.
              </p>
            </section>

            {/* ---- DATE ---- */}
            <section className="linea-divisoria-sopra mt-4 pt-4">
              <h3 className="titolo-mini mb-2">Date</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[13px] text-muted-foreground">Dal</span>
                  <Input
                    type="date"
                    value={modulo.dataInizio}
                    disabled={solaLettura}
                    onChange={(e) => imposta("dataInizio", e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] text-muted-foreground">Al</span>
                  <Input
                    type="date"
                    value={modulo.dataFine}
                    min={modulo.dataInizio || undefined}
                    disabled={solaLettura}
                    onChange={(e) => imposta("dataFine", e.target.value)}
                    aria-invalid={!dateValide}
                  />
                </label>
              </div>
              {!dateValide && <p className="mt-1.5 text-[13px] text-danger">La fine viene prima dell'inizio</p>}
              {!solaLettura && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Chip attiva={false} onClick={() => imposta("dataFine", estendiDa(modulo.dataFine || null, 7))} className="px-3.5 py-2">
                    +1 settimana
                  </Chip>
                  <Chip attiva={false} onClick={() => imposta("dataFine", estendiDa(modulo.dataFine || null, 0, 1))} className="px-3.5 py-2">
                    +1 mese
                  </Chip>
                  {modulo.dataFine && (
                    <Chip attiva={false} onClick={() => imposta("dataFine", "")} className="px-3.5 py-2">
                      Nessuna data di fine
                    </Chip>
                  )}
                </div>
              )}
              {!modulo.dataFine && (
                <p className="mt-1.5 text-[13px] text-muted-foreground">Nessuna data di fine.</p>
              )}
              {solaLettura && c.dataFine && (
                <p className="mt-1.5 text-[13px] text-muted-foreground">Concluso, era fissato fino al {formatData(c.dataFine)}.</p>
              )}
            </section>

            {/* ---- AZIONI ---- */}
            {!solaLettura && (
              <div className="mt-5 space-y-2">
                <Button
                  size="lg"
                  className={cn("w-full", theme.btnFilled, theme.btnFilledHover)}
                  disabled={!sporco || salvando || !importoValido || !dateValide}
                  onClick={salva}
                >
                  {salvando && <Loader2 className="animate-spin" />}
                  {sporco ? "Salva" : "Salvato"}
                </Button>

                {c.stato === "prova" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setConferma("assumi")}>
                      Assumi
                    </Button>
                    <Button variant="ghost" className="text-danger" onClick={() => setConferma("stacca")}>
                      Togli dalla bacheca
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" className="w-full text-danger" onClick={() => setConferma("termina")}>
                    Termina il lavoro
                  </Button>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={conferma !== null} onOpenChange={(o) => !o && !agendo && setConferma(null)}>
        <AlertDialogContent>
          {conferma && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{testiConferma[conferma].titolo}</AlertDialogTitle>
                <AlertDialogDescription>{testiConferma[conferma].testo}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={agendo}>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  disabled={agendo}
                  onClick={(e) => {
                    e.preventDefault();
                    esegui();
                  }}
                  className={conferma === "assumi" ? cn(theme.btnFilled, theme.btnFilledHover) : "bg-danger text-danger-foreground hover:bg-danger/90"}
                >
                  {agendo && <Loader2 className="animate-spin" />}
                  {testiConferma[conferma].azione}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
