import { VerificatoIcon } from "@/components/icons/uiIcons";
import { cn } from "@/lib/utils";

/**
 * «Attività verificata» come SEGNO accanto al nome (Tommaso, 26 ottobre): solo
 * l'icona, niente pillola sotto. Nell'inchiostro del ruolo del profilo
 * MOSTRATO, non di chi guarda (come lo scotch): sulla carta i pastelli non
 * reggono un'icona (§5). Il testo lo leggono gli screen reader e il `title`.
 */
export function SegnoVerificato({ employer, className }: { employer: boolean; className?: string }) {
  return (
    <span role="img" aria-label="Attività verificata" title="Attività verificata" className="inline-flex shrink-0">
      <VerificatoIcon
        aria-hidden
        className={cn("h-5 w-5", employer ? "text-employer-800" : "text-primary-strong", className)}
      />
    </span>
  );
}

/**
 * Il nome con il segno in linea. L'ultima parola e il segno stanno insieme
 * (`nowrap`): un nome lungo va a capo, e il segno non resta mai da solo su
 * una riga (successo a 390 px con un nome su due righe).
 */
export function NomeConSegno({
  nome,
  verificato,
  employer,
  classeSegno,
}: {
  nome: string;
  verificato: boolean;
  employer: boolean;
  classeSegno?: string;
}) {
  if (!verificato) return <>{nome}</>;
  const taglio = nome.trimEnd().lastIndexOf(" ");
  const inizio = taglio < 0 ? "" : nome.slice(0, taglio + 1);
  const ultima = taglio < 0 ? nome.trim() : nome.slice(taglio + 1).trim();
  return (
    <>
      {inizio}
      <span className="whitespace-nowrap">
        {ultima}
        <span className="ml-1.5 inline-block align-[-0.15em]">
          <SegnoVerificato employer={employer} className={classeSegno} />
        </span>
      </span>
    </>
  );
}
