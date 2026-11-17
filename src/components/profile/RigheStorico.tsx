import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TesseraIcona } from "@/components/ui/Tessera";
import { CuoreIcon, FreccettaIcon } from "@/components/icons/uiIcons";
import { getJobIconFromTags } from "@/lib/jobIcons";

/**
 * LO STORICO DEI LAVORI — una sola forma per il Profilo e il Profilo
 * pubblico (Atlante 40 e 42-2, 17 novembre).
 *
 * Prima erano due cose diverse e tutte e due «brutte» (Tommaso): nel Profilo
 * una fisarmonica chiusa con dentro card grigie (card dentro la card), nel
 * profilo pubblico card col bordo CSS arancione, l'etichetta «Concluso» su
 * ogni riga (lo dice già il titolo della sezione) e la parola «Cuore».
 *
 * Ora sono RIGHE, come i Passati di Annunci: la tessera del mestiere, il
 * titolo su due righe, «Attività · data», il cuore se c'è (solo l'icona: è un
 * segno, e senza cuore non si mostra niente — non è un voto negativo). Divise
 * dalla linea disegnata sottile. Le prime tre, poi «Mostra tutti».
 *
 * ⚠️ Il mestiere viene dai tag dell'ANNUNCIO, e il worker non legge gli
 * annunci chiusi (§18): nel proprio profilo molte righe avranno la valigetta.
 */

export interface RigaStorico {
  id: string;
  titolo: string;
  attivita: string;
  data: string;
  tags: string[];
  cuore: boolean;
  /** Se c'è, la riga porta al profilo dell'attività. */
  employerId?: string | null;
}

const PRIMI = 3;

/** «23 ott»; l'anno solo se non è quello in corso (con il cuore e la freccia
    accanto, «Enoteca Il Tappo Curioso · 23 ott 2026» si troncava). */
const giorno = (iso: string) => {
  const d = new Date(iso);
  const stessoAnno = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", ...(stessoAnno ? null : { year: "numeric" }) });
};

export function RigheStorico({ righe }: { righe: RigaStorico[] }) {
  const navigate = useNavigate();
  const [tutti, setTutti] = useState(false);
  const visibili = tutti ? righe : righe.slice(0, PRIMI);

  return (
    <div>
      {visibili.map((r, i) => {
        const Icona = getJobIconFromTags(r.tags);
        const contenuto = (
          <>
            <TesseraIcona icona={Icona} ruolo="worker" />
            <div className="min-w-0 flex-1">
              <p className="titolo-mini line-clamp-2 text-[17px] leading-snug">{r.titolo}</p>
              <p className="mt-0.5 truncate text-[13px] leading-snug text-ink-soft">
                {r.attivita} · {giorno(r.data)}
              </p>
            </div>
            {r.cuore && (
              <CuoreIcon className="h-5 w-5 shrink-0 text-primary-strong" aria-label="Cuore dall'attività" />
            )}
            {r.employerId && <FreccettaIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </>
        );
        const classi = cn("flex w-full items-center gap-3 py-3 text-left", i > 0 && "linea-divisoria-sottile");
        return r.employerId ? (
          <button
            key={r.id}
            type="button"
            onClick={() => navigate(`/profile/${r.employerId}`)}
            className={cn(classi, "active:opacity-60")}
          >
            {contenuto}
          </button>
        ) : (
          <div key={r.id} className={classi}>
            {contenuto}
          </div>
        );
      })}
      {righe.length > PRIMI && (
        <button
          type="button"
          onClick={() => setTutti((t) => !t)}
          className="linea-divisoria-sottile w-full py-3 text-center text-sm font-medium text-primary-strong active:opacity-60"
        >
          {tutti ? "Mostra meno" : `Mostra tutti (${righe.length})`}
        </button>
      )}
    </div>
  );
}
