/**
 * Textos de UI orientados a la ruta (origen → paradas → TomTom → mapa).
 * Usar estas constantes en app.js, React y bridge; no duplicar strings sueltos.
 */
export const MSG_RUTA = {
  resumenInicial:
    "<p><strong>Para ver la ruta en el mapa:</strong> confirma el origen (GPS o máquina), marca las máquinas a visitar y espera el cálculo automático.</p>",

  geoInicial:
    "Confirma tu GPS o elige origen; luego marca máquinas — la ruta se dibujará en el mapa.",

  origenInfoVacio:
    '<p class="small">Sin origen válido no se puede calcular la ruta. Confirma GPS o elige una máquina de partida.</p>',

  panelTraficoInicial: "Tráfico en la ruta: calcula primero para ver tramos rojos, amarillos y verdes.",

  reinicioResumen:
    "<p>Marca máquinas a visitar: la ruta se calculará en el mapa al tener origen y paradas.</p>",

  reinicioGeo:
    "Confirma origen y marca máquinas para calcular la ruta en el mapa.",

  restaurandoSesion: "<p>Restaurando tu última ruta…</p>",

  restaurarOrigenFallo:
    "<p>No se pudo restaurar el origen guardado. Confirma GPS o elige máquina para volver a calcular la ruta.</p>",

  restaurarSesionOk: "Ruta restaurada en el mapa.",

  sinMaquinasZona: "<p>No hay máquinas en esta zona — no se puede trazar ruta aquí.</p>",

  sinMaquinasSeleccionadas:
    "<p>Marca al menos una máquina en la lista para calcular la ruta en el mapa.</p>",

  sinOrigen: "<p>Indica un punto de partida (GPS o máquina) para calcular la ruta.</p>",

  gpsPendiente:
    "<p>Pulsa «Confirmar mi ubicación actual» para usar el GPS como inicio de la ruta.</p>",

  confirmarGpsAntesCalcular:
    "Confirma tu ubicación con el botón «Confirmar mi ubicación actual» antes de calcular la ruta.",

  origenInvalido:
    "<p>Confirma tu GPS o elige un origen válido antes de calcular la ruta.</p>",

  calculando: "<p><strong>Calculando ruta</strong> con tráfico TomTom…</p>",

  paradasSinOrigenDistinto:
    "<p>Marca al menos una máquina distinta del origen para trazar la ruta.</p>",

  gpsFijar:
    "Pulsa «Confirmar mi ubicación actual» para fijar el GPS y poder calcular la ruta.",

  origenSelectorError:
    "No se pudo determinar el origen de la ruta. Confirma GPS o elige una máquina.",

  origenValidoRequerido:
    "<p>El origen no es válido para la ruta. Confirma GPS o cambia el punto de partida.</p>",

  errorTomTomTitulo: "No se pudo calcular la ruta por carretera.",
  errorTomTomClave: "Revisa la clave TomTom en .env (VITE_TOMTOM_API_KEY) y vuelve a calcular.",

  esquivarSinRuta: "Calcula primero una ruta en el mapa para poder esquivar incidencias.",
  esquivarRecalculando: "<p>Recalculando la ruta esquivando la incidencia…</p>",

  confirmarGpsEspera:
    "Esperando GPS… Cuando se confirme, podrás calcular la ruta desde tu ubicación.",

  confirmarGpsOk:
    "GPS confirmado. Marca máquinas o pulsa «Calcular ruta óptima» para ver el trayecto.",

  origenMaquinaActualizando: (nombre) =>
    `Origen: ${nombre}. Actualizando ruta en el mapa…`,

  origenMaquinaListo: (nombre) => `Origen para la ruta: ${nombre}`,

  paradaSeleccionada: (nombre) =>
    `${nombre} — márcala en la lista para incluirla en la ruta.`
};
