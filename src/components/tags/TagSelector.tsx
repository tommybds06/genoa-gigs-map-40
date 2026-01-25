import { ROLE_TAGS, TYPE_TAGS } from "@/constants/tags";
import { cn } from "@/lib/utils";
import { getTagClasses, getTagSelectedClasses, isBlueTag } from "@/lib/tagColors";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export function TagSelector({ selectedTags, onChange, className }: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Role Tags - Orange */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Ruoli</h4>
        <div className="flex flex-wrap gap-2">
          {ROLE_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  getTagSelectedClasses(tag, isSelected)
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type Tags - Blue */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Modalità</h4>
        <div className="flex flex-wrap gap-2">
          {TYPE_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  getTagSelectedClasses(tag, isSelected)
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Display-only version for showing tags
// Uses the corrected logic: TYPE_TAGS = Blue, everything else (including custom) = Orange
export function TagBadges({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
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
