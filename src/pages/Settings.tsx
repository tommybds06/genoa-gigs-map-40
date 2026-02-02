import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  User, 
  Bell, 
  HelpCircle, 
  FileText, 
  LogOut, 
  Trash2,
  ChevronRight,
  Mail,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppTheme } from "@/hooks/useAppTheme";
import { DiamondButton } from "@/components/ui/DiamondButton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, isEmployer } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      toast.error("Errore durante il logout");
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    // For now, show a toast indicating this needs server-side implementation
    toast.info("Funzione da implementare lato server", {
      description: "Contatta il supporto per eliminare il tuo account.",
    });
    setShowDeleteDialog(false);
  };

  const handleSupport = () => {
    window.location.href = "mailto:support@stakkgenova.com";
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 safe-top border-b border-border">
        <div className="flex items-center gap-3">
          <DiamondButton 
            onClick={handleBack}
            variant="default"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </DiamondButton>
          <h1 className={`text-xl font-bold ${isEmployer ? "text-blue-600" : "text-primary"}`}>Impostazioni</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {/* User Info Card */}
        {user?.email && (
          <div className="material-card p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${theme.primary} text-white rounded-full flex items-center justify-center`}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loggato come</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Account
          </h2>
          <div className="material-card overflow-hidden">
            {/* Edit Profile */}
            <button 
              onClick={() => navigate("/settings/edit-profile")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Modifica Profilo</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Notifiche</span>
              </div>
              <Switch 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>
        </div>

        {/* Support & Info Section */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Supporto & Info
          </h2>
          <div className="material-card overflow-hidden">
            {/* Support */}
            <button 
              onClick={handleSupport}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Assistenza</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Terms & Privacy */}
            <button 
              onClick={() => toast.info("Termini e Privacy", { description: "Pagina in arrivo..." })}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Termini e Privacy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide mb-2 px-1">
            Zona Pericolo
          </h2>
          <div className="material-card overflow-hidden">
            {/* Logout */}
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors border-b border-border disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {isLoggingOut ? (
                  <Loader2 className="w-5 h-5 text-destructive animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5 text-destructive" />
                )}
                <span className="font-medium text-destructive">Esci</span>
              </div>
            </button>

            {/* Delete Account */}
            <button 
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-destructive" />
                <span className="font-medium text-destructive">Elimina Account</span>
              </div>
            </button>
          </div>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          STAKK GENOVA v1.0.0
        </p>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione è irreversibile. Tutti i tuoi dati, annunci e messaggi verranno eliminati permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
