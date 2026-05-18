/**
 * Clave TomTom (Traffic Flow + Incidents).
 * Fuente única: también se lee desde .env como VITE_TOMTOM_API_KEY
 */
const TOMTOM_API_KEY = "I1QN7ntpSqnErI9axpXW1qKCJhVeUROX";

window.TOMTOM_API_KEY = TOMTOM_API_KEY;

function obtenerClaveTomTom() {
  return window.TOMTOM_API_KEY || TOMTOM_API_KEY;
}
