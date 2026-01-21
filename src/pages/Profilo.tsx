import { BottomNav } from "@/components/layout/BottomNav";
import { User, Star, MapPin, Briefcase, Settings, LogOut, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { TagSelector } from "@/components/tags/TagSelector";
import { useState, useEffect } from "react";

const Profilo = () => {
  const { user, signOut } = useAuth();
  const { profile, loading, updateTags } = useProfile();
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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
    await updateTags(selectedTags);
    setHasChanges(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Profilo</h1>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-20 overflow-y-auto">
        {/* Profile Card */}
        <div className="material-card-elevated p-6 mb-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-material-md">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name || user?.user_metadata?.full_name || "Utente"}</h2>
              <p className="text-muted-foreground text-sm mb-1">{user?.email}</p>
              <div className="flex items-center gap-1 text-primary">
                <Star className="w-4 h-4" fill="currentColor" />
                <span className="font-semibold text-sm">4.8</span>
                <span className="text-muted-foreground text-sm">(12 recensioni)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="material-card p-4 text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="text-2xl font-bold text-primary">{profile?.xp_points || 0}</div>
            <div className="text-sm text-muted-foreground">Punti XP</div>
          </div>
          <div className="material-card p-4 text-center animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="text-2xl font-bold text-secondary">Lv.{profile?.level || 1}</div>
            <div className="text-sm text-muted-foreground">Livello</div>
          </div>
        </div>

        {/* Tag Selector */}
        <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">I tuoi Interessi</h3>
            {hasChanges && (
              <button 
                onClick={handleSaveTags}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                Salva
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Seleziona i tag per personalizzare la tua esperienza nella Lista
          </p>
          <TagSelector 
            selectedTags={selectedTags} 
            onChange={setSelectedTags} 
          />
        </div>

        {/* Info */}
        <div className="material-card p-4 mb-4 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <h3 className="font-semibold mb-3">Informazioni</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>Genova, Centro Storico</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span>Ruolo: {profile?.role === "employer" ? "Datore di Lavoro" : "Lavoratore"}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="material-btn-outlined w-full p-4 flex items-center justify-center gap-2 text-destructive border-destructive/30 animate-fade-in" 
          style={{ animationDelay: "0.3s" }}
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
