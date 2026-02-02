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
import { AppLogo } from '@/components/ui/AppLogo';
import { 
  GraduationCap, 
  Store, 
  Mail, 
  Lock, 
  User,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'worker' | 'employer';

const emailSchema = z.string().trim().email('Email non valida').max(255, 'Email troppo lunga');
const passwordSchema = z.string().min(6, 'Password deve essere almeno 6 caratteri').max(72, 'Password troppo lunga');
const nameSchema = z.string().trim().max(100, 'Nome troppo lungo').optional();

const Auth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  const { refetch: refetchProfile } = useUser();

  // Removed unused waitForProfile function - using direct upsert + hard reload strategy
  
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; role?: string; neighborhood?: string }>({});

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !authLoading) {
        // Check if user has completed onboarding
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

      // Neighborhood is required for employers
      if (selectedRole === 'employer' && !neighborhood) {
        newErrors.neighborhood = 'Seleziona il quartiere della tua attività';
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
          // Redirect will be handled by useEffect after checking onboarding status
        }
      } else {
        if (!selectedRole) {
          toast.error('Seleziona un ruolo');
          setLoading(false);
          return;
        }

        // Step 1: Create auth user
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
          // Step 2: FORCE WRITE profile with upsert (bypass trigger race condition)
          const profileData: {
            id: string;
            role: 'worker' | 'employer';
            full_name: string | null;
            neighborhood: string | null;
            is_onboarded: boolean;
          } = {
            id: data.user.id,
            role: selectedRole,
            full_name: fullName || null,
            neighborhood: selectedRole === 'employer' ? neighborhood : null,
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

          // Step 3: Show success toast
          toast.success('Benvenuto! Reindirizzamento...', { duration: 1000 });
          
          // Step 4: HARD RELOAD - Wait a bit for toast to show, then force full page reload
          // This bypasses ALL React state/cache issues
          setTimeout(() => {
            // Force complete browser reload to /onboarding
            window.location.replace('/onboarding');
          }, 800);
          
          // Keep loading spinner active - don't proceed to finally block
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in flex flex-col items-center">
          <AppLogo size="lg" />
          <p className="text-muted-foreground mt-4">
            {isLogin ? 'Bentornato!' : 'Unisciti alla community'}
          </p>
        </div>

        {/* Main Card */}
        <div className="material-card-elevated p-8 rounded-3xl animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection (only for signup) - Diamond Cards */}
            {!isLogin && (
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground text-center block">Chi sei?</label>
                {errors.role && <p className="text-xs text-destructive text-center">{errors.role}</p>}
                <div className="flex justify-center items-center gap-10 py-4">
                  {/* Worker Diamond Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('worker')}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div 
                      className={`w-24 h-24 rotate-45 rounded-xl shadow-lg flex items-center justify-center transition-all duration-300 ease-out ${
                        selectedRole === 'worker'
                          ? 'bg-primary border-2 border-primary scale-105 shadow-xl'
                          : 'bg-background border-2 border-slate-200 group-hover:border-slate-300 group-hover:scale-105'
                      }`}
                    >
                      <div className="-rotate-45 flex flex-col items-center justify-center">
                        <GraduationCap className={`w-8 h-8 transition-colors duration-300 ${
                          selectedRole === 'worker' ? 'text-white' : 'text-slate-400'
                        }`} />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className={`font-semibold text-sm transition-colors duration-300 ${
                        selectedRole === 'worker' ? 'text-primary' : 'text-foreground'
                      }`}>Cerco Impiego</h3>
                      <p className="text-xs text-muted-foreground">Studente</p>
                    </div>
                  </button>

                  {/* Employer Diamond Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('employer')}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div 
                      className={`w-24 h-24 rotate-45 rounded-xl shadow-lg flex items-center justify-center transition-all duration-300 ease-out ${
                        selectedRole === 'employer'
                          ? 'bg-blue-600 border-2 border-blue-600 scale-105 shadow-xl'
                          : 'bg-background border-2 border-slate-200 group-hover:border-slate-300 group-hover:scale-105'
                      }`}
                    >
                      <div className="-rotate-45 flex flex-col items-center justify-center">
                        <Store className={`w-8 h-8 transition-colors duration-300 ${
                          selectedRole === 'employer' ? 'text-white' : 'text-slate-400'
                        }`} />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className={`font-semibold text-sm transition-colors duration-300 ${
                        selectedRole === 'employer' ? 'text-blue-600' : 'text-foreground'
                      }`}>Offro Impiego</h3>
                      <p className="text-xs text-muted-foreground">Attività</p>
                    </div>
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
                    className="material-input pl-12 h-12 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
            )}

            {/* Neighborhood (only for employer signup) */}
            {!isLogin && selectedRole === 'employer' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  In che zona si trova la tua attività? <span className="text-destructive">*</span>
                </label>
                <NeighborhoodSelect
                  value={neighborhood}
                  onValueChange={setNeighborhood}
                  placeholder="Seleziona quartiere"
                  variant="employer"
                  error={!!errors.neighborhood}
                />
                {errors.neighborhood && <p className="text-xs text-destructive">{errors.neighborhood}</p>}
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
                  className="material-input pl-12 h-12 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary"
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
                  className="material-input pl-12 h-12 rounded-xl bg-muted border-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-secondary text-foreground font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300"
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
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>Non hai un account? <span className="text-secondary font-medium">Registrati</span></>
              ) : (
                <>Hai già un account? <span className="text-secondary font-medium">Accedi</span></>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          La gig economy studentesca di Genova 🏗️
        </p>
      </div>
    </div>
  );
};

export default Auth;
