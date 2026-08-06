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
 *   - PIENO   = stato attivo, quello che conta adesso (Assunto, Accettato)
 *   - CONTORNO = stato in sospeso o concluso, che deve arretrare
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
    className: "bg-employer text-employer-foreground border-transparent",
    icon: CheckCircle,
  },
  completed: {
    label: "Concluso",
    className: "bg-transparent text-neutral border-neutral",
    icon: Check,
  },
  pending: {
    label: "In Attesa",
    className: "bg-transparent text-warning border-warning",
  },
  rejected: {
    label: "Rifiutato",
    className: "bg-transparent text-danger border-danger",
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
      className={cn("shrink-0 text-xs font-semibold gap-0.5", cfg.className, className)}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </Badge>
  );
}
