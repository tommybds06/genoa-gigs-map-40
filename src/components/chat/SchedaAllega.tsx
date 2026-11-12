import { useRef, type ChangeEvent, type ComponentType, type SVGProps } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TesseraIcona } from "@/components/ui/Tessera";
import { DocumentoIcon, FotoIcon, ImmaginiIcon } from "@/components/icons/uiIcons";

/**
 * «ALLEGA» — la scheda che si apre dal bottone a sinistra del campo, in chat
 * (12 novembre).
 *
 * Tommaso: «non si può mandare foto scattandole sul momento, non si può
 * allegare cose che non siano immagini». Il bottone apriva direttamente il
 * selettore di foto del telefono, che su Android (13 in poi) è la galleria e
 * basta: la fotocamera lì dentro non c'è. Ora tre voci, come nelle app di
 * messaggi:
 * - **Scatta una foto** — `capture="environment"`: apre la fotocamera;
 * - **Galleria** — il selettore di foto di prima;
 * - **Documento** — solo PDF (`lib/allegati.ts`).
 *
 * ⚠️ I tre `<input type="file">` stanno FUORI dalla scheda e restano montati:
 * la scheda si chiude appena si sceglie una voce, e un input smontato mentre
 * il selettore del telefono è aperto perde il file scelto.
 * ⚠️ `z-[70]`: la chat aperta è `z-[60]` (§16).
 */
export type TipoScelta = "foto" | "documento";

interface Voce {
  chiave: "scatta" | "galleria" | "documento";
  titolo: string;
  riga: string;
  icona: ComponentType<SVGProps<SVGSVGElement>>;
}

const VOCI: Voce[] = [
  { chiave: "scatta", titolo: "Scatta una foto", riga: "Con la fotocamera, adesso", icona: FotoIcon },
  { chiave: "galleria", titolo: "Galleria", riga: "Una foto che hai già", icona: ImmaginiIcon },
  { chiave: "documento", titolo: "Documento", riga: "Un PDF, per esempio il CV · fino a 10 MB", icona: DocumentoIcon },
];

export function SchedaAllega({
  aperta,
  onChiudi,
  onFile,
}: {
  aperta: boolean;
  onChiudi: () => void;
  onFile: (file: File, tipo: TipoScelta) => void;
}) {
  const scatta = useRef<HTMLInputElement>(null);
  const galleria = useRef<HTMLInputElement>(null);
  const documento = useRef<HTMLInputElement>(null);
  const campi = { scatta, galleria, documento };

  const scelto = (tipo: TipoScelta) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Svuotato subito: scegliere due volte lo stesso file deve funzionare.
    e.target.value = "";
    if (file) onFile(file, tipo);
  };

  return (
    <>
      <input ref={scatta} type="file" accept="image/*" capture="environment" onChange={scelto("foto")} className="hidden" />
      <input ref={galleria} type="file" accept="image/*" onChange={scelto("foto")} className="hidden" />
      <input ref={documento} type="file" accept="application/pdf,.pdf" onChange={scelto("documento")} className="hidden" />

      <Drawer open={aperta} onOpenChange={(o) => !o && onChiudi()}>
        <DrawerContent className="z-[70]" overlayClassName="z-[70]">
          <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <DrawerHeader className="p-0 pb-1 text-left">
              <DrawerTitle className="titolo-sezione text-2xl font-normal leading-[1.9375rem] tracking-[-0.05em]">
                Allega
              </DrawerTitle>
              <DrawerDescription className="sr-only">Scegli cosa mandare in chat</DrawerDescription>
            </DrawerHeader>
            {VOCI.map((v, i) => (
              <button
                key={v.chiave}
                type="button"
                onClick={() => {
                  // Prima il selettore (serve il tocco dell'utente), poi si chiude.
                  campi[v.chiave].current?.click();
                  onChiudi();
                }}
                className={`flex w-full items-center gap-3 py-3 text-left active:opacity-60 ${i > 0 ? "linea-divisoria-sottile" : ""}`}
              >
                <TesseraIcona icona={v.icona} />
                <span className="min-w-0 flex-1">
                  <span className="titolo-mini block">{v.titolo}</span>
                  <span className="block text-sm text-ink-soft">{v.riga}</span>
                </span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
