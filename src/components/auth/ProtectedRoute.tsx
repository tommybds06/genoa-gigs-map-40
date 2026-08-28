import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { doveMandare } from '@/lib/percorsoAccesso';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { profile, hasLoaded } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  /**
   * ⚠️ Il controllo sta qui e non solo in Auth perche' dopo un accesso con
   * Google non e' garantito che si passi da /auth: se l'indirizzo di ritorno
   * non e' fra quelli ammessi si atterra sulla home. Senza questa guardia si
   * entrerebbe nell'app con un profilo che nessuno ha compilato.
   *
   * La regola vera sta in lib/percorsoAccesso.ts — qui si applica soltanto.
   * Si aspetta `hasLoaded`, se no al primo istante il profilo e' nullo per
   * tutti e verrebbero rimbalzati anche gli utenti a posto.
   */
  const staGiaSistemando =
    location.pathname === '/scegli-ruolo' || location.pathname === '/onboarding';

  if (hasLoaded && !staGiaSistemando) {
    const destinazione = doveMandare(user, profile);
    if (destinazione === '/scegli-ruolo') {
      return <Navigate to="/scegli-ruolo" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
