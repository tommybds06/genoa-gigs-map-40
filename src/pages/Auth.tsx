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
  Mail, 
  Lock, 
  User,
  MapPin,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type UserRole = 'worker' | 'employer';

const emailSchema = z.string().trim().email('Email non valida').max(255, 'Email troppo lunga');
const passwordSchema = z.string().min(6, 'Password deve essere almeno 6 caratteri').max(72, 'Password troppo lunga');
const nameSchema = z.string().trim().max(100, 'Nome troppo lungo').optional();

// Theme configuration for each role
const roleThemes = {
  worker: {
    bg: 'bg-orange-50',
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
    bg: 'bg-blue-50',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    text: 'text-blue-600',
    border: 'border-blue-600',
    ring: 'ring-blue-600',
    cardSelected: 'bg-blue-600/10 ring-2 ring-blue-600',
    iconBg: 'bg-blue-600 text-white',
    inputFocus: 'focus:ring-blue-600 focus:border-blue-600',
  },
  neutral: {
    bg: 'bg-background',
    primary: 'bg-gradient-to-r from-primary to-secondary',
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
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; role?: string; neighborhood?: string; address?: string }>({});

  // Get current theme based on selected role
  const currentTheme = selectedRole ? roleThemes[selectedRole] : roleThemes.neutral;

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !authLoading) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', user.id)
          .single();
        
        if (profile?.is_onboarded) {
          navigate('/');
        } else {
          navigate('/onboarding');
        }
      }
    };
    
    checkOnboarding();
  }, [user, authLoading, navigate]);

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
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Genoa<span className={cn(
              "transition-colors duration-500",
              selectedRole === 'employer' ? 'text-blue-600' : 'text-secondary'
            )}>Gigs</span>
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Bentornato!' : 'Unisciti alla community'}
          </p>
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
                        ? 'bg-primary/10 ring-2 ring-primary shadow-md'
                        : selectedRole === 'employer'
                          ? 'bg-muted opacity-60 hover:opacity-80'
                          : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-500",
                      selectedRole === 'worker' ? 'bg-primary text-primary-foreground' : 'bg-background'
                    )}>
                      <GraduationCap className="w-6 h-6" />
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
                        ? 'bg-blue-600/10 ring-2 ring-blue-600 shadow-md'
                        : selectedRole === 'worker'
                          ? 'bg-muted opacity-60 hover:opacity-80'
                          : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-500",
                      selectedRole === 'employer' ? 'bg-blue-600 text-white' : 'bg-background'
                    )}>
                      <Store className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Offro Impiego</h3>
                    <p className="text-xs text-muted-foreground mt-1">Privato o Attività</p>
                    {selectedRole === 'employer' && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-blue-600 rounded-full animate-scale-in" />
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
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={selectedRole === 'employer' ? 'Trattoria Da Luigi' : 'Mario Rossi'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn(
                      "pl-12 h-12 rounded-xl bg-muted border-none transition-all duration-500",
                      selectedRole === 'worker' && "focus:ring-2 focus:ring-primary",
                      selectedRole === 'employer' && "focus:ring-2 focus:ring-blue-600",
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
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Via Roma 123"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-muted border-none transition-all duration-500 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="mario.rossi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "pl-12 h-12 rounded-xl bg-muted border-none transition-all duration-500",
                    !isLogin && selectedRole === 'worker' && "focus:ring-2 focus:ring-primary",
                    !isLogin && selectedRole === 'employer' && "focus:ring-2 focus:ring-blue-600",
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "pl-12 h-12 rounded-xl bg-muted border-none transition-all duration-500",
                    !isLogin && selectedRole === 'worker' && "focus:ring-2 focus:ring-primary",
                    !isLogin && selectedRole === 'employer' && "focus:ring-2 focus:ring-blue-600",
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
                !isLogin && selectedRole === 'employer' && "bg-blue-600 hover:bg-blue-700 text-white",
                (isLogin || !selectedRole) && "bg-gradient-to-r from-primary to-secondary text-foreground"
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
                  selectedRole === 'employer' ? 'text-blue-600' : 'text-secondary'
                )}>Accedi</span></>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          La gig economy studentesca di Genova 🌊
        </p>
      </div>
    </div>
  );
};

export default Auth;
