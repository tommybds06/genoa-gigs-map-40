import { useState } from "react";
import { ROLE_TAGS, TYPE_TAGS } from "@/constants/tags";
import { cn } from "@/lib/utils";
import { getTagClasses, getTagSelectedClasses, isBlueTag } from "@/lib/tagColors";
import { getJobIcon } from "@/lib/jobIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PiuIcon } from "@/components/icons/uiIcons";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
  /** Mostra la sezione Durata (blu). Default: true. Nelle preferenze si passa false. */
  showDuration?: boolean;
  /** Layout dei ruoli: "chips" (pillole) o "grid" (riquadri quadrati). Default: "chips". */
  roleLayout?: "chips" | "grid";
}

export function TagSelector({
  selectedTags,
  onChange,
  className,
  showDuration = true,
  roleLayout = "chips",
}: TagSelectorProps) {
  const [customInput, setCustomInput] = useState("");
  const { theme } = useAppTheme();

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  // Ruoli custom = tag selezionati che non sono né ruoli né modalità predefiniti
  const predefined = [...ROLE_TAGS, ...TYPE_TAGS] as readonly string[];
  const customRoles = selectedTags.filter((t) => !predefined.includes(t));

  const addCustomRole = () => {
    const value = customInput.trim();
    if (!value) return;
    if (selectedTags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setCustomInput("");
      return;
    }
    onChange([...selectedTags, value]);
    setCustomInput("");
  };

  const isGrid = roleLayout === "grid";

  const renderRole = (tag: string, isSelected: boolean, isCustom: boolean) => {
    const Icon = getJobIcon(tag);
    if (isGrid) {
      return (
        <button
          key={tag}
          type="button"
          onClick={() => toggleTag(tag)}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 sagoma-tag rounded-[28px] text-sm font-medium transition-all border-2",
            // ⚠️ Il selezionato era `bg-primary` fisso, cioe' ARANCIONE anche in
            // "Crea annuncio", dove tutto il resto e' blu. Non si notava finche'
            // il non-selezionato usava un accent ambra fisso; da quando `--accent`
            // segue il ruolo, la tessera scelta stonava con le altre.
            isSelected
              ? `${theme.btnFilled} border-transparent`
              : "bg-accent text-accent-foreground border-transparent hover:bg-accent/70"
          )}
        >
          <Icon className="w-7 h-7 shrink-0" />
          <span className="text-xs text-center leading-tight flex items-center gap-1">
            {tag}
            {isCustom && <X className="w-3 h-3 opacity-70" />}
          </span>
        </button>
      );
    }
    return (
      <button
        key={tag}
        type="button"
        onClick={() => toggleTag(tag)}
        className={cn(
          // sagoma-chip: il fondo e' ritagliato sul disegno di Tommaso.
          // Il raggio serve da fallback dove la maschera non c'e' (vedi index.css).
          "inline-flex items-center gap-1.5 px-3 py-1.5 sagoma-chip rounded-full text-sm font-medium transition-all",
          getTagSelectedClasses(tag, isSelected)
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {tag}
        {isCustom && <X className="w-3.5 h-3.5 opacity-70" />}
      </button>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Role Tags - Orange */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Ruoli</h4>
        <div className={cn(isGrid ? "grid grid-cols-3 gap-2" : "flex flex-wrap gap-2")}>
          {ROLE_TAGS.map((tag) => renderRole(tag, selectedTags.includes(tag), false))}
          {customRoles.map((tag) => renderRole(tag, true, true))}
        </div>

        {/* Ruolo personalizzabile */}
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomRole();
              }
            }}
            placeholder="Aggiungi un ruolo personalizzato…"
            maxLength={30}
            className="text-sm"
          />
          <Button
            type="button"
            onClick={addCustomRole}
            disabled={!customInput.trim()}
            className="shrink-0"
          >
            <PiuIcon className="w-4 h-4" />
            Aggiungi
          </Button>
        </div>
      </div>

      {/* Type Tags - Blue (durata) */}
      {showDuration && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Durata</h4>
          <div className="flex flex-wrap gap-2">
            {TYPE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 sagoma-chip rounded-full text-sm font-medium transition-all",
                    getTagSelectedClasses(tag, isSelected)
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Display-only version for showing tags
// Uses the corrected logic: TYPE_TAGS = Blue, everything else (including custom) = Orange
// Tags are sorted: Role tags (Orange) first, then Type tags (Blue)
export function TagBadges({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags || tags.length === 0) return null;

  // Sort tags: Role tags (non-blue) first, then Type tags (blue)
  const sortedTags = [...tags].sort((a, b) => {
    const aIsBlue = isBlueTag(a);
    const bIsBlue = isBlueTag(b);

    // If one is blue and one is not, non-blue (role) comes first
    if (aIsBlue && !bIsBlue) return 1;
    if (!aIsBlue && bIsBlue) return -1;

    // Keep original order within each group
    return 0;
  });

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {sortedTags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            getTagClasses(tag)
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
