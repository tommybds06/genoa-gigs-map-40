import { isTypeTag } from "@/constants/tags";

/**
 * COLORE DEI TAG — due famiglie, un solo colore di brand.
 *
 * I tag sono di due tipi: il RUOLO ("Cameriere", "Ripetizioni") e la DURATA
 * ("Una tantum", "Weekend"). Servono due aspetti distinti, ma finora la durata
 * era BLU.
 *
 * ⚠️ Il blu in questa app non è un colore libero: è l'identità dell'employer.
 * Un worker si trovava quindi, sulla stessa nuvoletta, un chip arancione e uno
 * blu — cioè tutti e due i colori di ruolo insieme, su una schermata dove il
 * blu significa «l'altra parte». Una dimensione tassonomica si era presa un
 * colore che nel resto del sistema ha già un significato preciso.
 *
 * Ora la distinzione la fa la SUPERFICIE, non la tinta:
 *   - ruolo  → accent del tema, quindi arancio per il worker e blu per
 *              l'employer: è il colore dell'app di chi sta guardando;
 *   - durata → carta scavata con inchiostro, **10,3:1**. Neutro di proposito:
 *              la durata è un dato, non un'identità.
 *
 * Effetto collaterale utile: i chip adesso leggono uguale nei due temi, mentre
 * prima il blu restava blu anche in un'app tutta arancione.
 */
export const isBlueTag = (tag: string): boolean => {
  return isTypeTag(tag);
};

/** Aspetto del tag in sola lettura (nuvoletta, scheda annuncio, card). */
export const getTagClasses = (tag: string): string => {
  if (isBlueTag(tag)) {
    return "bg-paper-sunken text-ink";
  }
  return "bg-accent text-accent-foreground";
};

/**
 * Aspetto del tag nei SELETTORI (filtri, crea annuncio), dove serve la coppia
 * acceso/spento. Per la durata l'acceso è l'inchiostro pieno: invertire è il
 * segnale di selezione più forte che esista, e resta neutro.
 */
export const getTagSelectedClasses = (tag: string, isSelected: boolean): string => {
  if (isBlueTag(tag)) {
    return isSelected
      ? "bg-ink text-paper"
      : "bg-paper-sunken text-ink hover:bg-paper-line";
  }
  return isSelected
    ? "bg-primary text-primary-foreground shadow-md"
    : "bg-accent text-accent-foreground hover:bg-primary/20";
};
