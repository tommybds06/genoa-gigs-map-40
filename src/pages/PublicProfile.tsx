import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Briefcase, 
  Clock, 
  Euro,
  GraduationCap,
  Truck,
  PartyPopper,
  MessageCircle
} from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  address_text: string | null;
  role: "worker" | "employer";
  photos: string[];
  looking_for: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  schedule: string | null;
  created_at: string;
  tags: string[];
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

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return `${diffHours} ore fa`;
  return `${diffDays} giorni fa`;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { theme } = useAppTheme();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      setLoading(true);
      
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        
        if (profileError) throw profileError;
        
        if (profileData) {
          setProfile({
            ...profileData,
            photos: profileData.photos || [],
          });
        }
        
        // Fetch active jobs (last 48 hours)
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("owner_id", userId)
          .eq("status", "open")
          .gte("created_at", fortyEightHoursAgo)
          .order("created_at", { ascending: false });
        
        if (jobsError) throw jobsError;
        
        setJobs((jobsData || []).map(j => ({ ...j, tags: j.tags || [] })));
      } catch (error) {
        console.error("Error fetching public profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const nextPhoto = () => {
    if (profile?.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
    }
  };

  const prevPhoto = () => {
    if (profile?.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Caricamento...</div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Profilo non trovato</h2>
            <p className="text-muted-foreground mb-4">L'utente richiesto non esiste.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna indietro
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const displayName = profile.full_name || "Utente";
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const hasPhotos = profile.photos && profile.photos.length > 0;
  const currentPhoto = hasPhotos ? profile.photos[currentPhotoIndex] : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 pb-20 overflow-y-auto">
        {/* Back Button */}
        <div className="px-4 py-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
        </div>

        {/* Profile Header */}
        <div className="px-4 pb-6">
          {/* Photo Carousel or Avatar */}
          {hasPhotos ? (
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-4">
              <img 
                src={currentPhoto!} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
              
              {profile.photos.length > 1 && (
                <>
                  <button 
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    ←
                  </button>
                  <button 
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    →
                  </button>
                  
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {profile.photos.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <Avatar className={`w-32 h-32 border-4 ${theme.accentBg}`}>
                <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className={`${theme.accentBg} ${theme.accentText} text-4xl font-bold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Name and Role */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
            
            {profile.address_text && (
              <p className="text-muted-foreground flex items-center justify-center gap-1 mb-2">
                <MapPin className="w-4 h-4" />
                {profile.address_text}
              </p>
            )}
            
            <Badge variant="outline" className={`${theme.accentBg} ${theme.accentText} font-medium`}>
              {profile.role === "employer" ? "Attività" : "Worker"}
            </Badge>
          </div>

          {/* Placeholder Rating */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-5 h-5 ${star <= 4 ? `${theme.primaryText} fill-current` : 'text-muted-foreground/30'}`}
                />
              ))}
            </div>
            <span className="font-semibold">4.0</span>
            <span className="text-muted-foreground text-sm">(0 recensioni)</span>
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="px-4 pb-6">
            <div className="material-card p-4">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">CHI SIAMO</h3>
              <p className="text-foreground leading-relaxed">{profile.bio}</p>
            </div>
          </div>
        )}

        {/* Looking For Section (Employers) */}
        {profile.role === "employer" && profile.looking_for && (
          <div className="px-4 pb-6">
            <div className="material-card p-4">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">CHI CERCHIAMO</h3>
              <p className="text-foreground leading-relaxed">{profile.looking_for}</p>
            </div>
          </div>
        )}

        {/* Reviews Placeholder */}
        <div className="px-4 pb-6">
          <div className="material-card p-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">RECENSIONI</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">Nessuna recensione ancora</p>
            </div>
          </div>
        </div>

        {/* Active Jobs Section */}
        {profile.role === "employer" && (
          <div className="px-4 pb-6">
            <h3 className="font-semibold text-lg mb-3">Annunci Attivi</h3>
            
            {jobs.length === 0 ? (
              <div className="material-card p-6 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Nessun annuncio attivo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const Icon = categoryIcons[job.category || "general"] || Briefcase;
                  const categoryLabel = categoryLabels[job.category || "general"] || "Generale";
                  
                  return (
                    <div key={job.id} className="material-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-accent text-accent-foreground rounded-xl flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{categoryLabel}</p>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                            {job.schedule && (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {job.schedule}
                              </span>
                            )}
                            {job.price && (
                              <span className={`inline-flex items-center gap-1 ${theme.primaryText} font-semibold`}>
                                <Euro className="w-3.5 h-3.5" />
                                {job.price}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {getTimeAgo(job.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default PublicProfile;
