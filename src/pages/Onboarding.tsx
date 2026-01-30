import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagSelector } from '@/components/tags/TagSelector';
import { PhotoUploader } from '@/components/onboarding/PhotoUploader';
import { LocationPicker } from '@/components/onboarding/LocationPicker';
import { toast } from 'sonner';
import { Instagram, Globe, User, Briefcase, Camera, Hash, Loader2, Store, Search, MapPin } from 'lucide-react';

const Onboarding = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  const { theme, isEmployer } = useAppTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Common fields
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  
  // Worker-specific fields
  const [experience, setExperience] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Employer-specific fields
  const [lookingFor, setLookingFor] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  
  
  const [errors, setErrors] = useState<{ bio?: string; tags?: string; lookingFor?: string; location?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { bio?: string; tags?: string; lookingFor?: string; location?: string } = {};
    
    if (!bio.trim()) {
      newErrors.bio = isEmployer ? 'La descrizione attività è obbligatoria' : 'La presentazione è obbligatoria';
    }
    
    if (!isEmployer && selectedTags.length === 0) {
      newErrors.tags = 'Seleziona almeno un tag';
    }
    
    if (isEmployer && !lookingFor.trim()) {
      newErrors.lookingFor = 'Questo campo è obbligatorio';
    }
    
    if (isEmployer && (locationLat === null || locationLng === null)) {
      newErrors.location = 'Seleziona la posizione della tua attività';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    if (!user) {
      toast.error('Utente non autenticato');
      return;
    }

    setLoading(true);

    try {
      const socialLinks = {
        instagram: instagram.trim() || null,
        website: website.trim() || null,
      };

      const updateData: Record<string, unknown> = {
        bio: bio.trim(),
        photos,
        social_links: socialLinks,
        is_onboarded: true,
      };

      // Add role-specific fields
      if (isEmployer) {
        updateData.looking_for = lookingFor.trim();
        updateData.lat = locationLat;
        updateData.lng = locationLng;
      } else {
        updateData.experience = experience.trim() || null;
        updateData.tags = selectedTags;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profilo completato!', { duration: 1000 });
      
      // HARD RELOAD to ensure fresh data is loaded from DB
      setTimeout(() => {
        window.location.replace('/');
      }, 800);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Errore nel salvataggio del profilo');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Theme classes based on role using the centralized hook
  const headerBgClass = theme.headerBg;
  const headerTextClass = theme.headerText;
  const buttonBgClass = `${theme.btnFilled} ${theme.btnFilledHover}`;
  const iconColorClass = theme.primaryText;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`${headerBgClass} ${headerTextClass} px-6 py-8 text-center`}>
        <h1 className="text-2xl font-bold">
          {isEmployer ? 'Configura la tua Attività' : 'Completa il tuo profilo'}
        </h1>
        <p className={`${isEmployer ? 'text-white/80' : 'text-primary-foreground/80'} mt-1`}>
          {isEmployer ? 'Fatti trovare dai migliori candidati!' : 'Fatti conoscere dalla community!'}
        </p>
      </div>

      <div className="px-6 py-6 space-y-8 pb-24">
        {/* Section A: Chi sei / Descrizione Attività */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            {isEmployer ? (
              <Store className={`h-5 w-5 ${iconColorClass}`} />
            ) : (
              <User className={`h-5 w-5 ${iconColorClass}`} />
            )}
            <span>{isEmployer ? 'La tua Attività' : 'Chi sei'}</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base font-medium">
                {isEmployer ? 'Descrizione Attività' : 'Presentazione'} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bio"
                placeholder={isEmployer 
                  ? "Descrivi la tua attività, cosa fate e cosa offrite..." 
                  : "Parlaci di te, cosa sai fare o cosa cerchi..."}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`min-h-[120px] ${errors.bio ? 'border-destructive' : ''}`}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio}</p>
              )}
            </div>

            {/* Worker-only: Experiences */}
            {!isEmployer && (
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-base font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Esperienze
                </Label>
                <Textarea
                  id="experience"
                  placeholder="Hai già lavorato come rider o cameriere? Scrivilo qui..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {/* Employer-only: Looking For */}
            {isEmployer && (
              <div className="space-y-2">
                <Label htmlFor="lookingFor" className="text-base font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Chi cerchi solitamente? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="lookingFor"
                  placeholder="es. Rider per consegne, Staff per eventi, Camerieri per il weekend..."
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className={`min-h-[100px] ${errors.lookingFor ? 'border-destructive' : ''}`}
                />
                {errors.lookingFor && (
                  <p className="text-sm text-destructive">{errors.lookingFor}</p>
                )}
              </div>
            )}

            {/* Employer-only: Location Picker */}
            {isEmployer && (
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dove si trova l'attività? <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Clicca o trascina il pin per impostare la posizione
                </p>
                <LocationPicker
                  lat={locationLat}
                  lng={locationLng}
                  onLocationChange={(lat, lng) => {
                    setLocationLat(lat);
                    setLocationLng(lng);
                  }}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section B: La tua Vetrina / Foto Attività */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Camera className={`h-5 w-5 ${iconColorClass}`} />
            <span>{isEmployer ? 'Foto Attività / Logo' : 'La tua Vetrina'}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {isEmployer 
              ? 'Carica foto della tua attività o il logo' 
              : 'Carica fino a 10 foto per mostrarti al meglio'}
          </p>
          
          <PhotoUploader
            photos={photos}
            onPhotosChange={setPhotos}
            userId={user?.id || ''}
            maxPhotos={10}
          />
        </section>

        {/* Section C: Social */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Globe className={`h-5 w-5 ${iconColorClass}`} />
            <span>Social</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                placeholder="@tuousername"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sito Web
              </Label>
              <Input
                id="website"
                placeholder="https://tuosito.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Section D: I tuoi Interessi (Worker Only) */}
        {!isEmployer && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Hash className={`h-5 w-5 ${iconColorClass}`} />
              <span>I tuoi Interessi <span className="text-destructive">*</span></span>
            </div>

            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags}</p>
            )}
          </section>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button
          onClick={handleComplete}
          disabled={loading}
          className={`w-full ${buttonBgClass} text-white font-semibold py-6`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Salvataggio...
            </>
          ) : (
            isEmployer ? 'Configura Attività' : 'Completa Profilo'
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
