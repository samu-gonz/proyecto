/**
 * Ruta TomTom: petición, resumen (summary) y pintado por secciones en el mapa.
 */

const COLORES_TRAFICO = {
  fluido: "#00E676",
  lento: "#FFD600",
  congestion: "#FF1744"
};

const COLOR_RUTA_ESQUIVADA_BORDE = "#ff00aa";

/** Todas las polilíneas dibujadas en el mapa (se eliminan una a una al recalcular). */
let capasRutaActual = [];

function lonDePunto(p) {
  if (!p) return null;
  const lon = p.lon ?? p.lng;
  return lon == null ? null : Number(lon);
}

function latDePunto(p) {
  if (!p) return null;
  return p.lat == null ? null : Number(p.lat);
}

function coordenadasValidas(punto) {
  const lat = latDePunto(punto);
  const lon = lonDePunto(punto);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return false;
  }
  return true;
}

function normalizarPuntoRuta(punto) {
  const lat = latDePunto(punto);
  const lon = lonDePunto(punto);
  return {
    ...punto,
    lat,
    lon,
    lng: lon,
    nombre: punto?.nombre ?? "Punto"
  };
}

function validarOrigenYParadas(origen, paradas) {
  if (!coordenadasValidas(origen)) {
    console.error("Coordenadas no válidas — origen:", origen);
    return {
      ok: false,
      mensaje: "Origen sin coordenadas válidas (lat/lon). Confirma el GPS o elige una máquina."
    };
  }

  const origenNorm = normalizarPuntoRuta(origen);
  const paradasNorm = [];

  (paradas || []).forEach((p, i) => {
    if (!coordenadasValidas(p)) {
      console.error(`Coordenadas no válidas — parada ${i}:`, p);
      return;
    }
    paradasNorm.push(normalizarPuntoRuta(p));
  });

  if (paradasNorm.length === 0) {
    return {
      ok: false,
      mensaje: "No hay destinos con coordenadas válidas para calcular la ruta."
    };
  }

  return { ok: true, origen: origenNorm, paradas: paradasNorm };
}

function segmentoLatLon(punto) {
  const lat = latDePunto(punto);
  const lon = lonDePunto(punto);
  return `${lat},${lon}`;
}

/** URL estable: coche, tráfico, sin parámetros que provoquen 400. */
function construirUrlRutaTomTom(origen, paradas, apiKey) {
  const ubicaciones = [
    segmentoLatLon(origen),
    ...paradas.map((p) => segmentoLatLon(p)),
    segmentoLatLon(origen)
  ].join(":");

  const params = new URLSearchParams({
    key: apiKey,
    routeType: "fastest",
    traffic: "true",
    travelMode: "car",
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

  const puntos = [];
  legs.forEach((leg) => {
    const tramo = puntosCarreteraDesdeLeg(leg);
    if (tramo.length > 0) {
      puntos.push(...tramo);
    }
  });
  return puntos;
}

function colorPorRetraso(delayInSeconds) {
  const retraso = delayInSeconds ?? 0;
  if (retraso > 90) return COLORES_TRAFICO.congestion;
  if (retraso > 30) return COLORES_TRAFICO.lento;
  return COLORES_TRAFICO.fluido;
}

/**
 * Elimina del mapa cada polilínea registrada y vacía el array.
 */
function limpiarCapasRutaDelMapa(mapa) {
  if (mapa) {
    capasRutaActual.forEach((linea) => {
      if (linea && mapa.hasLayer(linea)) {
        mapa.removeLayer(linea);
      }
    });
  }
  capasRutaActual = [];

  if (typeof limpiarMarcadoresIncidencias === "function" && mapa) {
    limpiarMarcadoresIncidencias(mapa);
  }
}

function limpiarRutaTomTom(mapa) {
  limpiarCapasRutaDelMapa(mapa);
}

function puntosLatLngDesdeSeccion(seccion, puntosGlobales) {
  if (seccion.points?.length) {
    return seccion.points.map((p) => [p.latitude, p.longitude]);
  }

  if (!puntosGlobales?.length) return [];

  const inicio = Math.max(0, seccion.startPointIndex ?? 0);
  const fin = Math.min(
    puntosGlobales.length - 1,
    seccion.endPointIndex ?? inicio
  );

  if (fin < inicio) return [];
  return puntosGlobales.slice(inicio, fin + 1);
}

function anadirPolylineAlMapa(mapa, puntos, color, opciones = {}) {
  if (!mapa || !puntos || puntos.length < 2) return null;

  const linea = L.polyline(puntos, {
    color,
    weight: opciones.rutaEsquivada ? 8 : 6,
    opacity: 0.9,
    lineJoin: "round",
    lineCap: "round",
    dashArray: opciones.rutaEsquivada ? "14 8" : undefined
  });

  linea.addTo(mapa);
  capasRutaActual.push(linea);
  return linea;
}

/**
 * Kilómetros y minutos SOLO desde routes[0].summary (asignación directa, sin +=).
 */
function extraerResumenRutaTomTom(data) {
  const summary = data?.routes?.[0]?.summary;
  if (!summary) return null;

  const lengthInMeters = Number(summary.lengthInMeters) || 0;
  const travelTimeInSeconds = Number(summary.travelTimeInSeconds) || 0;
  const kilometros = (lengthInMeters / 1000).toFixed(1);
  const minutosConduccion = Math.round(travelTimeInSeconds / 60);

  return {
    distanciaKm: parseFloat(kilometros),
    minutosConduccion,
    kilometros,
    lengthInMeters,
    travelTimeInSeconds
  };
}

function capaAgrupadaParaBounds() {
  if (capasRutaActual.length === 0) return null;
  return L.featureGroup(capasRutaActual);
}

/**
 * Pinta cada sección TRAFFIC como polilínea independiente en capasRutaActual.
 */
function pintarRutaPorCarretera(mapa, data, opciones = {}) {
  if (!mapa || !data?.routes?.length) {
    return null;
  }

  limpiarCapasRutaDelMapa(mapa);

  const ruta = data.routes[0];
  const puntosGlobales = puntosCarreteraDesdeDatos(data);

  if (puntosGlobales.length < 2) {
    return null;
  }

  if (opciones.rutaEsquivada) {
    const borde = L.polyline(puntosGlobales, {
      color: COLOR_RUTA_ESQUIVADA_BORDE,
      weight: 10,
      opacity: 0.35,
      lineJoin: "round",
      lineCap: "round"
    });
    borde.addTo(mapa);
    capasRutaActual.push(borde);
  }

  const seccionesTrafico = (ruta.sections || [])
    .filter((s) => s.sectionType === "TRAFFIC")
    .sort((a, b) => (a.startPointIndex ?? 0) - (b.startPointIndex ?? 0));

  if (seccionesTrafico.length === 0) {
    anadirPolylineAlMapa(mapa, puntosGlobales, COLORES_TRAFICO.fluido, opciones);
  } else {
    seccionesTrafico.forEach((seccion) => {
      const puntos = puntosLatLngDesdeSeccion(seccion, puntosGlobales);
      if (puntos.length < 2) return;
      const color = colorPorRetraso(seccion.delayInSeconds);
      anadirPolylineAlMapa(mapa, puntos, color, opciones);
    });

    if (capasRutaActual.length === 0) {
      anadirPolylineAlMapa(mapa, puntosGlobales, COLORES_TRAFICO.fluido, opciones);
    }
  }

  return capaAgrupadaParaBounds();
}

async function calcularRutaTomTom(
  mapa,
  origen,
  paradas,
  apiKey,
  areasEvitar = null,
  opcionesPintado = {}
) {
  if (mapa) {
    limpiarCapasRutaDelMapa(mapa);
  }

  const validacion = validarOrigenYParadas(origen, paradas);
  if (!validacion.ok) {
    console.error(validacion.mensaje);
    if (typeof alert === "function") {
      alert(validacion.mensaje);
    }
    return null;
  }

  if (!apiKey?.trim()) {
    console.error("Falta clave API de TomTom");
    return null;
  }

  const { origen: origenOk, paradas: paradasOk } = validacion;
  const url = construirUrlRutaTomTom(origenOk, paradasOk, apiKey);
  const fetchOpciones = { method: "GET" };

  const areas = Array.isArray(areasEvitar) ? areasEvitar : [];
  if (areas.length > 0) {
    fetchOpciones.method = "POST";
    fetchOpciones.headers = { "Content-Type": "application/json" };
    fetchOpciones.body = JSON.stringify({
      avoidAreas: { rectangles: areas }
    });
  }

  try {
    const res = await fetch(url, fetchOpciones);
    const data = await res.json();

    if (!res.ok) {
      console.error("TomTom Routing error:", res.status, data);
      throw new Error(
        data?.detailedError?.message || `TomTom respondió ${res.status}`
      );
    }

    if (!data.routes?.length) {
      alert("TomTom no encontró ninguna carretera válida entre esos puntos.");
      return null;
    }

    const resumenViaje = extraerResumenRutaTomTom(data);
    const capa = mapa ? pintarRutaPorCarretera(mapa, data, opcionesPintado) : null;

    if (mapa && typeof pintarIncidenciasDeRuta === "function") {
      pintarIncidenciasDeRuta(mapa, data, apiKey).catch((errInc) => {
        console.warn("Incidencias de ruta:", errInc);
      });
    }

    return { data, capa, resumenViaje };
  } catch (error) {
    if (mapa) {
      limpiarCapasRutaDelMapa(mapa);
    }
    console.error("Error en la conexión con TomTom:", error);
    throw error;
  }
}

async function obtenerRutaTomTom(origen, paradas, apiKey, areasEvitar = []) {
  const validacion = validarOrigenYParadas(origen, paradas);
  if (!validacion.ok) {
    throw new Error(validacion.mensaje);
  }

  const url = construirUrlRutaTomTom(
    validacion.origen,
    validacion.paradas,
    apiKey
  );
  const fetchOpciones = { method: "GET" };

  if (areasEvitar.length > 0) {
    fetchOpciones.method = "POST";
    fetchOpciones.headers = { "Content-Type": "application/json" };
    fetchOpciones.body = JSON.stringify({
      avoidAreas: { rectangles: areasEvitar }
    });
  }

  const resp = await fetch(url, fetchOpciones);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(
      data?.detailedError?.message || `TomTom Routing ${resp.status}`
    );
  }

  if (!data.routes?.length) {
    throw new Error("TomTom no encontró ninguna carretera válida.");
  }

  if (puntosCarreteraDesdeDatos(data).length < 2) {
    throw new Error("TomTom no devolvió geometría en legs[].points.");
  }

  return data;
}

function pintarRutaPorCarreteraDesdeDatos(mapa, data, opciones) {
  return pintarRutaPorCarretera(mapa, data, opciones);
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
