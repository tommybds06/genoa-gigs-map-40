import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ROLE_TAGS, TYPE_TAGS } from '@/constants/tags';
import { getJobIcon } from '@/lib/jobIcons';
import { PennaIcon, DocumentoIcon, OrologioIcon, CalendarioIcon, EuroIcon } from "@/components/icons/uiIcons";
import { GenericoIcon } from '@/components/icons/roleIcons';
import { isWithinGenovaBounds, GEOFENCING_ERROR_MESSAGE } from '@/constants/geofencing';
import { TesseraIndietro } from "@/components/ui/Tessera";
import { durataDaTag, ORE_PER_DURATA, type TipoPaga } from "@/lib/prezzi";
import { leggiBozza, salvaBozza } from "@/lib/bozzaAnnuncio";
import { cn } from "@/lib/utils";
import { CampoData } from "@/components/ui/CampoData";
import { oggiISO } from "@/lib/bacheca";

/** «9,5» o «9.5» → 9,5; vuoto o non valido → null. */
const numero = (testo: string): number | null => {
  const n = Number(testo.replace(",", ".").trim());
  return testo.trim() && Number.isFinite(n) ? n : null;
};
const testoNumero = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

/** Le ore che può chiedere il form, con la loro etichetta e se sono intere. */
const CAMPI_ORE = {
  oreTotali: { etichetta: "Ore in tutto", intero: false },
  oreGiorno: { etichetta: "Ore al giorno", intero: false },
  giorni: { etichetta: "Giorni", intero: true },
  oreSettimana: { etichetta: "Ore a settimana", intero: false },
  settimane: { etichetta: "Settimane", intero: true },
} as const;
type CampoOre = keyof typeof CAMPI_ORE;

/** Le due scelte affiancate di paga (all'ora/forfait, netto/lordo). */
function SceltaDoppia<T extends string | boolean>({
  opzioni,
  valore,
  onScegli,
}: {
  opzioni: { valore: T; testo: string }[];
  valore: T | null;
  onScegli: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {opzioni.map((o) => (
        <button
          key={String(o.valore)}
          type="button"
          aria-pressed={valore === o.valore}
          onClick={() => onScegli(o.valore)}
          className={cn(
            "flex items-center justify-center px-3 py-2.5 sagoma-quartiere rounded-[19px] text-sm font-medium transition-all active:scale-95 border-2",
            valore === o.valore
              ? "bg-employer-700 text-employer-foreground border-employer-700"
              : "bg-employer-50 text-employer border-transparent hover:bg-employer-100"
          )}
        >
          {o.testo}
        </button>
      ))}
    </div>
  );
}

const CreateJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  
  // Tornando dalla pagina delle opzioni si ritrova quello che c'era
  // (lib/bozzaAnnuncio.ts).
  const [bozza] = useState(leggiBozza);

  // Form fields (neighborhood removed - inherited from profile)
  const [title, setTitle] = useState(bozza?.title ?? '');
  const [description, setDescription] = useState(bozza?.description ?? '');
  const [schedule, setSchedule] = useState(bozza?.schedule ?? '');
  // Quando inizia (facoltativo): solo per il promemoria del giorno prima.
  const [inizioData, setInizioData] = useState(bozza?.inizioData ?? '');
  const [inizioOra, setInizioOra] = useState(bozza?.inizioOra ?? '');

  /* LA PAGA, strutturata (5 novembre): serve al calcolo dei prezzi delle
     opzioni (lib/prezzi.ts). Il testo che vedono card e scheda («10€/h
     netti») lo scrive l'app da qui (`testoPaga`). */
  const [pagaTipo, setPagaTipo] = useState<TipoPaga>(bozza?.pagaTipo ?? 'oraria');
  const [pagaImporto, setPagaImporto] = useState(testoNumero(bozza?.pagaImporto));
  const [pagaLorda, setPagaLorda] = useState<boolean | null>(bozza?.pagaLorda ?? null);
  const [ore, setOre] = useState<Record<CampoOre, string>>({
    oreTotali: testoNumero(bozza?.oreTotali),
    oreGiorno: testoNumero(bozza?.oreGiorno),
    giorni: testoNumero(bozza?.giorni),
    oreSettimana: testoNumero(bozza?.oreSettimana),
    settimane: testoNumero(bozza?.settimane),
  });

  // Single selection tags
  const [selectedTypeTag, setSelectedTypeTag] = useState<string>(bozza?.tagDurata ?? '');
  const [selectedRoleTag, setSelectedRoleTag] = useState<string>(bozza && !bozza.ruoloPersonalizzato ? bozza.ruolo : '');
  const [customRoleTag, setCustomRoleTag] = useState<string>(bozza?.ruoloPersonalizzato ? bozza.ruolo : '');
  const [isCustomRole, setIsCustomRole] = useState(bozza?.ruoloPersonalizzato ?? false);
  
  const [errors, setErrors] = useState<{ 
    title?: string; 
    description?: string; 
    typeTag?: string;
    roleTag?: string;
    paga?: string;
    ore?: string;
  }>({});

  const durata = durataDaTag(selectedTypeTag);
  // Le ore servono al valore solo con la paga oraria: col forfait il valore
  // è l'importo (lib/prezzi.ts).
  const campiOre: CampoOre[] = durata && pagaTipo === 'oraria' ? ORE_PER_DURATA[durata] : [];

  const handleRoleSelect = (role: string) => {
    if (role === 'custom') {
      setIsCustomRole(true);
      setSelectedRoleTag('');
    } else {
      setIsCustomRole(false);
      setSelectedRoleTag(role);
      setCustomRoleTag('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    }
    
    if (!description.trim()) {
      newErrors.description = 'La descrizione è obbligatoria';
    }
    
    if (!selectedTypeTag) {
      newErrors.typeTag = 'Seleziona una modalità';
    }
    
    // Role is required - either predefined or custom
    const finalRole = isCustomRole ? customRoleTag.trim() : selectedRoleTag;
    if (!finalRole) {
      newErrors.roleTag = 'Seleziona o inserisci un ruolo';
    }

    const importo = numero(pagaImporto);
    if (importo === null || importo <= 0) {
      newErrors.paga = 'Scrivi quanto paghi';
    } else if (pagaLorda === null) {
      newErrors.paga = 'Indica se è netto o lordo';
    }

    for (const campo of campiOre) {
      const n = numero(ore[campo]);
      if (n === null || n <= 0 || (CAMPI_ORE[campo].intero && !Number.isInteger(n))) {
        newErrors.ore = `Indica ${CAMPI_ORE[campo].etichetta.toLowerCase()}`;
        break;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const prosegui = () => {
    if (!validateForm()) {
      toast.error('Compila i campi obbligatori', { duration: 1500 });
      return;
    }

    if (!user || !profile) {
      toast.error('Devi essere autenticato', { duration: 1500 });
      return;
    }

    // Check if employer has set their location — prima delle opzioni, non
    // dopo: scoprirlo all'ultimo tocco sarebbe peggio.
    if (!profile.lat || !profile.lng) {
      toast.error(
        profile.tipo_employer === 'privato'
          ? 'Scegli la tua zona nella configurazione del profilo'
          : 'Imposta la posizione della tua attività nel Profilo',
        { duration: 2300 }
      );
      return;
    }

    // Geofencing check
    if (!isWithinGenovaBounds(profile.lat, profile.lng)) {
      toast.error(GEOFENCING_ERROR_MESSAGE, { duration: 3000 });
      return;
    }

    const usate = new Set(campiOre);
    const oreDi = (campo: CampoOre) => (usate.has(campo) ? numero(ore[campo]) : null);
    salvaBozza({
      title: title.trim(),
      description: description.trim(),
      schedule: schedule.trim(),
      inizioData,
      inizioOra,
      tagDurata: selectedTypeTag,
      durata: durata!,
      ruolo: isCustomRole ? customRoleTag.trim() : selectedRoleTag,
      ruoloPersonalizzato: isCustomRole,
      pagaTipo,
      pagaImporto: numero(pagaImporto)!,
      pagaLorda: pagaLorda!,
      oreTotali: oreDi('oreTotali'),
      oreGiorno: oreDi('oreGiorno'),
      giorni: oreDi('giorni'),
      oreSettimana: oreDi('oreSettimana'),
      settimane: oreDi('settimane'),
    });
    navigate('/create-job/opzioni');
  };

  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-employer" />
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-background overflow-y-auto"
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Header — era un blocco blu pieno che si interrompeva di netto sulla
          carta: l'unica schermata dell'app fatta cosi'. Ora e' carta come le
          altre, e il colore del ruolo resta sulla freccia e sul bordo. */}
      <div className="bg-background border-b-2 border-border px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <TesseraIndietro onClick={() => navigate(-1)} />
          <h1 className="titolo-sezione">Crea annuncio</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Pubblica un nuovo annuncio di lavoro
        </p>
      </div>

      <div className="px-6 py-6 space-y-6 pb-32">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-lg font-semibold">
            Titolo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="es. Cameriere per evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
            <DocumentoIcon className="h-4 w-4 text-employer-800" />
            Descrizione <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Descrivi il lavoro, requisiti e aspettative..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`min-h-[120px] ${errors.description ? 'border-destructive' : ''}`}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <Label htmlFor="schedule" className="text-base font-medium flex items-center gap-2">
            <OrologioIcon className="h-4 w-4 text-employer-800" />
            Orario
          </Label>
          <Input
            id="schedule"
            placeholder="es. Lun-Ven 18:00-22:00"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </div>

        {/* Quando inizia — facoltativo. Con data E ora, chi viene scelto può
            ricevere il promemoria il giorno prima (§28). */}
        <div className="space-y-2">
          <Label htmlFor="inizio" className="text-base font-medium flex items-center gap-2">
            <CalendarioIcon className="h-4 w-4 text-employer-800" />
            Quando inizia
            <span className="text-sm font-normal text-muted-foreground">(facoltativo)</span>
          </Label>
          <div className="grid grid-cols-[3fr_2fr] gap-2">
            <CampoData id="inizio" value={inizioData} min={oggiISO()} onChange={setInizioData} aria-label="Giorno d'inizio" />
            <div className="relative">
              <Input
                type="time"
                value={inizioOra}
                onChange={(e) => setInizioOra(e.target.value)}
                className="campo-data relative pr-11"
                aria-label="Ora d'inizio"
              />
              <OrologioIcon
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-ink-soft"
              />
            </div>
          </div>
          {(inizioData !== '') !== (inizioOra !== '') && (
            <p className="text-sm text-muted-foreground">Con giorno e ora, chi scegli riceve un promemoria il giorno prima.</p>
          )}
        </div>

        {/* Paga: all'ora o a forfait, l'importo, netto o lordo */}
        <div className="space-y-2">
          <Label htmlFor="paga" className="text-base font-medium flex items-center gap-2">
            <EuroIcon className="h-4 w-4 text-employer-800" />
            Paga <span className="text-destructive">*</span>
          </Label>
          <SceltaDoppia<TipoPaga>
            opzioni={[{ valore: 'oraria', testo: "All'ora" }, { valore: 'forfait', testo: 'Forfait' }]}
            valore={pagaTipo}
            onScegli={setPagaTipo}
          />
          <div className="relative">
            <Input
              id="paga"
              inputMode="decimal"
              placeholder={pagaTipo === 'oraria' ? 'es. 10' : 'es. 80'}
              value={pagaImporto}
              onChange={(e) => setPagaImporto(e.target.value)}
              className={cn('pr-16', errors.paga && 'border-destructive')}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-sm text-muted-foreground">
              {pagaTipo === 'oraria' ? '€ / ora' : '€'}
            </span>
          </div>
          <SceltaDoppia<boolean>
            opzioni={[{ valore: false, testo: 'Netto' }, { valore: true, testo: 'Lordo' }]}
            valore={pagaLorda}
            onScegli={setPagaLorda}
          />
          {errors.paga && <p className="text-sm text-destructive">{errors.paga}</p>}
        </div>

        {/* Type Tag (Modalità) - Single Selection Required */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <CalendarioIcon className="h-4 w-4 text-employer-800" />
            Durata <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Seleziona il tipo di impiego
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTypeTag(tag)}
                className={`flex items-center justify-center px-3 py-2.5 sagoma-quartiere rounded-[19px] text-sm font-medium transition-all active:scale-95 border-2 ${
                  selectedTypeTag === tag
                    ? 'bg-employer-700 text-employer-foreground border-employer-700'
                    : 'bg-employer-50 text-employer border-transparent hover:bg-employer-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {errors.typeTag && <p className="text-sm text-destructive">{errors.typeTag}</p>}

          {/* Le ore: solo quelle che servono a questa durata, e solo con la
              paga oraria (lib/prezzi.ts, ORE_PER_DURATA). */}
          {campiOre.length > 0 && (
            <div className={cn('grid gap-2 pt-1', campiOre.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
              {campiOre.map((campo) => (
                <div key={campo} className="space-y-1">
                  <Label htmlFor={campo} className="text-sm text-muted-foreground">
                    {CAMPI_ORE[campo].etichetta}
                  </Label>
                  <Input
                    id={campo}
                    inputMode={CAMPI_ORE[campo].intero ? 'numeric' : 'decimal'}
                    value={ore[campo]}
                    onChange={(e) => setOre((o) => ({ ...o, [campo]: e.target.value }))}
                    className={errors.ore && !numero(ore[campo]) ? 'border-destructive' : ''}
                  />
                </div>
              ))}
            </div>
          )}
          {errors.ore && <p className="text-sm text-destructive">{errors.ore}</p>}
        </div>

        {/* Role Tag (Ruoli) - Single Selection Required with Custom Option */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            {/* era arancione: unica icona della schermata a non seguire il ruolo */}
            <GenericoIcon className="h-4 w-4 text-employer-800" />
            Ruolo <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Seleziona il ruolo richiesto
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_TAGS.map((tag) => {
              const Icon = getJobIcon(tag);
              const isSelected = !isCustomRole && selectedRoleTag === tag;
              
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRoleSelect(tag)}
                  className={`flex flex-col items-center gap-1.5 p-3 sagoma-tag rounded-[28px] text-sm font-medium transition-all active:scale-95 border-2 ${
                    isSelected
                      ? 'bg-employer-700 text-employer-foreground border-transparent'
                      : 'bg-accent text-accent-foreground border-transparent hover:bg-accent/70'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-employer-foreground' : 'text-accent-foreground'}`} />
                  <span className="text-xs text-center leading-tight">{tag}</span>
                </button>
              );
            })}
            
            {/* Custom Option */}
            <button
              type="button"
              onClick={() => handleRoleSelect('custom')}
              className={`flex flex-col items-center gap-1.5 p-3 sagoma-tag rounded-[28px] text-sm font-medium transition-all active:scale-95 border-2 ${
                isCustomRole
                  ? 'bg-employer-700 text-employer-foreground border-transparent'
                  : 'bg-accent text-accent-foreground border-transparent hover:bg-accent/70'
              }`}
            >
              <PennaIcon className={`w-5 h-5 ${isCustomRole ? 'text-employer-foreground' : 'text-accent-foreground'}`} />
              <span className="text-xs text-center leading-tight">Altro</span>
            </button>
          </div>
          
          {/* Custom Role Input */}
          {isCustomRole && (
            <div className="mt-3">
              <Input
                placeholder="Scrivi il ruolo personalizzato..."
                value={customRoleTag}
                onChange={(e) => setCustomRoleTag(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                L'icona visualizzata sarà una valigetta generica
              </p>
            </div>
          )}
          
          {errors.roleTag && <p className="text-sm text-destructive">{errors.roleTag}</p>}
        </div>
      </div>

      {/* Fixed Footer — le opzioni e la pubblicazione sono nella pagina
          dopo (OpzioniAnnuncio). */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button
          onClick={prosegui}
          size="lg"
          className="w-full bg-employer-700 hover:bg-employer-800 text-employer-foreground font-semibold"
        >
          Prosegui
        </Button>
      </div>
    </div>
  );
};

export default CreateJob;