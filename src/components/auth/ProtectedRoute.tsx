import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { role, hasLoaded } = useUser();
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
   * Sessione valida ma NESSUN ruolo: e' l'utente arrivato da Google che non ha
   * ancora una riga in `profiles`.
   *
   * ⚠️ Il controllo sta qui e non solo in Auth perche' dopo un accesso OAuth
   * non e' garantito che si passi da /auth: se l'indirizzo di ritorno non e'
   * fra quelli ammessi, si atterra sulla home. Senza questa guardia si
   * entrerebbe nell'app con un profilo inesistente, e le pagine che leggono il
   * ruolo si romperebbero una per una.
   *
   * Si aspetta `hasLoaded`, se no al primo istante il ruolo e' nullo per tutti
   * e verrebbero rimbalzati anche gli utenti a posto.
   */
  const staGiaSistemando =
    location.pathname === '/scegli-ruolo' || location.pathname === '/onboarding';

  if (hasLoaded && !role && !staGiaSistemando) {
    return <Navigate to="/scegli-ruolo" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
