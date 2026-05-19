/**
 * Enrutador TomTom: una sola petición, un solo summary, un solo pintado.
 * lineasRutaActual controla todas las polilíneas en el mapa.
 */

const COLORES_TRAFICO = {
  fluido: "#00E676",
  lento: "#FFD600",
  congestion: "#FF1744"
};

const COLOR_RUTA_ESQUIVADA_BORDE = "#ff00aa";

/** Array global obligatorio — compartido con app.js para borrado físico. */
var lineasRutaActual = [];

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
  return `${latDePunto(punto)},${lonDePunto(punto)}`;
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
    travelMode: "car",
    traffic: "true",
    trafficModel: "best",
    departAt: "now",
    routeRepresentation: "polyline",
    sectionType: "traffic"
  });

  return `https://api.tomtom.com/routing/1/calculateRoute/${ubicaciones}/json?${params.toString()}`;
}

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

function puntosCarreteraDeSeccion(seccion, polylineCarretera) {
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

function colorTraficoDeSeccion(seccion) {
  const retraso = seccion.delayInSeconds ?? 0;
  if (retraso > 90) return COLORES_TRAFICO.congestion;
  if (retraso > 30) return COLORES_TRAFICO.lento;
  return COLORES_TRAFICO.fluido;
}

/**
 * LIMPIEZA INMEDIATA: quita capas del mapa y vacía el contenedor global.
 */
function limpiarLineasRuta(mapa) {
  if (mapa) {
    lineasRutaActual.forEach((linea) => {
      if (linea && mapa.hasLayer(linea)) {
        mapa.removeLayer(linea);
      }
    });
  }
  lineasRutaActual = [];

  if (typeof limpiarMarcadoresIncidencias === "function" && mapa) {
    limpiarMarcadoresIncidencias(mapa);
  }
}

function limpiarRutaTomTom(mapa) {
  limpiarLineasRuta(mapa);
}

function resetearEtiquetasResumen() {
  sincronizarEtiquetasResumen("0.0", 0);
}

/** Asignación directa al DOM (sin acumular). */
function sincronizarEtiquetasResumen(kilometros, minutosConduccion) {
  const elKm = document.getElementById("distancia-total");
  const elMin = document.getElementById("tiempo-conduccion");
  const panel = document.getElementById("ruta-stats-flotante");

  const kmTexto = `${kilometros} km`;
  const minTexto = `${minutosConduccion} min`;

  if (elKm) elKm.textContent = kmTexto;
  if (elMin) elMin.textContent = minTexto;

  if (panel) {
    if (Number(kilometros) <= 0) {
      panel.hidden = true;
    } else {
      panel.textContent = `Distancia: ${kmTexto} | Tiempo: ${minTexto}`;
      panel.hidden = false;
    }
  }
}

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

function capaAgrupadaParaBounds() {
  if (lineasRutaActual.length === 0) return null;
  return L.featureGroup(lineasRutaActual);
}

/**
 * Pintado tramo a tramo: solo geometría de sections (carretera).
 */
function pintarSeccionesEnMapa(mapa, data, opciones = {}) {
  const ruta = data.routes[0];
  const polyline = polylineCarreteraDesdeRuta(data);
  const secciones = [...(ruta.sections || [])].sort(
    (a, b) => (a.startPointIndex ?? 0) - (b.startPointIndex ?? 0)
  );

  if (opciones.rutaEsquivada) {
    const contorno = [];
    secciones.forEach((seccion) => {
      puntosCarreteraDeSeccion(seccion, polyline).forEach((pt) => contorno.push(pt));
    });
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
    const nuevaLinea = L.polyline(puntosCarretera, {
      color: colorTrafico,
      weight: opciones.rutaEsquivada ? 8 : 6,
      opacity: 0.9,
      lineJoin: "round",
      lineCap: "round",
      dashArray: opciones.rutaEsquivada ? "14 8" : undefined
    }).addTo(mapa);

    lineasRutaActual.push(nuevaLinea);
    dibujadas += 1;
  });

  if (dibujadas === 0 && polyline.length >= 2) {
    const lineaUnica = L.polyline(polyline, {
      color: COLORES_TRAFICO.fluido,
      weight: 6,
      opacity: 0.9,
      lineJoin: "round",
      lineCap: "round"
    }).addTo(mapa);
    lineasRutaActual.push(lineaUnica);
    dibujadas = 1;
  }

  return dibujadas > 0 ? capaAgrupadaParaBounds() : null;
}

async function calcularRutaTomTom(
  mapa,
  origen,
  paradas,
  apiKey,
  areasEvitar = null,
  opcionesPintado = {}
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

    const resumenViaje = resumenDesdeSummary(data);
    if (!resumenViaje) {
      alert("TomTom no devolvió resumen de ruta.");
      return null;
    }

    sincronizarEtiquetasResumen(
      resumenViaje.kilometros,
      resumenViaje.minutosConduccion
    );

    const capa = mapa ? pintarSeccionesEnMapa(mapa, data, opcionesPintado) : null;

    if (!capa) {
      limpiarLineasRuta(mapa);
      resetearEtiquetasResumen();
      alert("TomTom no devolvió geometría de carretera en las secciones.");
      return null;
    }

    if (mapa && typeof pintarIncidenciasDeRuta === "function") {
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
  const secciones = (rutaTomTom.sections || []).filter(
    (s) => s.sectionType === "TRAFFIC"
  );
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