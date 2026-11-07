/**
 * IL CENTRO DI OGNI QUARTIERE (5 novembre), da OpenStreetMap (Nominatim,
 * `suburb`; il Centro Storico è la sua zona a traffico limitato).
 *
 * Serve a due cose, che usano la ZONA DEL PROFILO e non la posizione in tempo
 * reale: l'ordine della Lista per distanza (lib/potenziamento.ts) e la
 * notifica dei lavori in evidenza entro 2 km (lo fa il database).
 * ⚠️ Gli stessi numeri sono nella tabella `quartieri` del database
 * (migration 20261105130000_potenziamento.sql): vanno cambiati insieme.
 */
export const CENTRO_QUARTIERE: Record<string, { lat: number; lng: number }> = {
  Albaro: { lat: 44.3972, lng: 8.9636 },
  Apparizione: { lat: 44.4043, lng: 8.9948 },
  Bavari: { lat: 44.4328, lng: 9.0193 },
  Bolzaneto: { lat: 44.4587, lng: 8.9015 },
  Borgoratti: { lat: 44.4081, lng: 8.9885 },
  Borzoli: { lat: 44.4344, lng: 8.8675 },
  Carignano: { lat: 44.4017, lng: 8.9371 },
  Castelletto: { lat: 44.4155, lng: 8.9404 },
  "Centro Storico": { lat: 44.4097, lng: 8.9316 },
  Cornigliano: { lat: 44.4161, lng: 8.8718 },
  Foce: { lat: 44.3994, lng: 8.949 },
  Lagaccio: { lat: 44.4207, lng: 8.9177 },
  Maddalena: { lat: 44.4104, lng: 8.932 },
  Marassi: { lat: 44.417, lng: 8.9563 },
  Molassana: { lat: 44.4535, lng: 8.9809 },
  Molo: { lat: 44.4064, lng: 8.9304 },
  Nervi: { lat: 44.3833, lng: 9.0391 },
  Oregina: { lat: 44.423, lng: 8.9252 },
  Pegli: { lat: 44.4272, lng: 8.8149 },
  Pontedecimo: { lat: 44.4978, lng: 8.9035 },
  Portoria: { lat: 44.407, lng: 8.9363 },
  "Prà": { lat: 44.4282, lng: 8.7832 },
  "Prè": { lat: 44.4136, lng: 8.9268 },
  "Quarto dei Mille": { lat: 44.3928, lng: 8.998 },
  Quezzi: { lat: 44.4212, lng: 8.9715 },
  "Quinto al Mare": { lat: 44.3859, lng: 9.0164 },
  Rivarolo: { lat: 44.438, lng: 8.893 },
  Sampierdarena: { lat: 44.4127, lng: 8.8929 },
  "San Fruttuoso": { lat: 44.408, lng: 8.9611 },
  "San Martino": { lat: 44.406, lng: 8.9749 },
  "San Quirico": { lat: 44.4826, lng: 8.9011 },
  "San Teodoro": { lat: 44.4183, lng: 8.9106 },
  "San Vincenzo": { lat: 44.4053, lng: 8.9425 },
  "Sant'Eusebio": { lat: 44.442, lng: 8.986 },
  "Sant'Ilario": { lat: 44.3849, lng: 9.051 },
  "Sestri Ponente": { lat: 44.4249, lng: 8.8499 },
  Staglieno: { lat: 44.4313, lng: 8.9506 },
  Struppa: { lat: 44.451, lng: 9.0097 },
  Voltri: { lat: 44.4286, lng: 8.7542 },
};
