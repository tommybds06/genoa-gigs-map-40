import { FreccettaIcon } from "@/components/icons/uiIcons";
import { useState } from "react";
import { Foglietto } from "@/components/ui/Foglietto";
import { srcLogo } from "@/lib/gerarchia";
import { TesseraIcona, TesseraIndietro } from "@/components/ui/Tessera";
import { useNavigate } from "react-router-dom";
import { MailIcon, DocumentoIcon, EsciIcon, BidoneIcon, ProfiloIcon, InfoIcon } from "@/components/icons/uiIcons";
import { User, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ImpostazioniNotifiche } from "@/components/notifiche/ImpostazioniNotifiche";
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
import { CartaCard } from "@/components/ui/CartaCard";
import { Ventose } from "@/components/ui/Ventose";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, isEmployer } = useAppTheme();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [eliminando, setEliminando] = useState(false);

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

  /* ELIMINARE L'ACCOUNT (21 novembre). Lo fa l'edge function
     `elimina-account`: svuota l'account e lascia un profilo anonimo
     («Account eliminato»), così chat e recensioni restano alle altre persone
     (decisione di Tommaso). Poi si esce: l'utente non esiste più, e
     `signOut` toglie comunque la sessione dal telefono (lib/uscita.ts). */
  const handleDeleteAccount = async () => {
    setEliminando(true);
    try {
      const { data, error } = await supabase.functions.invoke("elimina-account");
      if (error || !data?.ok) throw error ?? new Error(data?.errore ?? "risposta inattesa");
      setShowDeleteDialog(false);
      await signOut();
      navigate("/auth");
      toast.success("Account eliminato");
    } catch (e) {
      console.error("[Politask] eliminazione dell'account non riuscita", e);
      toast.error("Non sono riuscito a eliminare l'account", {
        description: "Riprova tra poco. Se continua, scrivi all'assistenza.",
      });
      setEliminando(false);
    }
  };

  const handleSupport = () => {
    window.location.href = "mailto:support@politask.com";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="linea-sotto-sottile sticky top-0 z-40 bg-background px-4 pt-8 pb-3">
        <div className="flex items-center gap-3">
          <TesseraIndietro onClick={handleBack} />
          <img
            src={srcLogo(isEmployer)}
            alt="Politask"
            className="h-14 w-auto"
          />
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {/* User Info Card */}
        {user?.email && (
          <Foglietto seme="impostazioni-mail" scotch={[{ pezzo: "strappato", lato: "centro" }]}>
          <CartaCard seme="impostazioni-account" className="p-4 mb-6">
            <div className="flex items-center gap-3">
              <TesseraIcona icona={MailIcon} />
              <div>
                <p className="text-sm text-muted-foreground">Loggato come</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>
          </CartaCard>
          </Foglietto>
        )}

        {/* Account Section */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Account
          </h2>
          <CartaCard seme="impostazioni-0" ritaglia>
            {/* Edit Profile */}
            <button 
              onClick={() => navigate("/settings/edit-profile")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ProfiloIcon className={`w-5 h-5 ${theme.primaryText}`} />
                <span className="titolo-mini">Modifica profilo</span>
              </div>
              <FreccettaIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </CartaCard>
        </div>

        {/* Le notifiche: il dispositivo e una voce per categoria (§28). Al
            posto dell'interruttore «Notifiche» di prima, che non era
            collegato a niente. */}
        <ImpostazioniNotifiche />

        {/* Support & Info Section */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Supporto & Info
          </h2>
          <CartaCard seme="impostazioni-1" ritaglia>
            {/* Support */}
            <button 
              onClick={handleSupport}
              className="linea-sotto-sottile w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <InfoIcon className={`w-5 h-5 ${theme.primaryText}`} />
                <span className="titolo-mini">Assistenza</span>
              </div>
              <FreccettaIcon className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Terms & Privacy */}
            <button 
              onClick={() => toast.info("Termini e privacy", { description: "Pagina in arrivo..." })}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DocumentoIcon className={`w-5 h-5 ${theme.primaryText}`} />
                <span className="titolo-mini">Termini e privacy</span>
              </div>
              <FreccettaIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </CartaCard>
        </div>

        {/* "Zona pericolo" era la traduzione letterale di Danger Zone, che e'
            una convenzione da pannello di amministrazione: in un'app consumer
            suona minacciosa per un logout. Il rosso sulle voci basta a
            segnalare che sono azioni serie. */}
        {/* Nessuna intestazione: questa sezione si chiamava "Account" come
            quella in cima allo schermo, due titoli identici a mezza pagina di
            distanza. Il rosso delle voci dice gia' che sono azioni serie. */}
        <div className="mb-6">
          <CartaCard seme="impostazioni-2" ritaglia>
            {/* Logout */}
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 active:bg-destructive/10 transition-colors linea-sotto-sottile disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {isLoggingOut ? (
                  <Ventose className="w-5 h-5 text-destructive" />
                ) : (
                  <EsciIcon className="w-5 h-5 text-destructive" />
                )}
                <span className="titolo-mini text-destructive">Esci</span>
              </div>
            </button>

            {/* Delete Account */}
            <button 
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BidoneIcon className="w-5 h-5 text-destructive" />
                <span className="titolo-mini text-destructive">Elimina account</span>
              </div>
            </button>
          </CartaCard>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          Politask v1.0.0
        </p>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(aperto) => !eliminando && setShowDeleteDialog(aperto)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l'account?</AlertDialogTitle>
            <AlertDialogDescription>
              Profilo, foto e annunci vengono cancellati e non potrai più entrare. Le chat e le
              recensioni restano alle altre persone, con il nome «Account eliminato». Non si può
              annullare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Annulla</AlertDialogCancel>
            {/* `preventDefault`: l'azione di Radix chiuderebbe la finestra
                subito, prima che il server risponda. */}
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? <Ventose className="h-4" etichetta="Eliminazione in corso" /> : "Elimina account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
