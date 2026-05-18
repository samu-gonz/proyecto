/**
 * Clave manual (opcional). Si está vacía, se usa VITE_TOMTOM_API_KEY del .env
 * cargada en index.html. Obtén una clave en https://developer.tomtom.com/
 */
const TOMTOM_API_KEY_MANUAL = "";

if (TOMTOM_API_KEY_MANUAL) {
  window.TOMTOM_API_KEY = TOMTOM_API_KEY_MANUAL;
} else if (!window.TOMTOM_API_KEY) {
  window.TOMTOM_API_KEY = "";
}
