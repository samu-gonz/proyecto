/**
 * Incidencias TomTom interactivas (Incident Details API) + capa de flujo opcional.
 */

const TENERIFE_BBOX = {
  minLon: -17.05,
  minLat: 27.95,
  maxLon: -16.05,
  maxLat: 28.65
};

const TOMTOM_SUBDOMINIOS = ["a", "b", "c", "d"];

const CAMPOS_INCIDENTES =
  "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},from,to,delay,roadNumbers}}}";

const ICONOS_INCIDENTE = {
  1: { emoji: "💥", clase: "accidente", etiqueta: "Accidente" },
  6: { emoji: "🚦", clase: "atasco", etiqueta: "Tráfico denso" },
  7: { emoji: "⛔", clase: "carril", etiqueta: "Carril cerrado" },
  8: { emoji: "🛑", clase: "corte", etiqueta: "Corte de vía" },
  9: { emoji: "🚧", clase: "obras", etiqueta: "Obras" },
  default: { emoji: "⚠️", clase: "otro", etiqueta: "Incidencia" }
};

let capaMarcadoresIncidencias = null;
let intervaloIncidencias = null;

function urlFlujoTomTom(apiKey) {
  return `https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`;
}

function construirUrlIncidentDetails(apiKey) {
  const bbox = [
    TENERIFE_BBOX.minLon,
    TENERIFE_BBOX.minLat,
    TENERIFE_BBOX.maxLon,
    TENERIFE_BBOX.maxLat
  ].join(",");

  const params = new URLSearchParams({
    key: apiKey,
    bbox,
    fields: CAMPOS_INCIDENTES,
    language: "es-ES",
    timeValidityFilter: "present"
  });

  // v5 (v4 deprecada); bbox Tenerife: minLon,minLat,maxLon,maxLat
  return `https://api.tomtom.com/traffic/services/5/incidentDetails?${params.toString()}`;
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

function metaIconoIncidencia(iconCategory) {
  return ICONOS_INCIDENTE[iconCategory] || ICONOS_INCIDENTE.default;
}

function escHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function descripcionIncidencia(properties) {
  const eventos = properties?.events || [];
  if (eventos.length > 0 && eventos[0].description) {
    return eventos[0].description;
  }
  if (properties?.from && properties?.to) {
    return `${properties.from} → ${properties.to}`;
  }
  return "Incidencia de tráfico en la zona";
}

function crearIconoIncidencia(iconCategory) {
  const meta = metaIconoIncidencia(iconCategory);

  return L.divIcon({
    className: `marcador-incidencia marcador-incidencia--${meta.clase}`,
    html: `<div class="marcador-incidencia__pin" title="${meta.etiqueta}">${meta.emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function normalizarIncidencia(feature) {
  const props = feature.properties || {};
  const centro = centroGeometria(feature.geometry);
  if (!centro) return null;

  return {
    id: props.id || `${centro[0]}_${centro[1]}`,
    lat: centro[0],
    lng: centro[1],
    iconCategory: props.iconCategory,
    descripcion: descripcionIncidencia(props),
    tipo: metaIconoIncidencia(props.iconCategory).etiqueta,
    from: props.from,
    to: props.to,
    delay: props.delay,
    roadNumbers: props.roadNumbers,
    geometry: feature.geometry,
    avoidRectangle: rectanguloEvitarDesdeGeometria(feature.geometry)
  };
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

async function obtenerIncidentesTenerife(apiKey) {
  const url = construirUrlIncidentDetails(apiKey);
  const resp = await fetch(url);

  if (!resp.ok) {
    const texto = await resp.text().catch(() => "");
    throw new Error(
      `Incident Details ${resp.status}${texto ? `: ${texto.slice(0, 100)}` : ""}`
    );
  }

  const data = await resp.json();
  return (data.incidents || [])
    .map(normalizarIncidencia)
    .filter(Boolean);
}

function limpiarMarcadoresIncidencias(map) {
  if (capaMarcadoresIncidencias && map) {
    map.removeLayer(capaMarcadoresIncidencias);
    capaMarcadoresIncidencias = null;
  }
}

async function pintarIncidenciasInteractivas(map, apiKey) {
  limpiarMarcadoresIncidencias(map);

  const incidencias = await obtenerIncidentesTenerife(apiKey);
  capaMarcadoresIncidencias = L.layerGroup();

  incidencias.forEach((inc) => {
    const marcador = L.marker([inc.lat, inc.lng], {
      icon: crearIconoIncidencia(inc.iconCategory),
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
  return { total: incidencias.length, capa: capaMarcadoresIncidencias };
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
  let estadoIncidencias = { total: 0 };

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

  async function recargarIncidencias() {
    if (!preferenciaIncidencias) {
      limpiarMarcadoresIncidencias(map);
      return estadoIncidencias;
    }

    try {
      estadoIncidencias = await pintarIncidenciasInteractivas(map, apiKey);
      const nota = document.querySelector(".traffic-nota");
      if (nota && estadoIncidencias.total >= 0) {
        nota.textContent = `${estadoIncidencias.total} incidencias en vivo en Tenerife (clic para detalle y esquivar).`;
      }
    } catch (err) {
      console.error("Incidencias TomTom:", err);
      const nota = document.querySelector(".traffic-nota");
      if (nota) {
        nota.textContent = `Error al cargar incidencias: ${err.message}`;
      }
    }

    return estadoIncidencias;
  }

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
    if (visible) {
      recargarIncidencias();
    } else {
      limpiarMarcadoresIncidencias(map);
    }
  }

  recargarIncidencias();

  if (intervaloIncidencias) {
    clearInterval(intervaloIncidencias);
  }
  intervaloIncidencias = setInterval(() => {
    if (preferenciaIncidencias) recargarIncidencias();
  }, 5 * 60 * 1000);

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
      quitarCapaDelMapa(map, capaFlujo);
    },
    setFlowVisible(visible) {
      preferenciaFlujo = visible;
      aplicarFlujo();
    },
    setIncidentsVisible,
    recargarIncidencias,
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
