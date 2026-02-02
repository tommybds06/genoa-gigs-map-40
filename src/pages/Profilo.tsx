import { BottomNav } from "@/components/layout/BottomNav";
import { User, Star, MapPin, Briefcase, Settings, LogOut, Save, Instagram, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigate } from "react-router-dom";
import { TagSelector, TagBadges } from "@/components/tags/TagSelector";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WorkerJobHistory } from "@/components/profile/WorkerJobHistory";
import { supabase } from "@/integrations/supabase/client";

const Profilo = () => {
  const { user, signOut } = useAuth();
  const { profile, loading, updateTags } = useUser();
  const { theme, isEmployer } = useAppTheme();
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ avg: number; count: number } | null>(null);

  // Fetch review stats for employers
  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!profile?.id || !isEmployer) return;

      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("employer_id", profile.id);

      if (!error && data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setReviewStats({ avg: Math.round(avg * 10) / 10, count: data.length });
      }
    };

    fetchReviewStats();
  }, [profile?.id, isEmployer]);

  useEffect(() => {
    if (profile?.tags) {
      setSelectedTags(profile.tags);
    }
  }, [profile?.tags]);

  useEffect(() => {
    if (profile?.tags) {
      const tagsChanged = JSON.stringify(selectedTags.sort()) !== JSON.stringify([...profile.tags].sort());
      setHasChanges(tagsChanged);
    }
  }, [selectedTags, profile?.tags]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSaveTags = async () => {
    try {
      await updateTags(selectedTags);
      toast.success("Tag aggiornati!", { duration: 2000 });
      setHasChanges(false);
      setEditMode(false);
    } catch (error) {
      toast.error("Errore aggiornamento", { duration: 2000 });
    }
  };

  const nextPhoto = () => {
    if (profile?.photos && profile.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
    }
  };

  const prevPhoto = () => {
    if (profile?.photos && profile.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
    }
  };

  // Dynamic classes based on role
  const primaryBtnClasses = `${theme.btnFilled} ${theme.btnFilledHover}`;
  const accentBgClasses = theme.accentBg;
  const primaryTextClasses = theme.primaryText;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isEmployer ? "text-blue-600" : "text-primary"}`}>Profilo</h1>
          <button 
            onClick={() => navigate("/settings")}
            className={`p-2 rounded-full transition-colors ${isEmployer ? "hover:bg-blue-50" : "hover:bg-accent"}`}
          >
            <Settings className={`w-5 h-5 ${isEmployer ? "text-blue-600" : "text-primary"}`} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-20 overflow-y-auto">
        {/* Photo Carousel */}
        {profile?.photos && profile.photos.length > 0 && (
          <div className="relative mb-4 animate-fade-in">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              <img
                src={profile.photos[currentPhotoIndex]}
                alt={`Foto ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {profile.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-md"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-md"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Photo indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {profile.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentPhotoIndex
                          ? `${theme.primary} w-4`
                          : "bg-background/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Profile Card */}
        <div className="material-card-elevated p-6 mb-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 ${theme.primary} text-white rounded-full flex items-center justify-center shadow-material-md overflow-hidden`}>
              {profile?.photos && profile.photos.length > 0 ? (
                <img 
                  src={profile.photos[0]} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name || user?.user_metadata?.full_name || "Utente"}</h2>
              <p className="text-muted-foreground text-sm mb-1">{user?.email}</p>
              <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${primaryTextClasses}`}>
                  {isEmployer ? "Employer" : "Worker"}
                </span>
                {/* Show reviews only for Employers */}
                {isEmployer && reviewStats && (
                  <>
                    <span className="text-muted-foreground text-sm">•</span>
                    <div className={`flex items-center gap-1 ${primaryTextClasses}`}>
                      <Star className="w-4 h-4" fill="currentColor" />
                      <span className="font-semibold text-sm">{reviewStats.avg}</span>
                      <span className="text-muted-foreground text-sm">({reviewStats.count})</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          {profile?.social_links && (profile.social_links.instagram || profile.social_links.website) && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              {profile.social_links.instagram && (
                <a
                  href={`https://instagram.com/${profile.social_links.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{profile.social_links.instagram}</span>
                </a>
              )}
              {profile.social_links.website && (
                <a
                  href={profile.social_links.website.startsWith('http') ? profile.social_links.website : `https://${profile.social_links.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Sito Web</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Storico Lavori (Worker only - replaces XP/gamification) */}
        {!isEmployer && <WorkerJobHistory primaryTextClasses={primaryTextClasses} />}

        {/* Bio Section */}
        {profile?.bio && (
          <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h3 className="font-semibold mb-2">
              {isEmployer ? "Descrizione Attività" : "Presentazione"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Looking For Section (Employer only) */}
        {isEmployer && profile?.looking_for && (
          <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Briefcase className={`w-4 h-4 ${primaryTextClasses}`} />
              Chi cerco
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.looking_for}</p>
          </div>
        )}

        {/* Experience Section (Worker only) */}
        {!isEmployer && profile?.experience && (
          <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Briefcase className={`w-4 h-4 ${primaryTextClasses}`} />
              Esperienze
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.experience}</p>
          </div>
        )}

        {/* Tags Display / Edit (Worker only) */}
        {!isEmployer && (
          <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">I tuoi Interessi</h3>
              <div className="flex gap-2">
                {hasChanges && (
                  <button 
                    onClick={handleSaveTags}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${primaryBtnClasses}`}
                  >
                    <Save className="w-4 h-4" />
                    Salva
                  </button>
                )}
                {!editMode && (
                  <button 
                    onClick={() => setEditMode(true)}
                    className={`text-sm font-medium ${primaryTextClasses}`}
                  >
                    Modifica
                  </button>
                )}
              </div>
            </div>
            
            {editMode ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Seleziona i tag per personalizzare la tua esperienza nella Lista
                </p>
                <TagSelector 
                  selectedTags={selectedTags} 
                  onChange={setSelectedTags} 
                />
              </>
            ) : (
              <TagBadges tags={selectedTags} />
            )}
          </div>
        )}

        {/* Info */}
        <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <h3 className="font-semibold mb-3">Informazioni</h3>
          <div className="space-y-3">
            {profile?.neighborhood ? (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Genova, {profile.neighborhood}</span>
              </div>
            ) : profile?.address_text ? (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{profile.address_text}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span>Ruolo: <span className={`font-medium ${primaryTextClasses}`}>{isEmployer ? "Employer" : "Worker"}</span></span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="material-btn-outlined w-full p-4 flex items-center justify-center gap-2 text-destructive border-destructive/30 animate-fade-in" 
          style={{ animationDelay: "0.4s" }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Esci</span>
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profilo;
