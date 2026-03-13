// Genova neighborhoods list - alphabetically sorted
export const GENOA_NEIGHBORHOODS = [
  "Albaro", "Apparizione", "Bavari", "Bolzaneto", "Borgoratti", "Borzoli",
  "Carignano", "Castelletto", "Centro Storico", "Cornigliano", "Foce",
  "Lagaccio", "Maddalena", "Marassi", "Molassana", "Molo", "Nervi",
  "Oregina", "Pegli", "Pontedecimo", "Portoria", "Prà", "Prè",
  "Quarto dei Mille", "Quezzi", "Quinto al Mare", "Rivarolo",
  "Sampierdarena", "San Fruttuoso", "San Martino", "San Quirico",
  "San Teodoro", "San Vincenzo", "Sant'Eusebio", "Sant'Ilario",
  "Sestri Ponente", "Staglieno", "Struppa", "Voltri"
] as const;

export type GenoaNeighborhood = typeof GENOA_NEIGHBORHOODS[number];

// Greater Genova bounding box limits
export const GENOVA_BOUNDS = {
  north: 44.55,   // Northern boundary (inland)
  south: 44.30,   // Southern boundary (sea)
  west: 8.65,     // Western boundary (Arenzano/Voltri)
  east: 9.15,     // Eastern boundary (Sori/Recco)
} as const;

// Default center point for Genova
export const GENOVA_CENTER = {
  lat: 44.4056,
  lng: 8.9463,
} as const;

/**
 * Validates if coordinates are within the Greater Genova area
 * @returns true if coordinates are within bounds, false otherwise
 */
export function isWithinGenovaBounds(lat: number, lng: number): boolean {
  return (
    lat >= GENOVA_BOUNDS.south &&
    lat <= GENOVA_BOUNDS.north &&
    lng >= GENOVA_BOUNDS.west &&
    lng <= GENOVA_BOUNDS.east
  );
}

/**
 * Error message for locations outside Genova
 */
export const GEOFENCING_ERROR_MESSAGE = "Politask è operativa solo nell'area di Genova e dintorni.";
