import { 
  Bike, 
  Utensils, 
  Banknote, 
  BookOpen, 
  Palette, 
  Smartphone, 
  Users, 
  Ticket, 
  Sparkles, 
  ShoppingBag, 
  Shield, 
  Briefcase,
  LucideIcon
} from 'lucide-react';

// Global icon mapping for job roles
const ICON_MAP: Record<string, LucideIcon> = {
  'rider': Bike,
  'consegne': Bike,
  'cameriere': Utensils,
  'barista': Utensils,
  'cassa': Banknote,
  'ripetizioni': BookOpen,
  'grafico': Palette,
  'social': Smartphone,
  'staff': Users,
  'biglietteria': Ticket,
  'pulizie': Sparkles,
  'vendite': ShoppingBag,
  'security': Shield,
};

/**
 * Get the appropriate icon for a job based on its role tag
 * @param tagName - The role tag name (e.g., "Rider", "Cameriere")
 * @returns The corresponding Lucide icon component
 */
export function getJobIcon(tagName: string | null | undefined): LucideIcon {
  if (!tagName) return Briefcase;
  
  const normalized = tagName.toLowerCase().trim();
  return ICON_MAP[normalized] || Briefcase;
}

/**
 * Get icon from an array of tags - finds the first role tag match
 * @param tags - Array of tag strings
 * @returns The corresponding Lucide icon component
 */
export function getJobIconFromTags(tags: string[] | null | undefined): LucideIcon {
  if (!tags || tags.length === 0) return Briefcase;
  
  for (const tag of tags) {
    const normalized = tag.toLowerCase().trim();
    if (ICON_MAP[normalized]) {
      return ICON_MAP[normalized];
    }
  }
  
  return Briefcase;
}

export { Briefcase as DefaultJobIcon };
