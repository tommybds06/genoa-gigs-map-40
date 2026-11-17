import { FreccettaIcon } from "@/components/icons/uiIcons";
import { useNavigate } from "react-router-dom";
import { MessaggiIcon } from "@/components/icons/uiIcons";

import { TesseraIcona } from "@/components/ui/Tessera";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Application, useChatForApplication } from "@/hooks/useApplications";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { toast } from "sonner";
import { formatTempoTrascorso } from "@/lib/dates";

interface ApplicationCardProps {
  application: Application;
  userId: string;
}

export function ApplicationCard({ application, userId }: ApplicationCardProps) {
  const navigate = useNavigate();
  const { data: chatId } = useChatForApplication(
    application.status === "accepted" || application.status === "hired" ? application.job_id : undefined,
    userId
  );

  const job = application.job;
  const Icon = getJobIconFromTags(job?.tags || []);
  const isActiveStatus = application.status === "accepted" || application.status === "hired";

  const employerId = job?.owner_id;
  // Lo snapshot copre il caso dell'annuncio cancellato (vedi migration
  // 20260710000000_add_application_snapshot).
  const nomeEmployer = job?.profiles?.full_name || application.employer_name || null;

  // REGOLA UNICA delle affordance (prima ne convivevano tre nella stessa lista:
  // chevron, bottone chat, e righe morte che sembravano cliccabili ma non
  // facevano niente):
  //   - la riga è tappabile se porta da qualche parte  → chevron sempre visibile
  //   - se esiste una chat, un'icona la segnala        → indicatore, non bottone
  //   - se non porta da nessuna parte, non finge       → niente cursore, niente chevron
  const hasChat = isActiveStatus && !!chatId;
  const canOpen = hasChat || !!employerId;

  const handleClick = () => {
    if (hasChat) {
      // Use query param format that Messaggi.tsx expects
      navigate(`/messaggi?chat=${chatId}`);
    } else if (isActiveStatus && !employerId) {
      toast.info("Chat non disponibile", {
        description: "La chat sarà presto disponibile.",
        duration: 2300,
      });
    } else if (employerId) {
      navigate(`/profile/${employerId}`);
    }
  };

  return (
    <div
      onClick={canOpen || isActiveStatus ? handleClick : undefined}
      className={`material-card p-3 animate-fade-in ${
        canOpen || isActiveStatus ? "cursor-pointer touch-feedback" : ""
      }`}
    >
      {/* Come la card della Lista (Atlante, 17 novembre: «non si leggono mai
          titoli e nome dell'attività»). Prima stato, icona della chat e
          freccia stavano tutti sulla riga del titolo e se ne mangiavano la
          larghezza: «Cameriere per…», «Caffè …». Ora: la tessera del
          mestiere, il titolo intero (due righe), l'attività intera, e lo
          stato in una riga sua con il tempo. */}
      <div className="flex items-center gap-3">
        <TesseraIcona icona={Icon} />

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">
            {job?.title || application.job_title || "Lavoro"}
          </h3>
          {nomeEmployer && <p className="mt-0.5 truncate text-[13px] text-ink-soft">{nomeEmployer}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge stato={application.status} />
            <span className="text-xs text-muted-foreground">{formatTempoTrascorso(application.created_at)}</span>
            {hasChat && (
              <MessaggiIcon className="h-4 w-4 text-primary-strong" aria-label="Conversazione attiva" />
            )}
          </div>
        </div>

        {canOpen && <FreccettaIcon className="h-5 w-5 shrink-0 text-muted-foreground" />}
      </div>
    </div>
  );
}

/** Lo scheletro rispecchia la card VERA: stesso padding, stessa icona, due
 *  righe e non tre. Prima era p-4 con tre righe contro una card p-3 a due, e
 *  al caricamento la lista faceva un salto verso l'alto. */
export function ApplicationCardSkeleton() {
  return (
    <div className="material-card p-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-6 bg-muted rounded-full w-20 shrink-0" />
      </div>
    </div>
  );
}
