// Role Tags - Orange themed
export const ROLE_TAGS = [
  "Rider",
  "Cameriere",
  "Cassa",
  "Ripetizioni",
  "Grafico",
  "Social",
  "Staff",
  "Biglietteria",
  "Pulizie",
  "Vendite",
  "Security",
] as const;

// Type Tags - Blue themed
export const TYPE_TAGS = [
  "Occasionale",
  "A Chiamata",
  "Mensile",
  "Settimanale",
  "Weekend",
] as const;

export type RoleTag = (typeof ROLE_TAGS)[number];
export type TypeTag = (typeof TYPE_TAGS)[number];
export type Tag = RoleTag | TypeTag;

export const isRoleTag = (tag: string): tag is RoleTag => {
  return ROLE_TAGS.includes(tag as RoleTag);
};

export const isTypeTag = (tag: string): tag is TypeTag => {
  return TYPE_TAGS.includes(tag as TypeTag);
};
