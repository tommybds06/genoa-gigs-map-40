import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NeighborhoodSelect } from '@/components/ui/NeighborhoodSelect';
import {
  GraduationCap,
  Store,
  User,
  MapPin,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { MailIcon, LucchettoIcon, AnnunciIcon, ProfiloIcon, MappaIcon } from '@/components/icons/uiIcons';
import { GenericoIcon } from '@/components/icons/roleIcons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type UserRole = 'worker' | 'employer';
type Social = 'google' | 'apple';

/* I marchi vanno riprodotti come sono: Google e Apple hanno linee guida
   precise sui loro loghi, e ridisegnarli nel nostro stile hand-drawn sarebbe
   un uso scorretto. Sono le uniche due icone dell'app a non essere nostre. */
const LogoGoogle = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-2.8-.4-4H24v7.3h12.1c-.2 2-1.6 5-4.5 7l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15.6z" />
    <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8 41.4 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.5 28.5c-.5-1.4-.7-2.9-.7-4.5s.3-3.1.7-4.5l-7.1-5.5C2.9 17 2 20.4 2 24s.9 7 2.4 10z" />
    <path fill="#EA4335" d="M24 10.6c3.2 0 5.4 1.4 6.7 2.6l6.1-6C33 3.9 29.9 2 24 2 15.4 2 8 6.6 4.4 14l7.1 5.5c1.8-5.3 6.7-8.9 12.5-8.9z" />
  </svg>
);

const LogoApple = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M16.4 12.8c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.8zM14 5.6c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
  </svg>
);

const emailSchema = z.string().trim().email('Email non valida').max(255, 'Email troppo lunga');
const passwordSchema = z.string().min(6, 'Password deve essere almeno 6 caratteri').max(72, 'Password troppo lunga');
const nameSchema = z.string().trim().max(100, 'Nome troppo lungo').optional();

// Theme configuration for each role
const roleThemes = {
  worker: {
    bg: 'bg-accent/50',
    primary: 'bg-primary',
    primaryHover: 'hover:bg-primary/90',
    text: 'text-primary',
    border: 'border-primary',
    ring: 'ring-primary',
    cardSelected: 'bg-primary/10 ring-2 ring-primary',
    iconBg: 'bg-primary text-primary-foreground',
    inputFocus: 'focus:ring-primary focus:border-primary',
  },
  employer: {
    bg: 'bg-employer-50',
    primary: 'bg-employer-700',
    primaryHover: 'hover:bg-employer-800',
    text: 'text-employer',
    border: 'border-employer',
    ring: 'ring-employer',
    cardSelected: 'bg-employer/10 ring-2 ring-employer',
    iconBg: 'bg-employer-700 text-employer-foreground',
    inputFocus: 'focus:ring-employer focus:border-employer',
  },
  neutral: {
    bg: 'bg-background',
    primary: 'bg-primary',
    primaryHover: 'hover:opacity-90',
    text: 'text-foreground',
    border: 'border-muted',
    ring: 'ring-muted',
    cardSelected: '',
    iconBg: 'bg-muted',
    inputFocus: 'focus:ring-ring',
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  const { refetch: refetchProfile } = useUser();
  
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [social, setSocial] = useState<Social | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; role?: string; neighborhood?: string; address?: string }>({});

  // Get current theme based on selected role
  const currentTheme = selectedRole ? roleThemes[selectedRole] : roleThemes.neutral;

  /* Qui il ruolo non arriva ancora da UserContext — il profilo non esiste —
     quindi lo scriviamo noi sull'elemento radice appena viene scelto. Cosi'
     seguono anche i token che non passano dal tema JS: fondo dei campi,
     anello di focus, hover dei bottoni. Senza, scegliendo "Offro Impiego" la
     pagina diventava blu ma i campi restavano arancioni. */
  useEffect(() => {
    document.documentElement.dataset.ruolo = selectedRole ?? "worker";
  }, [selectedRole]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !authLoading) {
        // ⚠️ .maybeSingle() e non .single(): chi entra con Google o Apple NON
        // ha ancora una riga in `profiles`, e .single() su zero righe fa
        // rispondere 406 a PostgREST. E' lo stesso inciampo dello storico
        // candidature (vedi CLAUDE.md).
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_onboarded, role')
          .eq('id', user.id)
          .maybeSingle();

        // Tre casi, in ordine di quanto manca:
        //   niente riga o niente ruolo → non sappiamo nemmeno chi e'
        //   riga senza onboarding      → sa chi e', mancano i dati del profilo
        //   tutto a posto              → dentro
        if (!profile || !profile.role) {
          navigate('/scegli-ruolo');
        } else if (!profile.is_onboarded) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      }
    };
    
    checkOnboarding();
  }, [user, authLoading, navigate]);

  /**
   * Con OAuth non esistono "accedi" e "registrati" separati: e' una chiamata
   * sola, e Supabase crea l'utente se non c'e' gia'. Chi torna entra, chi e'
   * nuovo si ritrova senza riga in `profiles` e viene mandato a /scegli-ruolo
   * dallo smistamento qui sopra.
   *
   * ⚠️ Il redirect torna su /auth di proposito: e' l'unica pagina che sa
   * decidere dove mandare la persona, e lo fa sempre allo stesso modo, sia che
   * arrivi da un modulo sia che torni da Google.
   *
   * ⚠️ Perche' non si vede niente finche' non lo configuri: i provider vanno
   * accesi nel pannello Supabase (Authentication → Providers) con le
   * credenziali prese da Google Cloud e da Apple Developer. Senza, la chiamata
   * risponde "provider is not enabled".
   */
  const accediCon = async (provider: Social) => {
    setSocial(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) {
      console.error(`Errore accesso ${provider}:`, error);
      toast.error(
        error.message.includes('not enabled')
          ? `Accesso con ${provider === 'google' ? 'Google' : 'Apple'} non ancora attivo`
          : 'Accesso non riuscito. Riprova.',
        { duration: 3000 }
      );
      setSocial(null);
    }
    // Se va a buon fine il browser esce dalla pagina: non serve spegnere lo
    // stato di caricamento, e spegnerlo farebbe lampeggiare il bottone.
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
      if (!selectedRole) {
        newErrors.role = 'Seleziona un ruolo';
      }
      
      if (fullName) {
        const nameResult = nameSchema.safeParse(fullName);
        if (!nameResult.success) {
          newErrors.name = nameResult.error.errors[0].message;
        }
      }

      // Neighborhood required for both roles
      if (!neighborhood) {
        newErrors.neighborhood = 'Seleziona il tuo quartiere';
      }

      // Address required only for employer
      if (selectedRole === 'employer' && !address.trim()) {
        newErrors.address = 'Inserisci l\'indirizzo della tua attività';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email o password non corretti', { duration: 2000 });
          } else {
            toast.error(error.message, { duration: 2000 });
          }
        } else {
          toast.success('Bentornato!', { duration: 2000 });
        }
      } else {
        if (!selectedRole) {
          toast.error('Seleziona un ruolo');
          setLoading(false);
          return;
        }

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              role: selectedRole,
              full_name: fullName,
            }
          }
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Email già registrata.', { duration: 2000 });
          } else {
            toast.error(error.message, { duration: 2000 });
          }
        } else if (data.user) {
          const profileData: {
            id: string;
            role: 'worker' | 'employer';
            full_name: string | null;
            neighborhood: string | null;
            address_text: string | null;
            is_onboarded: boolean;
          } = {
            id: data.user.id,
            role: selectedRole,
            full_name: fullName || null,
            neighborhood: neighborhood || null,
            address_text: selectedRole === 'employer' ? address.trim() || null : null,
            is_onboarded: false,
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast.error('Errore nella creazione del profilo. Riprova.', { duration: 3000 });
            setLoading(false);
            return;
          }

          toast.success('Benvenuto! Reindirizzamento...', { duration: 1000 });
          
          setTimeout(() => {
            window.location.replace('/onboarding');
          }, 800);
          
          return;
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('Si è verificato un errore. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 overflow-y-auto py-8 px-4 transition-colors duration-700 ease-in-out",
        !isLogin && selectedRole ? currentTheme.bg : 'bg-background'
      )}
      style={{ 
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'auto'
      }}
    >
      <div className="w-full max-w-md mx-auto pb-8">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <img
            src={selectedRole === 'employer' ? "/images/logo-employer-v2.svg" : "/images/logo-worker-v2.svg"}
            alt="Politask"
            className="h-20 w-auto mx-auto mb-3 transition-all duration-500"
          />
          {!isLogin && (
            <h1 className="titolo-vuoto">Crea il tuo account</h1>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-card material-card-elevated p-8 rounded-3xl animate-scale-in transition-shadow duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection (only for signup) */}
            {!isLogin && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Chi sei?</label>
                {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {/* Worker Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('worker')}
                    className={cn(
                      "relative p-4 rounded-2xl transition-all duration-500 text-left touch-feedback",
                      selectedRole === 'worker'
                        ? 'bg-primary/15 ring-2 ring-primary'
                        : 'bg-card border border-border hover:border-primary/40'
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-500",
                      selectedRole === 'worker' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                    )}>
                      <GenericoIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Cerco Impiego</h3>
                    <p className="text-xs text-muted-foreground mt-1">Sono uno Studente</p>
                    {selectedRole === 'worker' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-scale-in" />
                    )}
                  </button>

                  {/* Employer Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('employer')}
                    className={cn(
                      "relative p-4 rounded-2xl transition-all duration-500 text-left touch-feedback",
                      selectedRole === 'employer'
                        ? 'bg-employer/15 ring-2 ring-employer-700'
                        : 'bg-card border border-border hover:border-employer/40'
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-500",
                      selectedRole === 'employer' ? 'bg-employer-700 text-employer-foreground' : 'bg-employer-50 text-employer-800'
                    )}>
                      <AnnunciIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Offro Impiego</h3>
                    <p className="text-xs text-muted-foreground mt-1">Privato o Attività</p>
                    {selectedRole === 'employer' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-employer rounded-full animate-scale-in" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Full Name (only for signup) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {selectedRole === 'employer' ? 'Nome attività (se ne si ha una)' : 'Nome completo'}
                </label>
                <div className="relative">
                  <ProfiloIcon className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder=""
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn(
                      "pl-12",
                      selectedRole === 'worker' && "focus:ring-2 focus:ring-primary",
                      selectedRole === 'employer' && "focus:ring-2 focus:ring-employer",
                      !selectedRole && "focus:ring-2 focus:ring-ring"
                    )}
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
            )}

            {/* Neighborhood (for both roles during signup) */}
            {!isLogin && selectedRole && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium text-foreground">
                  {selectedRole === 'employer' ? 'In che zona si trova la tua attività?' : 'In che zona abiti?'} <span className="text-destructive">*</span>
                </label>
                <NeighborhoodSelect
                  value={neighborhood}
                  onValueChange={setNeighborhood}
                  placeholder="Seleziona quartiere"
                  variant={selectedRole === 'employer' ? 'employer' : 'default'}
                  error={!!errors.neighborhood}
                />
                {errors.neighborhood && <p className="text-xs text-destructive">{errors.neighborhood}</p>}
              </div>
            )}

            {/* Address (only for employer signup) */}
            {!isLogin && selectedRole === 'employer' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium text-foreground">
                  Indirizzo attività <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MappaIcon className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Via e numero civico"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-12"
                  />
                </div>
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "pl-12",
                    !isLogin && selectedRole === 'worker' && "focus:ring-2 focus:ring-primary",
                    !isLogin && selectedRole === 'employer' && "focus:ring-2 focus:ring-employer",
                    (isLogin || !selectedRole) && "focus:ring-2 focus:ring-ring"
                  )}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <LucchettoIcon className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "pl-12",
                    !isLogin && selectedRole === 'worker' && "focus:ring-2 focus:ring-primary",
                    !isLogin && selectedRole === 'employer' && "focus:ring-2 focus:ring-employer",
                    (isLogin || !selectedRole) && "focus:ring-2 focus:ring-ring"
                  )}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-14 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-500 touch-feedback",
                !isLogin && selectedRole === 'worker' && "bg-primary hover:bg-primary/90 text-primary-foreground",
                !isLogin && selectedRole === 'employer' && "bg-employer-700 hover:bg-employer-800 text-employer-foreground",
                (isLogin || !selectedRole) && "bg-primary text-primary-foreground"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Accedi' : 'Prosegui'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* ---- Accesso con Google / Apple ----
              Con OAuth entrare e iscriversi sono la STESSA cosa: Supabase crea
              l'utente se non c'e'. La differenza la fa il profilo — se manca,
              lo smistamento qui sopra manda a /scegli-ruolo.
              Stanno sotto al modulo e non sopra: chi ha gia' un account con
              password lo usa, e mettere i social in cima spinge le persone a
              crearsi un secondo accesso per lo stesso indirizzo. */}
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">oppure</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => accediCon('google')}
                disabled={!!social}
                className="w-full font-medium border-transparent sagoma-btn sagoma-btn-lg bordo-btn rounded-full"
              >
                {social === 'google' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogoGoogle />
                    Continua con Google
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => accediCon('apple')}
                disabled={!!social}
                className="w-full font-medium border-transparent sagoma-btn sagoma-btn-lg bordo-btn rounded-full"
              >
                {social === 'apple' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogoApple />
                    Continua con Apple
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setSelectedRole(null);
                setNeighborhood('');
                setAddress('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>Non hai un account? <span className="text-secondary font-medium">Registrati</span></>
              ) : (
                <>Hai già un account? <span className={cn(
                  "font-medium transition-colors duration-500",
                  selectedRole === 'employer' ? 'text-employer' : 'text-secondary'
                )}>Accedi</span></>
              )}
            </button>
          </div>
        </div>

        {/* Il claim serve a chi non conosce ancora l'app, quindi ha senso in
            REGISTRAZIONE e non in accesso: chi accede sa gia' cos'e'.
            "Gig economy" era gergo da addetti ai lavori — uno studente di
            Genova cerca "lavoretti", non "gig". */}
        {!isLogin && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Lavoretti per studenti, a Genova
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
