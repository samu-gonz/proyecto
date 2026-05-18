/**
 * Ruta TomTom: validación de coordenadas, fetch seguro y pintado por secciones.
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
  if (!p) return null;
  const lon = p.lon ?? p.lng;
  return lon == null ? null : Number(lon);
}

function latDePunto(p) {
  if (!p) return null;
  return p.lat == null ? null : Number(p.lat);
}

/**
 * Comprueba lat/lon finitos y en rango WGS84 (TomTom: latitud,longitud).
 */
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

function pintarRutaPorCarretera(mapa, data, opciones = {}) {
  limpiarRutaTomTom(mapa);

  if (!data?.routes?.length) {
    return null;
  }

  const ruta = data.routes[0];
  const puntosGlobales = puntosCarreteraDesdeDatos(data);

  if (puntosGlobales.length < 2) {
    return null;
  }

  const secciones = (ruta.sections || []).sort(
    (a, b) => (a.startPointIndex ?? 0) - (b.startPointIndex ?? 0)
  );

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
    if (puntos.length < 2) return;
    miRutaGrupo.addLayer(
      L.polyline(puntos, {
        color,
        weight: opciones.rutaEsquivada ? 8 : 6,
        opacity: 0.9,
        lineJoin: "round",
        lineCap: "round",
        dashArray: opciones.rutaEsquivada ? "14 8" : undefined
      })
    );
  };

  const seccionesTrafico = secciones.filter((s) => s.sectionType === "TRAFFIC");

  if (seccionesTrafico.length === 0) {
    anadirTramo(puntosGlobales, COLORES_TRAFICO.fluido);
    return miRutaGrupo;
  }

  let indiceActual = 0;

  seccionesTrafico.forEach((seccion) => {
    const inicio = Math.max(0, seccion.startPointIndex ?? 0);
    const fin = Math.min(
      puntosGlobales.length - 1,
      seccion.endPointIndex ?? inicio
    );

    if (inicio > indiceActual) {
      anadirTramo(
        puntosGlobales.slice(indiceActual, inicio + 1),
        COLORES_TRAFICO.fluido
      );
    }

    const puntosCarretera = puntosDesdeSeccion(seccion, puntosGlobales);
    const colorTrafico = colorPorRetraso(seccion.delayInSeconds);

    if (puntosCarretera.length >= 2) {
      anadirTramo(puntosCarretera, colorTrafico);
    }

    indiceActual = fin;
  });

  if (indiceActual < puntosGlobales.length - 1) {
    anadirTramo(puntosGlobales.slice(indiceActual), COLORES_TRAFICO.fluido);
  }

  return miRutaGrupo;
}

/**
 * Petición segura a TomTom Routing (origen + paradas + regreso).
 * areasEvitar: array de rectángulos para POST avoidAreas.
 */
async function calcularRutaTomTom(
  mapa,
  origen,
  paradas,
  apiKey,
  areasEvitar = null,
  opcionesPintado = {}
) {
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

    if (!data.routes || data.routes.length === 0) {
      alert("TomTom no encontró ninguna carretera válida entre esos puntos.");
      return null;
    }

    const capa = mapa
      ? pintarRutaPorCarretera(mapa, data, opcionesPintado)
      : null;

    return { data, capa };
  } catch (error) {
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
