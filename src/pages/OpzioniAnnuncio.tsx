import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TesseraIcona, TesseraIndietro } from '@/components/ui/Tessera';
import { InvioIcon } from '@/components/icons/uiIcons';
import { getJobIcon } from '@/lib/jobIcons';
import { calcolaPrezzi, testoPaga, testoPrezzo, valoreAnnuncio, type Opzione } from '@/lib/prezzi';
import { PREZZI } from '@/config/prezzi';
import { cancellaBozza, inizioDaBozza, leggiBozza, type BozzaAnnuncio } from '@/lib/bozzaAnnuncio';
import { chiediPermessoDopo } from '@/lib/notifiche/permesso';
import { GIORNI_A_PAGAMENTO, ORE_GRATUITE } from '@/lib/scadenzaAnnunci';
import { cn } from '@/lib/utils';

type OpzionePagata = Exclude<Opzione, 'nessuna'>;

/** Nome e descrizione di ogni opzione (quella del potenziamento è di Tommaso,
 *  le altre provvisorie). */
const OPZIONI: { id: OpzionePagata; nome: string; conNome: string; descrizione: string }[] = [
  {
    id: 'potenziamento',
    nome: 'Potenziamento',
    conNome: 'con il potenziamento',
    descrizione: 'In cima alle ricerche dei ragazzi interessati, evidenziato, e segnalato a chi cerca questo tipo di lavoro vicino a te.',
  },
  {
    id: 'allungamento',
    nome: 'Allungamento',
    conNome: "con l'allungamento",
    descrizione: `Resta visibile ${GIORNI_A_PAGAMENTO} giorni invece di ${ORE_GRATUITE} ore.`,
  },
  {
    id: 'pacchetto',
    nome: 'Pacchetto',
    conNome: 'con il pacchetto',
    descrizione: `Potenziamento e allungamento insieme, con il ${Math.round(PREZZI.scontoPacchetto * 100)}% di sconto.`,
  },
];

/** La riga sotto il titolo nel riepilogo: «Cameriere · Una tantum · 5 ore». */
function righeRiepilogo(b: BozzaAnnuncio): string {
  const n = (x: number | null) => String(x ?? '').replace('.', ',');
  const ore =
    b.pagaTipo === 'forfait'
      ? null
      : b.durata === 'occasionale'
        ? `${n(b.oreTotali)} ore`
        : b.durata === 'giornaliero'
          ? `${n(b.oreGiorno)} ore × ${n(b.giorni)} giorni`
          : b.durata === 'settimanale'
            ? `${n(b.oreSettimana)} ore a settimana × ${n(b.settimane)} settimane`
            : `${n(b.oreSettimana)} ore a settimana`;
  return [b.ruolo, b.tagDurata, ore].filter(Boolean).join(' · ');
}

/**
 * LE OPZIONI PRIMA DI PUBBLICARE (5 novembre) — tra il form (CreateJob) e la
 * pubblicazione.
 *
 * - In alto il riepilogo dell'annuncio, per sapere di cosa si sta parlando.
 * - Tre card con il prezzo CALCOLATO dal valore dell'annuncio (lib/prezzi.ts,
 *   numeri in config/prezzi.ts): potenziamento, allungamento, pacchetto. Se
 *   ne sceglie una sola, o nessuna; toccare di nuovo quella scelta la toglie.
 * - «Pubblica gratis» è un bottone vero, grande quanto l'altro: chi non
 *   vuole niente non deve cercare l'uscita.
 *
 * FASE DI PROVA (`pagamentiAttivi = false`): niente pagamento, l'opzione si
 * applica gratis. Si salvano la scelta e i tre prezzi MOSTRATI, per capire
 * dopo il test cosa avrebbero comprato. L'allungamento lo applica il
 * database (`proteggi_scadenza_annuncio`, 7 giorni); il potenziamento lo
 * applicano le liste (lib/potenziamento.ts) e la notifica agli studenti
 * vicini (database, `notifica_lavoro_potenziato`).
 */
const OpzioniAnnuncio = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useUser();
  const [bozza] = useState(leggiBozza);
  const [scelta, setScelta] = useState<Opzione>('nessuna');
  const [pubblicando, setPubblicando] = useState(false);

  const valore = useMemo(
    () =>
      bozza &&
      valoreAnnuncio({
        durata: bozza.durata,
        tipoPaga: bozza.pagaTipo,
        importo: bozza.pagaImporto,
        oreTotali: bozza.oreTotali,
        oreGiorno: bozza.oreGiorno,
        giorni: bozza.giorni,
        oreSettimana: bozza.oreSettimana,
        settimane: bozza.settimane,
      }),
    [bozza]
  );
  const prezzi = useMemo(() => (valore == null ? null : calcolaPrezzi(valore)), [valore]);

  // Arrivati qui senza bozza (indirizzo scritto a mano, app ricaricata): al form.
  if (!bozza || !prezzi) return <Navigate to="/create-job" replace />;

  const Icona = getJobIcon(bozza.ruoloPersonalizzato ? null : bozza.ruolo);
  const conAllungamento = scelta === 'allungamento' || scelta === 'pacchetto';
  const conScelta = OPZIONI.find((o) => o.id === scelta)?.conNome;

  const pubblica = async (opzione: Opzione) => {
    if (!user || !profile?.lat || !profile?.lng) {
      toast.error('Devi essere autenticato', { duration: 1500 });
      return;
    }
    setPubblicando(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        owner_id: user.id,
        title: bozza.title,
        description: bozza.description,
        schedule: bozza.schedule || null,
        inizio_il: inizioDaBozza(bozza),
        price: testoPaga(bozza.pagaTipo, bozza.pagaImporto, bozza.pagaLorda),
        category: bozza.ruolo.toLowerCase(),
        tags: [bozza.tagDurata, bozza.ruolo],
        lat: profile.lat,
        lng: profile.lng,
        neighborhood: profile.neighborhood || null,
        status: 'open',
        paga_tipo: bozza.pagaTipo,
        paga_importo: bozza.pagaImporto,
        paga_lorda: bozza.pagaLorda,
        ore_totali: bozza.oreTotali,
        ore_giorno: bozza.oreGiorno,
        giorni: bozza.giorni,
        ore_settimana: bozza.oreSettimana,
        settimane: bozza.settimane,
        // La scelta e i prezzi VISTI qui. La scadenza la decide il database
        // dall'opzione (48 ore, o 7 giorni in prova con l'allungamento).
        opzione,
        prezzo_potenziamento: prezzi.potenziamento,
        prezzo_allungamento: prezzi.allungamento,
        prezzo_pacchetto: prezzi.pacchetto,
      });
      if (error) throw error;

      cancellaBozza();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['my-jobs'] }),
      ]);
      toast.success('Annuncio pubblicato!', { duration: 1500 });
      navigate('/annunci', { replace: true });
      // Dopo il primo annuncio: «ti avvisiamo quando qualcuno si candida».
      chiediPermessoDopo('annuncio');
    } catch (error) {
      console.error('[Politask] pubblicazione annuncio', error);
      toast.error('Errore nella pubblicazione', { duration: 1500 });
      setPubblicando(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-background" style={{ touchAction: 'pan-y' }}>
      <div className="border-b-2 border-border bg-background px-6 pb-4 pt-8">
        <div className="mb-1 flex items-center gap-3">
          <TesseraIndietro onClick={() => navigate(-1)} />
          <h1 className="titolo-sezione">Prima di pubblicare</h1>
        </div>
        <p className="text-sm text-muted-foreground">Vuoi dare una spinta al tuo annuncio?</p>
      </div>

      <div className="space-y-6 px-6 py-6 pb-56">
        {/* Il riepilogo: la riga della Lista, con la paga a destra. */}
        <div className="material-card flex items-center gap-3 p-3.5">
          <TesseraIcona icona={Icona} />
          <div className="min-w-0 flex-1">
            <p className="titolo-mini line-clamp-2 leading-tight">{bozza.title}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{righeRiepilogo(bozza)}</p>
          </div>
          <p className="max-w-[38%] shrink-0 text-right text-sm font-semibold text-employer-800">
            {testoPaga(bozza.pagaTipo, bozza.pagaImporto, bozza.pagaLorda)}
          </p>
        </div>

        <div role="radiogroup" aria-label="Opzioni dell'annuncio" className="card-tilt space-y-3">
          {OPZIONI.map((o, i) => {
            const attiva = scelta === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={attiva}
                onClick={() => setScelta(attiva ? 'nessuna' : o.id)}
                className={cn(
                  'material-card flex w-full items-start gap-3 p-4 text-left touch-feedback-subtle transition-colors',
                  i % 2 ? 'tilt-r' : 'tilt-l',
                  attiva && 'bg-employer-50'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="titolo-mini">{o.nome}</p>
                  <p className="mt-1 text-sm leading-snug text-ink-soft">{o.descrizione}</p>
                  {!PREZZI.pagamentiAttivi && (
                    <p className="mt-2 text-xs font-medium text-success">Gratis durante la fase di prova</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="font-[Shinjo,Outfit,sans-serif] text-[22px] leading-none tracking-[-0.02em] text-employer-800 [font-synthesis:none]">
                    {testoPrezzo(prezzi[o.id])}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                      attiva ? 'border-employer-800 bg-employer-800 text-paper-sheet' : 'border-paper-edge'
                    )}
                  >
                    {attiva && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* In fondo: con un'opzione scelta due bottoni della stessa misura,
          così «Pubblica gratis» non diventa un link nascosto. */}
      <div className="fixed bottom-0 left-0 right-0 space-y-2 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {scelta !== 'nessuna' && (
          <Button
            onClick={() => pubblica(scelta)}
            disabled={pubblicando}
            size="lg"
            className="w-full bg-employer-700 font-semibold text-employer-foreground hover:bg-employer-800"
          >
            {pubblicando ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pubblica ${conScelta}`}
          </Button>
        )}
        <Button
          onClick={() => pubblica('nessuna')}
          disabled={pubblicando}
          size="lg"
          variant={scelta === 'nessuna' ? 'default' : 'outline'}
          className={cn(
            'w-full font-semibold',
            scelta === 'nessuna' && 'bg-employer-700 text-employer-foreground hover:bg-employer-800'
          )}
        >
          {pubblicando && scelta === 'nessuna' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <InvioIcon className="mr-2 h-5 w-5" />
              Pubblica gratis
            </>
          )}
        </Button>
        <p className="text-center text-[13px] text-muted-foreground">
          Resta visibile sulla mappa per {conAllungamento ? `${GIORNI_A_PAGAMENTO} giorni` : `${ORE_GRATUITE} ore`}.
        </p>
      </div>
    </div>
  );
};

export default OpzioniAnnuncio;
