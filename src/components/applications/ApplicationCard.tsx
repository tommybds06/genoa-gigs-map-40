import { useNavigate } from "react-router-dom";
import { MessageCircle, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Application, useChatForApplication } from "@/hooks/useApplications";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { toast } from "@/hooks/use-toast";
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
      toast({
        title: "Chat non disponibile",
        description: "La chat sarà presto disponibile.",
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
      <div className="flex items-center gap-3">
        {/* Job Icon */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <Icon className="w-9 h-9 text-primary" />
        </div>

        {/* Content — employer e data su UNA riga sola: erano due righe di
            metadati impilate, e la card era alta il doppio del necessario
            per quattro informazioni. */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{job?.title || application.job_title || "Lavoro"}</h3>

          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground min-w-0">
            {nomeEmployer && (
              <>
                <Avatar className="w-4 h-4 shrink-0">
                  <AvatarImage src={job?.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {nomeEmployer.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[110px]">{nomeEmployer}</span>
                <span aria-hidden className="shrink-0">·</span>
              </>
            )}
            <span className="shrink-0">{formatTempoTrascorso(application.created_at)}</span>
          </div>
        </div>

        {/* Stato, indicatore chat, chevron — nello stesso ordine su ogni riga */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge stato={application.status} />
          {hasChat && (
            <MessageCircle className="w-4 h-4 text-primary" aria-label="Conversazione attiva" />
          )}
          {canOpen && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
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
