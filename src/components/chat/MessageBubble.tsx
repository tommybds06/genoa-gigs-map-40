import { useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { CheckCheck, Reply } from "lucide-react";
import { OrologioIcon } from "@/components/icons/uiIcons";
import { useAttachmentUrl } from "@/hooks/useAttachmentUrl";
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
  /** Il messaggio prima è della stessa persona, vicino nel tempo: stesso gruppo. */
  continuaGruppo: boolean;
  /** Il messaggio dopo NON è della stessa persona: chiude il gruppo. */
  chiudeGruppo: boolean;
  /** Rimanda un messaggio che non è partito. */
  onRiprova?: (message: Messaggio) => void;
}

const SWIPE_THRESHOLD = 50; // px per far scattare la risposta

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
 */
export const MessageBubble = ({
  message,
  isOwn,
  isEmployer,
  onReply,
  continuaGruppo,
  chiudeGruppo,
  onRiprova,
}: MessageBubbleProps) => {
  const [, setShowReplyIcon] = useState(false);
  const attachmentUrl = useAttachmentUrl(message.attachment_url);
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
    <div className={cn("group relative flex", isOwn ? "justify-end" : "justify-start", continuaGruppo ? "mt-0.5" : "mt-3")}>
      {!isOwn && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-muted p-2"
          style={{ opacity: replyIconOpacity, scale: replyIconScale }}
        >
          <Reply className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      )}

      <motion.div
        className="flex max-w-[78%] flex-col"
        drag={!isOwn ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDrag={(_, info) => setShowReplyIcon(info.offset.x > 20)}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
      >
        <div
          ref={ref}
          className={cn("relative px-3.5 pb-1.5 pt-2", colori, fallito && "opacity-70")}
          // Finché non c'è la misura, un raggio CSS: niente lampo squadrato.
          style={clipPath ? { clipPath } : { borderRadius: 18 }}
        >
          {message.reply_to && (
            <div className={cn("mb-1.5 rounded-lg border-l-2 px-2.5 py-1 text-xs", coloriCitazione)}>
              <p className="line-clamp-2 font-medium opacity-90">{message.reply_to.content}</p>
            </div>
          )}

          {attachmentUrl && (
            <div className="-mx-1.5 mb-1.5 mt-0.5">
              <img src={attachmentUrl} alt="Allegato" className="h-auto max-h-64 max-w-full rounded-xl object-cover" />
            </div>
          )}

          {message.content && message.content !== "📷 Foto" && (
            <p className="message-content select-text text-[15px] leading-snug">{message.content}</p>
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
          {!isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
              }}
              className="absolute -left-10 top-1/2 hidden -translate-y-1/2 rounded-full p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 md:block"
            >
              <Reply className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {fallito && (
          <button
            type="button"
            onClick={() => onRiprova?.(message)}
            className="mt-1 self-end text-xs font-medium text-danger"
          >
            Non inviato · Tocca per riprovare
          </button>
        )}
      </motion.div>
    </div>
  );
};
