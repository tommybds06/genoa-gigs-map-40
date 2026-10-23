import { GloboIcon, InstagramIcon } from "@/components/icons/uiIcons";
import type { SocialLinks } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { etichettaInstagram, etichettaSito, haSocial, linkInstagram, linkSito, pulisciInstagram } from "@/lib/social";

/**
 * I link social di un profilo: Instagram e sito, con le nostre icone.
 * Stesso componente in Profilo e nel profilo pubblico (prima solo Profilo li
 * mostrava, con le icone di lucide e un generico «Sito Web»).
 *
 * - Il colore è l'INCHIOSTRO del ruolo del profilo (`primary-strong` 4,66 /
 *   `employer-800` 5,86): sono link, devono leggersi come tali, e il
 *   pastello su carta non regge il testo (§5).
 * - Il sito si legge col suo dominio: dice dove porta prima di toccarlo.
 * - Alti 44 px: bersagli di tocco veri, non una riga di testo cliccabile.
 */
export function LinkSocial({
  social,
  employer,
  className,
}: {
  social: SocialLinks | null | undefined;
  /** Il ruolo del PROFILO mostrato, non di chi guarda. */
  employer: boolean;
  className?: string;
}) {
  if (!haSocial(social)) return null;
  const sito = social.website ? linkSito(social.website) : null;
  const instagram = social.instagram && pulisciInstagram(social.instagram) ? social.instagram : null;
  const colore = employer ? "text-employer-800" : "text-primary-strong";
  const voce = cn("inline-flex min-h-[44px] items-center gap-1.5 px-2 text-sm font-medium", colore);

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-2", className)}>
      {instagram && (
        <a href={linkInstagram(instagram)} target="_blank" rel="noopener noreferrer" className={voce}>
          <InstagramIcon className="h-5 w-5 shrink-0" />
          <span>{etichettaInstagram(instagram)}</span>
        </a>
      )}
      {sito && social.website && (
        <a href={sito} target="_blank" rel="noopener noreferrer" className={voce}>
          <GloboIcon className="h-5 w-5 shrink-0" />
          <span className="max-w-[12rem] truncate">{etichettaSito(social.website)}</span>
        </a>
      )}
    </div>
  );
}
