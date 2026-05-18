/**
 * Ruta TomTom por carretera: geometría en legs[].points y colores por secciones TRAFFIC.
 */

const COLORES_TRAFICO = {
  fluido: "#00E676",
  lento: "#FFD600",
  congestion: "#FF1744"
};

const COLOR_RUTA_ESQUIVADA_BORDE = "#ff00aa";

let miRutaActual = null;
let miRutaGrupo = null;

function lonDePunto(p) {
  return p.lng ?? p.lon;
}

function construirUrlRutaTomTom(origen, paradas, apiKey) {
  const ubicaciones = [
    `${origen.lat},${lonDePunto(origen)}`,
    ...paradas.map((p) => `${p.lat},${lonDePunto(p)}`),
    `${origen.lat},${lonDePunto(origen)}`
  ].join(":");

  const params = new URLSearchParams({
    key: apiKey,
    routeType: "fastest",
    traffic: "true",
    routeRepresentation: "polyline",
    sectionType: "traffic"
  });

  return `https://api.tomtom.com/routing/1/calculateRoute/${ubicaciones}/json?${params.toString()}`;
}

function puntosCarreteraDesdeLeg(leg) {
  const infoRuta = leg.points;
  if (!infoRuta?.length) return [];
  return infoRuta.map((p) => [p.latitude, p.longitude]);
}

function puntosCarreteraDesdeDatos(data) {
  const legs = data?.routes?.[0]?.legs;
  if (!legs?.length) return [];

  const puntosCarreteraReal = [];
  legs.forEach((leg) => {
    const tramo = puntosCarreteraDesdeLeg(leg);
    if (tramo.length > 0) {
      puntosCarreteraReal.push(...tramo);
    }
  });
  return puntosCarreteraReal;
}

/**
 * Puntos del tramo: seccion.points si existe; si no, slice de la polilínea global.
 */
function puntosDesdeSeccion(seccion, puntosGlobales) {
  if (seccion.points?.length) {
    return seccion.points.map((p) => [p.latitude, p.longitude]);
  }

  const inicio = Math.max(0, seccion.startPointIndex ?? 0);
  const fin = Math.min(
    puntosGlobales.length - 1,
    seccion.endPointIndex ?? inicio
  );

  if (fin < inicio || puntosGlobales.length < 2) {
    return [];
  }

  return puntosGlobales.slice(inicio, fin + 1);
}

function colorPorRetraso(delayInSeconds) {
  const retraso = delayInSeconds ?? 0;
  if (retraso > 90) return COLORES_TRAFICO.congestion;
  if (retraso > 30) return COLORES_TRAFICO.lento;
  return COLORES_TRAFICO.fluido;
}

async function obtenerRutaTomTom(origen, paradas, apiKey, areasEvitar = []) {
  const url = construirUrlRutaTomTom(origen, paradas, apiKey);
  const opciones = { method: "GET" };

  if (areasEvitar.length > 0) {
    opciones.method = "POST";
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify({
      avoidAreas: { rectangles: areasEvitar }
    });
  }

  const resp = await fetch(url, opciones);

  if (!resp.ok) {
    const cuerpo = await resp.text().catch(() => "");
    throw new Error(
      `TomTom Routing ${resp.status}${cuerpo ? `: ${cuerpo.slice(0, 120)}` : ""}`
    );
  }

  const data = await resp.json();

  if (!data.routes?.[0]?.legs?.length) {
    throw new Error("TomTom no devolvió routes[0].legs.");
  }

  const puntosCarreteraReal = puntosCarreteraDesdeDatos(data);
  if (puntosCarreteraReal.length < 2) {
    throw new Error(
      "TomTom no devolvió routes[0].legs[].points (sin geometría de carretera)."
    );
  }

  return data;
}

function limpiarRutaTomTom(mapa) {
  if (miRutaActual && mapa) {
    mapa.removeLayer(miRutaActual);
    miRutaActual = null;
  }
  if (miRutaGrupo && mapa) {
    mapa.removeLayer(miRutaGrupo);
    miRutaGrupo = null;
  }
}

function crearPolilineaTramo(mapa, puntos, color, opciones = {}) {
  if (puntos.length < 2) return null;

  const peso = opciones.rutaEsquivada ? 8 : 6;
  const estilo = {
    color,
    weight: peso,
    opacity: 0.92,
    lineJoin: "round",
    lineCap: "round"
  };

  if (opciones.rutaEsquivada) {
    estilo.dashArray = "14 8";
  }

  return L.polyline(puntos, estilo);
}

/**
 * Pinta la ruta recorriendo routes[0].sections (TRAFFIC) con color según delayInSeconds.
 */
function pintarRutaPorCarretera(mapa, data, opciones = {}) {
  limpiarRutaTomTom(mapa);

  const ruta = data.routes[0];
  const puntosGlobales = puntosCarreteraDesdeDatos(data);

  if (puntosGlobales.length < 2) {
    return null;
  }

  const secciones = (ruta.sections || [])
    .filter((s) => s.sectionType === "TRAFFIC")
    .sort((a, b) => (a.startPointIndex ?? 0) - (b.startPointIndex ?? 0));

  miRutaGrupo = L.layerGroup();

  if (opciones.rutaEsquivada) {
    miRutaGrupo.addLayer(
      L.polyline(puntosGlobales, {
        color: COLOR_RUTA_ESQUIVADA_BORDE,
        weight: 10,
        opacity: 0.4,
        lineJoin: "round",
        lineCap: "round"
      })
    );
  }

  miRutaGrupo.addTo(mapa);

  const anadirTramo = (puntos, color) => {
    const linea = crearPolilineaTramo(mapa, puntos, color, opciones);
    if (linea) {
      miRutaGrupo.addLayer(linea);
    }
  };

  if (secciones.length === 0) {
    anadirTramo(puntosGlobales, COLORES_TRAFICO.fluido);
    return miRutaGrupo;
  }

  let indiceActual = 0;

  secciones.forEach((seccion) => {
    const inicio = Math.max(0, seccion.startPointIndex ?? 0);
    const fin = Math.min(
      puntosGlobales.length - 1,
      seccion.endPointIndex ?? inicio
    );

    if (inicio > indiceActual) {
      const tramoLibre = puntosGlobales.slice(indiceActual, inicio + 1);
      anadirTramo(tramoLibre, COLORES_TRAFICO.fluido);
    }

    const puntosSeccion = puntosDesdeSeccion(seccion, puntosGlobales);
    const color = colorPorRetraso(seccion.delayInSeconds);

    if (puntosSeccion.length >= 2) {
      anadirTramo(puntosSeccion, color);
    }

    indiceActual = fin;
  });

  if (indiceActual < puntosGlobales.length - 1) {
    anadirTramo(puntosGlobales.slice(indiceActual), COLORES_TRAFICO.fluido);
  }

  return miRutaGrupo;
}

function dibujarRutaTomTomColoreada(mapa, data, opciones) {
  return pintarRutaPorCarretera(mapa, data, opciones);
}

function resumenTraficoRuta(rutaTomTom) {
  const secciones = (rutaTomTom.sections || []).filter(
    (s) => s.sectionType === "TRAFFIC"
  );
  let congestion = 0;
  let lento = 0;
  let fluido = 0;

  secciones.forEach((s) => {
    const color = colorPorRetraso(s.delayInSeconds);
    if (color === COLORES_TRAFICO.congestion) congestion += 1;
    else if (color === COLORES_TRAFICO.lento) lento += 1;
    else fluido += 1;
  });

  return { congestion, lento, fluido, total: secciones.length };
}
