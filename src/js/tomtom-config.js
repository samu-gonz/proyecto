/**
 * Clave TomTom (Traffic Flow + Incidents).
 * Fuente: .env como VITE_TOMTOM_API_KEY
 */
const TOMTOM_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TOMTOM_API_KEY) ||
  "";

if (TOMTOM_API_KEY) {
  window.TOMTOM_API_KEY = TOMTOM_API_KEY;
}

export function obtenerClaveTomTom() {
  return window.TOMTOM_API_KEY || TOMTOM_API_KEY || "";
}

window.obtenerClaveTomTom = obtenerClaveTomTom;
