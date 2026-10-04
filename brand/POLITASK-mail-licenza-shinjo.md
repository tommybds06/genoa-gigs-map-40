# Mail a Komet & Flicker — licenza Shinjo

## Dove mandarla

**Non c'è un indirizzo pubblico.** Ho cercato: il sito della foundry non espone
una mail, e i «Komet» che si trovano cercando sono altre aziende (utensili
dentali, comunicazione). I due canali diretti sono:

1. **Creative Market** — <https://creativemarket.com/KometFlicker> → bottone
   **«Contact»** sul profilo del negozio. **È la strada da preferire**: la
   conversazione resta agganciata al tuo acquisto, quindi non devono chiederti
   prove.
2. **Behance** — <https://www.behance.net/kometflicker> → «Message». Da usare
   solo se dal primo non rispondono entro una settimana.

Scrivi in **inglese**: la foundry è di Seattle.

---

## Cosa stai chiedendo (tre cose, in un colpo solo)

Conviene chiedere tutto adesso, perché ogni giro costa giorni di attesa.

| # | Cosa | Perché serve |
|---|---|---|
| 1 | **Caricare i glifi su Mapbox** | le etichette della mappa le disegna il renderer di Mapbox: il font va caricato sui *loro* server. È hosting di terze parti, che la licenza Webfont non nomina |
| 2 | **Embedding nell'app nativa** | Fase 10 con Despia: il font finisce dentro il pacchetto. Di norma serve la licenza App |
| 3 | **Uso nel logo, con lettere ridisegnate** | Creative Market lo permette solo se l'asset è modificato e non dominante — e nel wordmark le lettere *sono* dominanti. Serve il loro assenso scritto prima del deposito EUTM |

⚠️ Il punto 3 è l'unico con una **scadenza esterna**. Gli altri due possono
aspettare; quello no.

---

## Testo da inviare

> **Subject:** Shinjo licensing — map rendering, native app, and logo use
>
> Hi,
>
> I bought the Desktop and Webfont licenses for Shinjo and I'm using it as the
> display typeface for Politask, a small local job-matching app I'm building for
> students in Genoa, Italy. It's a solo project, currently pre-launch.
>
> Three questions I'd rather ask now than assume:
>
> **1. Uploading the font to Mapbox.** The app has a map, and map labels are
> rendered by Mapbox, not by the browser. To use Shinjo there I'd have to upload
> the font file to Mapbox Studio, which converts it into glyph ranges served from
> their servers. It isn't redistribution — nobody can download the original file —
> but the font would sit on third-party infrastructure. Does the Webfont license
> cover this, or do you need to authorise it separately?
>
> **2. Native app.** Later this year the web app will be wrapped into iOS and
> Android builds, so the font file would be embedded in the app bundle. I assume
> this needs the App license — could you confirm the scope, and whether it's
> per-app or per-platform?
>
> **3. Logo.** My wordmark is drawn from Shinjo. I've redrawn the letterforms
> rather than using the font outlines as-is, and I plan to file it as an EU trade
> mark. I understand your terms allow font use in a logo only when the asset is
> modified and not the dominant element, and that the typeface must be
> disclaimed. Since the letters are the dominant element in a wordmark, I'd like
> your written position on it: how much modification you consider sufficient, and
> whether you're comfortable with the filing.
>
> Happy to send the current logo file and a screenshot of the app if that helps.
>
> Thanks a lot — Shinjo is genuinely lovely to work with.
>
> Best,
> Tommaso Bruschi de Simone
> Politask — Genoa, Italy

---

## Note su come è scritta

- **Dice che hai già comprato.** Chi ha pagato ottiene risposte più in fretta di
  chi sta valutando.
- **Spiega il caso Mapbox invece di chiedere «posso?»** Molte foundry non sanno
  come funziona il rendering delle mappe: se glielo spieghi tu, possono
  rispondere subito invece di dover indagare.
- **Chiede una posizione scritta sul logo, non un permesso generico.** «Posso
  usarlo nel logo?» invita a un no prudente; «quanto ritenete sufficiente» apre
  una trattativa.
- **Non minimizza il progetto.** Dire «è solo un progettino» invita a essere
  liquidati; dire cos'è davvero, senza gonfiarlo, invita a essere trattati come
  un cliente.
- **Chiude con un complimento sincero.** Sono progettisti indipendenti, e la
  differenza fra una risposta in due giorni e una in tre settimane spesso è
  questa.

## Se non rispondono

Dopo una settimana: sollecito breve su Behance. Dopo due: valuta un font
alternativo per i titoli — la dipendenza da una risposta che non arriva non può
bloccare il lancio. Gabarito aveva vinto il confronto a quattro e ha una licenza
aperta (SIL), quindi come piano B non costa niente e non ha vincoli.
