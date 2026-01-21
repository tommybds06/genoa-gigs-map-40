import { ROLE_TAGS, TYPE_TAGS, isRoleTag } from "@/constants/tags";
import { cn } from "@/lib/utils";

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
                  isSelected
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
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
                  isSelected
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
export function TagBadges({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            isRoleTag(tag)
              ? "bg-orange-100 text-orange-700"
              : "bg-blue-100 text-blue-700"
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
