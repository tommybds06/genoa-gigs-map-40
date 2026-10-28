import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CampoPassword } from "@/components/auth/CampoPassword";
import { controllaPasswordNuova, PASSWORD_MINIMA } from "@/lib/registrazione";
import { srcLogo } from "@/lib/gerarchia";
import { doveMandare } from "@/lib/percorsoAccesso";
import { chiudiRecupero, messaggioErrorePassword, segnaRecupero } from "@/lib/recuperoPassword";

type Stato = "controllo" | "pronta" | "scaduto";

/**
 * SCEGLI UNA NUOVA PASSWORD (26 ottobre) — ci si arriva dal link dell'email
 * di «Password dimenticata?» (Auth). Il link apre una sessione di RECUPERO:
 * Supabase la legge da solo dall'indirizzo (`detectSessionInUrl`) e manda
 * l'evento PASSWORD_RECOVERY. Con quella sessione `updateUser` cambia la
 * password; dopo si è dentro, e si va dove manda `doveMandare` (la mappa,
 * o la scelta del ruolo per un account mai completato).
 *
 * ⚠️ Finché la password non è salvata la persona resta QUI (lib/
 * recuperoPassword.ts): il link è già un accesso, e cambiando pagina ci si
 * ritrovava dentro senza aver scelto niente. «Annulla» chiude la sessione.
 *
 * Se il link è scaduto o già usato, Supabase rimanda qui con un errore
 * nell'indirizzo, o non apre nessuna sessione: si dice e si torna all'accesso
 * per chiederne un altro.
 *
 * ⚠️ L'indirizzo `/reimposta-password` deve essere fra quelli ammessi nelle
 * impostazioni di accesso (Lovable Cloud), per 127.0.0.1:8080 e per il
 * dominio pubblicato: se no Supabase rimanda al Site URL.
 */
const ReimpostaPassword = () => {
  const navigate = useNavigate();
  const [stato, setStato] = useState<Stato>("controllo");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvataggio, setSalvataggio] = useState(false);

  // Il segno si mette in un effetto, non nell'inizializzatore (StrictMode).
  useEffect(() => {
    if (stato === "pronta") segnaRecupero();
  }, [stato]);

  useEffect(() => {
    if (/error_description|error_code/.test(window.location.hash + window.location.search)) {
      setStato("scaduto");
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((evento, sessione) => {
      if (evento === "PASSWORD_RECOVERY" || sessione) setStato("pronta");
    });
    // Se la sessione è già stata letta prima che ci iscrivessimo all'evento.
    const t = window.setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setStato((prima) => (prima === "controllo" ? (s.session ? "pronta" : "scaduto") : prima));
    }, 1500);
    return () => {
      data.subscription.unsubscribe();
      window.clearTimeout(t);
    };
  }, []);

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = controllaPasswordNuova(password);
    setErrore(problema);
    if (problema) return;
    setSalvataggio(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSalvataggio(false);
      // In console il motivo vero: senza, il prossimo «non me la prende»
      // resta di nuovo un'ipotesi.
      console.error("[Politask] nuova password rifiutata", error.code, error.message);
      if (error.name === "AuthSessionMissingError" || error.status === 401) {
        chiudiRecupero();
        setStato("scaduto");
        return;
      }
      setErrore(
        messaggioErrorePassword(error) ??
          `Non sono riuscito a salvarla (${error.code ?? error.status ?? "errore"}). Riprova, o chiedi un nuovo link.`
      );
      return;
    }
    chiudiRecupero();
    const { data: profilo } = await supabase
      .from("profiles")
      .select("is_onboarded, role, neighborhood")
      .eq("id", data.user.id)
      .maybeSingle();
    setSalvataggio(false);
    toast.success("Password cambiata", { duration: 2300 });
    navigate(doveMandare(data.user, profilo) ?? "/", { replace: true });
  };

  const annulla = async () => {
    chiudiRecupero();
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={srcLogo(false)} alt="Politask" className="mx-auto mb-3 h-20 w-auto" />
          <h1 className="titolo-vuoto">Scegli una nuova password</h1>
        </div>

        <div className="material-card-elevated rounded-3xl bg-card p-8">
          {stato === "controllo" && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary-strong" />
            </div>
          )}

          {stato === "scaduto" && (
            <div className="space-y-4 text-center">
              <p className="text-foreground">
                Il link è scaduto o è già stato usato. Chiedine un altro dalla pagina di accesso.
              </p>
              <Button size="lg" className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                Torna all'accesso
              </Button>
            </div>
          )}

          {stato === "pronta" && (
            <form onSubmit={salva} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="nuova-password" className="text-sm font-medium text-foreground">
                  Nuova password
                </label>
                <CampoPassword id="nuova-password" value={password} onChange={setPassword} autoComplete="new-password" />
                {errore ? (
                  <p className="text-xs text-destructive">{errore}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Almeno {PASSWORD_MINIMA} caratteri</p>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={salvataggio}>
                {salvataggio ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salva la password"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={annulla} disabled={salvataggio}>
                Annulla
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReimpostaPassword;
