// Role Tags - Orange themed
export const ROLE_TAGS = [
  "Rider",
  "Cameriere",
  "Aiuto cucina",
  "Cassa",
  "Vendite",
  "Pulizie",
  "Ripetizioni",
  "Babysitter",
  "Dog-sitter",
  "Grafico",
  "Social",
  "Promoter",
  "Steward",
] as const;

// Type Tags - Blue themed — DURATA indicativa dell'impiego (scala progressiva)
export const TYPE_TAGS = [
  "Una tantum",
  "Giorni",
  "Settimane",
  "Mesi",
  "Continuativo",
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
