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
import { PageTransition } from "@/components/layout/PageTransition";
import Index from "./pages/Index";
import Lista from "./pages/Lista";
import Annunci from "./pages/Annunci";
import CreateJob from "./pages/CreateJob";
import Messaggi from "./pages/Messaggi";
import Profilo from "./pages/Profilo";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component that provides location for AnimatePresence
function AnimatedRoutes() {
  const location = useLocation();
  
  // Determine if this is a tab route (fade) or detail route (slide)
  const tabRoutes = ['/', '/lista', '/annunci', '/messaggi', '/profilo'];
  const isTabRoute = tabRoutes.includes(location.pathname);
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={
          <PageTransition variant="fade">
            <Auth />
          </PageTransition>
        } />
        <Route path="/onboarding" element={
          <PageTransition variant="fade">
            <ProtectedRoute><Onboarding /></ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/" element={
          <PageTransition variant="fade">
            <ProtectedRoute><Index /></ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/lista" element={
          <PageTransition variant="fade">
            <ProtectedRoute><Lista /></ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/annunci" element={
          <PageTransition variant="fade">
            <ProtectedRoute><Annunci /></ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/create-job" element={
          <PageTransition variant="slide">
            <ProtectedRoute><CreateJob /></ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/messaggi" element={
          <PageTransition variant="fade">
            <ProtectedRoute><Messaggi /></ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/profilo" element={
          <PageTransition variant="fade">
            <ProtectedRoute><Profilo /></ProtectedRoute>
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
        <Route path="*" element={
          <PageTransition variant="fade">
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
        <TooltipProvider>
          <div className="safe-area-wrapper">
            <Toaster />
            <Sonner />
            <ReviewPrompt />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
