import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENOA_NEIGHBORHOODS } from "@/constants/geofencing";
import { MapPin } from "lucide-react";
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

export function NeighborhoodSelect({
  value,
  onValueChange,
  placeholder = "Seleziona quartiere",
  className,
  disabled = false,
  error = false,
  variant = "default",
}: NeighborhoodSelectProps) {
  const triggerClasses = cn(
    "w-full",
    error && "border-destructive",
    variant === "employer" && "focus:ring-blue-500 border-blue-200",
    variant === "worker" && "focus:ring-primary border-primary/20",
    className
  );

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClasses}>
        <div className="flex items-center gap-2">
          <MapPin className={cn(
            "w-4 h-4",
            variant === "employer" ? "text-blue-600" : "text-primary"
          )} />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {GENOA_NEIGHBORHOODS.map((neighborhood) => (
          <SelectItem key={neighborhood} value={neighborhood}>
            {neighborhood}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
