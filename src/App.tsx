import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { UserProvider } from "@/contexts/UserContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ReviewPrompt } from "@/components/reviews/ReviewPrompt";
import { PromemoriaScadenza } from "@/components/bacheca/PromemoriaScadenza";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { GestoreNotifiche } from "@/components/notifiche/GestoreNotifiche";
import { ChiediPermesso } from "@/components/notifiche/ChiediPermesso";
import { BannerIphone } from "@/components/notifiche/BannerIphone";
import { Schede } from "@/components/layout/Schede";
import { TAB_ROUTES } from "@/lib/schede";
import CreateJob from "./pages/CreateJob";
import OpzioniAnnuncio from "./pages/OpzioniAnnuncio";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import Notifiche from "./pages/Notifiche";
import EditProfile from "./pages/EditProfile";
import Auth from "./pages/Auth";
import ReimpostaPassword from "./pages/ReimpostaPassword";
import Onboarding from "./pages/Onboarding";
import ScegliRuolo from "./pages/ScegliRuolo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Evita la raffica di refetch al ritorno sulla tab (concausa del freeze)
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 min
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  const isTabRoute = TAB_ROUTES.includes(location.pathname);

  return (
    <MainLayout hideBottomNav={!isTabRoute}>
      {/* Le pagine con la barra in basso: montate una volta e affiancate
          (components/layout/Schede.tsx). Sotto le pagine di dettaglio resta
          visibile l'ultima, così chi entra da destra le scorre sopra. */}
      <Schede />
      {/* ⚠️ NIENTE `mode="wait"` — era la causa dello SFARFALLIO.
          Con `wait` la pagina vecchia completa la sua uscita (opacità → 0) e
          solo DOPO monta la nuova (opacità 0 → 1): fra le due c'è un istante in
          cui sullo schermo non c'è nessuna pagina, si vede il fondo nudo di
          MainLayout e poi ricompare tutto. Due dissolvenze in fila con un buco
          in mezzo — a 0,1s l'occhio non legge una transizione, legge un lampo.

          Senza `mode` (default `sync`) le due pagine coesistono e si
          incrociano: nessun fotogramma vuoto. Qui è sicuro perché
          `PageTransition` è `absolute inset-0`, quindi le due pagine si
          sovrappongono invece di accodarsi.

          Qui restano solo le pagine FUORI dalle schede: il dettaglio che
          esce verso destra scopre la scheda sotto, che non si è mai smontata. */}
      <AnimatePresence initial={false}>
        {!isTabRoute && (
        <Routes location={location} key={location.pathname}>
          {/* Auth routes - no layout */}
          <Route path="/auth" element={
            <PageTransition variant="fade">
              <Auth />
            </PageTransition>
          } />
          {/* Dal link dell'email «Password dimenticata?»: fuori da
              ProtectedRoute, la sessione di recupero la apre il link. */}
          <Route path="/reimposta-password" element={
            <PageTransition variant="fade">
              <ReimpostaPassword />
            </PageTransition>
          } />
          <Route path="/scegli-ruolo" element={
            <PageTransition variant="fade">
              <ProtectedRoute><ScegliRuolo /></ProtectedRoute>
            </PageTransition>
          } />
          <Route path="/onboarding" element={
            <PageTransition variant="fade">
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            </PageTransition>
          } />
          
          {/* Detail routes - slide transition */}
          <Route path="/create-job" element={
            <PageTransition variant="slide">
              <ProtectedRoute><CreateJob /></ProtectedRoute>
            </PageTransition>
          } />
          {/* Dopo «Prosegui»: le opzioni e la pubblicazione (5 novembre). */}
          <Route path="/create-job/opzioni" element={
            <PageTransition variant="slide">
              <ProtectedRoute><OpzioniAnnuncio /></ProtectedRoute>
            </PageTransition>
          } />
          <Route path="/notifiche" element={
            <PageTransition variant="slide">
              <ProtectedRoute><Notifiche /></ProtectedRoute>
            </PageTransition>
          } />
          <Route path="/settings" element={
            <PageTransition variant="slide">
              <ProtectedRoute><Settings /></ProtectedRoute>
            </PageTransition>
          } />
          <Route path="/settings/edit-profile" element={
            <PageTransition variant="slide">
              <ProtectedRoute><EditProfile /></ProtectedRoute>
            </PageTransition>
          } />
          <Route path="/profile/:userId" element={
            <PageTransition variant="slide">
              <ProtectedRoute><PublicProfile /></ProtectedRoute>
            </PageTransition>
          } />
          
          {/* 404 */}
          <Route path="*" element={
            <PageTransition variant="fade">
              <NotFound />
            </PageTransition>
          } />
        </Routes>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
         <TooltipProvider>
           <div className="safe-area-wrapper min-h-screen min-h-[100dvh]">
             <Toaster />
             <Sonner />
             <ReviewPrompt />
             <PromemoriaScadenza />
             <BrowserRouter>
               <AnimatedRoutes />
               {/* Le notifiche (§28): dentro il router, perché portano a
                   una schermata. */}
               <GestoreNotifiche />
               <ChiediPermesso />
               <BannerIphone />
             </BrowserRouter>
             {/* Ultimo e fuori dal router: è uno strato sopra tutto, e
                 intanto l'app sotto carica sessione e mappa. */}
             <SplashScreen />
           </div>
         </TooltipProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
