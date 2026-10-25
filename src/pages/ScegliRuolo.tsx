import { useEffect, useState } from "react";
import { SceltaTipoEmployer } from "@/components/auth/SceltaTipoEmployer";
import { CampoMaggiorenne } from "@/components/auth/CampoMaggiorenne";
import { controllaEta, MESSAGGIO_MINORENNE, salvaRiservati, testiEmployer, type TipoEmployer } from "@/lib/registrazione";
import { TesseraRuolo } from "@/components/auth/TesseraRuolo";
import { srcLogo } from "@/lib/gerarchia";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NeighborhoodSelect } from "@/components/ui/NeighborhoodSelect";
import { AnnunciIcon } from "@/components/icons/uiIcons";
import { GenericoIcon } from "@/components/icons/roleIcons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Ruolo = "worker" | "employer";

/**
 * Chi arriva da Google o Apple non ha mai scelto se cerca o offre lavoro, e
 * non ha dato ne' quartiere ne' indirizzo: l'accesso social restituisce solo
 * email, nome e foto. Questa schermata raccoglie esattamente i dati che
 * l'iscrizione via email chiede in piu' rispetto a email e password — niente
 * di piu', se no diventano due moduli lunghi di fila.
 *
 * Poi crea la riga in `profiles` e passa a /onboarding, che e' la stessa
 * pagina che vedono tutti gli altri.
 *
 * ⚠️ Serve DAVVERO, non e' un passaggio decorativo: Onboarding legge
 * `isEmployer` da UserContext, che a sua volta legge `profiles.role`. Senza
 * una riga con un ruolo, quella pagina non sa nemmeno quali campi mostrare.
 */
const ScegliRuolo = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refetch: refetchProfile } = useUser();

  const [ruolo, setRuolo] = useState<Ruolo | null>(null);
  const [quartiere, setQuartiere] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [nome, setNome] = useState("");
  const [salvataggio, setSalvataggio] = useState(false);
  // Come in Auth (24 ottobre): attività o privato, e l'età dei worker.
  const [tipo, setTipo] = useState<TipoEmployer | null>(null);
  const [nascita, setNascita] = useState("");
  const [maggiorenne, setMaggiorenne] = useState(false);
  const [errori, setErrori] = useState<{ ruolo?: string; quartiere?: string; indirizzo?: string; tipo?: string; nascita?: string; conferma?: string }>({});
  const privato = ruolo === "employer" && tipo === "privato";
  const testi = testiEmployer(tipo);

  // Il nome arriva gia' compilato dal provider: e' l'unico dato che possiamo
  // riempire da soli, e risparmiarlo all'utente vale la riga di codice.
  useEffect(() => {
    const meta = user?.user_metadata;
    if (meta) setNome(meta.full_name || meta.name || "");
  }, [user]);

  // Il ruolo scelto qui deve arrivare anche ai token CSS (fondo dei campi,
  // anello di focus): il profilo non esiste ancora, quindi UserContext non
  // puo' saperlo.
  useEffect(() => {
    // Stesso motivo di Auth: si scrive solo dopo una scelta vera, mai un
    // fallback che sovrascriverebbe il ruolo gia' noto.
    if (ruolo) document.documentElement.dataset.ruolo = ruolo;
  }, [ruolo]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const valida = () => {
    const e: typeof errori = {};
    if (!ruolo) e.ruolo = "Scegli come vuoi usare Politask";
    if (!quartiere) e.quartiere = "Seleziona il tuo quartiere";
    if (ruolo === "employer" && !tipo) e.tipo = "Scegli se sei un'attività o un privato";
    if (ruolo === "employer" && tipo === "attivita" && !indirizzo.trim()) e.indirizzo = "Inserisci l'indirizzo della tua attività";
    if (ruolo === "worker") Object.assign(e, controllaEta(nascita, maggiorenne));
    setErrori(e);
    return Object.keys(e).length === 0;
  };

  const prosegui = async () => {
    if (!valida() || !user || !ruolo) return;
    setSalvataggio(true);
    try {
      // upsert e non insert: se l'utente e' gia' passato di qui e ha
      // abbandonato a meta', la seconda volta deve poter correggere invece
      // di sbattere contro una chiave duplicata.
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          role: ruolo,
          full_name: nome.trim() || null,
          neighborhood: quartiere || null,
          address_text: ruolo === "employer" && !privato ? indirizzo.trim() || null : null,
          tipo_employer: ruolo === "employer" ? tipo : null,
          is_onboarded: false,
        },
        { onConflict: "id" }
      );
      if (error) throw error;

      if (ruolo === "worker") {
        await salvaRiservati(user.id, {
          data_nascita: nascita,
          maggiorenne_confermato_il: new Date().toISOString(),
        });
      }

      await refetchProfile();
      navigate("/onboarding", { replace: true });
    } catch (err) {
      console.error("Errore creazione profilo:", err);
      const minorenne = String((err as { message?: string })?.message).includes("minorenne");
      toast.error(minorenne ? MESSAGGIO_MINORENNE : "Non sono riuscito a salvare. Riprova.", { duration: 3000 });
      setSalvataggio(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tessera = (
    valore: Ruolo,
    Icona: typeof GenericoIcon,
    titolo: string,
    sotto: string
  ) => (
    // Componente unico con Auth (auth/TesseraRuolo): contorno disegnato e puntina.
    <TesseraRuolo
      ruolo={valore}
      scelto={ruolo === valore}
      onScegli={() => setRuolo(valore)}
      icona={Icona}
      titolo={titolo}
      sotto={sotto}
    />
  );

  return (
    <div className="h-full overflow-y-auto bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={srcLogo(ruolo === "employer")}
            alt="Politask"
            className="h-20 w-auto mx-auto mb-3 transition-all duration-500"
          />
          <h1 className="titolo-vuoto">Ancora due cose</h1>
        </div>

        <div className="bg-card material-card-elevated p-8 rounded-3xl">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Chi sei?</label>
              {errori.ruolo && <p className="text-xs text-destructive">{errori.ruolo}</p>}
              <div className="grid grid-cols-2 gap-3">
                {tessera("worker", GenericoIcon, "Cerco impiego", "Sono uno studente")}
                {tessera("employer", AnnunciIcon, "Offro impiego", "Privato o attività")}
              </div>
              {ruolo === "employer" && <SceltaTipoEmployer valore={tipo} onScegli={setTipo} errore={errori.tipo} />}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {ruolo === "employer" ? testi.nome : "Nome completo"}
              </label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {ruolo === "employer" ? testi.zona : "Quartiere / Zona"}{" "}
                <span className="text-destructive">*</span>
              </label>
              <NeighborhoodSelect
                value={quartiere}
                onValueChange={setQuartiere}
                placeholder="Seleziona quartiere"
                variant={ruolo === "employer" ? "employer" : "worker"}
                error={!!errori.quartiere}
              />
              {errori.quartiere && <p className="text-xs text-destructive">{errori.quartiere}</p>}
            </div>

            {ruolo === "worker" && (
              <CampoMaggiorenne
                nascita={nascita}
                onNascita={setNascita}
                confermato={maggiorenne}
                onConferma={setMaggiorenne}
                errori={{ nascita: errori.nascita, conferma: errori.conferma }}
              />
            )}

            {ruolo === "employer" && !privato && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Indirizzo attività <span className="text-destructive">*</span>
                </label>
                <Input
                  value={indirizzo}
                  onChange={(e) => setIndirizzo(e.target.value)}
                  placeholder="Via e numero civico"
                />
                {errori.indirizzo && <p className="text-xs text-destructive">{errori.indirizzo}</p>}
              </div>
            )}

            <Button
              size="lg"
              onClick={prosegui}
              disabled={salvataggio}
              className={cn(
                "w-full font-semibold",
                ruolo === "employer" &&
                  "bg-employer-700 hover:bg-employer-800 text-employer-foreground"
              )}
            >
              {salvataggio ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continua"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScegliRuolo;
