import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Un quarto più breve di prima (Tommaso, 24 ottobre): di serie 3 s
      // invece dei 4 di sonner; le durate scritte nelle chiamate sono state
      // accorciate della stessa misura.
      duration={3000}
      toastOptions={{
        classNames: {
          // Il riquadro è un pezzo di SCOTCH lungo allungato: tutto in
          // index.css («I TOAST»), fuori dai layer per battere lo stile di sonner.
          toast: "toast toast-scotch",
          // Inchiostro anche la descrizione: il grigio sul nastro starebbe a ~3:1.
          description: "!text-ink/80",
          // ⚠️ Era `group-[.toast]:bg-primary`: cerca un genitore che sia
          // insieme `.group` e `.toast`, e non c'è (il `.group` è il
          // contenitore) — il bottone restava il bianco di serie di sonner.
          // Ora un chip disegnato in inchiostro, leggibile sul nastro per
          // tutti e due i ruoli.
          actionButton: "sagoma-chip !rounded-full !bg-ink !px-3 !font-semibold !text-paper-sheet",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
