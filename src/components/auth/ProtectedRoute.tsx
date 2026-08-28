import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ⚠️ NON aggiungere qui un controllo del tipo "ha un profilo? ha un ruolo?".
 * Provato ad agosto 2026 e rimosso subito: mandava alla scelta ruolo TUTTI,
 * anche chi entrava con email e aveva il profilo completo da mesi.
 *
 * Il motivo sta in UserContext: `hasLoaded` diventa `true` anche quando non
 * c'e' nessun utente, e da li' in poi resta `true` per sempre; `profile`
 * invece torna `null` a ogni cambio di sessione finche' la nuova lettura non
 * e' finita. Quindi nell'istante dopo il login la coppia e'
 * "caricato = si', profilo = nullo", che sembra "non ha un profilo" ma vuol
 * dire solo "sto aspettando".
 *
 * Lo smistamento vive in Auth.tsx, dove il profilo viene letto con una query
 * esplicita e la risposta e' certa. Se un giorno servisse anche qui, prima
 * bisogna dare a UserContext un modo per distinguere "non ancora letto" da
 * "letto, e non c'e'".
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
};

export default ProtectedRoute;
