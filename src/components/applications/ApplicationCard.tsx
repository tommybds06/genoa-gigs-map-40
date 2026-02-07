import { useNavigate } from "react-router-dom";
import { Clock, MessageCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Application, useChatForApplication } from "@/hooks/useApplications";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { toast } from "@/hooks/use-toast";

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  return `${diffDays} giorni fa`;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "In Attesa",
    className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  },
  accepted: {
    label: "Accettato",
    className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
  },
  hired: {
    label: "Assunto",
    className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  },
  rejected: {
    label: "Rifiutato",
    className: "bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600",
  },
  completed: {
    label: "Concluso",
    className: "bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500",
  },
};

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
  const status = statusConfig[application.status] || statusConfig.pending;
  const isActiveStatus = application.status === "accepted" || application.status === "hired";

  const employerId = job?.owner_id;

  const handleClick = () => {
    if (isActiveStatus && chatId) {
      // Use query param format that Messaggi.tsx expects
      navigate(`/messaggi?chat=${chatId}`);
    } else if (isActiveStatus) {
      toast({
        title: "Chat non disponibile",
        description: "La chat sarà presto disponibile.",
      });
    } else if (application.status === "pending" && employerId) {
      // Navigate to employer's profile for pending applications
      navigate(`/profile/${employerId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="material-card p-4 cursor-pointer touch-feedback animate-fade-in"
    >
      <div className="flex items-center gap-3">
        {/* Job Icon */}
        <div className="w-12 h-12 bg-accent text-accent-foreground rounded-2xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{job?.title || "Lavoro"}</h3>
          
          <div className="flex items-center gap-2 mt-1">
            {job?.profiles && (
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
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Inviata {getTimeAgo(application.created_at)}</span>
          </div>
        </div>

        {/* Status Badge & Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-xs font-medium ${status.className}`}>
            {status.label}
          </Badge>
          {isActiveStatus && (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
          )}
          {!isActiveStatus && application.status === "pending" && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
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
