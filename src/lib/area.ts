import { generatore, semeDa } from "@/lib/tratto";

/**
 * L'AREA DI UN PRIVATO (24 ottobre 2026): un cerchio di ~300 m al posto del
 * pin. Il centro che si vede è SEMPRE quello già spostato dal database (fino
 * a 100 m, fisso per profilo): qui si disegna e basta.
 */

/* Il contorno è tracciato «a mano» come le sagome (`lib/tratto.ts`): il
   raggio di ogni vertice si sposta un poco, col seme di chi è l'area, quindi
   è sempre lo stesso disegno. In proporzione al raggio e non in pixel: sulla
   mappa lo zoom cambia, e una frazione fissa resta un tremolio da mano a
   ogni zoom (±1,5%: ~±2 px a zoom 16, invisibile da lontano). */
const TREMOLIO = 0.015;

/** Un cerchio in metri come poligono GeoJSON. Con `seme`, il bordo è a mano. */
export function cerchioGeo(lat: number, lng: number, raggio: number, seme?: string, lati = 96) {
  const dLat = raggio / 111320;
  const dLng = raggio / (111320 * Math.cos((lat * Math.PI) / 180));
  const caso = seme ? generatore(semeDa(seme)) : null;
  const scarti = Array.from({ length: lati }, () => (caso ? 1 + (caso() * 2 - 1) * TREMOLIO : 1));
  const anello = Array.from({ length: lati + 1 }, (_, i) => {
    const a = (2 * Math.PI * i) / lati;
    const k = scarti[i % lati];
    return [lng + dLng * k * Math.cos(a), lat + dLat * k * Math.sin(a)];
  });
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [anello] },
  };
}

/**
 * Un colore dei token come stringa che Mapbox capisce. Le vernici di Mapbox
 * non leggono le variabili CSS: si legge il valore («213 45% 38%») e lo si
 * scrive come `hsl(213, 45%, 38%)`, con una trasparenza se serve.
 */
export function coloreToken(nome: string, alfa = 1): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const [h, s, l] = v.split(/\s+/);
  if (!h || !s || !l) return alfa < 1 ? `rgba(53, 93, 141, ${alfa})` : "#355D8D";
  return alfa < 1 ? `hsla(${h}, ${s}, ${l}, ${alfa})` : `hsl(${h}, ${s}, ${l})`;
}
