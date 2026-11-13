import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { DocumentoIcon, SearchIcon, XIcon } from "@/components/icons/uiIcons";
import { useAllegato } from "@/hooks/useAttachmentUrl";
import { MISURA_FOTO } from "@/lib/foto";
import { eSegnaposto, nomeAllegato, tipoAllegato } from "@/lib/allegati";
import { cercaMessaggi, ritaglio } from "@/lib/chatLista";
import { etichettaGiorno, oraMessaggio } from "@/lib/dates";
import type { Messaggio } from "@/hooks/useMessaggi";
import { cn } from "@/lib/utils";

/**
 * «CERCA IN CHAT» — la lente nella testata della chat (13 novembre).
 *
 * Tommaso: «non si può cercare nella chat e vedere tipo i media inviati».
 * Una scheda sola per le due cose, perché rispondono alla stessa domanda
 * («dov'era quella cosa?»):
 * - campo VUOTO → **Foto** | **Documenti** mandati in questa chat, dal più
 *   recente;
 * - si SCRIVE → i messaggi che contengono il testo (senza badare ad accenti
 *   e maiuscole), col pezzo trovato in evidenza.
 *
 * Toccando una foto o un risultato la scheda si chiude e la chat scorre a
 * quel messaggio (`onVai`), che lampeggia: si ritrova la cosa DENTRO il
 * discorso. Un documento invece si apre: è quello che si vuole da un PDF.
 *
 * - I messaggi sono già tutti in memoria (`useMessaggi`): cercare non va in
 *   rete, quindi risponde a ogni lettera.
 * - Alta FISSA (`h-[88dvh]`): cambiando linguetta o scrivendo non salta.
 * - La tastiera NON si apre da sola: coprirebbe le foto, e chi ha toccato la
 *   lente magari voleva quelle (come la scelta del quartiere, §22).
 * - I messaggi automatici non si cercano: non li ha scritti nessuno.
 * - `z-[70]`: sopra la chat aperta (§16).
 */
type Vista = "foto" | "documenti";

const testoCercabile = (m: Messaggio) => {
  if (m.is_system) return "";
  if (!eSegnaposto(m.content)) return m.content ?? "";
  return tipoAllegato(m.attachment_url) === "documento" ? nomeAllegato(m.attachment_url!) : "";
};

const quando = (iso: string) => `${etichettaGiorno(iso)}, ${oraMessaggio(iso)}`;

function Miniatura({ m, storta, onVai }: { m: Messaggio; storta: boolean; onVai: (id: string) => void }) {
  const { url, ripiega, caricata } = useAllegato(m.attachment_url, MISURA_FOTO.miniatura);
  return (
    <button
      type="button"
      onClick={() => onVai(m.id)}
      aria-label={`Foto, ${quando(m.created_at)}`}
      className="aspect-square w-full transition-transform active:scale-95"
    >
      {/* La maschera sul div interno: sul bottone taglierebbe l'anello del fuoco (§6). */}
      <div className={cn("h-full w-full bg-paper-sunken", storta ? "sagoma-foto-b" : "sagoma-foto")}>
        {url && (
          <img
            src={url}
            onError={ripiega}
            onLoad={caricata}
            decoding="async"
            loading="lazy"
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </button>
  );
}

function RigaDocumento({ m, chi }: { m: Messaggio; chi: string }) {
  // Un link vero con l'indirizzo già firmato: aprire una finestra dopo
  // un'attesa, su iPhone, viene bloccato come popup (vedi MessageBubble).
  const { url } = useAllegato(m.attachment_url);
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="linea-divisoria-sottile flex items-center gap-3 py-3 active:opacity-60"
    >
      <DocumentoIcon className="h-7 w-7 shrink-0 text-ink-soft" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 break-all text-[15px] font-medium leading-snug">
          {nomeAllegato(m.attachment_url!)}
        </span>
        <span className="block text-[13px] text-ink-soft">
          {chi} · {quando(m.created_at)}
        </span>
      </span>
    </a>
  );
}

export function CercaInChat({
  aperta,
  messaggi,
  mioId,
  nomeAltro,
  isEmployer,
  onChiudi,
  onVai,
}: {
  aperta: boolean;
  messaggi: Messaggio[];
  mioId: string | undefined;
  nomeAltro: string;
  isEmployer: boolean;
  onChiudi: () => void;
  onVai: (idMessaggio: string) => void;
}) {
  const [cerca, setCerca] = useState("");
  const [vista, setVista] = useState<Vista>("foto");
  // Ogni apertura riparte pulita (la scheda resta montata).
  useEffect(() => {
    if (aperta) setCerca("");
  }, [aperta]);

  const { foto, documenti } = useMemo(() => {
    const conAllegato = messaggi.filter((m) => !!m.attachment_url && !m.stato).reverse();
    return {
      foto: conAllegato.filter((m) => tipoAllegato(m.attachment_url) === "foto"),
      documenti: conAllegato.filter((m) => tipoAllegato(m.attachment_url) === "documento"),
    };
  }, [messaggi]);
  const trovati = useMemo(() => cercaMessaggi(messaggi, cerca, testoCercabile), [messaggi, cerca]);
  const staCercando = cerca.trim().length >= 2;
  const chi = (m: Messaggio) => (m.sender_id === mioId ? "Tu" : nomeAltro);
  const inchiostro = isEmployer ? "text-employer-800" : "text-primary-strong";

  const linguetta = (v: Vista, nome: string, n: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={vista === v}
      onClick={() => setVista(v)}
      className={cn(
        "h-full flex-1 rounded-[15px] font-[Shinjo,Outfit,sans-serif] text-[15px] tracking-[-0.04em] [font-synthesis:none]",
        vista === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
      )}
    >
      {nome}
      {n > 0 && <span className="ml-1.5 font-sans text-[13px] tracking-normal text-ink-soft">{n}</span>}
    </button>
  );
  const vuoto = (testo: string) => <p className="px-4 py-10 text-center text-sm text-ink-soft">{testo}</p>;

  return (
    <Drawer open={aperta} onOpenChange={(o) => !o && onChiudi()}>
      <DrawerContent className="z-[70] h-[88dvh]" overlayClassName="z-[70]">
        <div className="flex min-h-0 flex-1 flex-col px-4">
          <DrawerHeader className="p-0 pb-3 text-left">
            <DrawerTitle className="titolo-sezione text-2xl font-normal leading-[1.9375rem] tracking-[-0.05em]">
              Cerca in chat
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Cerca nei messaggi, o guarda foto e documenti mandati in questa chat
            </DrawerDescription>
          </DrawerHeader>

          <div className="relative shrink-0">
            {/* z-10: il guscio del campo è `relative` e coprirebbe l'icona (§6). */}
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-ink-soft" />
            <Input
              value={cerca}
              onChange={(e) => setCerca(e.target.value)}
              placeholder="Cerca nei messaggi"
              aria-label="Cerca nei messaggi"
              enterKeyHint="search"
              autoComplete="off"
              className="pl-11 pr-11"
            />
            {cerca && (
              <button
                type="button"
                onClick={() => setCerca("")}
                aria-label="Cancella"
                className="absolute right-0 top-0 z-10 flex h-full w-11 items-center justify-center text-ink-soft active:opacity-60"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {staCercando ? (
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              {trovati.length === 0
                ? vuoto(`Nessun messaggio con «${cerca.trim()}»`)
                : trovati.map((t) => {
                    const r = ritaglio(t);
                    return (
                      <button
                        key={t.messaggio.id}
                        type="button"
                        onClick={() => onVai(t.messaggio.id)}
                        className="linea-divisoria-sottile block w-full py-2.5 text-left active:opacity-60"
                      >
                        <span className="block text-[13px] text-ink-soft">
                          {chi(t.messaggio)} · {quando(t.messaggio.created_at)}
                        </span>
                        <span className="line-clamp-2 text-[15px] leading-snug text-ink">
                          {r.prima}
                          <span className={cn("font-semibold", inchiostro)}>{r.trovato}</span>
                          {r.dopo}
                        </span>
                      </button>
                    );
                  })}
            </div>
          ) : (
            <>
              <div role="tablist" className="sagoma-quartiere mt-3 flex h-12 shrink-0 rounded-[19px] bg-muted p-1">
                {linguetta("foto", "Foto", foto.length)}
                {linguetta("documenti", "Documenti", documenti.length)}
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
                {vista === "foto" ? (
                  foto.length === 0 ? (
                    vuoto("Nessuna foto in questa chat")
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {foto.map((m, i) => (
                        <Miniatura key={m.id} m={m} storta={i % 2 === 1} onVai={onVai} />
                      ))}
                    </div>
                  )
                ) : documenti.length === 0 ? (
                  vuoto("Nessun documento in questa chat")
                ) : (
                  documenti.map((m) => <RigaDocumento key={m.id} m={m} chi={chi(m)} />)
                )}
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
