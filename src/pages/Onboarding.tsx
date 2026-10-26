import { useState, useEffect } from 'react';
import { saltaProssimoSplash } from "@/lib/splash";
import { leggiSocial } from "@/lib/social";
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
import { PhotoGalleryManager } from '@/components/profile/PhotoGalleryManager';
import { AreaPicker } from '@/components/onboarding/AreaPicker';
import { IntestazioneAMano } from '@/components/onboarding/IntestazioneAMano';
import { VerificaIdentita } from '@/components/profile/VerificaIdentita';
import { MESSAGGI_PARTITA_IVA, RAGGIO_AREA, salvaRiservati, testiEmployer, verificaPartitaIva } from '@/lib/registrazione';
import { LocationPicker } from '@/components/onboarding/LocationPicker';
import { toast } from 'sonner';
import { BadgeCheck, Loader2 } from 'lucide-react';
import {
  ProfiloIcon, DocumentoIcon, FotoIcon, GloboIcon, InstagramIcon,
  HashtagIcon, SearchIcon, MappaIcon, AnnunciIcon,
} from '@/components/icons/uiIcons';

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
  // Attività o privato (24 ottobre): cambiano testi, posizione e verifica.
  const tipo = isEmployer ? (profile?.tipo_employer ?? "attivita") : null;
  const privato = tipo === "privato";
  const testi = testiEmployer(tipo);
  const [partitaIva, setPartitaIva] = useState('');

  type Errori = { bio?: string; tags?: string; lookingFor?: string; location?: string; instagram?: string; website?: string };
  const [errors, setErrors] = useState<Errori>({});

  const validateForm = (): boolean => {
    // I link social sono facoltativi, ma se ci sono devono essere leggibili.
    const newErrors: Errori = { ...leggiSocial(instagram, website).errori };
    
    if (!bio.trim()) {
      newErrors.bio = isEmployer ? `${testi.descrizione} è obbligatoria` : 'La presentazione è obbligatoria';
    }
    
    if (!isEmployer && selectedTags.length === 0) {
      newErrors.tags = 'Seleziona almeno un tag';
    }
    
    if (isEmployer && !lookingFor.trim()) {
      newErrors.lookingFor = 'Questo campo è obbligatorio';
    }
    
    if (isEmployer && (locationLat === null || locationLng === null)) {
      newErrors.location = privato ? 'Scegli la zona in cui ti trovi' : 'Seleziona la posizione della tua attività';
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
      // Puliti (lib/social.ts): «@mario» → «mario», «barmario.it» → «https://barmario.it».
      const socialLinks = leggiSocial(instagram, website).valori;

      const updateData: Record<string, unknown> = {
        bio: bio.trim(),
        photos,
        social_links: socialLinks,
        is_onboarded: true,
      };

      // Add role-specific fields
      if (isEmployer) {
        updateData.looking_for = lookingFor.trim();
        // Il privato NON scrive una posizione nel profilo: l'area va nei dati
        // riservati, e il database pubblica il centro spostato (qui sotto).
        if (!privato) {
          updateData.lat = locationLat;
          updateData.lng = locationLng;
        }
      } else {
        updateData.experience = experience.trim() || null;
        updateData.tags = selectedTags;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      if (privato && locationLat !== null && locationLng !== null) {
        await salvaRiservati(user.id, { area_lat: locationLat, area_lng: locationLng, area_raggio: RAGGIO_AREA });
      }

      // Partita IVA facoltativa: si verifica, ma la configurazione va avanti
      // comunque — se VIES non risponde si riprova da Modifica profilo.
      if (!privato && isEmployer && partitaIva.trim()) {
        const esito = await verificaPartitaIva(partitaIva);
        (esito === "valida" ? toast.success : toast.error)(MESSAGGI_PARTITA_IVA[esito], { duration: 3000 });
      }

      toast.success('Profilo completato!', { duration: 800 });
      
      // HARD RELOAD to ensure fresh data is loaded from DB
      setTimeout(() => {
        // Fine della registrazione, non un'apertura: niente splash.
        saltaProssimoSplash();
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
    // ⚠️ h-full + overflow-y-auto, non min-h-screen: MainLayout mette
    // `overflow-hidden` sul contenitore, quindi una pagina piu' alta dello
    // schermo veniva TAGLIATA invece che scorrere — e il bottone in fondo
    // diventava irraggiungibile.
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      {/* Il bordo basso è tagliato a mano (IntestazioneAMano, 24 ottobre). */}
      <IntestazioneAMano className={`${headerBgClass} ${headerTextClass} px-6 pb-9 pt-8 text-center`}>
        <h1 className="text-2xl font-bold">
          {isEmployer ? testi.titoloConfigura : 'Completa il tuo profilo'}
        </h1>
        {/* ⚠️ Il sottotitolo employer sta su un fondo BLU PIENO, dove
            `primary-foreground` e' l'inchiostro: nero su blu scuro. Serve il
            bianco. Sul worker il fondo e' arancione e l'inchiostro va bene.
            Il testo worker era "Fatti conoscere dalla community": non dice
            cosa ci guadagni. Ora lo dice. */}
        <p className={`mt-1 ${isEmployer ? 'text-employer-foreground/85' : 'text-primary-foreground/75'}`}>
          {isEmployer
            ? privato ? 'Trova qualcuno che ti dia una mano' : 'Fatti trovare dai migliori candidati!'
            : 'Un profilo completo viene scelto prima'}
        </p>
      </IntestazioneAMano>

      {/* pb-28 e non pb-24: il footer e' fisso e alto ~76px, e con pb-24
          l'ultima sezione ci finiva sotto. In compenso non serve piu' spazio
          extra dopo i tag durata, che qui non ci sono: la durata si sceglie
          creando un annuncio, non compilando il profilo. */}
      <div className="px-6 py-6 space-y-8 pb-28">
        {/* Section A: Chi sei / Descrizione attività */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            {isEmployer && !privato ? (
              <AnnunciIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
            ) : (
              <ProfiloIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
            )}
            <span className="titolo-mini">{isEmployer ? testi.sezione : 'Chi sei'}</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base font-medium">
                {isEmployer ? testi.descrizione : 'Presentazione'} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bio"
                placeholder={isEmployer
                  ? testi.segnapostoDescrizione
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
                  <DocumentoIcon className="h-4 w-4 shrink-0" />
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
                  <SearchIcon className="h-4 w-4 shrink-0" />
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

            {/* Posizione: l'ATTIVITÀ mette il pin preciso, il PRIVATO sceglie
                un'area di ~300 m (24 ottobre). */}
            {isEmployer && (
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <MappaIcon className="h-4 w-4 shrink-0" />
                  {privato ? 'La tua zona' : "Dove si trova l'attività?"} <span className="text-destructive">*</span>
                </Label>
                {privato ? (
                  <AreaPicker
                    lat={locationLat}
                    lng={locationLng}
                    onChange={(lat, lng) => {
                      setLocationLat(lat);
                      setLocationLng(lng);
                    }}
                  />
                ) : (
                  <>
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
                  </>
                )}
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
            <FotoIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
            <span className="titolo-mini">{isEmployer ? testi.foto : 'La tua vetrina'}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {isEmployer
              ? testi.testoFoto
              : 'Carica fino a 10 foto per mostrarti al meglio'}
          </p>
          
          {/* Le stesse foto stampate di Modifica profilo (24 ottobre): erano
              riquadri tratteggiati col «+». */}
          <PhotoGalleryManager
            photos={photos}
            onPhotosChange={setPhotos}
            userId={user?.id || ''}
            isEmployer={isEmployer}
            maxPhotos={10}
          />
        </section>

        {/* Verifiche, FACOLTATIVE (24 ottobre): si possono fare anche dopo,
            da Modifica profilo. */}
        {isEmployer && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BadgeCheck className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
              <span className="titolo-mini">Verifica (facoltativa)</span>
            </div>
            {privato ? (
              <VerificaIdentita verificata={!!profile?.identita_verificata} />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="partita-iva" className="text-base font-medium">
                  Partita IVA
                </Label>
                <Input
                  id="partita-iva"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="11 cifre"
                  value={partitaIva}
                  onChange={(e) => setPartitaIva(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Le attività verificate ricevono più candidature. La controlliamo nel registro europeo
                  (VIES): se è valida, il tuo profilo mostra «Attività verificata».
                </p>
              </div>
            )}
          </section>
        )}

        {/* Section C: Social */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <GloboIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
            <span className="titolo-mini">Social</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <InstagramIcon className="h-4 w-4 shrink-0" />
                Instagram
              </Label>
              <Input
                id="instagram"
                placeholder="@tuousername"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
              {errors.instagram && <p className="text-sm text-destructive">{errors.instagram}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <GloboIcon className="h-4 w-4 shrink-0" />
                Sito web
              </Label>
              <Input
                id="website"
                placeholder="https://tuosito.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
            </div>
          </div>
        </section>

        {/* Section D: I tuoi Interessi (Worker Only) */}
        {!isEmployer && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <HashtagIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
              <span className="titolo-mini">I tuoi Interessi <span className="text-destructive">*</span></span>
            </div>

            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              showDuration={false}
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
          size="lg"
          className={`w-full ${buttonBgClass} font-semibold ${isEmployer ? 'text-employer-foreground' : 'text-primary-foreground'}`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Salvataggio...
            </>
          ) : (
            isEmployer ? testi.bottoneConfigura : 'Completa profilo'
          )}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
