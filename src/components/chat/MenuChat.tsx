import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { OcchioChiusoIcon } from "@/components/icons/uiIcons";
import { Puntina1 } from "@/components/icons/puntine";
import { useUltimoAperto } from "@/hooks/useUltimoAperto";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { Chat } from "@/hooks/useChats";

/**
 * IL MENU DI UNA CHAT — tenendola premuta nella lista (13 novembre).
 *
 * Tommaso: «non si può nemmeno eliminare o fissare una chat se tieni premuto».
 * - **Fissa in alto** / **Togli dall'alto** — la puntina della bacheca: è lo
 *   stesso gesto, appendere una cosa per ritrovarla.
 * - **Nascondi** — decisione sua: NON si cancella. La chat sparisce dalla mia
 *   lista e torna da sola se arriva un messaggio; i messaggi restano, perché
 *   sono la traccia degli accordi di un'assunzione. Per questo la voce dice
 *   «Nascondi» e non «Elimina», e sotto c'è scritto cosa succede: una voce
 *   che si chiama «Elimina» e poi fa ricomparire la chat sarebbe una bugia.
 *
 * Stessa scheda del menu di un messaggio (`MenuMessaggio`); resta montata con
 * l'ultima chat, così chiudendo scende (§16).
 */
export function MenuChat({
  chat,
  onChiudi,
  onFissa,
  onNascondi,
}: {
  chat: Chat | null;
  onChiudi: () => void;
  onFissa: (c: Chat, fissa: boolean) => void;
  onNascondi: (c: Chat) => void;
}) {
  const { isEmployer } = useAppTheme();
  const [c, aperto] = useUltimoAperto(chat);
  if (!c) return null;
  const fissata = !!c.fissata_il;
  const riga = "flex w-full items-center gap-3 py-3 text-left active:opacity-60 linea-divisoria-sottile";

  return (
    <Drawer open={aperto} onOpenChange={(o) => !o && onChiudi()}>
      <DrawerContent>
        <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="p-0 pb-2 text-left">
            <DrawerTitle className="titolo-mini font-normal">{c.other_user?.full_name || "Utente"}</DrawerTitle>
            <DrawerDescription className="truncate text-[13px] text-ink-soft">
              {c.job?.title || "Chat"}
            </DrawerDescription>
          </DrawerHeader>

          <button
            type="button"
            className={riga}
            onClick={() => {
              onChiudi();
              onFissa(c, !fissata);
            }}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              <Puntina1 className={isEmployer ? "h-6 w-auto text-employer-700" : "h-6 w-auto text-primary"} />
            </span>
            <span className="text-[16px]">{fissata ? "Togli dall'alto" : "Fissa in alto"}</span>
          </button>

          <button
            type="button"
            className={riga}
            onClick={() => {
              onChiudi();
              onNascondi(c);
            }}
          >
            <OcchioChiusoIcon className="h-6 w-6 shrink-0 text-ink-soft" />
            <span className="min-w-0 flex-1">
              <span className="block text-[16px]">Nascondi</span>
              <span className="block text-sm text-ink-soft">
                Sparisce dalla tua lista e torna se arriva un messaggio. I messaggi restano.
              </span>
            </span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
