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

/** Bloqueos activos detectados en el último cálculo (se vacía al limpiar el mapa). */
var roadblocksActivos = [];

const UMBRAL_INTERCEPCION_RUTA_METROS = 150;
const RETRASO_CRITICO_SEGUNDOS = 300;
const RADIO_EVITAR_METROS = 280;
const MAX_AREAS_EVITAR = 10;

/** Iconos TomTom: 8=corte, 9=obras, 7=carril, 1=accidente. */
const ICONOS_BLOQUEO_GRAVE = new Set([1, 7, 8, 9]);

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
  limpiarRoadblocksActivos();
}

function limpiarRoadblocksActivos() {
  roadblocksActivos = [];
}

function limpiarRutaTomTom(mapa) {
  limpiarLineasRuta(mapa);
}

function resetearEtiquetasResumen() {
  sincronizarEtiquetasResumen("0.0", 0, 0);
}

/**
 * Cabecera y panel flotante: tiempo total = conducción TomTom + servicio en paradas.
 */
function sincronizarEtiquetasResumen(
  kilometros,
  minutosConduccion,
  minutosServicio = 0
) {
  const elKm = document.getElementById("distancia-total");
  const elMin = document.getElementById("tiempo-conduccion");
  const panel = document.getElementById("ruta-stats-flotante");

  const conduccion = Math.max(0, Math.round(Number(minutosConduccion) || 0));
  const servicio = Math.max(0, Math.round(Number(minutosServicio) || 0));
  const total = conduccion + servicio;

  const kmTexto = `${kilometros} km`;
  const minTexto = `${total} min`;

  if (elKm) elKm.textContent = kmTexto;
  if (elMin) elMin.textContent = minTexto;

  if (panel) {
    const kmNum = parseFloat(String(kilometros)) || 0;
    if (kmNum <= 0 || total <= 0) {
      panel.hidden = true;
    } else {
      panel.textContent = `Distancia: ${kmTexto} | Total: ${minTexto}`;
      panel.hidden = false;
    }
  }
}

/** km/h medios a partir del summary de TomTom. */
function velocidadMediaDesdeSummary(lengthInMeters, travelTimeInSeconds) {
  if (!travelTimeInSeconds || travelTimeInSeconds <= 0) return 0;
  const km = lengthInMeters / 1000;
  return km / (travelTimeInSeconds / 3600);
}

/**
 * Tiempos de conducción en isla: si TomTom devuelve media muy baja (p. ej. origen en montaña
 * sin acceso vial directo), se usa una estimación prudente ~45 km/h sobre los km de la ruta.
 */
function minutosConduccionDesdeSummary(summary) {
  const lengthInMeters = Number(summary.lengthInMeters) || 0;
  const travelTimeInSeconds = Number(summary.travelTimeInSeconds) || 0;
  const km = lengthInMeters / 1000;
  const minutosTomTom = Math.round(travelTimeInSeconds / 60);
  const velMedia = velocidadMediaDesdeSummary(lengthInMeters, travelTimeInSeconds);

  const VELOCIDAD_MEDIA_MIN_KMH = 32;
  const VELOCIDAD_PRUDENTE_ISLA_KMH = 45;
  const KM_MINIMOS_PARA_REVISAR = 12;

  if (
    km >= KM_MINIMOS_PARA_REVISAR &&
    velMedia > 0 &&
    velMedia < VELOCIDAD_MEDIA_MIN_KMH
  ) {
    const minutosCorregidos = Math.max(
      Math.round((km / VELOCIDAD_PRUDENTE_ISLA_KMH) * 60),
      Math.round(km * 1.1)
    );
    return {
      minutosConduccion: minutosCorregidos,
      minutosTomTom,
      tiempoAjustado: true,
      velocidadMediaKmH: Math.round(velMedia),
      motivoAjuste:
        "TomTom calculó un trazado muy lento (carreteras de montaña o acceso poco habitual). " +
        "Se muestra una estimación prudente para la isla."
    };
  }

  return {
    minutosConduccion: minutosTomTom,
    minutosTomTom,
    tiempoAjustado: false,
    velocidadMediaKmH: Math.round(velMedia),
    motivoAjuste: null
  };
}

/** Lee routes[0].summary una sola vez. */
function resumenDesdeSummary(data) {
  const summary = data?.routes?.[0]?.summary;
  if (!summary) return null;

  const lengthInMeters = Number(summary.lengthInMeters) || 0;
  const travelTimeInSeconds = Number(summary.travelTimeInSeconds) || 0;
  const kilometros = (lengthInMeters / 1000).toFixed(1);
  const tiempos = minutosConduccionDesdeSummary(summary);

  return {
    kilometros,
    minutosConduccion: tiempos.minutosConduccion,
    minutosTomTom: tiempos.minutosTomTom,
    tiempoAjustado: tiempos.tiempoAjustado,
    motivoAjuste: tiempos.motivoAjuste,
    velocidadMediaKmH: tiempos.velocidadMediaKmH,
    lengthInMeters,
    travelTimeInSeconds
  };
}

/** Solo lee summary; las etiquetas las actualiza app.js con servicio en paradas. */
function aplicarSummaryAlPanel(data) {
  return resumenDesdeSummary(data);
}

function capaAgrupadaParaBounds() {
  if (lineasRutaActual.length === 0) return null;
  return L.featureGroup(lineasRutaActual);
}

/** Si el bounds pintado cubre muy poco de la polilínea, los índices de sección fallaron. */
function geometriaPintadaCubreRuta(polyline, capas) {
  if (!polyline?.length || polyline.length < 2 || !capas?.length) return false;

  const bRuta = L.latLngBounds(polyline);
  const bPint = L.featureGroup(capas).getBounds();
  if (!bRuta.isValid() || !bPint.isValid()) return false;

  const spanRutaLat = bRuta.getNorth() - bRuta.getSouth();
  const spanRutaLng = bRuta.getEast() - bRuta.getWest();
  const spanPintLat = bPint.getNorth() - bPint.getSouth();
  const spanPintLng = bPint.getEast() - bPint.getWest();

  const ratioLat = spanRutaLat > 1e-6 ? spanPintLat / spanRutaLat : 1;
  const ratioLng = spanRutaLng > 1e-6 ? spanPintLng / spanRutaLng : 1;
  return Math.min(ratioLat, ratioLng) >= 0.2;
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

  const indiceInicioCapas = lineasRutaActual.length;
  let dibujadas = 0;

  secciones.forEach((seccion) => {
    const puntosCarretera = puntosCarreteraDeSeccion(seccion, polyline);
    if (puntosCarretera.length < 2) return;

    const colorTrafico = colorTraficoDeSeccion(seccion);
    pintarPolylineEnMapa(mapa, puntosCarretera, colorTrafico, opciones);
    dibujadas += 1;
  });

  const capasNuevas = lineasRutaActual.slice(indiceInicioCapas);

  if (
    dibujadas === 0 ||
    !geometriaPintadaCubreRuta(polyline, capasNuevas)
  ) {
    capasNuevas.forEach((linea) => {
      if (mapa.hasLayer(linea)) mapa.removeLayer(linea);
    });
    lineasRutaActual = lineasRutaActual.slice(0, indiceInicioCapas);
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

function distanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanciaPuntoASegmentoMetros(pLat, pLon, aLat, aLon, bLat, bLon) {
  const abLat = bLat - aLat;
  const abLon = bLon - aLon;
  if (Math.abs(abLat) < 1e-9 && Math.abs(abLon) < 1e-9) {
    return distanciaMetros(pLat, pLon, aLat, aLon);
  }
  const t = Math.max(
    0,
    Math.min(
      1,
      ((pLat - aLat) * abLat + (pLon - aLon) * abLon) /
        (abLat * abLat + abLon * abLon)
    )
  );
  return distanciaMetros(pLat, pLon, aLat + t * abLat, aLon + t * abLon);
}

function distanciaPuntoAPolylineMetros(lat, lon, polyline) {
  if (!polyline || polyline.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const [aLat, aLon] = polyline[i];
    const [bLat, bLon] = polyline[i + 1];
    min = Math.min(
      min,
      distanciaPuntoASegmentoMetros(lat, lon, aLat, aLon, bLat, bLon)
    );
  }
  return min;
}

function incidenciaInterceptaRuta(lat, lon, polyline) {
  return (
    distanciaPuntoAPolylineMetros(lat, lon, polyline) <=
    UMBRAL_INTERCEPCION_RUTA_METROS
  );
}

function retrasoSegundosDesdePoi(poi) {
  const delay = Number(
    poi?.dl ?? poi?.delay ?? poi?.jd ?? poi?.magnitudeOfDelay ?? 0
  );
  return Number.isFinite(delay) ? delay : 0;
}

function esIncidenciaGrave(poi) {
  const ic = Number(poi?.ic);
  if (ICONOS_BLOQUEO_GRAVE.has(ic)) return true;

  const delay = retrasoSegundosDesdePoi(poi);
  if (delay >= RETRASO_CRITICO_SEGUNDOS) return true;

  const ty = String(poi?.ty || poi?.type || "").toUpperCase();
  if (/CLOSURE|ROAD.CLOSED|BLOCK/.test(ty)) return true;

  return ic === 6 && delay >= 180;
}

function rectanguloEvitarDesdeRadioMetros(lat, lon, radioMetros = RADIO_EVITAR_METROS) {
  const margenGrados = radioMetros / 111320;
  return {
    southWestCorner: {
      latitude: lat - margenGrados,
      longitude: lon - margenGrados
    },
    northEastCorner: {
      latitude: lat + margenGrados,
      longitude: lon + margenGrados
    }
  };
}

function areaEvitarYaRegistrada(areas, rect) {
  if (!rect?.southWestCorner || !rect?.northEastCorner) return false;
  return areas.some(
    (r) =>
      r.southWestCorner.latitude === rect.southWestCorner.latitude &&
      r.southWestCorner.longitude === rect.southWestCorner.longitude &&
      r.northEastCorner.latitude === rect.northEastCorner.latitude &&
      r.northEastCorner.longitude === rect.northEastCorner.longitude
  );
}

function combinarAreasEvitar(areasBase, bloqueos) {
  const areas = [...(areasBase || [])];
  (bloqueos || []).forEach((rb) => {
    if (!rb.avoidRectangle) return;
    if (areaEvitarYaRegistrada(areas, rb.avoidRectangle)) return;
    areas.push(rb.avoidRectangle);
  });
  return areas.slice(0, MAX_AREAS_EVITAR);
}

async function peticionRutaTomTom(origenOk, paradasOk, apiKey, areasEvitar = []) {
  const url = construirUrlRutaTomTom(origenOk, paradasOk, apiKey);
  const fetchOpciones = { method: "GET" };
  const areas = Array.isArray(areasEvitar) ? areasEvitar : [];

  if (areas.length > 0) {
    fetchOpciones.method = "POST";
    fetchOpciones.headers = { "Content-Type": "application/json" };
    fetchOpciones.body = JSON.stringify({
      avoidAreas: { rectangles: areas.slice(0, MAX_AREAS_EVITAR) }
    });
  }

  const response = await fetch(url, fetchOpciones);
  const data = await response.json();

  if (!response.ok) {
    console.error("TomTom Routing error:", response.status, data);
    throw new Error(
      data?.detailedError?.message || `TomTom respondió ${response.status}`
    );
  }

  if (!data.routes?.length) {
    throw new Error("TomTom no encontró ninguna carretera válida entre esos puntos.");
  }

  return data;
}

function pintarRutaDesdeDatos(mapa, data, opcionesPintado, seqToken) {
  if (pintadoObsoleto(seqToken)) return null;

  const resumenViaje = aplicarSummaryAlPanel(data);
  if (!resumenViaje) return null;

  if (pintadoObsoleto(seqToken)) return null;

  const capa = mapa ? pintarSeccionesEnMapa(mapa, data, opcionesPintado) : null;

  if (pintadoObsoleto(seqToken)) {
    if (mapa) limpiarLineasRuta(mapa);
    return null;
  }

  if (!capa) return null;

  return { capa, resumenViaje };
}

function incidenciasHabilitadasEnUi() {
  const chk = document.getElementById("chk-trafico-incidencias");
  return !chk || chk.checked;
}

async function obtenerIncidentesJson(bbox, apiKey) {
  const clave = apiKey?.trim();
  if (!clave || !bbox) return null;

  const url = construirUrlIncidentesTomTom(bbox, clave);
  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok) {
    console.error("TomTom Incident Details:", response.status, json);
    return null;
  }

  return json;
}

function detectarRoadblocksSobreRuta(data, jsonIncidencias) {
  const polyline = polylineCarreteraDesdeRuta(data);
  if (polyline.length < 2) return [];

  const pois = listaPoiDesdeRespuestaIncidencias(jsonIncidencias);
  const vistos = new Set();
  const bloqueos = [];

  pois.forEach((poi, indice) => {
    if (!esIncidenciaGrave(poi)) return;

    const coords = latLonDesdePoi(poi);
    if (!coords) return;
    if (!incidenciaInterceptaRuta(coords.lat, coords.lon, polyline)) return;

    const clave = `${coords.lat.toFixed(5)},${coords.lon.toFixed(5)}`;
    if (vistos.has(clave)) return;
    vistos.add(clave);

    bloqueos.push({
      id: poi.id || `rb-${indice}`,
      lat: coords.lat,
      lon: coords.lon,
      descripcion: etiquetaIncidenciaPoi(poi),
      avoidRectangle: rectanguloEvitarDesdeRadioMetros(coords.lat, coords.lon),
      poi
    });
  });

  return bloqueos;
}

function pintarMarcadoresRoadblocks(mapa, bloqueos) {
  if (!mapa) return;

  limpiarMarcadoresIncidencias(mapa);

  if (!incidenciasHabilitadasEnUi()) {
    limpiarRoadblocksActivos();
    return;
  }

  roadblocksActivos = (bloqueos || []).map((rb) => ({ ...rb }));

  bloqueos.forEach((rb) => {
    const marcador = crearMarcadorIncidencia(rb.lat, rb.lon, rb.descripcion, {
      enRuta: true
    });
    marcador.addTo(mapa);
    marcador.incidenciaDatos = {
      id: rb.id,
      lat: rb.lat,
      lon: rb.lon,
      lng: rb.lon,
      descripcion: rb.descripcion,
      tipo: rb.descripcion,
      avoidRectangle: rb.avoidRectangle,
      poi: rb.poi
    };
    marcadoresIncidencias.push(marcador);
  });
}

/**
 * Tras la ruta inicial: Incident Details → bloqueos en la polilínea → marcadores → recálculo POST avoidAreas.
 */
async function procesarRoadblocksTrasRuta(
  mapa,
  data,
  apiKey,
  areasBase,
  evitarAutomatico,
  seqToken
) {
  if (!mapa || !data?.routes?.length || !incidenciasHabilitadasEnUi()) {
    return {
      bloqueos: [],
      areasEvitadas: areasBase,
      rutaEsquivada: false,
      data
    };
  }

  const bbox = bboxDesdeDatosRuta(data);
  if (!bbox) {
    return {
      bloqueos: [],
      areasEvitadas: areasBase,
      rutaEsquivada: false,
      data
    };
  }

  const jsonInc = await obtenerIncidentesJson(bbox, apiKey);
  if (pintadoObsoleto(seqToken) || !jsonInc) {
    return {
      bloqueos: [],
      areasEvitadas: areasBase,
      rutaEsquivada: false,
      data
    };
  }

  const bloqueos = detectarRoadblocksSobreRuta(data, jsonInc);
  pintarMarcadoresRoadblocks(mapa, bloqueos);

  if (!evitarAutomatico || bloqueos.length === 0) {
    return {
      bloqueos,
      areasEvitadas: areasBase,
      rutaEsquivada: false,
      data
    };
  }

  const areasNuevas = combinarAreasEvitar(areasBase, bloqueos);
  if (areasNuevas.length <= areasBase.length) {
    return {
      bloqueos,
      areasEvitadas: areasBase,
      rutaEsquivada: false,
      data
    };
  }

  return {
    bloqueos,
    areasEvitadas: areasNuevas,
    rutaEsquivada: true,
    data,
    requiereRecalculo: true
  };
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
  limpiarRoadblocksActivos();

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
  const areasBase = Array.isArray(areasEvitar) ? [...areasEvitar] : [];
  const evitarAutomatico =
    opcionesPintado.autoEvitarRoadblocks !== false && areasBase.length === 0;

  try {
    let data = await peticionRutaTomTom(origenOk, paradasOk, apiKey, areasBase);

    if (pintadoObsoleto(seqToken)) return null;

    let opcionesPintura = { ...opcionesPintado };
    let pintado = pintarRutaDesdeDatos(mapa, data, opcionesPintura, seqToken);

    if (!pintado) {
      limpiarLineasRuta(mapa);
      resetearEtiquetasResumen();
      console.error("TomTom: sin geometría pintable.", data);
      if (typeof alert === "function") {
        alert("TomTom no devolvió geometría de carretera. Revisa la consola (F12).");
      }
      return null;
    }

    let areasFinales = areasBase;
    let rutaEsquivada = Boolean(opcionesPintado.rutaEsquivada);
    let bloqueos = [];

    const resultadoRb = await procesarRoadblocksTrasRuta(
      mapa,
      data,
      apiKey,
      areasBase,
      evitarAutomatico,
      seqToken
    );

    bloqueos = resultadoRb.bloqueos;
    areasFinales = resultadoRb.areasEvitadas;

    if (
      resultadoRb.requiereRecalculo &&
      !pintadoObsoleto(seqToken)
    ) {
      limpiarLineasRuta(mapa);
      resetearEtiquetasResumen();

      data = await peticionRutaTomTom(
        origenOk,
        paradasOk,
        apiKey,
        areasFinales
      );

      if (pintadoObsoleto(seqToken)) return null;

      rutaEsquivada = true;
      opcionesPintura = { ...opcionesPintado, rutaEsquivada: true };
      pintado = pintarRutaDesdeDatos(mapa, data, opcionesPintura, seqToken);

      if (!pintado) {
        limpiarLineasRuta(mapa);
        resetearEtiquetasResumen();
        console.error("TomTom: sin geometría en ruta esquivando bloqueos.", data);
        if (typeof alert === "function") {
          alert(
            "No se pudo dibujar la ruta alternativa. Prueba con otras paradas."
          );
        }
        return null;
      }

      pintarMarcadoresRoadblocks(mapa, bloqueos);
    }

    return {
      data,
      capa: pintado.capa,
      resumenViaje: pintado.resumenViaje,
      roadblocks: [...roadblocksActivos],
      areasEvitadas: areasFinales,
      rutaEsquivada
    };
  } catch (error) {
    limpiarLineasRuta(mapa);
    limpiarRoadblocksActivos();
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

function crearMarcadorIncidencia(lat, lon, textoPopup, opciones = {}) {
  let html = `<strong>${textoPopup}</strong>`;
  if (opciones.enRuta) {
    html +=
      "<br><small>Bloqueo detectado en tu ruta. Se calculará alternativa si aplica.</small>";
  }
  return L.circleMarker([lat, lon], {
    radius: 10,
    color: "#ffffff",
    weight: 2,
    fillColor: COLOR_INCIDENCIA_ROADBLOCK,
    fillOpacity: 0.95
  }).bindPopup(html);
}

/**
 * API pública: solo marcadores (sin recálculo). Usado si se invoca fuera del flujo principal.
 */
async function pintarIncidenciasDeRuta(mapa, data, apiKey = "") {
  if (!mapa || !data?.routes?.length) {
    return { total: 0, marcadores: [], roadblocks: [] };
  }

  if (!incidenciasHabilitadasEnUi()) {
    limpiarMarcadoresIncidencias(mapa);
    limpiarRoadblocksActivos();
    return { total: 0, marcadores: [], roadblocks: [], ocultas: true };
  }

  const clave = apiKey?.trim() || "";
  if (!clave) {
    console.warn("Incidencias: falta clave API TomTom");
    return { total: 0, marcadores: [], roadblocks: [] };
  }

  const bbox = bboxDesdeDatosRuta(data);
  if (!bbox) {
    console.warn("Incidencias: no se pudo calcular el bbox de la ruta");
    return { total: 0, marcadores: [], roadblocks: [] };
  }

  try {
    const json = await obtenerIncidentesJson(bbox, clave);
    if (!json) {
      return { total: 0, marcadores: [], roadblocks: [] };
    }

    const bloqueos = detectarRoadblocksSobreRuta(data, json);
    pintarMarcadoresRoadblocks(mapa, bloqueos);

    return {
      total: marcadoresIncidencias.length,
      marcadores: marcadoresIncidencias,
      roadblocks: [...roadblocksActivos]
    };
  } catch (error) {
    console.error("Error al obtener incidencias TomTom:", error);
    return { total: 0, marcadores: [], roadblocks: [] };
  }
}

if (typeof window !== "undefined") {
  window.calcularRutaTomTom = calcularRutaTomTom;
  window.limpiarLineasRuta = limpiarLineasRuta;
  window.limpiarRutaTomTom = limpiarRutaTomTom;
  window.limpiarMarcadoresIncidencias = limpiarMarcadoresIncidencias;
  window.limpiarRoadblocksActivos = limpiarRoadblocksActivos;
  window.pintarIncidenciasDeRuta = pintarIncidenciasDeRuta;
  window.obtenerRoadblocksActivos = () => [...roadblocksActivos];
  window.resumenDesdeSummary = resumenDesdeSummary;
}
