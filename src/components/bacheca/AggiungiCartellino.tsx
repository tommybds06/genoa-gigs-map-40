import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  CHIAVE_CANDIDATI,
  CHIAVE_CARTELLINI,
  useCandidatiDaAppendere,
} from "@/hooks/useCartellini";
import { appendi } from "@/lib/bacheca";
import { cn } from "@/lib/utils";
import { Iniziali } from "./CartellinoCard";

interface AggiungiCartellinoProps {
  aperto: boolean;
  onClose: () => void;
}

/**
 * IL «+» — appende IN PROVA una persona di cui hai accettato la candidatura.
 *
 * Non assume nessuno: la candidatura resta `accepted`. Chi viene assunto
 * (dalla chat o dalla scheda del cartellino) finisce sulla bacheca da solo,
 * quindi qui compaiono solo le persone in colloquio non ancora appese.
 */
export function AggiungiCartellino({ aperto, onClose }: AggiungiCartellinoProps) {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { data: candidati = [], isLoading, error } = useCandidatiDaAppendere(user?.id, aperto);
  const [inCorso, setInCorso] = useState<string | null>(null);

  const appendiCandidato = async (i: number) => {
    const candidato = candidati[i];
    if (!user || !candidato) return;
    setInCorso(candidato.applicationId);
    try {
      await appendi(candidato, user.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [CHIAVE_CARTELLINI] }),
        queryClient.invalidateQueries({ queryKey: [CHIAVE_CANDIDATI] }),
      ]);
      toast.success(`${candidato.nome} è in bacheca, in prova`, { duration: 2000 });
      onClose();
    } catch (e) {
      console.error("Appendi cartellino:", e);
      toast.error("Non sono riuscito ad appenderlo");
    } finally {
      setInCorso(null);
    }
  };

  return (
    <Drawer open={aperto} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="min-h-0 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="p-0 pt-1 text-left">
            <DrawerTitle className="titolo-sezione text-2xl font-normal leading-[1.9375rem] tracking-[-0.05em]">
              Aggiungi alla bacheca
            </DrawerTitle>
            <DrawerDescription className="text-[13px] text-muted-foreground">
              Le persone di cui hai accettato la candidatura. Entrano in prova: le assumi quando vuoi.
            </DrawerDescription>
          </DrawerHeader>

          <div className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <p className="py-6 text-center text-[15px] text-muted-foreground">
                Non riesco a caricare l'elenco. Riprova tra poco.
              </p>
            ) : candidati.length === 0 ? (
              <p className="py-6 text-center text-[15px] text-muted-foreground">
                Nessuno da aggiungere. Qui compare chi accetti da Annunci, finché non è in bacheca.
              </p>
            ) : (
              <ul>
                {candidati.map((p, i) => (
                  <li
                    key={p.applicationId}
                    className={cn("flex items-center gap-3 py-3", i > 0 && "linea-divisoria-sopra")}
                  >
                    <div className="sagoma-foto h-12 w-12 shrink-0 overflow-hidden bg-paper-sunken">
                      {p.foto ? (
                        <img src={p.foto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Iniziali nome={p.nome} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="titolo-mini truncate">{p.nome}</p>
                      <p className="truncate text-[13px] text-muted-foreground">{p.mestiere}</p>
                    </div>
                    <Button
                      size="sm"
                      className={cn("shrink-0", theme.btnFilled, theme.btnFilledHover)}
                      disabled={inCorso !== null}
                      onClick={() => appendiCandidato(i)}
                    >
                      {inCorso === p.applicationId && <Loader2 className="animate-spin" />}
                      Appendi
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
