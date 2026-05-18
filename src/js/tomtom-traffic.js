/**
 * Tráfico TomTom: flujo opcional + incidencias solo sobre la ruta calculada.
 * Fuentes: routes[0].incidents, secciones TRAFFIC de la ruta, o Incident Details
 * acotado al bbox del trayecto (no toda la isla).
 */

const CAMPOS_INCIDENTES =
  "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},from,to,delay,roadNumbers}}}";

const CATEGORIAS_INCIDENTE_EN_RUTA = new Set([
  "JAM",
  "ROAD_WORK",
  "ROAD_CLOSURE",
  "OTHER"
]);

const TOMTOM_SUBDOMINIOS = ["a", "b", "c", "d"];

const ICONOS_INCIDENTE = {
  1: { emoji: "💥", clase: "accidente", etiqueta: "Accidente" },
  6: { emoji: "🚦", clase: "atasco", etiqueta: "Tráfico denso" },
  7: { emoji: "⛔", clase: "carril", etiqueta: "Carril cerrado" },
  8: { emoji: "🛑", clase: "corte", etiqueta: "Corte de vía" },
  9: { emoji: "🚧", clase: "obras", etiqueta: "Obras" },
  default: { emoji: "⚠️", clase: "otro", etiqueta: "Incidencia" }
};

const ICONOS_POR_TIPO = {
  ROAD_WORK: { emoji: "🚧", clase: "obras", etiqueta: "Obras" },
  roadworks: { emoji: "🚧", clase: "obras", etiqueta: "Obras" },
  ROAD_CLOSURE: { emoji: "🛑", clase: "corte", etiqueta: "Corte de vía" },
  "road-closed": { emoji: "🛑", clase: "corte", etiqueta: "Corte de vía" },
  JAM: { emoji: "🚦", clase: "atasco", etiqueta: "Tráfico denso" },
  jam: { emoji: "🚦", clase: "atasco", etiqueta: "Tráfico denso" },
  LANE_CLOSED: { emoji: "⛔", clase: "carril", etiqueta: "Carril cerrado" },
  "lane-closed": { emoji: "⛔", clase: "carril", etiqueta: "Carril cerrado" },
  ACCIDENT: { emoji: "💥", clase: "accidente", etiqueta: "Accidente" },
  accident: { emoji: "💥", clase: "accidente", etiqueta: "Accidente" },
  OTHER: { emoji: "⚠️", clase: "otro", etiqueta: "Incidencia" },
  other: { emoji: "⚠️", clase: "otro", etiqueta: "Incidencia" }
};

let capaMarcadoresIncidencias = null;
let ultimosDatosRutaIncidencias = null;

function urlFlujoTomTom(apiKey) {
  return `https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`;
}

function coordsGeometria(geometry) {
  if (!geometry?.coordinates) return [];

  const { type, coordinates } = geometry;

  if (type === "Point") return [coordinates];
  if (type === "LineString") return coordinates;
  if (type === "MultiLineString") return coordinates.flat();
  if (type === "Polygon") return coordinates[0] || [];
  return [];
}

function centroGeometria(geometry) {
  const coords = coordsGeometria(geometry);
  if (!coords.length) return null;

  let latSum = 0;
  let lonSum = 0;
  coords.forEach(([lon, lat]) => {
    latSum += lat;
    lonSum += lon;
  });

  return [latSum / coords.length, lonSum / coords.length];
}

function rectanguloEvitarDesdeLatLng(lat, lng, margenGrados = 0.012) {
  return {
    southWestCorner: {
      latitude: lat - margenGrados,
      longitude: lng - margenGrados
    },
    northEastCorner: {
      latitude: lat + margenGrados,
      longitude: lng + margenGrados
    }
  };
}

function rectanguloEvitarDesdeGeometria(geometry, margenGrados = 0.012) {
  const coords = coordsGeometria(geometry);
  if (!coords.length) return null;

  const lats = coords.map((c) => c[1]);
  const lons = coords.map((c) => c[0]);

  return {
    southWestCorner: {
      latitude: Math.min(...lats) - margenGrados,
      longitude: Math.min(...lons) - margenGrados
    },
    northEastCorner: {
      latitude: Math.max(...lats) + margenGrados,
      longitude: Math.max(...lons) + margenGrados
    }
  };
}

function metaIconoIncidencia(iconCategory, incidentType, simpleCategory) {
  if (iconCategory != null && ICONOS_INCIDENTE[iconCategory]) {
    return ICONOS_INCIDENTE[iconCategory];
  }

  const claves = [incidentType, simpleCategory].filter(Boolean);
  for (const clave of claves) {
    if (ICONOS_POR_TIPO[clave]) return ICONOS_POR_TIPO[clave];
    const normalizada = String(clave).toLowerCase();
    const encontrada = Object.entries(ICONOS_POR_TIPO).find(
      ([k]) => k.toLowerCase() === normalizada
    );
    if (encontrada) return encontrada[1];
  }

  return ICONOS_INCIDENTE.default;
}

function escHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function descripcionDesdePropiedades(properties) {
  const eventos = properties?.events || [];
  if (eventos.length > 0 && eventos[0].description) {
    return eventos[0].description;
  }
  if (properties?.from && properties?.to) {
    return `${properties.from} → ${properties.to}`;
  }
  return null;
}

function geometryDesdeIncidenciaRuta(incident) {
  if (incident.geometry?.coordinates) {
    return incident.geometry;
  }

  const punto =
    incident.point ||
    incident.startPoint ||
    incident.location ||
    (Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude)
      ? { latitude: incident.latitude, longitude: incident.longitude }
      : null);

  if (punto?.latitude != null && punto?.longitude != null) {
    return {
      type: "Point",
      coordinates: [Number(punto.longitude), Number(punto.latitude)]
    };
  }

  return null;
}

function normalizarIncidenciaRutaTomTom(incident, indice) {
  const geometry = geometryDesdeIncidenciaRuta(incident);
  const centro = centroGeometria(geometry);
  if (!centro) return null;

  const incidentType = incident.incidentType ?? incident.type;
  const simpleCategory = incident.simpleCategory;
  const meta = metaIconoIncidencia(
    incident.iconCategory,
    incidentType,
    simpleCategory
  );

  const descripcion =
    incident.description ||
    incident.text ||
    descripcionDesdePropiedades(incident.properties || incident) ||
    meta.etiqueta;

  const delay =
    incident.delayInSeconds ?? incident.delay ?? incident.properties?.delay;

  return {
    id: incident.eventId || incident.id || `ruta-inc-${indice}`,
    lat: centro[0],
    lng: centro[1],
    iconCategory: incident.iconCategory,
    incidentType,
    simpleCategory,
    descripcion,
    tipo: meta.etiqueta,
    from: incident.from ?? incident.properties?.from,
    to: incident.to ?? incident.properties?.to,
    delay,
    geometry,
    avoidRectangle:
      rectanguloEvitarDesdeGeometria(geometry) ||
      rectanguloEvitarDesdeLatLng(centro[0], centro[1])
  };
}

function descripcionDesdeTec(tec) {
  if (!tec?.causes?.length) return null;
  const causa = tec.causes[0];
  if (causa?.mainCauseCode != null) {
    return `Incidencia en ruta (código ${causa.mainCauseCode})`;
  }
  return null;
}

function normalizarIncidenciaDesdeSeccion(seccion, puntosGlobales, indice) {
  let categoria = seccion.simpleCategory;
  if (!categoria || !CATEGORIAS_INCIDENTE_EN_RUTA.has(categoria)) {
    categoria = "JAM";
  }

  const inicio = Math.max(0, seccion.startPointIndex ?? 0);
  const fin = Math.min(
    puntosGlobales.length - 1,
    seccion.endPointIndex ?? inicio
  );
  if (!puntosGlobales.length || fin < inicio) return null;

  const medio = Math.floor((inicio + fin) / 2);
  const punto = puntosGlobales[medio];
  const lat = punto[0];
  const lon = punto[1];

  const coordsGeo = puntosGlobales
    .slice(inicio, fin + 1)
    .map((p) => [p[1], p[0]]);

  const geometry =
    coordsGeo.length >= 2
      ? { type: "LineString", coordinates: coordsGeo }
      : { type: "Point", coordinates: [lon, lat] };

  const meta = metaIconoIncidencia(null, categoria, categoria);
  const descripcion =
    descripcionDesdeTec(seccion.tec) ||
    (seccion.effectiveSpeedInKmh != null
      ? `${meta.etiqueta} · ~${Math.round(seccion.effectiveSpeedInKmh)} km/h`
      : meta.etiqueta);

  return {
    id: seccion.eventId || `ruta-sec-${indice}-${categoria}`,
    lat,
    lng: lon,
    simpleCategory: categoria,
    incidentType: categoria,
    descripcion,
    tipo: meta.etiqueta,
    delay: seccion.delayInSeconds,
    geometry,
    avoidRectangle:
      rectanguloEvitarDesdeGeometria(geometry) ||
      rectanguloEvitarDesdeLatLng(lat, lon)
  };
}

function seccionesTraficoDeRuta(ruta) {
  if (!ruta) return [];
  const enRuta = ruta.sections || [];
  const enLegs = (ruta.legs || []).flatMap((leg) => leg.sections || []);
  return [...enRuta, ...enLegs];
}

function extraerIncidenciasDeRuta(data) {
  const ruta = data?.routes?.[0];
  if (!ruta) return [];

  if (Array.isArray(ruta.incidents) && ruta.incidents.length > 0) {
    return ruta.incidents
      .map((inc, i) => normalizarIncidenciaRutaTomTom(inc, i))
      .filter(Boolean);
  }

  const puntosGlobales =
    typeof puntosCarreteraDesdeDatos === "function"
      ? puntosCarreteraDesdeDatos(data)
      : [];

  return seccionesTraficoDeRuta(ruta)
    .filter((s) => esSeccionIncidenciaEnRuta(s))
    .map((s, i) => normalizarIncidenciaDesdeSeccion(s, puntosGlobales, i))
    .filter(Boolean);
}

function esSeccionIncidenciaEnRuta(seccion) {
  if (seccion.sectionType !== "TRAFFIC") return false;
  if (
    seccion.simpleCategory &&
    CATEGORIAS_INCIDENTE_EN_RUTA.has(seccion.simpleCategory)
  ) {
    return true;
  }
  const delay = Number(seccion.delayInSeconds) || 0;
  const magnitude = Number(seccion.magnitudeOfDelay) || 0;
  return delay >= 30 || magnitude >= 2;
}

function construirUrlIncidentDetailsBbox(apiKey, bbox) {
  const params = new URLSearchParams({
    key: apiKey,
    bbox: bbox.join(","),
    fields: CAMPOS_INCIDENTES,
    language: "es-ES",
    timeValidityFilter: "present"
  });
  return `https://api.tomtom.com/traffic/services/5/incidentDetails?${params.toString()}`;
}

function bboxDesdePuntosRuta(puntos, margenGrados = 0.02) {
  if (!puntos?.length) return null;
  const lats = puntos.map((p) => p[0]);
  const lons = puntos.map((p) => p[1]);
  return [
    Math.min(...lons) - margenGrados,
    Math.min(...lats) - margenGrados,
    Math.max(...lons) + margenGrados,
    Math.max(...lats) + margenGrados
  ];
}

function normalizarIncidenciaDetalle(feature, indice) {
  const props = feature.properties || {};
  const centro = centroGeometria(feature.geometry);
  if (!centro) return null;

  return {
    id: props.id || `detalle-${indice}`,
    lat: centro[0],
    lng: centro[1],
    iconCategory: props.iconCategory,
    descripcion: descripcionDesdePropiedades(props) || "Incidencia en la ruta",
    tipo: metaIconoIncidencia(props.iconCategory).etiqueta,
    from: props.from,
    to: props.to,
    delay: props.delay,
    geometry: feature.geometry,
    avoidRectangle: rectanguloEvitarDesdeGeometria(feature.geometry)
  };
}

async function obtenerIncidenciasEnCorredorRuta(data, apiKey) {
  if (!apiKey?.trim()) return [];

  const puntos =
    typeof puntosCarreteraDesdeDatos === "function"
      ? puntosCarreteraDesdeDatos(data)
      : [];
  const bbox = bboxDesdePuntosRuta(puntos);
  if (!bbox) return [];

  const url = construirUrlIncidentDetailsBbox(apiKey, bbox);
  const resp = await fetch(url);
  if (!resp.ok) {
    const texto = await resp.text().catch(() => "");
    throw new Error(
      `Incident Details ${resp.status}${texto ? `: ${texto.slice(0, 80)}` : ""}`
    );
  }

  const json = await resp.json();
  return (json.incidents || [])
    .map((f, i) => normalizarIncidenciaDetalle(f, i))
    .filter(Boolean);
}

function crearIconoIncidenciaDesdeMeta(meta) {
  return L.divIcon({
    className: `marcador-incidencia marcador-incidencia--${meta.clase}`,
    html: `<div class="marcador-incidencia__pin" title="${meta.etiqueta}">${meta.emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function htmlPopupIncidencia(inc) {
  let html = `<div class="popup-incidencia">`;
  html += `<p class="popup-incidencia__tipo"><strong>${escHtml(inc.tipo)}</strong></p>`;
  html += `<p class="popup-incidencia__desc">${escHtml(inc.descripcion)}</p>`;
  if (inc.from && inc.to) {
    html += `<p class="popup-incidencia__via"><small>${escHtml(inc.from)} → ${escHtml(inc.to)}</small></p>`;
  }
  if (inc.delay) {
    html += `<p class="popup-incidencia__retraso"><small>Retraso: ~${Math.round(inc.delay / 60)} min</small></p>`;
  }
  html += `<button type="button" class="popup-btn popup-btn--esquivar" data-incidente-id="${inc.id}">Esquivar esta incidencia</button>`;
  html += `</div>`;
  return html;
}

function actualizarNotaIncidencias(total) {
  const nota = document.querySelector(".traffic-nota");
  if (!nota) return;

  if (total === 0) {
    nota.textContent =
      "Sin incidencias en la ruta. Calcula un trayecto para ver obstáculos en tu camino.";
  } else {
    nota.textContent = `${total} incidencia(s) en tu ruta (clic para detalle y esquivar).`;
  }
}

function limpiarMarcadoresIncidencias(map) {
  if (capaMarcadoresIncidencias && map) {
    map.removeLayer(capaMarcadoresIncidencias);
    capaMarcadoresIncidencias = null;
  }
}

function incidenciasVisiblesEnUi() {
  const chk = document.getElementById("chk-trafico-incidencias");
  return chk?.checked ?? true;
}

function pintarMarcadoresIncidenciasEnMapa(map, incidencias) {
  limpiarMarcadoresIncidencias(map);

  if (!incidencias.length) {
    actualizarNotaIncidencias(0);
    return { total: 0, capa: null };
  }

  capaMarcadoresIncidencias = L.layerGroup();

  incidencias.forEach((inc) => {
    const meta = metaIconoIncidencia(
      inc.iconCategory,
      inc.incidentType,
      inc.simpleCategory
    );

    const marcador = L.marker([inc.lat, inc.lng], {
      icon: crearIconoIncidenciaDesdeMeta(meta),
      zIndexOffset: 800
    });

    marcador.incidenciaDatos = inc;
    marcador.bindPopup(htmlPopupIncidencia(inc), { maxWidth: 320 });

    marcador.on("popupopen", () => {
      const popup = marcador.getPopup();
      const contenedor = popup?.getElement();
      if (!contenedor) return;

      const btn = contenedor.querySelector(".popup-btn--esquivar");
      if (!btn || btn.dataset.bound === "1") return;

      btn.dataset.bound = "1";
      btn.addEventListener("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (typeof window.esquivarIncidenciaTomTom === "function") {
          window.esquivarIncidenciaTomTom(inc);
        }
        map.closePopup();
      });
    });

    capaMarcadoresIncidencias.addLayer(marcador);
  });

  capaMarcadoresIncidencias.addTo(map);
  actualizarNotaIncidencias(incidencias.length);

  return { total: incidencias.length, capa: capaMarcadoresIncidencias };
}

/**
 * Pinta incidencias que afectan al trayecto calculado (no toda la isla).
 */
async function pintarIncidenciasDeRuta(map, data, apiKey = "") {
  if (!map) return { total: 0, capa: null };

  ultimosDatosRutaIncidencias = data;

  let incidencias = extraerIncidenciasDeRuta(data);

  if (!incidencias.length && apiKey?.trim()) {
    try {
      incidencias = await obtenerIncidenciasEnCorredorRuta(data, apiKey);
    } catch (err) {
      console.warn("Incidencias en corredor de ruta:", err);
    }
  }

  if (!incidenciasVisiblesEnUi()) {
    limpiarMarcadoresIncidencias(map);
    actualizarNotaIncidencias(incidencias.length);
    return { total: incidencias.length, capa: null, ocultas: true };
  }

  return pintarMarcadoresIncidenciasEnMapa(map, incidencias);
}

function quitarCapaDelMapa(map, capa) {
  if (capa && map.hasLayer(capa)) {
    map.removeLayer(capa);
  }
}

function initCapasTraficoTomTom(map, apiKey) {
  const aviso = document.getElementById("tomtom-aviso");

  if (!apiKey || !apiKey.trim()) {
    if (aviso) aviso.hidden = false;
    return null;
  }

  if (aviso) aviso.hidden = true;

  if (!map.getPane("trafficFlow")) {
    map.createPane("trafficFlow");
    map.getPane("trafficFlow").style.zIndex = 450;
  }
  if (!map.getPane("routePane")) {
    map.createPane("routePane");
    map.getPane("routePane").style.zIndex = 550;
  }

  const chkFlujo = document.getElementById("chk-trafico-flujo");
  const chkIncidencias = document.getElementById("chk-trafico-incidencias");

  let preferenciaFlujo = chkFlujo?.checked ?? false;
  let preferenciaIncidencias = chkIncidencias?.checked ?? true;
  let rutaBoundsActiva = null;

  actualizarNotaIncidencias(0);

  const capaFlujo = L.tileLayer(urlFlujoTomTom(apiKey), {
    subdomains: TOMTOM_SUBDOMINIOS,
    maxZoom: 22,
    tileSize: 256,
    zoomOffset: 0,
    pane: "trafficFlow",
    opacity: 0.9,
    attribution:
      'Flujo &copy; <a href="https://www.tomtom.com" target="_blank" rel="noopener">TomTom</a>'
  });

  function aplicarFlujo() {
    if (!preferenciaFlujo || !rutaBoundsActiva) {
      quitarCapaDelMapa(map, capaFlujo);
      return;
    }

    capaFlujo.options.bounds = rutaBoundsActiva;
    if (!map.hasLayer(capaFlujo)) {
      capaFlujo.addTo(map);
    }
    capaFlujo.redraw();
  }

  function setIncidentsVisible(visible) {
    preferenciaIncidencias = visible;
    if (!visible) {
      limpiarMarcadoresIncidencias(map);
      return;
    }
    if (ultimosDatosRutaIncidencias) {
      pintarIncidenciasDeRuta(map, ultimosDatosRutaIncidencias, apiKey);
    }
  }

  return {
    flow: capaFlujo,
    incidents: () => capaMarcadoresIncidencias,
    hayRutaActiva() {
      return rutaBoundsActiva !== null;
    },
    mostrarEnRuta(bounds) {
      rutaBoundsActiva = bounds.pad(0.12);
      aplicarFlujo();
    },
    ocultarDeRuta() {
      rutaBoundsActiva = null;
      ultimosDatosRutaIncidencias = null;
      quitarCapaDelMapa(map, capaFlujo);
      limpiarMarcadoresIncidencias(map);
      actualizarNotaIncidencias(0);
    },
    setFlowVisible(visible) {
      preferenciaFlujo = visible;
      aplicarFlujo();
    },
    setIncidentsVisible,
    pintarIncidenciasDeRuta: (data, key) =>
      pintarIncidenciasDeRuta(map, data, key || apiKey),
    redraw() {
      aplicarFlujo();
    }
  };
}

function enlazarControlesTraficoTomTom(traffic) {
  if (!traffic) return;

  const chkFlujo = document.getElementById("chk-trafico-flujo");
  const chkIncidencias = document.getElementById("chk-trafico-incidencias");

  const aplicarFlujo = () => traffic.setFlowVisible(chkFlujo.checked);
  const aplicarIncidencias = () =>
    traffic.setIncidentsVisible(chkIncidencias.checked);

  if (chkFlujo) {
    chkFlujo.addEventListener("change", aplicarFlujo);
  }

  if (chkIncidencias) {
    chkIncidencias.addEventListener("change", aplicarIncidencias);
  }

  document.querySelectorAll(".leyenda-item[data-capa]").forEach((item) => {
    item.addEventListener("click", () => {
      const capa = item.dataset.capa;
      if (capa === "flujo" && chkFlujo) {
        chkFlujo.checked = !chkFlujo.checked;
        aplicarFlujo();
      }
      if (capa === "incidencias" && chkIncidencias) {
        chkIncidencias.checked = !chkIncidencias.checked;
        aplicarIncidencias();
      }
    });
  });
}
