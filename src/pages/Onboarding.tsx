import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagSelector } from '@/components/tags/TagSelector';
import { PhotoUploader } from '@/components/onboarding/PhotoUploader';
import { toast } from 'sonner';
import { Instagram, Globe, User, Briefcase, Camera, Hash, Loader2 } from 'lucide-react';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<{ bio?: string; tags?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { bio?: string; tags?: string } = {};
    
    if (!bio.trim()) {
      newErrors.bio = 'La presentazione è obbligatoria';
    }
    
    if (selectedTags.length === 0) {
      newErrors.tags = 'Seleziona almeno un tag';
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

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio.trim(),
          experience: experience.trim() || null,
          photos,
          social_links: socialLinks,
          tags: selectedTags,
          is_onboarded: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profilo completato!');
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Errore nel salvataggio del profilo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-8 text-center">
        <h1 className="text-2xl font-bold">Completa il tuo profilo</h1>
        <p className="text-primary-foreground/80 mt-1">
          Fatti conoscere dalla community!
        </p>
      </div>

      <div className="px-6 py-6 space-y-8 pb-24">
        {/* Section A: Chi sei */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5 text-primary" />
            <span>Chi sei</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base font-medium">
                Presentazione <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bio"
                placeholder="Parlaci di te, cosa sai fare o cosa cerchi..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`min-h-[120px] ${errors.bio ? 'border-destructive' : ''}`}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio}</p>
              )}
            </div>

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
          </div>
        </section>

        {/* Section B: La tua Vetrina */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Camera className="h-5 w-5 text-primary" />
            <span>La tua Vetrina</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Carica fino a 10 foto per mostrarti al meglio
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
            <Globe className="h-5 w-5 text-primary" />
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

        {/* Section D: I tuoi Interessi */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Hash className="h-5 w-5 text-primary" />
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
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button
          onClick={handleComplete}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Salvataggio...
            </>
          ) : (
            'Completa Profilo'
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
