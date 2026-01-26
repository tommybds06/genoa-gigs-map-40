import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, Loader2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, refetch } = useUser();
  const { theme, isEmployer } = useAppTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [addressText, setAddressText] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [experience, setExperience] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  // Fetch current profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || "");
      setBio(profileData.bio || "");
      setAddressText(profileData.address_text || "");
      setLookingFor(profileData.looking_for || "");
      setExperience(profileData.experience || "");
      setPhotos(profileData.photos || []);
      setAvatarUrl(profileData.photos?.[0] || profileData.avatar_url || null);
    }
  }, [profileData]);

  const handleBack = () => {
    navigate(-1);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Seleziona un file immagine valido");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine deve essere inferiore a 5MB");
      return;
    }

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      const newPhotoUrl = urlData.publicUrl;
      
      // Add new photo as first in the array
      const updatedPhotos = [newPhotoUrl, ...photos.filter(p => p !== newPhotoUrl)];
      setPhotos(updatedPhotos);
      setAvatarUrl(newPhotoUrl);
      
      toast.success("Foto caricata!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Errore durante il caricamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    
    try {
      const updateData: Record<string, unknown> = {
        full_name: fullName.trim(),
        bio: bio.trim(),
        address_text: addressText.trim(),
        photos: photos,
      };

      // Add role-specific fields
      if (isEmployer) {
        updateData.looking_for = lookingFor.trim();
      } else {
        updateData.experience = experience.trim();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      // Invalidate cache and refetch
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await refetch();
      
      toast.success("Profilo aggiornato con successo!", { duration: 2000 });
      navigate(-1);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Errore durante il salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic classes based on role
  const backButtonClasses = isEmployer 
    ? "text-blue-600 hover:bg-blue-50" 
    : "text-primary hover:bg-accent";
  
  const inputBorderClasses = isEmployer
    ? "focus-visible:ring-blue-500 border-blue-200"
    : "focus-visible:ring-primary border-primary/20";
  
  const buttonClasses = isEmployer
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-primary hover:bg-primary/90 text-primary-foreground";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className={`p-2 rounded-full transition-colors ${backButtonClasses}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Modifica Profilo</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
        {/* Photo Section */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="relative">
            <div className={`w-28 h-28 rounded-full overflow-hidden ${theme.primary} flex items-center justify-center shadow-lg`}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-white font-bold">
                  {fullName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`absolute -bottom-1 -right-1 p-2.5 rounded-full shadow-md transition-colors ${buttonClasses} disabled:opacity-50`}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`mt-3 text-sm font-medium ${isEmployer ? "text-blue-600" : "text-primary"}`}
          >
            {isUploading ? "Caricamento..." : "Cambia Foto"}
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              {isEmployer ? "Nome Attività" : "Nome e Cognome"}
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isEmployer ? "Es. Bar Da Mario" : "Es. Mario Rossi"}
              className={`${inputBorderClasses}`}
            />
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Indirizzo / Zona
            </Label>
            <Input
              id="address"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="Es. Genova, Centro Storico"
              className={`${inputBorderClasses}`}
            />
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              {isEmployer ? "Descrizione Attività" : "Presentazione"}
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                isEmployer 
                  ? "Descrivi la tua attività, cosa fate, orari..." 
                  : "Parlaci di te, delle tue passioni e competenze..."
              }
              rows={4}
              className={`resize-none ${inputBorderClasses}`}
            />
          </div>

          {/* Role-Specific Fields */}
          {isEmployer ? (
            <div className="space-y-2">
              <Label htmlFor="lookingFor" className="text-sm font-medium">
                Chi cerco
              </Label>
              <Textarea
                id="lookingFor"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="Descrivi il tipo di lavoratori che cerchi..."
                rows={3}
                className={`resize-none ${inputBorderClasses}`}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-sm font-medium">
                Esperienze
              </Label>
              <Textarea
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Racconta le tue esperienze lavorative..."
                rows={3}
                className={`resize-none ${inputBorderClasses}`}
              />
            </div>
          )}
        </div>
      </main>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full h-12 text-base font-semibold ${buttonClasses}`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salva Modifiche
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
