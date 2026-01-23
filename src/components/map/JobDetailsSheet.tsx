import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, GraduationCap, Truck, PartyPopper, Briefcase, Eye, ChevronRight, Loader2, Check } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

interface JobProfile {
  full_name: string | null;
  avatar_url: string | null;
  address_text: string | null;
  photos?: string[] | null;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  schedule?: string | null;
  tags?: string[] | null;
  lat: number;
  lng: number;
  owner_id?: string;
  status?: string;
  profiles?: JobProfile | null;
}

interface JobDetailsSheetProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, typeof GraduationCap> = {
  tutoring: GraduationCap,
  delivery: Truck,
  event: PartyPopper,
  general: Briefcase,
};

const categoryLabels: Record<string, string> = {
  tutoring: "Ripetizioni",
  delivery: "Consegne",
  event: "Eventi",
  general: "Generale",
};

const categoryColors: Record<string, string> = {
  tutoring: "bg-blue-100 text-blue-700",
  delivery: "bg-green-100 text-green-700",
  event: "bg-purple-100 text-purple-700",
  general: "bg-secondary/20 text-secondary",
};

export function JobDetailsSheet({ job, isOpen, onClose }: JobDetailsSheetProps) {
  const { isEmployer } = useUser();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Check if worker has already applied when sheet opens
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!job || !user || isEmployer) return;
      
      setCheckingStatus(true);
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', job.id)
          .eq('applicant_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setHasApplied(true);
        } else {
          setHasApplied(false);
        }
      } catch (error) {
        console.error('Error checking application status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (isOpen && job) {
      checkApplicationStatus();
    }
  }, [isOpen, job, user, isEmployer]);
  
  if (!job) return null;

  const Icon = categoryIcons[job.category || 'general'] || Briefcase;
  const categoryLabel = categoryLabels[job.category || 'general'] || "Altro";
  const categoryColor = categoryColors[job.category || 'general'] || "bg-muted text-muted-foreground";

  // Get employer info from profiles join - use first photo as avatar
  const employerName = job.profiles?.full_name || "Employer";
  const employerPhotos = job.profiles?.photos;
  const employerAvatar = employerPhotos && employerPhotos.length > 0 
    ? employerPhotos[0] 
    : job.profiles?.avatar_url || null;
  const employerAddress = job.profiles?.address_text || null;
  const employerInitials = employerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleEmployerClick = () => {
    if (job.owner_id) {
      onClose();
      navigate(`/profile/${job.owner_id}`);
    }
  };

  const handleApply = async () => {
    if (!user || !job || hasApplied || isApplying) return;
    
    setIsApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          applicant_id: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          // Duplicate - already applied
          setHasApplied(true);
          toast.info('Ti sei già candidato a questo lavoro', { duration: 2000 });
        } else {
          throw error;
        }
      } else {
        setHasApplied(true);
        toast.success('Candidatura inviata!', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Errore nell\'invio della candidatura', { duration: 2000 });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl p-0 overflow-hidden"
        hideCloseButton
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            {/* Header with Employer Profile */}
            <SheetHeader className="text-left pb-4">
              {/* Clickable Employer Section */}
              <button
                onClick={handleEmployerClick}
                className="flex items-center gap-3 mb-4 p-3 -mx-3 rounded-2xl hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className={`w-14 h-14 border-2 ${isEmployer ? "border-blue-600/20" : "border-primary/20"}`}>
                  <AvatarImage src={employerAvatar || undefined} alt={employerName} />
                  <AvatarFallback className={`${theme.accentBg} ${theme.accentText} font-bold text-lg`}>
                    {employerInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{employerName}</p>
                  {employerAddress && (
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {employerAddress}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
              
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-2xl font-bold text-foreground leading-tight">
                  {job.title}
                </SheetTitle>
                {job.price && (
                  <Badge className={`${theme.btnFilled} font-bold text-base px-3 py-1.5 rounded-full shrink-0`}>
                    {job.price}
                  </Badge>
                )}
              </div>

              {/* Schedule Display */}
              {job.schedule && (
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{job.schedule}</span>
                </div>
              )}

              {/* Only show category badge if not "Altro" */}
              {categoryLabel !== "Altro" && (
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline" className={`${categoryColor} border-none font-medium`}>
                    <Icon className="w-3.5 h-3.5 mr-1" />
                    {categoryLabel}
                  </Badge>
                </div>
              )}
            </SheetHeader>

            {/* Description */}
            {job.description && (
              <div className="py-4 border-t border-border">
                <h3 className={`text-sm font-bold mb-3 ${isEmployer ? 'text-blue-600' : 'text-primary'}`}>
                  DESCRIZIONE
                </h3>
                <p className="text-foreground leading-relaxed">
                  {job.description}
                </p>
              </div>
            )}

            {/* Static Map Preview */}
            <div className="py-4 border-t border-border">
              <h3 className={`text-sm font-bold mb-3 ${isEmployer ? 'text-blue-600' : 'text-primary'}`}>
                POSIZIONE
              </h3>
              <div className="relative h-32 bg-muted rounded-2xl overflow-hidden">
                {/* Stylized mini map */}
                <div className="absolute inset-0">
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-blue-100/40" />
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 60 Q30 50 60 55 T100 45" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" opacity="0.3" />
                    <path d="M20 80 L50 40 L80 30" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.4" opacity="0.2" />
                  </svg>
                </div>
                
                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className={`w-6 h-6 ${theme.primary} rounded-full flex items-center justify-center shadow-md`}>
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Location label */}
                <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
                  <p className="text-xs font-medium">{employerAddress || "Genova Centro"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            {isEmployer ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium">Visualizzazione anteprima Employer</span>
              </div>
            ) : checkingStatus ? (
              <Button 
                className="w-full h-14 bg-muted text-muted-foreground font-bold text-lg rounded-xl"
                disabled
              >
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifica...
              </Button>
            ) : hasApplied ? (
              <Button 
                className="w-full h-14 bg-muted text-muted-foreground font-bold text-lg rounded-xl cursor-not-allowed"
                disabled
              >
                <Check className="w-5 h-5 mr-2" />
                Candidatura Inviata
              </Button>
            ) : (
              <Button 
                className={`w-full h-14 ${theme.btnFilled} text-white font-bold text-lg rounded-xl shadow-material-md`}
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  'Candidati Ora'
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
