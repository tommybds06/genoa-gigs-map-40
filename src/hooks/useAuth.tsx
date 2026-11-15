import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { canaleAttivo } from '@/lib/notifiche/canale';
import { esciSempre } from '@/lib/uscita';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'worker' | 'employer', fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: 'worker' | 'employer', fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role,
          full_name: fullName,
        }
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  /* ⚠️ Si esce SEMPRE (15 novembre, `lib/uscita.ts`): se il server non
     conferma, `supabase.auth.signOut()` lascia la sessione sul telefono, e
     la pagina di accesso rimandava alla mappa («non riesce a farti
     uscire»). Allora la sessione si toglie come fa Supabase quando l'uscita
     riesce (`_removeSession`: storage + evento SIGNED_OUT), e lo stato qui
     si azzera comunque. */
  const signOut = async () => {
    const { errore } = await esciSempre({
      scollegaNotifiche: () => canaleAttivo.scollega(),
      esciDalServer: () => supabase.auth.signOut(),
      togliSessioneLocale: async () => {
        const auth = supabase.auth as unknown as { _removeSession?: () => Promise<void> };
        await auth._removeSession?.();
      },
    });
    if (errore) {
      console.error('[Politask] uscita: il server non ha confermato, sessione chiusa su questo telefono', errore);
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
