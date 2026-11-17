import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TesseraIcona } from "@/components/ui/Tessera";
import { MappaIcon } from "@/components/icons/uiIcons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { srcLogo } from "@/lib/gerarchia";

/**
 * LA PAGINA CHE NON C'È (Atlante, 17 novembre). Era quella di serie del
 * modello, in inglese («Oops! Page not found», «Return to Home») e su fondo
 * grigio. Ora nello stile dell'app; il disegno arriverà col lavoro sul
 * branding (§14b).
 */
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, isEmployer } = useAppTheme();

  useEffect(() => {
    console.error("[Politask] pagina inesistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-6 text-center">
      <img src={srcLogo(isEmployer)} alt="Politask" className="mb-10 h-12 w-auto" />
      <TesseraIcona icona={MappaIcon} misura="lg" className="mb-5" />
      <h1 className="titolo-sezione mb-2 text-2xl">Questa pagina non c'è</h1>
      <p className="mb-8 max-w-xs text-sm text-ink-soft">
        Forse il link è vecchio, o sei finito nei caruggi. Torniamo sulla mappa.
      </p>
      <Button size="lg" className={theme.btnFilled} onClick={() => navigate("/", { replace: true })}>
        Torna alla mappa
      </Button>
    </div>
  );
};

export default NotFound;
