import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GalleryDialog } from "@/components/profile/GalleryDialog";
import { JobDetailsSheet } from "@/components/map/JobDetailsSheet";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Briefcase, 
  Clock, 
  Euro,
  MessageCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Camera,
  ChevronRight
} from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useUser } from "@/contexts/UserContext";
import { getJobIconFromTags } from "@/lib/jobIcons";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  address_text: string | null;
  neighborhood: string | null;
  role: "worker" | "employer";
  photos: string[];
  looking_for: string | null;
  experience: string | null;
}

interface CompletedJob {
  id: string;
  applicationId: string;
  title: string;
  employerName: string;
  completedAt: string;
  tags: string[];
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  category: string | null;
  schedule: string | null;
  neighborhood: string | null;
  created_at: string;
  tags: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  worker_name: string | null;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return `${diffHours} ore fa`;
  return `${diffDays} giorni fa`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { theme } = useAppTheme();
  const { isEmployer } = useUser();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{ avg: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);

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

          // If employer profile, fetch reviews
          if (profileData.role === "employer") {
            const { data: reviewsData, error: reviewsError } = await supabase
              .from("reviews")
              .select(`
                id,
                rating,
                comment,
                created_at,
                worker_id,
                profiles!reviews_worker_id_fkey (
                  full_name
                )
              `)
              .eq("employer_id", userId)
              .order("created_at", { ascending: false })
              .limit(10);

            if (!reviewsError && reviewsData) {
              const formattedReviews = reviewsData.map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                created_at: r.created_at,
                worker_name: (r.profiles as unknown as { full_name: string | null })?.full_name || "Utente",
              }));
              setReviews(formattedReviews);

              if (reviewsData.length > 0) {
                const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
                setReviewStats({ avg: Math.round(avg * 10) / 10, count: reviewsData.length });
              }
            }

            // Fetch active jobs (last 48 hours) for employers
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            
            const { data: jobsData, error: jobsError } = await supabase
              .from("jobs")
              .select("*")
              .eq("owner_id", userId)
              .eq("status", "open")
              .gte("created_at", fortyEightHoursAgo)
              .order("created_at", { ascending: false });
            
            if (!jobsError) {
              setJobs((jobsData || []).map(j => ({ ...j, tags: j.tags || [] })));
            }
          }

          // If worker profile, fetch completed jobs
          if (profileData.role === "worker") {
            const { data: applicationsData, error: applicationsError } = await supabase
              .from("applications")
              .select(`
                id,
                updated_at,
                job_id,
                jobs (
                  id,
                  title,
                  tags,
                  owner_id,
                  profiles!jobs_owner_id_fkey (
                    full_name
                  )
                )
              `)
              .eq("applicant_id", userId)
              .eq("status", "completed")
              .order("updated_at", { ascending: false });

            if (!applicationsError && applicationsData) {
              const formattedJobs: CompletedJob[] = applicationsData.map((app: any) => ({
                id: app.jobs?.id || app.job_id,
                applicationId: app.id,
                title: app.jobs?.title || "Lavoro",
                employerName: app.jobs?.profiles?.full_name || "Attività",
                completedAt: app.updated_at,
                tags: app.jobs?.tags || [],
              }));
              setCompletedJobs(formattedJobs);
            }
          }
        }
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
        <Header showSearch={false} />
        <main className="flex-1 pb-20 px-4">
          <div className="py-4 space-y-6">
            {/* Loading skeleton */}
            <div className="flex justify-center">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header showSearch={false} />
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
  const avatarUrl = hasPhotos ? profile.photos[0] : profile.avatar_url;

  // Determine if viewing a worker or employer profile
  const isWorkerProfile = profile.role === "worker";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showSearch={false} />

      <main className="flex-1 pb-20 overflow-y-auto">
        {/* Back Button */}
        <div className="px-4 py-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className={`rounded-full ${isEmployer ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-accent text-primary hover:bg-accent/80'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
        </div>

        {/* Profile Header - CV Style */}
        <div className="px-4 pb-6">
          {/* Avatar - Large, Circular, Centered */}
          <div className="flex justify-center mb-4">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} className="object-cover" />
              <AvatarFallback className={`${isWorkerProfile ? 'bg-accent text-primary' : 'bg-blue-50 text-blue-600'} text-4xl font-bold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name and Role */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-2">{displayName}</h1>
            
            {/* Role Badge */}
            <Badge 
              variant="outline" 
              className={`mb-2 ${isWorkerProfile ? 'bg-accent text-primary border-primary/30' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
            >
              {isWorkerProfile ? "Worker" : "Employer"}
            </Badge>
            
            {/* Location - Workers show only neighborhood, Employers show full address */}
            {(isWorkerProfile ? profile.neighborhood : profile.address_text) && (
              <p className="text-muted-foreground flex items-center justify-center gap-1 mt-2">
                <MapPin className="w-4 h-4" />
                {isWorkerProfile 
                  ? profile.neighborhood 
                  : profile.address_text
                }
              </p>
            )}
          </div>

          {/* Rating Display (Employers only with reviews) */}
          {!isWorkerProfile && reviewStats && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${
                      star <= reviewStats.avg 
                        ? "text-blue-500 fill-blue-500" 
                        : reviewStats.avg >= star - 0.5
                        ? "text-blue-500 fill-blue-500/50"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{reviewStats.avg}</span>
              <span className="text-muted-foreground text-sm">({reviewStats.count} recensioni)</span>
            </div>
          )}
        </div>

        {/* Photo Gallery */}
        {profile.photos && profile.photos.length > 1 && (
          <div className="px-4 pb-6">
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Camera className={`w-5 h-5 ${isWorkerProfile ? 'text-primary' : 'text-blue-600'}`} />
                <h3 className="font-bold text-lg">Foto</h3>
                <span className="text-muted-foreground text-sm">({profile.photos.length})</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {profile.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setGalleryIndex(index);
                      setIsGalleryOpen(true);
                    }}
                    className="aspect-square rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <img 
                      src={photo} 
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Photo Gallery Dialog */}
        <GalleryDialog
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          photos={profile.photos || []}
          currentIndex={galleryIndex}
          onIndexChange={setGalleryIndex}
        />

        {isWorkerProfile && (
          <>
            {/* Sezione 1: Presentazione (Bio) */}
            <div className="px-4 pb-6">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">Presentazione</h3>
                </div>
                <p className="text-foreground leading-relaxed">
                  {profile.bio || "Nessuna presentazione inserita."}
                </p>
              </div>
            </div>

            {/* Sezione 2: Esperienze (if available) */}
            {profile.experience && (
              <div className="px-4 pb-6">
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">Esperienze</h3>
                  </div>
                  <p className="text-foreground leading-relaxed">{profile.experience}</p>
                </div>
              </div>
            )}

            {/* Sezione 3: Storico Lavori Completati */}
            <div className="px-4 pb-6">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">Storico Lavori</h3>
                </div>
                
                {completedJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">Nessun lavoro completato ancora</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedJobs.map((job) => {
                      const Icon = getJobIconFromTags(job.tags);
                      
                      return (
                        <div 
                          key={job.applicationId} 
                          className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                        >
                          <div className="w-10 h-10 bg-accent text-primary rounded-xl flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{job.title}</h4>
                            <p className="text-xs text-muted-foreground">{job.employerName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(job.completedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Badge variant="outline" className="bg-accent text-primary border-primary/30 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Concluso
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* EMPLOYER PROFILE SECTIONS */}
        {!isWorkerProfile && (
          <>
            {/* Bio Section */}
            {profile.bio && (
              <div className="px-4 pb-6">
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">Chi siamo</h3>
                  </div>
                  <p className="text-foreground leading-relaxed">{profile.bio}</p>
                </div>
              </div>
            )}

            {/* Looking For Section */}
            {profile.looking_for && (
              <div className="px-4 pb-6">
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">Chi cerchiamo</h3>
                  </div>
                  <p className="text-foreground leading-relaxed">{profile.looking_for}</p>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="px-4 pb-6">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-lg">Recensioni</h3>
                </div>
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">Nessuna recensione ancora</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{review.worker_name}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating
                                    ? "text-blue-500 fill-blue-500"
                                    : review.rating >= star - 0.5
                                    ? "text-blue-500 fill-blue-500/50"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {getTimeAgo(review.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Jobs Section */}
            <div className="px-4 pb-6">
              <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">Annunci Attivi</h3>
                </div>
                
                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">Nessun annuncio attivo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => {
                      const Icon = getJobIconFromTags(job.tags);
                      const roleTag = job.tags?.find(t => !['Occasionale', 'A Chiamata', 'Mensile', 'Settimanale', 'Weekend'].includes(t));
                      
                      return (
                        <button 
                          key={job.id} 
                          onClick={() => {
                            setSelectedJob(job);
                            setIsJobDetailsOpen(true);
                          }}
                          className="w-full p-3 rounded-xl bg-muted/50 border border-border hover:border-blue-300 hover:shadow-md active:scale-[0.98] transition-all text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{job.title}</h4>
                              <p className="text-sm text-muted-foreground">{roleTag || "Generale"}</p>
                              
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                                {job.schedule && (
                                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    {job.schedule}
                                  </span>
                                )}
                                {job.price && (
                                  <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                                    <Euro className="w-3.5 h-3.5" />
                                    {job.price}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(job.created_at)}
                              </span>
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Job Details Sheet */}
        <JobDetailsSheet 
          job={selectedJob ? {
            id: selectedJob.id,
            title: selectedJob.title,
            description: selectedJob.description,
            price: selectedJob.price,
            category: selectedJob.category,
            schedule: selectedJob.schedule,
            tags: selectedJob.tags,
            lat: 0,
            lng: 0,
            owner_id: userId || "",
            status: "open",
            neighborhood: selectedJob.neighborhood || profile?.neighborhood || null,
            profiles: profile ? {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              photos: profile.photos,
              address_text: profile.address_text
            } : undefined
          } : null} 
          isOpen={isJobDetailsOpen} 
          onClose={() => setIsJobDetailsOpen(false)} 
        />
      </main>

      <BottomNav />
    </div>
  );
};

export default PublicProfile;