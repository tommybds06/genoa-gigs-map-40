import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UserProvider } from "@/contexts/UserContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ReviewPrompt } from "@/components/reviews/ReviewPrompt";
import Index from "./pages/Index";
import Lista from "./pages/Lista";
import Annunci from "./pages/Annunci";
import CreateJob from "./pages/CreateJob";
import Messaggi from "./pages/Messaggi";
import Profilo from "./pages/Profilo";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ReviewPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/lista" element={<ProtectedRoute><Lista /></ProtectedRoute>} />
              <Route path="/annunci" element={<ProtectedRoute><Annunci /></ProtectedRoute>} />
              <Route path="/create-job" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
              <Route path="/messaggi" element={<ProtectedRoute><Messaggi /></ProtectedRoute>} />
              <Route path="/profilo" element={<ProtectedRoute><Profilo /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
