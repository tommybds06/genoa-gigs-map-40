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

/**
 * Nomi di durata usati PRIMA della rinomina.
 * Restano nel database su annunci e profili creati allora, e senza questa lista
 * un tag "Settimanale" non viene riconosciuto come durata: finisce tra i ruoli,
 * e in un profilo compare un chip blu in mezzo a quelli arancioni.
 * NON aggiungere qui nuovi valori: questa lista può solo crescere all'indietro.
 */
export const LEGACY_TYPE_TAGS = [
  "Occasionale",
  "A Chiamata",
  "Mensile",
  "Settimanale",
  "Weekend",
] as const;

export type RoleTag = (typeof ROLE_TAGS)[number];
export type TypeTag = (typeof TYPE_TAGS)[number];
export type Tag = RoleTag | TypeTag;

/** true solo per i ruoli PREDEFINITI: i ruoli personalizzati danno false. */
export const isRoleTag = (tag: string): tag is RoleTag => {
  return ROLE_TAGS.includes(tag as RoleTag);
};

/** true per le durate, comprese quelle con i nomi vecchi. */
export const isTypeTag = (tag: string): boolean => {
  return (
    TYPE_TAGS.includes(tag as TypeTag) ||
    (LEGACY_TYPE_TAGS as readonly string[]).includes(tag)
  );
};

/**
 * Il ruolo di un annuncio o di un profilo.
 *
 * Si definisce per SOTTRAZIONE — il primo tag che non è una durata — e non con
 * `isRoleTag`, che copre solo i ruoli predefiniti e quindi scarterebbe i ruoli
 * personalizzati inseriti dagli utenti, facendo comparire "Generale" su annunci
 * che un ruolo ce l'hanno eccome.
 */
export const getRoleTag = (tags: string[] | null | undefined): string | undefined => {
  return tags?.find((t) => !isTypeTag(t));
};

/** I soli tag ruolo, per le liste di chip dove la durata non c'entra. */
export const soloRuoli = (tags: string[] | null | undefined): string[] => {
  return (tags ?? []).filter((t) => !isTypeTag(t));
};
