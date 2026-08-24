import { Check, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Badge di stato — SORGENTE UNICA per tutta l'app.
 *
 * Prima ogni schermata se lo ridisegnava: "Assunto" era verde pieno in Messaggi
 * e verde tenue in Candidature, "Concluso" era verde nei messaggi e grigio nelle
 * candidature. Cinque linguaggi diversi per cinque stati.
 *
 * La regola ora e' una sola:
 *   - PIENO FORTE = stato attivo, quello che conta adesso (Assunto, Accettato)
 *   - PIENO TENUE = stato in sospeso o concluso, che deve arretrare
 *
 * ⚠️ Erano a CONTORNO, e accanto alle card tagliate a mano quel filo da 1px
 * era la cosa piu' "fatta col CSS" della schermata. Convertiti ai fondi
 * "-soft" gia' definiti nei token: la gerarchia resta (forte contro tenue) e
 * la sagoma disegnata puo' ritagliarli come i chip, perche' ora c'e' un
 * riempimento da tagliare invece di una linea da mozzare.
 */
export type StatoCandidatura =
  | "pending"
  | "accepted"
  | "hired"
  | "rejected"
  | "completed";

const CONFIG: Record<
  StatoCandidatura,
  { label: string; className: string; icon?: typeof Check }
> = {
  hired: {
    label: "Assunto",
    className: "bg-success text-success-foreground border-transparent",
    icon: CheckCircle,
  },
  accepted: {
    label: "Accettato",
    className: "bg-employer-700 text-employer-foreground border-transparent",
    icon: CheckCircle,
  },
  completed: {
    label: "Concluso",
    className: "bg-neutral-soft text-neutral-soft-foreground border-transparent",
    icon: Check,
  },
  pending: {
    label: "In Attesa",
    className: "bg-warning-soft text-warning-soft-foreground border-transparent",
  },
  rejected: {
    label: "Rifiutato",
    className: "bg-danger-soft text-danger-soft-foreground border-transparent",
  },
};

interface StatusBadgeProps {
  stato: string | null | undefined;
  className?: string;
}

export function StatusBadge({ stato, className }: StatusBadgeProps) {
  const cfg = CONFIG[(stato as StatoCandidatura) ?? "pending"] ?? CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        // sagoma-badge: stesso disegno dei chip, riscalato su un'altezza di ~26px
        "shrink-0 text-xs font-semibold gap-1 py-1 sagoma-badge rounded-full",
        cfg.className,
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </Badge>
  );
}
