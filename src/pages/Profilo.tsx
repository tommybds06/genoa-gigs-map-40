// ChevronLeft/Right rimossi: erano le frecce sul carosello foto, che su mobile
// coprivano la foto per un gesto che si fa gia' con lo swipe. Restano i pallini.
import { LinkSocial } from "@/components/profile/LinkSocial";
import { Foglietto } from "@/components/ui/Foglietto";
import { FotoStampata } from "@/components/ui/FotoStampata";
import { RecensioniRicevute } from "@/components/reviews/RecensioniRicevute";
import { mediaRecensioni, useRecensioniRicevute } from "@/hooks/useRecensioni";
import { CaroselloFoto } from "@/components/profile/CaroselloFoto";
import { srcLogo } from "@/lib/gerarchia";
import { SalvaIcon } from "@/components/icons/uiIcons";
import { ImpostazioniIcon, ProfiloIcon, CuoreIcon, InfoIcon, StellaIcon, MappaIcon } from "@/components/icons/uiIcons";
import { GenericoIcon } from "@/components/icons/roleIcons";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigate } from "react-router-dom";
import { TagSelector, TagBadges } from "@/components/tags/TagSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { soloRuoli } from "@/constants/tags";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WorkerJobHistory } from "@/components/profile/WorkerJobHistory";
 import { SwipeNavigator } from "@/components/layout/SwipeNavigator";

const Profilo = () => {
  const { user } = useAuth();
  const { profile, loading, updateTags } = useUser();
  const { theme, isEmployer } = useAppTheme();
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  /* In react-query e non in un `useEffect`: la pagina si smonta a ogni cambio
     di tab, quindi senza cache la media delle recensioni la si andava a
     ricalcolare da capo ogni volta, e il numero compariva a scoppio ritardato
     spostando la riga sotto il nome. */
  const { data: recensioni = [] } = useRecensioniRicevute(isEmployer ? profile?.id : undefined);
  const reviewStats = mediaRecensioni(recensioni);

  useEffect(() => {
    if (profile?.tags) setSelectedTags(profile.tags);
  }, [profile?.tags]);

  useEffect(() => {
    if (profile?.tags) {
      const tagsChanged = JSON.stringify(selectedTags.sort()) !== JSON.stringify([...profile.tags].sort());
      setHasChanges(tagsChanged);
    }
  }, [selectedTags, profile?.tags]);

  const handleSaveTags = async () => {
    try {
      await updateTags(selectedTags);
      toast.success("Tag aggiornati!", { duration: 1500 });
      setHasChanges(false);
      setEditMode(false);
    } catch (error) {
      toast.error("Errore aggiornamento", { duration: 1500 });
    }
  };

  const nextPhoto = () => {
    if (profile?.photos && profile.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
    }
  };

  const prevPhoto = () => {
    if (profile?.photos && profile.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
    }
  };

  const primaryBtnClasses = `${theme.btnFilled} ${theme.btnFilledHover}`;
  const primaryTextClasses = theme.primaryText;

  return (
     <SwipeNavigator>
       <div className="flex flex-col h-full bg-background">
         {/* Header */}
         <header className="sticky top-0 z-40 bg-background px-4 pt-8 pb-3">
           <div className="flex items-center justify-between">
             <img
               src={srcLogo(isEmployer)}
               alt="Politask"
               className="h-14 w-auto -ml-1"
             />
             <button
               onClick={() => navigate("/settings")}
               className={`p-2 rounded-full transition-colors touch-feedback ${isEmployer ? "hover:bg-employer-50" : "hover:bg-accent"}`}
             >
               <ImpostazioniIcon className={`w-7 h-7 ${isEmployer ? "text-employer" : "text-primary"}`} />
             </button>
           </div>
         </header>

         <main className="flex-1 px-4 py-4 pb-4 overflow-y-auto">
        {/* Photo Carousel — una foto STAMPATA (ui/FotoStampata, 23 ottobre):
            cornice di carta col tratto delle card, tenuta dal pezzo lungo
            di scotch in alto, i pallini nel margine basso come la scritta di una
            Polaroid. Le foto sono in fila
            in una striscia che segue il dito (CaroselloFoto). */}
        {profile?.photos && profile.photos.length > 0 && (
          <FotoStampata
            seme={`carosello-${profile.id}`}
            misura="grande"
            // Quadrata, come una Polaroid (Tommaso). Era 4:3.
            formato="1 / 1"
            className="mb-6 mt-2"
            scotch={[{ pezzo: "lungo", lato: "centro" }]}
            fondo={
              profile.photos.length > 1 ? (
                <div className="flex gap-1.5">
                  {profile.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      aria-label={`Foto ${index + 1}`}
                      className={`h-2 rounded-full transition-all touch-feedback ${
                        index === currentPhotoIndex ? `${theme.primary} w-4` : "w-2 bg-paper-line"
                      }`}
                    />
                  ))}
                </div>
              ) : undefined
            }
          >
            {/* Le foto scorrono sotto il dito; i pallini restano per chi tocca. */}
            <CaroselloFoto foto={profile.photos} indice={currentPhotoIndex} onIndice={setCurrentPhotoIndex} />
          </FotoStampata>
        )}

        {/* Profile Card */}
        {/* Lo scotch: UN pezzo per oggetto, sul bordo alto. Le foto il lungo
            al centro, le card il corto alternato sinistra/destra scendendo
            (Tommaso, 23 ottobre: «troppo incasinato»). Le sezioni con
            bottoni dentro (Interessi) e lo storico ne restano senza. */}
        <Foglietto seme="intestazione" scotch={[{ pezzo: "corto", lato: "sopraSx" }]}>
        <div className="material-card-elevated p-6 mb-4">
          <div className="flex items-center gap-4">
            {/* Cerchio imperfetto (ui/avatar). Via l'ombra: il ritaglio la
                taglierebbe a tratti. */}
            <Avatar seme={profile?.id} className="w-20 h-20">
              <AvatarImage src={profile?.photos?.[0] || undefined} alt="Avatar" />
              <AvatarFallback className={theme.btnFilled}>
                <ProfiloIcon className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name || user?.user_metadata?.full_name || "Utente"}</h2>
              <p className="text-muted-foreground text-sm mb-1">{user?.email}</p>
              <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${primaryTextClasses}`}>{isEmployer ? "Employer" : "Worker"}</span>
                {isEmployer && reviewStats && (
                  <>
                    <span className="text-muted-foreground text-sm">•</span>
                    <div className={`flex items-center gap-1 ${primaryTextClasses}`}>
                      <StellaIcon className="w-4 h-4" />
                      <span className="font-semibold text-sm">{reviewStats.avg.toLocaleString("it-IT", { maximumFractionDigits: 1 })}</span>
                      <span className="text-muted-foreground text-sm">({reviewStats.count})</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Allineati a sinistra come il resto della card; `-ml-2` compensa
              il padding del primo link, che c'è per il bersaglio di tocco. */}
          <LinkSocial social={profile?.social_links} employer={isEmployer} className="mt-3 -ml-2 justify-start" />
        </div>
        </Foglietto>

        {profile?.bio && (
          /* L'unica card con lo scotch sull'ANGOLO (Tommaso): in alto a destra. */
          <Foglietto seme="bio" scotch={[{ pezzo: "cortoB", lato: "dx" }]}>
          <div className="material-card tilt-l p-4 mb-4">
            <h3 className="titolo-mini mb-2 flex items-center gap-2">
              <ProfiloIcon className={`w-4 h-4 ${primaryTextClasses}`} />{isEmployer ? "Descrizione" : "Presentazione"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
          </Foglietto>
        )}

        {isEmployer && profile?.looking_for && (
          <Foglietto seme="cerco" scotch={[{ pezzo: "corto", lato: "sopraSx" }]}>
          <div className="material-card tilt-r p-4 mb-4">
            <h3 className="titolo-mini mb-2 flex items-center gap-2">
              <GenericoIcon className={`w-4 h-4 ${primaryTextClasses}`} />Chi cerco
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.looking_for}</p>
          </div>
          </Foglietto>
        )}

        {/* Le recensioni ricevute: prima l'employer non poteva vederle
            (Tommaso, 24 ottobre). Stesso elenco del profilo pubblico, tre
            alla volta. I worker ricevono i cuori, non le recensioni. */}
        {isEmployer && (
          <Foglietto seme="recensioni" scotch={[{ pezzo: "cortoB", lato: "sopraDx" }]}>
          <div className="material-card tilt-r p-4 mb-4">
            <h3 className="titolo-mini mb-3 flex items-center gap-2">
              <StellaIcon className={`w-4 h-4 ${primaryTextClasses}`} />Le tue recensioni
            </h3>
            <RecensioniRicevute
              recensioni={recensioni}
              vuoto="Ancora nessuna. Arrivano quando un lavoro si conclude."
            />
          </div>
          </Foglietto>
        )}

        {!isEmployer && profile?.experience && (
          <Foglietto seme="esperienze" scotch={[{ pezzo: "corto", lato: "sopraSx", dritto: true }]}>
          <div className="material-card tilt-l p-4 mb-4">
            <h3 className="titolo-mini mb-2 flex items-center gap-2">
              <GenericoIcon className={`w-4 h-4 ${primaryTextClasses}`} />Esperienze
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.experience}</p>
          </div>
          </Foglietto>
        )}

        {!isEmployer && (
          <div className="material-card tilt-r p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="titolo-mini flex items-center gap-2"><CuoreIcon className={`w-4 h-4 ${primaryTextClasses}`} />I tuoi Interessi</h3>
              <div className="flex gap-2">
                {hasChanges && (
                  <button onClick={handleSaveTags} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-feedback ${primaryBtnClasses}`}>
                    <SalvaIcon className="w-4 h-4" />Salva
                  </button>
                )}
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className={`text-sm font-medium touch-feedback ${primaryTextClasses}`}>Modifica</button>
                )}
              </div>
            </div>
            {editMode ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">Seleziona i tag per personalizzare la tua esperienza nella Lista</p>
                <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} roleLayout="grid" showDuration={false} />
              </>
            ) : (
              // Solo i ruoli: la durata è stata tolta dalle preferenze, ma i
              // tag salvati prima restano nel profilo. Si filtrano in lettura,
              // così non serve nessuna migration sui dati.
              <TagBadges tags={soloRuoli(selectedTags)} />
            )}
          </div>
        )}

        {!isEmployer && <WorkerJobHistory primaryTextClasses={primaryTextClasses} />}

        {/* Sul bordo alto a DESTRA, non sull'angolo (Tommaso, 24 ottobre). */}
        <Foglietto seme="informazioni" scotch={[{ pezzo: "cortoB", lato: "sopraDx" }]}>
        <div className="material-card tilt-l p-4 mb-4">
          <h3 className="titolo-mini mb-3 flex items-center gap-2"><InfoIcon className={`w-4 h-4 ${primaryTextClasses}`} />Informazioni</h3>
          <div className="space-y-3">
            {profile?.neighborhood ? (
              <div className="flex items-center gap-3 text-sm"><MappaIcon className="w-4 h-4 text-muted-foreground" /><span>Genova, {profile.neighborhood}</span></div>
            ) : profile?.address_text ? (
              <div className="flex items-center gap-3 text-sm"><MappaIcon className="w-4 h-4 text-muted-foreground" /><span>{profile.address_text}</span></div>
            ) : null}
            <div className="flex items-center gap-3 text-sm">
              <GenericoIcon className="w-4 h-4 text-muted-foreground" />
              <span>Ruolo: <span className={`font-medium ${primaryTextClasses}`}>{isEmployer ? "Employer" : "Worker"}</span></span>
            </div>
          </div>
        </div>
        </Foglietto>

           {/* "Esci" vive solo in Impostazioni: era duplicato qui e lì, e le
               azioni distruttive non vanno offerte in due posti diversi. */}
         </main>
       </div>
     </SwipeNavigator>
  );
};

export default Profilo;
