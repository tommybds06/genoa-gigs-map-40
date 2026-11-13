import { useMemo, useRef, useState, type PointerEvent } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { CheckCheck, Reply } from "lucide-react";
import { DocumentoIcon, OrologioIcon } from "@/components/icons/uiIcons";
import { eSegnaposto, etichettaMessaggio, nomeAllegato, tipoAllegato } from "@/lib/allegati";
import { useAllegato } from "@/hooks/useAttachmentUrl";
import { MISURA_FOTO } from "@/lib/foto";
import { useMisure } from "@/hooks/useMisure";
import { formaBolla } from "@/lib/formaBolla";
import { oraMessaggio } from "@/lib/dates";
import type { Messaggio } from "@/hooks/useMessaggi";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Messaggio;
  isOwn: boolean;
  isEmployer: boolean;
  onReply: (message: Messaggio) => void;
  /** Pressione lunga (o tasto destro): il menu del messaggio. */
  onMenu?: (message: Messaggio) => void;
  /** Il messaggio prima è della stessa persona, vicino nel tempo: stesso gruppo. */
  continuaGruppo: boolean;
  /** Il messaggio dopo NON è della stessa persona: chiude il gruppo. */
  chiudeGruppo: boolean;
  /** Rimanda un messaggio che non è partito. */
  onRiprova?: (message: Messaggio) => void;
}

const SWIPE_THRESHOLD = 50; // px per far scattare la risposta
const PRESSIONE_LUNGA = 450; // ms
const TOLLERANZA_DITO = 10; // px: oltre, è uno scorrimento e non una pressione

/**
 * LA BOLLA DI UN MESSAGGIO.
 *
 * - Forma a mano (`lib/formaBolla.ts`) come ritaglio, misurata sulle sue
 *   dimensioni vere; l'angolo dal lato di chi parla è piccolo sull'ultima di
 *   un gruppo e in alto su quelle che lo continuano.
 * - Solo l'ora: la data la dice il separatore di giornata.
 * - La citazione di una risposta sta DENTRO la bolla (prima era un pezzo
 *   staccato sopra, con un'altra forma).
 * - I miei messaggi appena scritti compaiono subito (vedi `useMessaggi`):
 *   orologio finché il database non conferma, «Non inviato» se fallisce.
 * - RISPONDERE (12 novembre): trascinando la bolla verso destra, ANCHE le
 *   proprie. Prima il gesto era acceso solo sui messaggi dell'altro, e a un
 *   proprio messaggio non si poteva rispondere («non si può rispondere ad un
 *   proprio messaggio», Tommaso).
 * - PRESSIONE LUNGA (o tasto destro) → `onMenu`: Rispondi, Copia. Per questo
 *   sul telefono il testo non si seleziona più tenendo premuto (c'è «Copia»);
 *   col mouse sì.
 * - ALLEGATI: una foto, oppure un DOCUMENTO PDF (`lib/allegati.ts`): una riga
 *   con l'icona e il nome, che si apre toccandola. È un link vero (`<a>`), con
 *   l'indirizzo firmato già pronto: aprire una finestra DOPO un'attesa, su
 *   iPhone, viene bloccato come popup.
 */
export const MessageBubble = ({
  message,
  isOwn,
  isEmployer,
  onReply,
  onMenu,
  continuaGruppo,
  chiudeGruppo,
  onRiprova,
}: MessageBubbleProps) => {
  const [, setShowReplyIcon] = useState(false);
  const documento = tipoAllegato(message.attachment_url) === "documento";
  // Un documento si firma così com'è; una foto si chiede già ridimensionata.
  const { url: attachmentUrl, ripiega: ripiegaAllegato, caricata: allegatoCaricato } = useAllegato(
    message.attachment_url,
    documento ? undefined : MISURA_FOTO.grande
  );

  /* La pressione lunga. Un timer che parte al tocco e si annulla se il dito
     si sposta (è uno scorrimento, o il trascinamento della risposta) o si
     alza. `contextmenu` copre il tasto destro e, su Android, la pressione
     lunga del sistema: lì si ferma il menu nativo e si apre il nostro, una
     volta sola. */
  const pressione = useRef<{ timer: number; x: number; y: number } | null>(null);
  const menuAperto = useRef(0);
  const apriMenu = () => {
    if (!onMenu || message.stato) return;
    if (Date.now() - menuAperto.current < 800) return;
    menuAperto.current = Date.now();
    if (navigator.vibrate) navigator.vibrate(10);
    onMenu(message);
  };
  const annullaPressione = () => {
    if (pressione.current) window.clearTimeout(pressione.current.timer);
    pressione.current = null;
  };
  const iniziaPressione = (e: PointerEvent) => {
    if (e.pointerType === "mouse" || (e.target as HTMLElement).closest("a, button")) return;
    annullaPressione();
    pressione.current = { x: e.clientX, y: e.clientY, timer: window.setTimeout(apriMenu, PRESSIONE_LUNGA) };
  };
  const muoviPressione = (e: PointerEvent) => {
    const p = pressione.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TOLLERANZA_DITO) annullaPressione();
  };
  const x = useMotionValue(0);
  const controls = useAnimation();
  const { ref, misure } = useMisure<HTMLDivElement>();

  const replyIconOpacity = useTransform(x, [0, 30, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const replyIconScale = useTransform(x, [0, 30, SWIPE_THRESHOLD], [0.5, 0.8, 1]);

  // Angolo piccolo dal lato di chi parla: [alto-sx, alto-dx, basso-dx, basso-sx].
  const clipPath = useMemo(() => {
    if (!misure || misure.w === 0) return undefined;
    const piccoli: [boolean, boolean, boolean, boolean] = isOwn
      ? [false, continuaGruppo, chiudeGruppo, false]
      : [continuaGruppo, false, false, chiudeGruppo];
    return `path("${formaBolla(misure.w, misure.h, message.id, { piccoli })}")`;
  }, [misure, isOwn, continuaGruppo, chiudeGruppo, message.id]);

  // ⚠️ Il fondo segue il ruolo e il testo pure, in coppia (§5).
  const colori = isOwn
    ? isEmployer
      ? "bg-employer-700 text-employer-foreground"
      : "bg-primary text-primary-foreground"
    : "bg-paper-sunken text-foreground";
  const coloriOra = isOwn
    ? isEmployer
      ? "text-employer-foreground/75"
      : "text-primary-foreground/70"
    : "text-muted-foreground";
  const coloriCitazione = isOwn
    ? isEmployer
      ? "bg-employer-800/40 border-employer-foreground/60"
      : "bg-paper-sheet/45 border-primary-foreground/50"
    : "bg-paper-sheet/70 border-ink-soft/50";

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      if (navigator.vibrate) navigator.vibrate(10);
      onReply(message);
    }
    await controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    setShowReplyIcon(false);
  };

  const fallito = message.stato === "errore";

  return (
    /* `data-messaggio`: «Cerca in chat» scorre fin qui e fa lampeggiare la
       riga. `-mx-4 px-4`: la riga arriva ai bordi dello schermo (il
       contenitore ha `px-4`), così il lampo e il trascinamento li prendono. */
    <div data-messaggio={message.id} className={cn("group relative -mx-4 px-4", continuaGruppo ? "mt-0.5" : "mt-3")}>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-muted p-2"
        style={{ opacity: replyIconOpacity, scale: replyIconScale }}
      >
        <Reply className="h-4 w-4 text-muted-foreground" />
      </motion.div>

      {/* ⚠️ Si trascina TUTTA LA RIGA, non la bolla (13 novembre, Tommaso:
          «funziona solo se trascini esattamente sopra il messaggio»): il gesto
          parte anche dallo spazio vuoto accanto, come su WhatsApp. framer mette
          da sé `touch-action: pan-y`, quindi in verticale la chat scorre. */}
      <motion.div
        className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        // Solo verso destra: a sinistra la bolla non si muove.
        dragElastic={{ left: 0, right: 0.5 }}
        onDrag={(_, info) => setShowReplyIcon(info.offset.x > 20)}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
      >
       <div className="flex max-w-[78%] flex-col">
        <div
          ref={ref}
          className={cn(
            "relative select-none px-3.5 pb-1.5 pt-2 [-webkit-touch-callout:none] md:select-auto",
            colori,
            fallito && "opacity-70"
          )}
          // Finché non c'è la misura, un raggio CSS: niente lampo squadrato.
          style={clipPath ? { clipPath } : { borderRadius: 18 }}
          onPointerDown={iniziaPressione}
          onPointerMove={muoviPressione}
          onPointerUp={annullaPressione}
          onPointerCancel={annullaPressione}
          onContextMenu={(e) => {
            if (!onMenu) return;
            e.preventDefault();
            annullaPressione();
            apriMenu();
          }}
        >
          {message.reply_to && (
            <div className={cn("mb-1.5 rounded-lg border-l-2 px-2.5 py-1 text-xs", coloriCitazione)}>
              <p className="line-clamp-2 font-medium opacity-90">{etichettaMessaggio(message.reply_to)}</p>
            </div>
          )}

          {documento ? (
            /* Il documento: icona, nome, «PDF». Un link vero, così si apre al
               tocco anche su iPhone. Finché l'indirizzo non è firmato è solo
               una riga, senza link. */
            <a
              href={attachmentUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className={cn(
                "-mx-1.5 mb-1.5 mt-0.5 flex min-w-[190px] items-center gap-2.5 rounded-xl px-2.5 py-2 transition-opacity active:opacity-70",
                coloriCitazione.split(" ")[0]
              )}
            >
              <DocumentoIcon className="h-7 w-7 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 break-all text-[14px] font-medium leading-snug">
                  {nomeAllegato(message.attachment_url!)}
                </span>
                <span className="block text-[11px] opacity-75">PDF · tocca per aprire</span>
              </span>
            </a>
          ) : (
            attachmentUrl && (
              <div className="-mx-1.5 mb-1.5 mt-0.5">
                <img src={attachmentUrl} onError={ripiegaAllegato} onLoad={allegatoCaricato} decoding="async" alt="Allegato" className="h-auto max-h-64 max-w-full rounded-xl object-cover" />
              </div>
            )
          )}

          {message.content && !eSegnaposto(message.content) && (
            <p className="message-content text-[15px] leading-snug md:select-text">{message.content}</p>
          )}

          <div className={cn("mt-0.5 flex items-center justify-end gap-1", coloriOra)}>
            <span className="text-[11px] tabular-nums">{oraMessaggio(message.created_at)}</span>
            {isOwn &&
              (message.stato === "invio" ? (
                <OrologioIcon className="h-3 w-3" aria-label="In invio" />
              ) : fallito ? null : (
                /* LETTO nel colore dell'ALTRO ruolo (Tommaso, 22 ottobre): blu
                   sull'arancio del worker, arancio sul blu dell'employer. Le
                   tinte sono quelle che reggono 3:1 su quella bolla: il blu
                   inchiostro (3,29) e un arancio chiaro (3,18); i colori di
                   brand pieni darebbero 2,30. Non letto: la spunta tenue. */
                <CheckCheck
                  className={cn(
                    "h-4 w-4",
                    message.is_read
                      ? isEmployer
                        ? "text-[hsl(var(--brand-orange-chiaro))]"
                        : "text-[hsl(var(--letto-su-worker))]"
                      : "opacity-60"
                  )}
                  aria-label={message.is_read ? "Letto" : "Inviato"}
                />
              ))}
          </div>

          {/* Desktop: rispondere col passaggio del mouse. */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply(message);
            }}
            aria-label="Rispondi"
            className="absolute -left-10 top-1/2 hidden -translate-y-1/2 rounded-full p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 md:block"
          >
            <Reply className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {fallito && (
          <button
            type="button"
            onClick={() => onRiprova?.(message)}
            className="mt-1 self-end text-xs font-medium text-danger transition-opacity active:opacity-60"
          >
            Non inviato · Tocca per riprovare
          </button>
        )}
       </div>
      </motion.div>
    </div>
  );
};
