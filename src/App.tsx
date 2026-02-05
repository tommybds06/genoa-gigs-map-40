import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { UserProvider } from "@/contexts/UserContext";
 import { SwipeDirectionProvider } from "@/contexts/SwipeDirectionContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ReviewPrompt } from "@/components/reviews/ReviewPrompt";
import { MainLayout } from "@/components/layout/MainLayout";
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

// Tab routes that show the persistent bottom nav
const TAB_ROUTES = ['/', '/lista', '/annunci', '/messaggi', '/profilo'];

function AnimatedRoutes() {
  const location = useLocation();
  const isTabRoute = TAB_ROUTES.includes(location.pathname);
  const isDetailRoute = !isTabRoute && !['/auth', '/onboarding'].includes(location.pathname);
  
  return (
    <MainLayout hideBottomNav={!isTabRoute}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Auth routes - no layout */}
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
          
          {/* Tab routes - fade transition */}
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
          
          {/* Detail routes - slide transition */}
          <Route path="/create-job" element={
            <PageTransition variant="slide">
              <ProtectedRoute><CreateJob /></ProtectedRoute>
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
      </AnimatePresence>
    </MainLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
         <SwipeDirectionProvider>
           <TooltipProvider>
             <div className="safe-area-wrapper min-h-screen min-h-[100dvh]">
               <Toaster />
               <Sonner />
               <ReviewPrompt />
               <BrowserRouter>
                 <AnimatedRoutes />
               </BrowserRouter>
             </div>
           </TooltipProvider>
         </SwipeDirectionProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
