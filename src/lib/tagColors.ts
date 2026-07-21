import { isTypeTag } from "@/constants/tags";

/**
 * Determines if a tag should be displayed with BLUE color.
 * Only TYPE_TAGS (Occasionale, Weekend, etc.) are blue.
 * All other tags (predefined roles AND custom roles) are ORANGE.
 */
export const isBlueTag = (tag: string): boolean => {
  return isTypeTag(tag);
};

/**
 * Get the badge classes for a tag.
 * TYPE_TAGS = Blue, Everything else (including custom) = Orange
 */
export const getTagClasses = (tag: string): string => {
  if (isBlueTag(tag)) {
    return "bg-employer-50 text-employer";
  }
  return "bg-accent text-accent-foreground";
};

/**
 * Get the selected state classes for a tag (for forms/selectors)
 */
export const getTagSelectedClasses = (tag: string, isSelected: boolean): string => {
  if (isBlueTag(tag)) {
    return isSelected
      ? "bg-employer text-employer-foreground shadow-md"
      : "bg-employer-50 text-employer hover:bg-employer-100";
  }
  return isSelected
    ? "bg-primary text-primary-foreground shadow-md"
    : "bg-accent text-accent-foreground hover:bg-primary/20";
};
