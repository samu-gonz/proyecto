/**
 * Ruta TomTom: petición, resumen (summary) y pintado por secciones en el mapa.
 * La geometría sale de routes[0].sections (points o índices sobre legs[].points).
 * Nunca se dibuja entre waypoints/máquinas en línea recta.
 */

const COLORES_TRAFICO = {
  fluido: "#00E676",
  lento: "#FFD600",
  congestion: "#FF1744"
};

const COLOR_RUTA_ESQUIVADA_BORDE = "#ff00aa";

/** Polilíneas Leaflet activas; se vacía con limpiarCapasRutaDelMapa. */
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
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
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

/** Origen → paradas → regreso; routeType=fastest, travelMode=car. */
function construirUrlRutaTomTom(origen, paradas, apiKey) {
  const ubicaciones = [
    segmentoLatLon(origen),
    ...paradas.map((p) => segmentoLatLon(p)),
    segmentoLatLon(origen)
  ].join(":");

  const params = new URLSearchParams({
    key: apiKey,
    routeType: "fastest",
    travelMode: "car",
    traffic: "true",
    routeRepresentation: "polyline",
    sectionType: "traffic"
  });

  return `https://api.tomtom.com/routing/1/calculateRoute/${ubicaciones}/json?${params.toString()}`;
}

/** Polilínea de carretera unificada (solo legs[].points de TomTom). */
function polylineCarreteraDesdeRuta(data) {
  const legs = data?.routes?.[0]?.legs;
  if (!legs?.length) return [];

  const puntos = [];
  legs.forEach((leg) => {
    (leg.points || []).forEach((p) => {
      puntos.push([p.latitude, p.longitude]);
    });
  });
  return puntos;
}

/**
 * Puntos Leaflet de una sección: primero seccion.points; si no, recorte por índices
 * sobre la polilínea de carretera (nunca coordenadas de máquinas).
 */
function puntosLatLngDeSeccion(seccion, polylineCarretera) {
  if (seccion.points?.length) {
    return seccion.points.map((p) => [p.latitude, p.longitude]);
  }

  if (!polylineCarretera?.length) return [];

  const inicio = Math.max(0, seccion.startPointIndex ?? 0);
  const fin = Math.min(
    polylineCarretera.length - 1,
    seccion.endPointIndex ?? inicio
  );

  if (fin <= inicio) return [];
  return polylineCarretera.slice(inicio, fin + 1);
}

function colorPorRetraso(delayInSeconds) {
  const retraso = delayInSeconds ?? 0;
  if (retraso > 90) return COLORES_TRAFICO.congestion;
  if (retraso > 30) return COLORES_TRAFICO.lento;
  return COLORES_TRAFICO.fluido;
}

function colorDeSeccion(seccion) {
  if (seccion.sectionType === "TRAFFIC") {
    return colorPorRetraso(seccion.delayInSeconds);
  }
  return COLORES_TRAFICO.fluido;
}

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

/** Kilómetros y minutos solo desde routes[0].summary (asignación directa). */
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

function geometriaPintableEnRuta(data) {
  const ruta = data?.routes?.[0];
  if (!ruta) return false;

  const polyline = polylineCarreteraDesdeRuta(data);
  const secciones = ruta.sections || [];

  if (secciones.length > 0) {
    return secciones.some(
      (s) => puntosLatLngDeSeccion(s, polyline).length >= 2
    );
  }

  return polyline.length >= 2;
}

/**
 * Pinta routes[0].sections recorriendo seccion.points (o recorte por índices).
 */
function pintarRutaPorCarretera(mapa, data, opciones = {}) {
  if (!mapa || !data?.routes?.length) {
    return null;
  }

  limpiarCapasRutaDelMapa(mapa);

  const ruta = data.routes[0];
  const polyline = polylineCarreteraDesdeRuta(data);
  const secciones = [...(ruta.sections || [])].sort(
    (a, b) => (a.startPointIndex ?? 0) - (b.startPointIndex ?? 0)
  );

  const tramos = [];

  if (secciones.length > 0) {
    secciones.forEach((seccion) => {
      const puntos = puntosLatLngDeSeccion(seccion, polyline);
      if (puntos.length < 2) return;
      tramos.push({ puntos, color: colorDeSeccion(seccion) });
    });
  } else if (polyline.length >= 2) {
    tramos.push({ puntos: polyline, color: COLORES_TRAFICO.fluido });
  }

  if (tramos.length === 0) {
    return null;
  }

  if (opciones.rutaEsquivada) {
    const contorno = [];
    tramos.forEach((t) => {
      t.puntos.forEach((pt) => contorno.push(pt));
    });
    if (contorno.length >= 2) {
      const borde = L.polyline(contorno, {
        color: COLOR_RUTA_ESQUIVADA_BORDE,
        weight: 10,
        opacity: 0.35,
        lineJoin: "round",
        lineCap: "round"
      });
      borde.addTo(mapa);
      capasRutaActual.push(borde);
    }
  }

  tramos.forEach((t) => {
    anadirPolylineAlMapa(mapa, t.puntos, t.color, opciones);
  });

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

    if (!geometriaPintableEnRuta(data)) {
      alert(
        "TomTom no devolvió geometría de carretera en sections/legs. Prueba de nuevo."
      );
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
