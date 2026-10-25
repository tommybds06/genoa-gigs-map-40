import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { GENOA_NEIGHBORHOODS } from "@/constants/geofencing";
import { MappaIcon, SearchIcon } from "@/components/icons/uiIcons";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useAppTheme } from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";

interface NeighborhoodSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  variant?: "default" | "employer" | "worker";
}

/** «Sant'Ilario» si trova scrivendo «santilario», «sant ilario» o «SANT'ILARIO». */
const pulisci = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

/**
 * LA SCELTA DEL QUARTIERE (Tommaso, 24 ottobre: «poco personalizzata e
 * responsiva»). Era il menu a tendina generico (Radix Select): un riquadro
 * col bordo CSS e l'ombra di serie, e su 39 quartieri si scorreva con la
 * freccetta in fondo invece che col dito.
 *
 * Ora il campo apre una SCHEDA DAL BASSO, la stessa dell'app (bordo a mano e
 * fessura), come fanno Google Maps e le app di consegna per gli elenchi
 * lunghi su telefono:
 * - un campo per cercare (senza accenti, apostrofi e maiuscole);
 * - righe alte 44 px (il minimo da pollice), che scorrono col dito;
 * - le lettere dell'alfabeto come piccoli titoli, per orientarsi scorrendo;
 * - il quartiere scelto nell'inchiostro del ruolo, con la spunta.
 * La tastiera NON si apre da sola: coprirebbe mezzo elenco, e la maggior
 * parte delle volte basta scorrere.
 */
export function NeighborhoodSelect({
  value,
  onValueChange,
  placeholder = "Seleziona quartiere",
  className,
  disabled = false,
  error = false,
  variant = "default",
}: NeighborhoodSelectProps) {
  const { isEmployer } = useAppTheme();
  const [aperta, setAperta] = useState(false);
  const [cerca, setCerca] = useState("");

  const blu = variant === "employer" || (variant === "default" && isEmployer);
  const inchiostro = blu ? "text-employer-800" : "text-primary-strong";

  const gruppi = useMemo(() => {
    const q = pulisci(cerca);
    const trovati = GENOA_NEIGHBORHOODS.filter((n) => !q || pulisci(n).includes(q));
    const perLettera = new Map<string, string[]>();
    for (const n of trovati) {
      const lettera = n[0].toUpperCase();
      perLettera.set(lettera, [...(perLettera.get(lettera) ?? []), n]);
    }
    return [...perLettera.entries()];
  }, [cerca]);

  const scegli = (n: string) => {
    onValueChange(n);
    setAperta(false);
    setCerca("");
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAperta(true)}
        aria-haspopup="dialog"
        className={cn(
          "campo-guscio flex h-12 w-full items-center gap-2 rounded-xl border border-input bg-field px-4 text-left text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          error && "border-destructive",
          className
        )}
      >
        <MappaIcon className={cn("h-4 w-4 shrink-0", inchiostro)} />
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      <Drawer
        open={aperta}
        onOpenChange={(o) => {
          setAperta(o);
          if (!o) setCerca("");
        }}
      >
        <DrawerContent className="h-[85vh]">
          <div className="flex min-h-0 flex-1 flex-col px-4">
            <DrawerHeader className="gap-0 p-0 text-left">
              <DrawerTitle className="titolo-sezione text-2xl font-normal">In che zona?</DrawerTitle>
              <DrawerDescription className="sr-only">Scegli il tuo quartiere di Genova</DrawerDescription>
            </DrawerHeader>

            <div className="relative mt-3">
              {/* `z-10`: il guscio del campo copre le icone messe prima (§6). */}
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={cerca}
                onChange={(e) => setCerca(e.target.value)}
                placeholder="Cerca un quartiere"
                aria-label="Cerca un quartiere"
                autoComplete="off"
                autoCorrect="off"
                className="pl-11"
              />
            </div>

            <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
              {gruppi.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nessun quartiere con questo nome
                </p>
              ) : (
                gruppi.map(([lettera, nomi]) => (
                  <section key={lettera}>
                    <h3 className="titolo-mini px-3 pb-0.5 pt-3 text-ink-soft">{lettera}</h3>
                    {nomi.map((n) => {
                      const scelto = n === value;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => scegli(n)}
                          aria-pressed={scelto}
                          className={cn(
                            // `sagoma-quartiere`: la sagoma disegnata per le righe larghe e
                            // basse, tarata proprio su 44 px (22 + 22). Ritaglia il fondo
                            // della riga scelta e quello del tocco.
                            "sagoma-quartiere flex min-h-[44px] w-full items-center justify-between rounded-[19px] px-3 text-left text-base transition-colors active:bg-accent",
                            scelto && cn("bg-accent font-semibold", inchiostro)
                          )}
                        >
                          {n}
                          {scelto && <Check className="h-5 w-5 shrink-0" />}
                        </button>
                      );
                    })}
                  </section>
                ))
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
