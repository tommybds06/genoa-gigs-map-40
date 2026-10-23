// Mapping ruolo → icona custom (Fase 3). Le icone vivono in components/icons/roleIcons.tsx
// e sono theme-aware (currentColor). Questo modulo mantiene l'API storica (getJobIcon,
// getJobIconFromTags, DefaultJobIcon) usata da card, marker, dettaglio annuncio, ecc.
import {
  getRoleIcon,
  GenericoIcon,
  ROLE_ICON_MAP,
  type RoleIconComponent,
} from '@/components/icons/roleIcons';

export type { RoleIconComponent };

/**
 * Icona per un singolo tag di ruolo (es. "Rider", "Cameriere"). Fallback: Generico.
 */
export function getJobIcon(tagName: string | null | undefined): RoleIconComponent {
  return getRoleIcon(tagName);
}

/**
 * Trova la prima icona-ruolo corrispondente in un array di tag. Fallback: Generico.
 */
export function getJobIconFromTags(tags: string[] | null | undefined): RoleIconComponent {
  if (!tags || tags.length === 0) return GenericoIcon;
  for (const tag of tags) {
    const key = tag.toLowerCase().trim();
    if (ROLE_ICON_MAP[key]) return ROLE_ICON_MAP[key];
  }
  return GenericoIcon;
}

export { GenericoIcon as DefaultJobIcon };

/**
 * L'icona di PIÙ annunci insieme: quella del mestiere se sono tutti uguali
 * (due turni da cameriere restano «cameriere»), se no il generico — scegliere
 * un mestiere a caso direbbe una cosa falsa. Usata dal pin di un locale con
 * più annunci e dai pin che escono di scena cambiando zoom.
 */
export function iconaComune(jobs: { tags: string[] | null }[]): RoleIconComponent {
  const icone = jobs.map((j) => getJobIconFromTags(j.tags));
  return icone.length > 0 && icone.every((i) => i === icone[0]) ? icone[0] : GenericoIcon;
}
