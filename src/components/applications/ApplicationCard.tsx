import { useNavigate } from "react-router-dom";
import { Clock, MessageCircle, ChevronRight } from "lucide-react";
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
      className={`material-card p-4 animate-fade-in ${
        canOpen || isActiveStatus ? "cursor-pointer touch-feedback" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Job Icon */}
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Icon className="w-10 h-10 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{job?.title || application.job_title || "Lavoro"}</h3>
          
          <div className="flex items-center gap-2 mt-1">
            {job?.profiles ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={job.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {job.profiles.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                  {job.profiles.full_name || "Employer"}
                </span>
              </div>
            ) : application.employer_name ? (
              // Annuncio cancellato: usa lo snapshot del nome employer
              <div className="flex items-center gap-1.5">
                <Avatar className="w-4 h-4">
                  <AvatarFallback className="text-[8px]">
                    {application.employer_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                  {application.employer_name}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Inviata {formatTempoTrascorso(application.created_at)}</span>
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

export function ApplicationCardSkeleton() {
  return (
    <div className="material-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-muted rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
        <div className="h-6 bg-muted rounded-full w-20" />
      </div>
    </div>
  );
}
