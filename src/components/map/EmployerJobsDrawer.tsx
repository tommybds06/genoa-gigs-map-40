import { Clock, MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getJobIconFromTags } from "@/lib/jobIcons";
import { getTagClasses } from "@/lib/tagColors";
import { Job } from "@/hooks/useJobs";

interface EmployerJobsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  onJobSelect: (job: Job) => void;
}

export function EmployerJobsDrawer({ 
  isOpen, 
  onClose, 
  jobs, 
  onJobSelect 
}: EmployerJobsDrawerProps) {
  const { isEmployer } = useUser();
  const { theme } = useAppTheme();
  const navigate = useNavigate();
  
  if (jobs.length === 0) return null;
  
  const firstJob = jobs[0];
  const employerId = firstJob.owner_id;
  const photos = firstJob.profiles?.photos;
  const avatarUrl = photos && photos.length > 0 
    ? photos[0] 
    : firstJob.profiles?.avatar_url || null;
  const employerName = firstJob.profiles?.full_name || "Attività";
  const initials = employerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const employerAddress = firstJob.profiles?.address_text || null;

  const handleJobClick = (job: Job) => {
    onClose();
    // Small delay to allow drawer animation to complete
    setTimeout(() => {
      onJobSelect(job);
    }, 150);
  };

  const handleEmployerClick = () => {
    onClose();
    navigate(`/profile/${employerId}`);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="flex flex-col max-h-[85vh] overflow-hidden">
          {/* Header with Employer Info - Clickable */}
          <DrawerHeader className="text-left pb-4 px-6 shrink-0">
            <button 
              onClick={handleEmployerClick}
              className="flex items-center gap-3 mb-2 w-full text-left hover:opacity-80 active:scale-[0.98] transition-all"
            >
              <Avatar className={`w-12 h-12 border-2 ${isEmployer ? "border-employer/20" : "border-primary/20"}`}>
                <AvatarImage src={avatarUrl || undefined} alt={employerName} className="object-cover" />
                <AvatarFallback className={`${theme.accentBg} ${theme.accentText} font-bold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DrawerTitle className="text-lg font-bold text-foreground truncate">
                  Annunci presso {employerName}
                </DrawerTitle>
                {employerAddress && (
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {employerAddress}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </button>
            <p className="text-sm text-muted-foreground">
              {jobs.length} annunci disponibili
            </p>
          </DrawerHeader>

          {/* Scrollable Job List */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <div className="space-y-3">
              {jobs.map((job) => {
                const Icon = getJobIconFromTags(job.tags || []);
                
                return (
                  <button
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-md active:scale-[0.98] transition-all text-left"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isEmployer ? "bg-employer-50 text-employer" : "bg-accent text-primary"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {job.title}
                      </h3>
                      
                      {/* Tags */}
                      {job.tags && job.tags.filter(tag => tag.toLowerCase() !== 'altro').length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {job.tags.filter(tag => tag.toLowerCase() !== 'altro').slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagClasses(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {job.tags.filter(tag => tag.toLowerCase() !== 'altro').length > 2 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              +{job.tags.filter(tag => tag.toLowerCase() !== 'altro').length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Schedule & Price Row */}
                      <div className="flex items-center gap-2 mt-2">
                        {job.schedule && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{job.schedule}</span>
                          </div>
                        )}
                        {job.price && (
                          <Badge className={`${theme.btnFilled} text-xs px-2 py-0.5 rounded-full`}>
                            {job.price}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
