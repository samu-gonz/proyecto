/**
 * Enrutador TomTom: una petición, summary directo, pintado por secciones Traffic.
 */

const COLORES_TRAFICO = {
  fluido: "#00E676",
  lento: "#FFD600",
  congestion: "#FF1744"
};

const COLOR_RUTA_ESQUIVADA_BORDE = "#ff00aa";

/** Array global — app.js lo vacía con limpiarLineasRuta. */
var lineasRutaActual = [];

/** Marcadores Leaflet de incidencias (roadblocks) en la ruta actual. */
var marcadoresIncidencias = [];

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

function mismasCoordenadas(a, b, tolerancia = 0.00015) {
  const latA = latDePunto(a);
  const lonA = lonDePunto(a);
  const latB = latDePunto(b);
  const lonB = lonDePunto(b);
  if (!Number.isFinite(latA) || !Number.isFinite(lonA)) return false;
  if (!Number.isFinite(latB) || !Number.isFinite(lonB)) return false;
  return (
    Math.abs(latA - latB) <= tolerancia && Math.abs(lonA - lonB) <= tolerancia
  );
}

function deduplicarParadas(origen, paradas) {
  const unicas = [];
  const claves = new Set();

  (paradas || []).forEach((p) => {
    if (!coordenadasValidas(p)) return;
    if (mismasCoordenadas(origen, p)) return;

    const norm = normalizarPuntoRuta(p);
    const clave =
      norm.id != null
        ? `id:${norm.id}`
        : `${norm.lat.toFixed(5)},${norm.lon.toFixed(5)}`;
    if (claves.has(clave)) return;
    claves.add(clave);
    unicas.push(norm);
  });

  return unicas;
}

function validarOrigenYParadas(origen, paradas) {
  if (!coordenadasValidas(origen)) {
    return {
      ok: false,
      mensaje: "Origen sin coordenadas válidas (lat/lon). Confirma el GPS o elige una máquina."
    };
  }

  const origenNorm = normalizarPuntoRuta(origen);
  const paradasNorm = deduplicarParadas(origenNorm, paradas);

  if (paradasNorm.length === 0) {
    return {
      ok: false,
      mensaje: "No hay destinos con coordenadas válidas para calcular la ruta."
    };
  }

  return { ok: true, origen: origenNorm, paradas: paradasNorm };
}

function segmentoLatLon(punto) {
  return `${latDePunto(punto)},${lonDePunto(punto)}`;
}

/**
 * Origen → paradas (sin vuelta al origen).
 * URL en texto plano (sin URLSearchParams).
 * sectionType=traffic en la petición (Traffic con T mayúscula devuelve 400).
 * La respuesta puede traer sectionType "TRAFFIC" en cada sección.
 */
function construirUrlRutaTomTom(origen, paradas, apiKey) {
  const tramos = [segmentoLatLon(origen)];
  paradas.forEach((p) => tramos.push(segmentoLatLon(p)));
  const ubicaciones = tramos.join(":");

  return `https://api.tomtom.com/routing/1/calculateRoute/${ubicaciones}/json?key=${apiKey}&routeType=fastest&travelMode=car&traffic=true&departAt=now&routeRepresentation=polyline&sectionType=traffic`;
}

function polylineCarreteraDesdeRuta(data) {
  const ruta = data?.routes?.[0];
  if (!ruta) return [];

  if (ruta.points?.length) {
    return ruta.points.map((p) => [p.latitude, p.longitude]);
  }

  const legs = ruta.legs;
  if (!legs?.length) return [];

  const puntos = [];
  legs.forEach((leg) => {
    (leg.points || []).forEach((p) => {
      puntos.push([p.latitude, p.longitude]);
    });
  });
  return puntos;
}

function esSeccionTrafico(seccion) {
  const tipo = (seccion.sectionType || "TRAFFIC").toUpperCase();
  return tipo === "TRAFFIC";
}

function puntosCarreteraDeSeccion(seccion, polylineCarretera) {
  if (seccion.points?.length) {
    return seccion.points.map((p) => [p.latitude, p.longitude]);
  }

  if (!polylineCarretera?.length) return [];

  let inicio = Math.max(0, seccion.startPointIndex ?? 0);
  let fin = Math.min(
    polylineCarretera.length - 1,
    seccion.endPointIndex ?? inicio
  );

  if (fin < inicio) return [];
  if (fin === inicio && fin < polylineCarretera.length - 1) {
    fin += 1;
  }

  const tramo = polylineCarretera.slice(inicio, fin + 1);
  return tramo.length >= 2 ? tramo : [];
}

function colorTraficoDeSeccion(seccion) {
  const retraso = Number(seccion.delayInSeconds) || 0;
  if (retraso > 90) return COLORES_TRAFICO.congestion;
  if (retraso > 30) return COLORES_TRAFICO.lento;
  return COLORES_TRAFICO.fluido;
}

function limpiarLineasRuta(mapa) {
  if (mapa) {
    lineasRutaActual.forEach((linea) => {
      if (linea && mapa.hasLayer(linea)) {
        mapa.removeLayer(linea);
      }
    });
  }
  lineasRutaActual = [];

  limpiarMarcadoresIncidencias(mapa);
}

function limpiarRutaTomTom(mapa) {
  limpiarLineasRuta(mapa);
}

function resetearEtiquetasResumen() {
  sincronizarEtiquetasResumen("0.0", 0);
}

/** Escritura directa en DOM desde summary (sin acumular). */
function sincronizarEtiquetasResumen(kilometros, minutosConduccion) {
  const elKm = document.getElementById("distancia-total");
  const elMin = document.getElementById("tiempo-conduccion");
  const panel = document.getElementById("ruta-stats-flotante");

  const kmTexto = `${kilometros} km`;
  const minTexto = `${minutosConduccion} min`;

  if (elKm) elKm.textContent = kmTexto;
  if (elMin) elMin.textContent = minTexto;

  if (panel) {
    const kmNum = parseFloat(String(kilometros)) || 0;
    if (kmNum <= 0) {
      panel.hidden = true;
    } else {
      panel.textContent = `Distancia: ${kmTexto} | Tiempo: ${minTexto}`;
      panel.hidden = false;
    }
  }
}

/** Lee routes[0].summary una sola vez. */
function resumenDesdeSummary(data) {
  const summary = data?.routes?.[0]?.summary;
  if (!summary) return null;

  const lengthInMeters = Number(summary.lengthInMeters) || 0;
  const travelTimeInSeconds = Number(summary.travelTimeInSeconds) || 0;
  const kilometros = (lengthInMeters / 1000).toFixed(1);
  const minutosConduccion = Math.round(travelTimeInSeconds / 60);

  return {
    kilometros,
    minutosConduccion,
    lengthInMeters,
    travelTimeInSeconds
  };
}

function aplicarSummaryAlPanel(data) {
  const resumen = resumenDesdeSummary(data);
  if (!resumen) return null;
  sincronizarEtiquetasResumen(resumen.kilometros, resumen.minutosConduccion);
  return resumen;
}

function capaAgrupadaParaBounds() {
  if (lineasRutaActual.length === 0) return null;
  return L.featureGroup(lineasRutaActual);
}

function pintarPolylineEnMapa(mapa, puntos, color, opciones = {}) {
  const linea = L.polyline(puntos, {
    color,
    weight: opciones.rutaEsquivada ? 8 : 6,
    opacity: 0.9,
    lineJoin: "round",
    lineCap: "round",
    dashArray: opciones.rutaEsquivada ? "14 8" : undefined
  }).addTo(mapa);
  lineasRutaActual.push(linea);
  return linea;
}

/**
 * Recorre routes[0].sections; colores por delayInSeconds.
 * Fallback: polilínea completa en verde.
 */
function pintarSeccionesEnMapa(mapa, data, opciones = {}) {
  const ruta = data.routes[0];
  const polyline = polylineCarreteraDesdeRuta(data);

  if (polyline.length < 2) {
    console.warn("TomTom: sin puntos en legs[].points ni routes[0].points");
    return null;
  }

  const secciones = [...(ruta.sections || [])]
    .filter((s) => esSeccionTrafico(s))
    .sort((a, b) => (a.startPointIndex ?? 0) - (b.startPointIndex ?? 0));

  if (opciones.rutaEsquivada && secciones.length > 0) {
    const contorno = [];
    secciones.forEach((seccion) => {
      puntosCarreteraDeSeccion(seccion, polyline).forEach((pt) => contorno.push(pt));
    });
    if (contorno.length < 2 && polyline.length >= 2) {
      polyline.forEach((pt) => contorno.push(pt));
    }
    if (contorno.length >= 2) {
      const borde = L.polyline(contorno, {
        color: COLOR_RUTA_ESQUIVADA_BORDE,
        weight: 10,
        opacity: 0.35,
        lineJoin: "round",
        lineCap: "round"
      }).addTo(mapa);
      lineasRutaActual.push(borde);
    }
  }

  let dibujadas = 0;

  secciones.forEach((seccion) => {
    const puntosCarretera = puntosCarreteraDeSeccion(seccion, polyline);
    if (puntosCarretera.length < 2) return;

    const colorTrafico = colorTraficoDeSeccion(seccion);
    pintarPolylineEnMapa(mapa, puntosCarretera, colorTrafico, opciones);
    dibujadas += 1;
  });

  if (dibujadas === 0) {
    pintarPolylineEnMapa(mapa, polyline, COLORES_TRAFICO.fluido, opciones);
    dibujadas = 1;
  }

  return dibujadas > 0 ? capaAgrupadaParaBounds() : null;
}

function pintadoObsoleto(seqToken) {
  return (
    seqToken != null &&
    typeof window !== "undefined" &&
    window.__rutaSeqActiva != null &&
    seqToken !== window.__rutaSeqActiva
  );
}

async function calcularRutaTomTom(
  mapa,
  origen,
  paradas,
  apiKey,
  areasEvitar = null,
  opcionesPintado = {},
  seqToken = null
) {
  limpiarLineasRuta(mapa);
  resetearEtiquetasResumen();

  const validacion = validarOrigenYParadas(origen, paradas);
  if (!validacion.ok) {
    console.error(validacion.mensaje);
    if (typeof alert === "function") alert(validacion.mensaje);
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
    const response = await fetch(url, fetchOpciones);
    const data = await response.json();

    if (!response.ok) {
      console.error("TomTom Routing error:", response.status, data);
      throw new Error(
        data?.detailedError?.message || `TomTom respondió ${response.status}`
      );
    }

    if (!data.routes?.length) {
      alert("TomTom no encontró ninguna carretera válida entre esos puntos.");
      return null;
    }

    const resumenViaje = aplicarSummaryAlPanel(data);
    if (!resumenViaje) {
      alert("TomTom no devolvió resumen de ruta.");
      return null;
    }

    if (pintadoObsoleto(seqToken)) {
      return null;
    }

    const capa = mapa ? pintarSeccionesEnMapa(mapa, data, opcionesPintado) : null;

    if (pintadoObsoleto(seqToken)) {
      return null;
    }

    if (!capa) {
      limpiarLineasRuta(mapa);
      resetearEtiquetasResumen();
      console.error("TomTom: sin geometría pintable.", data);
      alert("TomTom no devolvió geometría de carretera. Revisa la consola (F12).");
      return null;
    }

    if (mapa) {
      pintarIncidenciasDeRuta(mapa, data, apiKey).catch((errInc) => {
        console.warn("Incidencias de ruta:", errInc);
      });
    }

    return { data, capa, resumenViaje };
  } catch (error) {
    limpiarLineasRuta(mapa);
    resetearEtiquetasResumen();
    console.error("Error en la llamada de enrutamiento:", error);
    throw error;
  }
}

function extraerResumenRutaTomTom(data) {
  return resumenDesdeSummary(data);
}

function resumenTraficoRuta(rutaTomTom) {
  const secciones = (rutaTomTom.sections || []).filter((s) => esSeccionTrafico(s));
  let congestion = 0;
  let lento = 0;
  let fluido = 0;

  secciones.forEach((s) => {
    const color = colorTraficoDeSeccion(s);
    if (color === COLORES_TRAFICO.congestion) congestion += 1;
    else if (color === COLORES_TRAFICO.lento) lento += 1;
    else fluido += 1;
  });

  return { congestion, lento, fluido, total: secciones.length };
}

const COLOR_INCIDENCIA_ROADBLOCK = "#FF1744";

const ETIQUETAS_ICONO_INCIDENCIA = {
  1: "Accidente",
  6: "Tráfico denso",
  7: "Carril cerrado",
  8: "Carretera cortada",
  9: "Obras"
};

/**
 * Acuña el viaje: summary si trae esquinas; si no, geometría de la ruta (legs/points).
 */
function bboxDesdeDatosRuta(data, margenGrados = 0.03) {
  const summary = data?.routes?.[0]?.summary;
  const sw =
    summary?.southWestCorner ||
    summary?.boundingBox?.southWestCorner ||
    summary?.bbox?.southWest;
  const ne =
    summary?.northEastCorner ||
    summary?.boundingBox?.northEastCorner ||
    summary?.bbox?.northEast;

  if (sw && ne) {
    const minLat = Number(sw.latitude ?? sw.lat);
    const minLon = Number(sw.longitude ?? sw.lon ?? sw.lng);
    const maxLat = Number(ne.latitude ?? ne.lat);
    const maxLon = Number(ne.longitude ?? ne.lon ?? ne.lng);
    if (
      [minLat, minLon, maxLat, maxLon].every((n) => Number.isFinite(n))
    ) {
      return {
        minLat: minLat - margenGrados,
        minLon: minLon - margenGrados,
        maxLat: maxLat + margenGrados,
        maxLon: maxLon + margenGrados
      };
    }
  }

  const puntos = polylineCarreteraDesdeRuta(data);
  if (puntos.length < 2) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  puntos.forEach(([lat, lon]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  });

  return {
    minLat: minLat - margenGrados,
    minLon: minLon - margenGrados,
    maxLat: maxLat + margenGrados,
    maxLon: maxLon + margenGrados
  };
}

function construirUrlIncidentesTomTom(bbox, apiKey) {
  const { minLat, minLon, maxLat, maxLon } = bbox;
  return `https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${minLat},${minLon},${maxLat},${maxLon}/11/-1/json?key=${apiKey}&trafficModelId=-1&language=es-ES`;
}

function etiquetaIncidenciaPoi(poi) {
  const ic = Number(poi?.ic);
  if (ETIQUETAS_ICONO_INCIDENCIA[ic]) return ETIQUETAS_ICONO_INCIDENCIA[ic];

  const texto =
    poi?.d ||
    poi?.description ||
    poi?.desc ||
    poi?.c ||
    poi?.ty ||
    poi?.type;
  if (texto && String(texto).trim()) return String(texto).trim();

  return "Incidencia de tráfico";
}

function esRoadblockPoi(poi) {
  const ic = Number(poi?.ic);
  if ([1, 6, 7, 8, 9].includes(ic)) return true;

  const ty = String(poi?.ty || poi?.type || "").toUpperCase();
  return /CLOSURE|WORK|ACCIDENT|JAM|BLOCK|OBST/.test(ty);
}

function latLonDesdePoi(poi) {
  if (poi?.p) {
    const lon = Number(poi.p.x ?? poi.p.lon ?? poi.p.longitude);
    const lat = Number(poi.p.y ?? poi.p.lat ?? poi.p.latitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
  }

  if (poi?.location) {
    const lat = Number(poi.location.latitude ?? poi.location.lat);
    const lon = Number(poi.location.longitude ?? poi.location.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
  }

  const lat = Number(poi.lat ?? poi.latitude);
  const lon = Number(poi.lon ?? poi.lng ?? poi.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }

  return null;
}

function listaPoiDesdeRespuestaIncidencias(json) {
  const raiz = json?.tm ?? json;
  if (!raiz) return [];

  if (Array.isArray(raiz.poi)) return raiz.poi;
  if (Array.isArray(raiz.POI)) return raiz.POI;

  return [];
}

function limpiarMarcadoresIncidencias(mapa) {
  if (mapa) {
    marcadoresIncidencias.forEach((marcador) => {
      if (marcador && mapa.hasLayer(marcador)) {
        mapa.removeLayer(marcador);
      }
    });
  }
  marcadoresIncidencias = [];
}

function crearMarcadorIncidencia(lat, lon, textoPopup) {
  return L.circleMarker([lat, lon], {
    radius: 10,
    color: "#ffffff",
    weight: 2,
    fillColor: COLOR_INCIDENCIA_ROADBLOCK,
    fillOpacity: 0.95
  }).bindPopup(`<strong>${textoPopup}</strong>`);
}

/**
 * Roadblocks TomTom: bbox del viaje → Incident Details v4 → marcadores rojos en Leaflet.
 */
async function pintarIncidenciasDeRuta(mapa, data, apiKey = "") {
  if (!mapa || !data?.routes?.length) {
    return { total: 0, marcadores: [] };
  }

  const chkIncidencias = document.getElementById("chk-trafico-incidencias");
  if (chkIncidencias && !chkIncidencias.checked) {
    limpiarMarcadoresIncidencias(mapa);
    return { total: 0, marcadores: [], ocultas: true };
  }

  limpiarMarcadoresIncidencias(mapa);

  const clave = apiKey?.trim() || "";
  if (!clave) {
    console.warn("Incidencias: falta clave API TomTom");
    return { total: 0, marcadores: [] };
  }

  const bbox = bboxDesdeDatosRuta(data);
  if (!bbox) {
    console.warn("Incidencias: no se pudo calcular el bbox de la ruta");
    return { total: 0, marcadores: [] };
  }

  const url = construirUrlIncidentesTomTom(bbox, clave);

  try {
    const response = await fetch(url);
    const json = await response.json();

    if (!response.ok) {
      console.error("TomTom Incident Details:", response.status, json);
      return { total: 0, marcadores: [] };
    }

    const pois = listaPoiDesdeRespuestaIncidencias(json);
    const vistos = new Set();

    pois.forEach((poi, indice) => {
      if (!esRoadblockPoi(poi)) return;

      const coords = latLonDesdePoi(poi);
      if (!coords) return;

      const claveMarcador = `${coords.lat.toFixed(5)},${coords.lon.toFixed(5)}`;
      if (vistos.has(claveMarcador)) return;
      vistos.add(claveMarcador);

      const titulo = etiquetaIncidenciaPoi(poi);
      const marcador = crearMarcadorIncidencia(
        coords.lat,
        coords.lon,
        titulo
      );
      marcador.addTo(mapa);
      marcador.incidenciaDatos = {
        id: poi.id || `inc-${indice}`,
        lat: coords.lat,
        lon: coords.lon,
        descripcion: titulo,
        tipo: titulo,
        poi
      };
      marcadoresIncidencias.push(marcador);
    });

    return { total: marcadoresIncidencias.length, marcadores: marcadoresIncidencias };
  } catch (error) {
    console.error("Error al obtener incidencias TomTom:", error);
    return { total: 0, marcadores: [] };
  }
}

if (typeof window !== "undefined") {
  window.calcularRutaTomTom = calcularRutaTomTom;
  window.limpiarLineasRuta = limpiarLineasRuta;
  window.limpiarRutaTomTom = limpiarRutaTomTom;
  window.limpiarMarcadoresIncidencias = limpiarMarcadoresIncidencias;
  window.pintarIncidenciasDeRuta = pintarIncidenciasDeRuta;
}
