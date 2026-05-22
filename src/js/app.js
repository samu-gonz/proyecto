import { MAQUINAS } from "../data/maquinas.js";
import { obtenerClaveTomTom } from "./tomtom-config.js";
import {
  calcularRutaTomTom,
  coordenadasValidas,
  limpiarLineasRuta,
  limpiarMarcadoresIncidencias,
  limpiarRutaTomTom,
  normalizarPuntoRuta,
  resumenDesdeSummary,
  resetearEtiquetasResumen,
  sincronizarEtiquetasResumen
} from "./tomtom-routing.js";
import {
  enlazarControlesTraficoTomTom,
  initCapasTraficoTomTom
} from "./tomtom-traffic.js";

let bootstrapSeq = 0;
let listenersUiAdjuntos = false;

let map;
let capasTraficoTomTom = null;
let estadoRutaReponedor = null;
let numeroMarkers = [];
let maquinaMarkers = [];
let maquinasVisibles = [...MAQUINAS];
let textoFiltroActual = "";
let repositorMarker = null;
let origenMaquinaMarker = null;
let gpsWatchId = null;
let origenRuta = null;
let maquinaSeleccionadaId = null;
let marcadorSeleccionadoLayer = null;
let guardarEstadoTimeout = null;
let restaurandoSesion = false;
let recalcularRutaTimer = null;
/** Evita aplicar respuestas TomTom obsoletas si el usuario cambió paradas rápido. */
let calcularRutaSeq = 0;
/** Petición espejo origen→destino final (ruta secundaria de respaldo). */
let seqPeticionSecundariaRespaldoApp = 0;
/** Paradas elegidas desde el menú lateral (orden de clic). */
let misParadasSeleccionadas = [];

/** Grupo Leaflet con todas las líneas de tráfico (app.js). */
let grupoLineasRutaApp = null;
let departAtSeleccionadoIsoApp = null;
let fetchTomTomPatcheadoApp = false;

/** Conteo de tramos para el panel del menú lateral. */
let conteoTraficoRutaApp = { verde: 0, amarillo: 0, rojo: 0 };

const COLORES_TRAMO_TRAFICO_APP = {
  verde: "#00E676",
  amarillo: "#FFD600",
  rojo: "#FF1744"
};

const ID_SELECTOR_FECHA_FUTURA = "selector-fecha-futura";

/** Rutas alternativas TomTom (extensiones post-ruta; no afecta el bucle de legs). */
const ACTIVAR_RUTAS_ALTERNATIVAS_TOMTOM_APP = true;

const STORAGE_KEY = "planificador-ruta-tenerife-v1";

const iconoRepositor = L.divIcon({
  className: "marcador-repositor",
  html: `<div class="marcador-repositor__van" title="Tu ubicación">🚐</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const iconoOrigenMaquina = L.divIcon({
  className: "marcador-origen-maquina",
  html: `<div class="marcador-origen-maquina__pin">INICIO</div>`,
  iconSize: [52, 28],
  iconAnchor: [26, 28]
});

function obtenerOrigenRuta() {
  return origenRuta;
}

function obtenerMaquinaPorId(id) {
  return MAQUINAS.find((m) => m.id === Number(id));
}

/** lat/lon numéricos desde una máquina o parada de la lista. */
function puntoDesdeMaquina(maquina) {
  const lat = Number(maquina?.lat);
  const lon = Number(maquina?.lon ?? maquina?.lng);
  return {
    ...maquina,
    lat,
    lon,
    lng: lon
  };
}

function tiempoServicioMinutos(parada) {
  const minutos = Number(parada?.tiempoServicioMin);
  return Number.isFinite(minutos) ? minutos : 10;
}

function resetearPanelResumenUI() {
  if (typeof resetearEtiquetasResumen === "function") {
    resetearEtiquetasResumen();
  } else {
    const elKm = document.getElementById("distancia-total");
    const elMin = document.getElementById("tiempo-conduccion");
    if (elKm) elKm.textContent = "0.0 km";
    if (elMin) elMin.textContent = "0 min";
  }
}

/** Rompe persistencia de itinerarios y zonas a evitar del cálculo anterior. */
function limpiarEstadoRutaInterno() {
  estadoRutaReponedor = null;
  resetearPanelResumenUI();
}

function limpiarContenedorResumen(mensajeHtml = "") {
  const resumenDiv = document.getElementById("resumen");
  if (resumenDiv) {
    resumenDiv.innerHTML = mensajeHtml;
  }
}

function ocultarResumenRutaFlotante() {
  const panel = document.getElementById("ruta-stats-flotante");
  if (panel) panel.hidden = true;
}

function formatearDepartAtDesdeInput(valorInput) {
  if (!valorInput) return null;
  let fechaInput = valorInput.split(".")[0];
  if (fechaInput.endsWith("Z")) {
    fechaInput = fechaInput.slice(0, -1);
  }
  if (fechaInput.length === 16) {
    fechaInput += ":00";
  }
  return fechaInput;
}

function leerDepartAtSeleccionadoDesdeUI() {
  const input = document.getElementById(ID_SELECTOR_FECHA_FUTURA);
  if (!input?.value) return null;
  return formatearDepartAtDesdeInput(input.value);
}

function asegurarSelectorFechaFuturaEnSidebar() {
  if (document.getElementById(ID_SELECTOR_FECHA_FUTURA)) return;

  const btnRuta = document.getElementById("btn-ruta");
  if (!btnRuta?.parentNode) return;

  const cont = document.createElement("div");
  cont.id = "bloque-fecha-futura-ruta";
  cont.style.margin = "10px 0 12px";
  cont.style.padding = "10px";
  cont.style.border = "1px solid #d8dce5";
  cont.style.borderRadius = "10px";
  cont.style.background = "#f8fafc";

  const label = document.createElement("label");
  label.htmlFor = ID_SELECTOR_FECHA_FUTURA;
  label.textContent = "Salida (predicción de tráfico)";
  label.style.display = "block";
  label.style.fontWeight = "600";
  label.style.marginBottom = "6px";

  const input = document.createElement("input");
  input.type = "datetime-local";
  input.id = ID_SELECTOR_FECHA_FUTURA;
  input.className = "input-fecha-futura";
  input.style.width = "100%";
  input.style.padding = "8px 10px";
  input.style.border = "1px solid #c9d2e3";
  input.style.borderRadius = "8px";
  input.style.background = "#ffffff";
  input.style.boxSizing = "border-box";

  const nota = document.createElement("p");
  nota.className = "small";
  nota.style.margin = "6px 0 0";
  nota.textContent =
    "Vacío = tráfico en tiempo real. Con fecha = predicción para esa hora.";

  cont.appendChild(label);
  cont.appendChild(input);
  cont.appendChild(nota);

  btnRuta.parentNode.insertBefore(cont, btnRuta);
}

/** 1. CAPTURA Y FORMATEO DE FECHA FUTURA (departAt sin codificar %3A). */
function leerFechaFuturaDesdeUIApp() {
  let fechaInput = document.getElementById(ID_SELECTOR_FECHA_FUTURA)?.value || "";
  if (!fechaInput && departAtSeleccionadoIsoApp) {
    fechaInput = departAtSeleccionadoIsoApp;
  }
  return fechaInput;
}

function formatearFechaFuturaTomTomApp(fechaInput) {
  if (!fechaInput) return "";
  let fechaFinal = String(fechaInput).split(".")[0];
  if (fechaFinal.endsWith("Z")) {
    fechaFinal = fechaFinal.slice(0, -1);
  }
  if (fechaFinal.length === 16) {
    fechaFinal += ":00";
  }
  return fechaFinal;
}

/**
 * Construye la URL de calculateRoute (fecha futura + maxAlternatives).
 * departAt se concatena en texto plano para conservar ":" sin %3A.
 */
function construirUrlCalculateRouteTomTomApp(points, apiKey, opciones = {}) {
  const params = new URLSearchParams({
    key: apiKey,
    routeType: "fastest",
    travelMode: "car",
    routeRepresentation: "polyline"
  });
  params.append("sectionType", "traffic");
  params.append("sectionType", "motorway");
  if (opciones.computeBestOrder) {
    params.set("computeBestOrder", "true");
  }

  let urlBase = `https://api.tomtom.com/routing/1/calculateRoute/${points}/json`;
  const fechaFinal = formatearFechaFuturaTomTomApp(
    opciones.fechaInput ?? leerFechaFuturaDesdeUIApp()
  );

  // maxAlternatives rompe la geometría multiparada (solo pinta el 1.er leg).
  const numParadas = Number(opciones.numParadas) || 0;
  const paramAlternativas =
    ACTIVAR_RUTAS_ALTERNATIVAS_TOMTOM_APP && numParadas <= 1
      ? "&maxAlternatives=2"
      : "";

  if (fechaFinal) {
    urlBase +=
      "?" +
      params.toString() +
      "&traffic=true&computeTravelTimeFor=all" +
      paramAlternativas +
      "&departAt=" +
      fechaFinal;
  } else {
    urlBase +=
      "?" +
      params.toString() +
      "&traffic=true&departAt=now" +
      paramAlternativas;
  }

  return urlBase;
}

function parchearFetchTomTomConDepartAt() {
  if (fetchTomTomPatcheadoApp) return;
  if (typeof window.fetch !== "function") return;

  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const urlOriginal = typeof input === "string" ? input : input?.url;
    if (
      typeof urlOriginal !== "string" ||
      !urlOriginal.includes("api.tomtom.com/routing/1/calculateRoute/")
    ) {
      return fetchOriginal(input, init);
    }

    try {
      const urlParseada = new URL(urlOriginal);
      const matchPoints = urlParseada.pathname.match(/\/calculateRoute\/(.+)\/json$/);
      if (!matchPoints?.[1]) {
        return fetchOriginal(input, init);
      }

      const points = matchPoints[1];
      const apiKey =
        urlParseada.searchParams.get("key") ||
        (typeof obtenerClaveTomTom === "function"
          ? obtenerClaveTomTom()
          : window.TOMTOM_API_KEY || "");

      const numWaypoints = points.split(":").filter(Boolean).length;
      const numParadas = Math.max(0, numWaypoints - 1);

      const urlTomTom = construirUrlCalculateRouteTomTomApp(points, apiKey, {
        fechaInput: leerFechaFuturaDesdeUIApp(),
        computeBestOrder:
          urlParseada.searchParams.get("computeBestOrder") === "true",
        numParadas
      });

      console.log("🚀 URL Enviada a TomTom:", urlTomTom);

      if (typeof input === "string") {
        return fetchOriginal(urlTomTom, init);
      }
      const req = new Request(urlTomTom, input);
      return fetchOriginal(req, init);
    } catch {
      return fetchOriginal(input, init);
    }
  };

  fetchTomTomPatcheadoApp = true;
}

function leerEstadoGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const estado = JSON.parse(raw);
    if (estado?.version !== 1) return null;
    return estado;
  } catch {
    return null;
  }
}

function limpiarEstadoGuardado() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("No se pudo borrar el estado guardado:", e);
  }
}

function programarGuardadoEstado() {
  if (restaurandoSesion) return;
  clearTimeout(guardarEstadoTimeout);
  guardarEstadoTimeout = setTimeout(() => guardarEstadoSesion(), 400);
}

function guardarEstadoSesion() {
  const origen = obtenerOrigenRuta();
  const select = document.getElementById("select-origen");
  const valorOrigen = select?.value ?? "gps";
  const maquinasIds = obtenerSeleccionadosIds().filter((id) =>
    MAQUINAS.some((m) => m.id === id)
  );

  const estado = {
    version: 1,
    origenSelect: valorOrigen,
    maquinasSeleccionadas: maquinasIds,
    textoFiltroZona: textoFiltroActual || "",
    rutaCalculada: estadoRutaReponedor != null && maquinasIds.length > 0
  };

  if (origen?.esGPS && typeof coordenadasValidas === "function" && coordenadasValidas(origen)) {
    estado.origenGps = {
      lat: origen.lat,
      lon: origen.lon ?? origen.lng,
      precision: origen.precision ?? null
    };
  } else if (origen?.esMaquina && origen.maquinaId) {
    estado.origenMaquinaId = origen.maquinaId;
  } else if (valorOrigen !== "gps") {
    const id = Number(valorOrigen);
    if (Number.isFinite(id) && obtenerMaquinaPorId(id)) {
      estado.origenMaquinaId = id;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch (e) {
    console.warn("No se pudo guardar el estado en localStorage:", e);
  }
}

function reanudarSeguimientoGPS() {
  if (!navigator.geolocation?.watchPosition || !esEntornoSeguroParaGPS()) {
    return;
  }

  detenerSeguimientoGPS();

  gpsWatchId = navigator.geolocation.watchPosition(
    (position) => {
      if (aplicarPosicionGPS(position, { esPrimeraLectura: false })) {
        programarGuardadoEstado();
      }
    },
    (error) => {
      const estado = document.getElementById("geo-estado");
      if (estado && origenRuta?.esGPS) {
        estado.className = "small geo-estado error";
        estado.textContent = mensajeErrorGeolocalizacion(error);
      }
    },
    opcionesGPS
  );
}

function restaurarOrigenDesdeEstado(estado) {
  const select = document.getElementById("select-origen");
  const geo = document.getElementById("geo-estado");

  if (estado.origenGps) {
    const lat = Number(estado.origenGps.lat);
    const lon = Number(estado.origenGps.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return false;
    }

    if (select) select.value = "gps";
    origenRuta = {
      nombre: "Tu ubicación",
      lat,
      lon,
      lng: lon,
      zona: "GPS",
      esGPS: true,
      esMaquina: false,
      maquinaId: null,
      precision: estado.origenGps.precision ?? null
    };
    colocarMarcadorGpsUsuario(lat, lon, estado.origenGps.precision);
    actualizarInfoOrigen();
    if (geo) {
      geo.className = "small geo-estado ok";
      geo.textContent =
        "Ubicación restaurada. Reactivando seguimiento GPS en segundo plano…";
    }
    reanudarSeguimientoGPS();
    return true;
  }

  if (estado.origenMaquinaId) {
    const maquina = obtenerMaquinaPorId(estado.origenMaquinaId);
    if (!maquina) return false;
    if (select) select.value = String(maquina.id);
    establecerOrigenMaquina(maquina, { centrar: false, limpiarRuta: false });
    if (geo) {
      geo.className = "small geo-estado ok";
      geo.textContent = `Origen restaurado: ${maquina.nombre}`;
    }
    return true;
  }

  return false;
}

async function restaurarEstadoDesdeLocalStorage() {
  const estado = leerEstadoGuardado();
  if (!estado?.rutaCalculada) return;

  const ids = (estado.maquinasSeleccionadas || []).filter((id) =>
    MAQUINAS.some((m) => m.id === id)
  );
  if (ids.length === 0) return;

  restaurandoSesion = true;

  try {
    const resumenDiv = document.getElementById("resumen");
    if (resumenDiv) {
      resumenDiv.innerHTML = "<p>Restaurando tu última sesión…</p>";
    }

    if (estado.textoFiltroZona?.trim()) {
      const inputZona = document.getElementById("input-zona");
      if (inputZona) inputZona.value = estado.textoFiltroZona;
      textoFiltroActual = estado.textoFiltroZona;
      maquinasVisibles = filtrarMaquinas(estado.textoFiltroZona);
      actualizarMarcadoresMaquinas(maquinasVisibles);
      actualizarIndicadorFiltro(estado.textoFiltroZona, maquinasVisibles.length);
    }

    renderListaMaquinas(maquinasVisibles, ids);

    if (!restaurarOrigenDesdeEstado(estado)) {
      if (resumenDiv) {
        resumenDiv.innerHTML =
          "<p>No se pudo restaurar el punto de partida guardado.</p>";
      }
      return;
    }

    await calcularRuta({ resolverOrigen: false });

    const geo = document.getElementById("geo-estado");
    if (geo && !geo.classList.contains("error")) {
      geo.className = "small geo-estado ok";
      geo.textContent = "Ruta restaurada desde la última sesión.";
    }
  } catch (e) {
    console.warn("Restauración de sesión:", e);
  } finally {
    restaurandoSesion = false;
  }
}

function initSelectOrigen() {
  const select = document.getElementById("select-origen");
  const optgroup = document.createElement("optgroup");
  optgroup.label = "Empezar desde una máquina";

  [...MAQUINAS]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .forEach((m) => {
      const option = document.createElement("option");
      option.value = String(m.id);
      option.textContent = m.nombre;
      optgroup.appendChild(option);
    });

  select.appendChild(optgroup);
}

function marcarMaquinaEnLista(id, checked) {
  const chk = document.getElementById(`maq-${id}`);
  if (chk) chk.checked = checked;
}

/**
 * Recalcula la ruta al cambiar paradas u origen (debounce para no saturar TomTom).
 */
function recalcularRutaAutomatica() {
  if (restaurandoSesion) return;

  clearTimeout(recalcularRutaTimer);
  recalcularRutaTimer = setTimeout(() => {
    recalcularRutaAutomaticaAhora();
  }, 300);
}

async function recalcularRutaAutomaticaAhora() {
  if (
    misParadasSeleccionadas.length === 0 &&
    obtenerSeleccionados().length > 0
  ) {
    obtenerSeleccionados().forEach((m) => {
      if (!misParadasSeleccionadas.some((p) => p.id === m.id)) {
        misParadasSeleccionadas.push(paradaParaItinerario(m));
      }
    });
  }
  await invocarEnrutamientoTomTom();
}

function detenerSeguimientoGPS() {
  if (gpsWatchId != null && navigator.geolocation?.clearWatch) {
    navigator.geolocation.clearWatch(gpsWatchId);
  }
  gpsWatchId = null;
}

function limpiarMarcadoresOrigen() {
  detenerSeguimientoGPS();
  if (repositorMarker) {
    map.removeLayer(repositorMarker);
    repositorMarker = null;
  }
  if (origenMaquinaMarker) {
    map.removeLayer(origenMaquinaMarker);
    origenMaquinaMarker = null;
  }
}

function quitarMarcadorOrigenMaquina() {
  if (origenMaquinaMarker) {
    map.removeLayer(origenMaquinaMarker);
    origenMaquinaMarker = null;
  }
}

function textoPopupGpsUsuario(precision) {
  return (
    `<b>Tu ubicación</b><br>Punto de partida de la ruta` +
    (precision ? `<br>Precisión: ±${Math.round(precision)} m` : "") +
    `<br><span class="small">Actualización en tiempo real</span>`
  );
}

function actualizarInfoOrigen() {
  const origen = obtenerOrigenRuta();
  const info = document.getElementById("origen-info");

  if (!origen) {
    info.innerHTML = '<p class="small">Selecciona un punto de partida.</p>';
    return;
  }

  let tipo = "Máquina (origen)";
  if (origen.esGPS) tipo = "Ubicación actual (GPS)";
  else if (origen.esMaquina) tipo = "Máquina seleccionada como origen";

  info.innerHTML =
    `<p><strong>${origen.nombre}</strong><br>` +
    `${tipo}<br>` +
    `Lat: ${origen.lat.toFixed(6)}, Lng: ${origen.lng.toFixed(6)}</p>`;
}

const opcionesGPS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

function esEntornoSeguroParaGPS() {
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function mensajeErrorGeolocalizacion(error) {
  if (!esEntornoSeguroParaGPS()) {
    return (
      "Error: Permiso denegado o entorno no seguro. " +
      "Abre la app con npm run dev (http://localhost), no con file://."
    );
  }

  if (!error || typeof error.code === "undefined") {
    return "Error: No se pudo obtener la ubicación.";
  }

  switch (error.code) {
    case 1:
    case error.PERMISSION_DENIED:
      return (
        "Error: Permiso denegado o entorno no seguro. " +
        "Permite la ubicación en el navegador o usa localhost con npm run dev."
      );
    case 2:
    case error.POSITION_UNAVAILABLE:
      return "Error: Posición no disponible. Comprueba que el GPS esté activo.";
    case 3:
    case error.TIMEOUT:
      return "Error: Tiempo agotado (10 s). Vuelve a intentar en un lugar con mejor señal.";
    default:
      return `Error: ${error.message || "Fallo al obtener la ubicación."}`;
  }
}

function actualizarMarcadorGpsUsuario(lat, lng, precision) {
  if (!repositorMarker) return;
  repositorMarker.setLatLng([lat, lng]);
  repositorMarker.setPopupContent(textoPopupGpsUsuario(precision));
  repositorMarker.bringToFront();
}

function colocarMarcadorGpsUsuario(lat, lng, precision) {
  quitarMarcadorOrigenMaquina();

  if (repositorMarker) {
    actualizarMarcadorGpsUsuario(lat, lng, precision);
    return;
  }

  repositorMarker = L.circleMarker([lat, lng], {
    radius: 12,
    fillColor: "#0078d4",
    color: "#ffffff",
    weight: 3,
    opacity: 1,
    fillOpacity: 0.95
  })
    .addTo(map)
    .bindPopup(textoPopupGpsUsuario(precision));

  repositorMarker.bringToFront();
}

function aplicarPosicionGPS(position, { esPrimeraLectura = false } = {}) {
  const { latitude, longitude, accuracy } = position.coords;
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }

  origenRuta = {
    nombre: "Tu ubicación",
    lat,
    lon,
    lng: lon,
    zona: "GPS",
    esGPS: true,
    esMaquina: false,
    maquinaId: null,
    precision: accuracy
  };

  if (esPrimeraLectura) {
    const hayParadas =
      misParadasSeleccionadas.length > 0 || obtenerSeleccionados().length > 0;
    if (!hayParadas) {
      limpiarRutaEnMapa();
    }
    colocarMarcadorGpsUsuario(lat, lon, accuracy);
    actualizarInfoOrigen();
    if (!hayParadas) {
      centrarMapaEn(lat, lon, 15);
    }
  } else {
    colocarMarcadorGpsUsuario(lat, lon, accuracy);
    actualizarInfoOrigen();
    if (estadoRutaReponedor && !restaurandoSesion) {
      programarGuardadoEstado();
    }
  }

  return true;
}

function colocarMarcadorOrigenMaquina(maquina) {
  limpiarMarcadoresOrigen();
  origenMaquinaMarker = L.marker([maquina.lat, maquina.lng], {
    icon: iconoOrigenMaquina,
    title: `Origen: ${maquina.nombre}`,
    zIndexOffset: 1000
  })
    .addTo(map)
    .bindPopup(`<b>Origen de ruta</b><br>${maquina.nombre}`);
}

function centrarMapaEn(lat, lng, zoom = 14) {
  map.flyTo([lat, lng], zoom, { duration: 0.7 });
}

function limpiarLineasRutaDelMapa() {
  if (typeof limpiarLineasRuta === "function") {
    limpiarLineasRuta(map);
  } else if (typeof limpiarRutaTomTom === "function") {
    limpiarRutaTomTom(map);
  }
}

function limpiarGrupoLineasRutaApp(mapa) {
  if (mapa && grupoLineasRutaApp && mapa.hasLayer(grupoLineasRutaApp)) {
    mapa.removeLayer(grupoLineasRutaApp);
  }
  grupoLineasRutaApp = null;
}

/** Registro de capas Leaflet (principal + alternativas en segundo plano). */
function limpiarCapasRutaRegistroApp(mapa) {
  if (!window.capasRuta) window.capasRuta = [];
  window.capasRuta.forEach((capa) => {
    if (mapa && capa && mapa.hasLayer(capa)) {
      mapa.removeLayer(capa);
    }
  });
  window.capasRuta = [];

  if (!window.capasRuta) window.capasRuta = [];
  window.capasRuta.forEach((capa) => {
    if (mapa && capa && mapa.hasLayer(capa)) {
      mapa.removeLayer(capa);
    }
  });
  window.capasRuta = [];

  const panelAtasco = document.getElementById("panel-alerta-atasco-pasivo");
  if (panelAtasco) panelAtasco.hidden = true;

  limpiarRutasSecundariasRespaldoEnMapa(mapa);
  const bannerIncidencias = document.getElementById("alerta-incidencias-ruta");
  if (bannerIncidencias) bannerIncidencias.remove();
}

function registrarCapasGrupoEnWindowCapasRuta(grupo) {
  if (!window.capasRuta) window.capasRuta = [];
  (grupo?.getLayers?.() || []).forEach((capa) => {
    window.capasRuta.push(capa);
  });
}

function limpiarCapasRuta() {
  limpiarLineasRutaDelMapa();
  limpiarCapasRutaRegistroApp(map);
  limpiarGrupoLineasRutaApp(map);
  limpiarPanelTraficoMenuLateral();
  if (capasTraficoTomTom) {
    capasTraficoTomTom.ocultarDeRuta();
  }
}

function esSeccionPintableEnMapaApp(seccion) {
  const tipo = (seccion?.sectionType || "").toUpperCase();
  return tipo === "TRAFFIC" || tipo === "MOTORWAY";
}

function ordenarSeccionesParaPintadoApp(a, b) {
  const diff = (a.startPointIndex ?? 0) - (b.startPointIndex ?? 0);
  if (diff !== 0) return diff;
  const ta = (a.sectionType || "").toUpperCase();
  const tb = (b.sectionType || "").toUpperCase();
  if (ta === "MOTORWAY" && tb === "TRAFFIC") return -1;
  if (ta === "TRAFFIC" && tb === "MOTORWAY") return 1;
  return 0;
}

/** Siempre la ruta principal multiparada (primer viaje de TomTom). */
function rutaPrincipalTomTomApp(data) {
  return data?.routes?.[0] ?? null;
}

/**
 * Con maxAlternatives, routes[0] a veces NO es el viaje multiparada completo.
 * Elige la ruta con más legs/puntos y la pone primero.
 */
function puntuacionRutaMultiparadaApp(ruta, paradasEsperadas = 0) {
  const legs = ruta?.legs?.length || 0;
  const puntos = polylineCompletaRutaPrincipalApp(ruta).length;
  let score = puntos + legs * 500;
  if (paradasEsperadas > 0 && legs >= paradasEsperadas) {
    score += 1_000_000;
  }
  return score;
}

function datosTomTomRutaPrincipalPrimeroApp(data, paradasEsperadas = 0) {
  const rutas = data?.routes;
  if (!rutas?.length) return data;
  if (rutas.length === 1) return data;

  let idxMejor = 0;
  let mejorScore = -1;
  rutas.forEach((ruta, idx) => {
    const score = puntuacionRutaMultiparadaApp(ruta, paradasEsperadas);
    if (score > mejorScore) {
      mejorScore = score;
      idxMejor = idx;
    }
  });

  if (idxMejor === 0) return data;

  const principal = rutas[idxMejor];
  const otras = rutas.filter((_, idx) => idx !== idxMejor);
  console.warn("TomTom: reordenando routes — la multiparada completa no estaba en [0]", {
    indiceElegido: idxMejor,
    legsElegidos: principal?.legs?.length ?? 0,
    puntosElegidos: polylineCompletaRutaPrincipalApp(principal).length
  });
  return { ...data, routes: [principal, ...otras] };
}

function puntosLegComoPolylineApp(leg) {
  return (leg?.points || [])
    .map((p) => [
      Number(p.latitude ?? p.lat),
      Number(p.longitude ?? p.lon ?? p.lng)
    ])
    .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]));
}

/** Une todos los legs de routes[0] (solo para contorno / alternativas grises). */
function polylineConcatenandoLegsApp(rutaPrincipal) {
  const puntos = [];
  (rutaPrincipal?.legs || []).forEach((leg) => {
    puntosLegComoPolylineApp(leg).forEach((pt) => {
      const ultimo = puntos[puntos.length - 1];
      if (ultimo && ultimo[0] === pt[0] && ultimo[1] === pt[1]) return;
      puntos.push(pt);
    });
  });
  return puntos;
}

function polylineDesdePointsRutaTomTomApp(points) {
  return (points || [])
    .map((p) => [
      Number(p.latitude ?? p.lat),
      Number(p.longitude ?? p.lon ?? p.lng)
    ])
    .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]));
}

function contarLegsConGeometriaApp(legs) {
  return (legs || []).filter((leg) => puntosLegComoPolylineApp(leg).length >= 2).length;
}

/**
 * Con maxAlternatives TomTom a veces rellena routes[0].points completo
 * pero deja legs[1..n] sin geometría → solo se ve el primer tramo.
 */
function multiparadaLegsIncompletosApp(rutaPrincipal) {
  const legs = rutaPrincipal?.legs || [];
  if (!legs.length) return true;

  const legsConGeo = contarLegsConGeometriaApp(legs);
  if (legsConGeo === 0) return true;
  if (legsConGeo < legs.length) return true;

  const polyLegs = polylineConcatenandoLegsApp(rutaPrincipal);
  const polyRuta = polylineDesdePointsRutaTomTomApp(rutaPrincipal.points);
  if (polyRuta.length >= 2 && polyLegs.length < polyRuta.length * 0.85) {
    return true;
  }

  return false;
}

function polylineCompletaRutaPrincipalApp(rutaPrincipal) {
  const polyLegs = polylineConcatenandoLegsApp(rutaPrincipal);
  const polyRuta = polylineDesdePointsRutaTomTomApp(rutaPrincipal?.points);
  if (polyRuta.length < 2) return polyLegs;
  if (polyLegs.length < 2) return polyRuta;
  return polyRuta.length >= polyLegs.length ? polyRuta : polyLegs;
}

/**
 * Polyline + sections con índices coherentes (evita todo verde por desfase legs/points).
 */
function contextoPintadoTraficoRutaPrincipalApp(rutaPrincipal) {
  const polyRuta = polylineDesdePointsRutaTomTomApp(rutaPrincipal?.points);
  const seccionesRuta = [...(rutaPrincipal?.sections || [])].filter(
    esSeccionPintableEnMapaApp
  );
  const seccionesLegs = seccionesGlobalesRutaPrincipalApp(rutaPrincipal);
  const traficoEnRuta = seccionesRuta.some(
    (s) => (s.sectionType || "").toUpperCase() === "TRAFFIC"
  );
  const traficoEnLegs = seccionesLegs.some(
    (s) => (s.sectionType || "").toUpperCase() === "TRAFFIC"
  );

  if (polyRuta.length >= 2 && (traficoEnRuta || !traficoEnLegs)) {
    return {
      polyline: polyRuta,
      secciones: traficoEnRuta ? seccionesRuta : seccionesLegs
    };
  }

  const polyLegs = polylineConcatenandoLegsApp(rutaPrincipal);
  return { polyline: polyLegs, secciones: seccionesLegs };
}

function puntosTramoSeccionEnPolylineApp(seccion, polyline) {
  if (!polyline?.length) return [];

  const inicio = Math.max(0, Number(seccion.startPointIndex) || 0);
  const fin = Math.min(
    polyline.length - 1,
    Number(seccion.endPointIndex) ?? inicio
  );
  if (fin < inicio) return [];

  let tramo = polyline.slice(inicio, fin + 1);
  if (tramo.length < 2 && fin + 1 < polyline.length) {
    tramo = polyline.slice(inicio, fin + 2);
  }
  return tramo.length >= 2 ? tramo : [];
}

/** Secciones globales: route.sections + leg.sections con offset acumulado. */
function seccionesGlobalesRutaPrincipalApp(rutaPrincipal) {
  const vistos = new Set();
  const lista = [];

  const agregar = (seccion, offset) => {
    const clave = `${offset}:${seccion.startPointIndex}:${seccion.endPointIndex}:${seccion.sectionType}`;
    if (vistos.has(clave)) return;
    vistos.add(clave);
    lista.push({
      ...seccion,
      startPointIndex: (Number(seccion.startPointIndex) || 0) + offset,
      endPointIndex: (Number(seccion.endPointIndex) || 0) + offset
    });
  };

  [...(rutaPrincipal?.sections || [])].forEach((s) => agregar(s, 0));

  let offset = 0;
  (rutaPrincipal?.legs || []).forEach((leg) => {
    const pts = puntosLegComoPolylineApp(leg);
    [...(leg.sections || [])].forEach((s) => agregar(s, offset));
    offset += Math.max(0, pts.length - 1);
  });

  return lista
    .filter((s) => esSeccionPintableEnMapaApp(s))
    .sort(ordenarSeccionesParaPintadoApp);
}

/**
 * Recorta los points del leg según índices de la section (multiparada TomTom).
 */
function puntosTramoSeccionEnLegApp(leg, seccion) {
  const puntosLeg = puntosLegComoPolylineApp(leg);
  if (puntosLeg.length < 2) return [];

  const inicio = Math.max(0, Number(seccion.startPointIndex) || 0);
  const fin = Math.min(
    puntosLeg.length - 1,
    Number(seccion.endPointIndex) ?? inicio
  );
  if (fin < inicio) return [];

  let tramo = puntosLeg.slice(inicio, fin + 1);
  if (tramo.length < 2 && fin + 1 < puntosLeg.length) {
    tramo = puntosLeg.slice(inicio, fin + 2);
  }
  return tramo.length >= 2 ? tramo : [];
}

const CATEGORIAS_TRAFICO_ROJO_APP = new Set([
  "JAM",
  "HEAVY_JAM",
  "STATIONARY",
  "ROAD_CLOSURE"
]);

const CATEGORIAS_TRAFICO_AMARILLO_APP = new Set([
  "SLOW",
  "QUEUE",
  "ROAD_WORK",
  "OTHER"
]);

/**
 * Misma regla para mapa y menú. TomTom en predicción (p. ej. viernes 16:00) suele
 * traer effectiveSpeedInKmh / simpleCategory sin delayInSeconds en cada tramo.
 */
function clasificarTramoTraficoApp(seccion) {
  const retraso = Number(seccion.delayInSeconds) || 0;
  const magnitude =
    Number(seccion.magnitudeOfDelay ?? seccion.magnitudOfDelay) || 0;
  const categoria = String(seccion.simpleCategory || "").toUpperCase();
  const velEfectiva = Number(seccion.effectiveSpeedInKmh);

  if (CATEGORIAS_TRAFICO_ROJO_APP.has(categoria)) return "rojo";
  if (CATEGORIAS_TRAFICO_AMARILLO_APP.has(categoria)) return "amarillo";

  if (magnitude >= 3 || retraso > 90) return "rojo";
  if (magnitude >= 2 || retraso > 30) return "amarillo";
  if (magnitude >= 1 || retraso > 0) return "amarillo";

  if (Number.isFinite(velEfectiva)) {
    if (velEfectiva < 25) return "rojo";
    if (velEfectiva < 50) return "amarillo";
  }

  const viaje = Number(seccion.travelTimeInSeconds) || 0;
  const sinTrafico = Number(seccion.noTrafficTravelTimeInSeconds) || 0;
  if (sinTrafico > 0 && viaje > sinTrafico) {
    const retrasoTramo = viaje - sinTrafico;
    if (retrasoTramo > 90) return "rojo";
    if (retrasoTramo > 20) return "amarillo";
  }

  return "verde";
}

/** Misma regla que el tramo sintético pintado en mapa (resumen TomTom). */
function nivelTraficoSinteticoResumenRutaApp(rutaPrincipal) {
  const summary = rutaPrincipal?.summary;
  if (!summary) return null;

  const delay = Number(summary.trafficDelayInSeconds) || 0;
  const trafficLen = Number(summary.trafficLengthInMeters) || 0;
  const totalLen = Number(summary.lengthInMeters) || 0;
  const sinTrafico = Number(summary.noTrafficTravelTimeInSeconds) || 0;
  const viaje = Number(summary.travelTimeInSeconds) || 0;

  if (
    delay < 15 &&
    trafficLen < 80 &&
    !(sinTrafico > 0 && viaje > sinTrafico + 30)
  ) {
    return null;
  }

  let fraccion = 0.3;
  if (totalLen > 0 && trafficLen > 0) {
    fraccion = Math.min(0.75, trafficLen / totalLen);
  } else if (sinTrafico > 0 && viaje > sinTrafico) {
    fraccion = Math.min(0.65, (viaje - sinTrafico) / viaje);
  } else if (viaje > 0 && delay > 0) {
    fraccion = Math.min(0.55, delay / viaje);
  }

  return delay > 300 || fraccion > 0.45 ? "rojo" : "amarillo";
}

function pintarTraficoDesdeResumenRutaApp(
  grupoLineasRuta,
  rutaPrincipal,
  polyline,
  opciones = {}
) {
  if (!polyline?.length || polyline.length < 2) return false;

  const nivel = nivelTraficoSinteticoResumenRutaApp(rutaPrincipal);
  if (!nivel) return false;

  const n = polyline.length;
  const summary = rutaPrincipal.summary;
  const delay = Number(summary.trafficDelayInSeconds) || 0;
  const trafficLen = Number(summary.trafficLengthInMeters) || 0;
  const totalLen = Number(summary.lengthInMeters) || 0;
  const sinTrafico = Number(summary.noTrafficTravelTimeInSeconds) || 0;
  const viaje = Number(summary.travelTimeInSeconds) || 0;

  let fraccion = 0.3;
  if (totalLen > 0 && trafficLen > 0) {
    fraccion = Math.min(0.75, trafficLen / totalLen);
  } else if (sinTrafico > 0 && viaje > sinTrafico) {
    fraccion = Math.min(0.65, (viaje - sinTrafico) / viaje);
  } else if (viaje > 0 && delay > 0) {
    fraccion = Math.min(0.55, delay / viaje);
  }

  const largoTramo = Math.max(2, Math.round(n * fraccion));
  const inicio = Math.max(0, Math.floor((n - largoTramo) * 0.3));
  const tramo = polyline.slice(inicio, inicio + largoTramo);

  agregarPolylineAlGrupoRuta(
    grupoLineasRuta,
    tramo,
    COLORES_TRAMO_TRAFICO_APP[nivel],
    opciones
  );
  return true;
}

function incrementarConteoTramoTraficoApp(conteo, seccion) {
  const nivel = clasificarTramoTraficoApp(seccion);
  if (nivel === "rojo") conteo.rojo += 1;
  else if (nivel === "amarillo") conteo.amarillo += 1;
  else conteo.verde += 1;
}

/** Misma lógica que pintarRutaPrincipalFallbackPolylineApp (lo que ves en el mapa). */
function contarTramosTraficoGlobalDesdeRutaApp(rutaPrincipal) {
  const conteo = { rojo: 0, amarillo: 0, verde: 0 };
  const { polyline, secciones } = contextoPintadoTraficoRutaPrincipalApp(rutaPrincipal);

  if (polyline.length < 2) return conteo;

  if (!secciones.length) {
    const nivel = nivelTraficoSinteticoResumenRutaApp(rutaPrincipal);
    if (nivel === "rojo") conteo.rojo = 1;
    else if (nivel === "amarillo") conteo.amarillo = 1;
    else conteo.verde = 1;
    return conteo;
  }

  const indicesCubiertos = indicesCubiertosPorSeccionesApp(
    secciones,
    polyline.length
  );
  let tramosNoVerdes = 0;

  let i = 0;
  while (i < polyline.length) {
    while (i < polyline.length && indicesCubiertos.has(i)) i++;
    const inicio = i;
    while (i < polyline.length && !indicesCubiertos.has(i)) i++;
    if (i > inicio) conteo.verde += 1;
  }

  secciones.forEach((seccion) => {
    const tipo = (seccion.sectionType || "").toUpperCase();
    if (tipo !== "TRAFFIC" && tipo !== "MOTORWAY") return;

    const puntosTramo = puntosTramoSeccionEnPolylineApp(seccion, polyline);
    if (puntosTramo.length < 2) {
      if (tipo === "TRAFFIC") {
        incrementarConteoTramoTraficoApp(conteo, seccion);
        if (clasificarTramoTraficoApp(seccion) !== "verde") tramosNoVerdes += 1;
      }
      return;
    }

    incrementarConteoTramoTraficoApp(conteo, seccion);
    if (clasificarTramoTraficoApp(seccion) !== "verde") tramosNoVerdes += 1;
  });

  if (tramosNoVerdes === 0) {
    const nivel = nivelTraficoSinteticoResumenRutaApp(rutaPrincipal);
    if (nivel === "rojo") conteo.rojo += 1;
    else if (nivel === "amarillo") conteo.amarillo += 1;
  }

  return conteo;
}

function colorTramoTraficoApp(seccion) {
  return COLORES_TRAMO_TRAFICO_APP[clasificarTramoTraficoApp(seccion)];
}

function indicesCubiertosPorSeccionesApp(secciones, longitudPolyline) {
  const cubierto = new Set();
  secciones.forEach((seccion) => {
    const inicio = Math.max(0, seccion.startPointIndex ?? 0);
    const fin = Math.min(
      longitudPolyline - 1,
      seccion.endPointIndex ?? inicio
    );
    for (let i = inicio; i <= fin; i++) {
      cubierto.add(i);
    }
  });
  return cubierto;
}

function agregarPolylineAlGrupoRuta(grupo, puntos, color, opciones) {
  if (puntos.length < 2) return;
  grupo.addLayer(
    L.polyline(puntos, {
      color,
      weight: opciones.rutaEsquivada ? 8 : 6,
      opacity: 0.9,
      lineJoin: "round",
      lineCap: "round",
      dashArray: opciones.rutaEsquivada ? "14 8" : undefined
    })
  );
}

/** Tramos de la polyline global no cubiertos por ninguna section (calles a máquinas). */
function pintarHuecosPolylineEnGrupo(grupo, polyline, indicesCubiertos, color, opciones) {
  let i = 0;
  while (i < polyline.length) {
    while (i < polyline.length && indicesCubiertos.has(i)) i++;
    const inicio = i;
    while (i < polyline.length && !indicesCubiertos.has(i)) i++;
    if (i <= inicio) continue;

    let desde = inicio;
    let hasta = i;
    if (hasta - desde < 2) {
      if (desde > 0) desde -= 1;
      if (hasta < polyline.length) hasta += 1;
    }
    agregarPolylineAlGrupoRuta(
      grupo,
      polyline.slice(desde, hasta),
      color,
      opciones
    );
  }
}

/**
 * Un tramo (leg) entre dos paradas: sections + slice de leg.points.
 */
function pintarTraficoLegMultiparada(grupoLineasRuta, leg, opciones = {}) {
  const puntosLeg = puntosLegComoPolylineApp(leg);
  if (puntosLeg.length < 2) return false;

  const seccionesLeg = [...(leg.sections || [])]
    .filter((s) => esSeccionPintableEnMapaApp(s))
    .sort(ordenarSeccionesParaPintadoApp);

  if (!seccionesLeg.length) {
    agregarPolylineAlGrupoRuta(
      grupoLineasRuta,
      puntosLeg,
      COLORES_TRAMO_TRAFICO_APP.verde,
      opciones
    );
    return true;
  }

  const indicesCubiertosLeg = indicesCubiertosPorSeccionesApp(
    seccionesLeg,
    puntosLeg.length
  );
  pintarHuecosPolylineEnGrupo(
    grupoLineasRuta,
    puntosLeg,
    indicesCubiertosLeg,
    COLORES_TRAMO_TRAFICO_APP.verde,
    opciones
  );

  seccionesLeg.forEach((seccion) => {
    const puntosTramo = puntosTramoSeccionEnLegApp(leg, seccion);
    if (puntosTramo.length < 2) return;
    agregarPolylineAlGrupoRuta(
      grupoLineasRuta,
      puntosTramo,
      colorTramoTraficoApp(seccion),
      opciones
    );
  });
  return true;
}

/** Fallback: polyline alineada con sections (índices TomTom coherentes). */
function pintarRutaPrincipalFallbackPolylineApp(grupoLineasRuta, rutaPrincipal, opciones = {}) {
  const { polyline, secciones } = contextoPintadoTraficoRutaPrincipalApp(rutaPrincipal);
  if (polyline.length < 2) return false;

  if (!secciones.length) {
    agregarPolylineAlGrupoRuta(
      grupoLineasRuta,
      polyline,
      COLORES_TRAMO_TRAFICO_APP.verde,
      opciones
    );
    return pintarTraficoDesdeResumenRutaApp(
      grupoLineasRuta,
      rutaPrincipal,
      polyline,
      opciones
    );
  }

  const indicesCubiertos = indicesCubiertosPorSeccionesApp(
    secciones,
    polyline.length
  );
  pintarHuecosPolylineEnGrupo(
    grupoLineasRuta,
    polyline,
    indicesCubiertos,
    COLORES_TRAMO_TRAFICO_APP.verde,
    opciones
  );

  let tramosTraficoColoreados = 0;
  secciones.forEach((seccion) => {
    const puntosTramo = puntosTramoSeccionEnPolylineApp(seccion, polyline);
    if (puntosTramo.length < 2) return;
    const nivel = clasificarTramoTraficoApp(seccion);
    if ((seccion.sectionType || "").toUpperCase() === "TRAFFIC" && nivel !== "verde") {
      tramosTraficoColoreados += 1;
    }
    agregarPolylineAlGrupoRuta(
      grupoLineasRuta,
      puntosTramo,
      colorTramoTraficoApp(seccion),
      opciones
    );
  });

  if (tramosTraficoColoreados === 0) {
    pintarTraficoDesdeResumenRutaApp(
      grupoLineasRuta,
      rutaPrincipal,
      polyline,
      opciones
    );
  }

  return true;
}

/** Multiparada: un solo trazo continuo (evita cortes entre legs). */
function usarPintadoContinuoMultiparadaApp(rutaPrincipal) {
  const legs = rutaPrincipal?.legs || [];
  return legs.length >= 2 || multiparadaLegsIncompletosApp(rutaPrincipal);
}

/**
 * Pinta data.routes[0]. Con 2+ paradas usa polyline global continua;
 * con 1 parada mantiene pintado por leg.
 */
function pintarRutaPrincipalMultiparadaEnMapa(mapa, data, opciones = {}) {
  limpiarGrupoLineasRutaApp(mapa);
  if (typeof limpiarLineasRuta === "function") {
    limpiarLineasRuta(mapa);
  }

  const dataOrdenado = datosTomTomRutaPrincipalPrimeroApp(
    data,
    opciones.paradasEsperadas || 0
  );
  const rutaPrincipal = rutaPrincipalTomTomApp(dataOrdenado);
  if (!rutaPrincipal) return null;

  const legs = rutaPrincipal.legs || [];
  const polyCompleta = polylineCompletaRutaPrincipalApp(rutaPrincipal);

  if (polyCompleta.length < 2 && contarLegsConGeometriaApp(legs) === 0) {
    console.warn("TomTom: sin geometría en routes[0]", {
      legs: legs.length,
      puntosRuta: rutaPrincipal.points?.length ?? 0
    });
    return null;
  }

  const grupoLineasRuta = L.featureGroup().addTo(mapa);
  grupoLineasRutaApp = grupoLineasRuta;

  if (opciones.rutaEsquivada && polyCompleta.length >= 2) {
    grupoLineasRuta.addLayer(
      L.polyline(polyCompleta, {
        color: "#ff00aa",
        weight: 10,
        opacity: 0.35,
        lineJoin: "round",
        lineCap: "round"
      })
    );
  }

  if (usarPintadoContinuoMultiparadaApp(rutaPrincipal) && polyCompleta.length >= 2) {
    const ctx = contextoPintadoTraficoRutaPrincipalApp(rutaPrincipal);
    const traficoSecs = ctx.secciones.filter(
      (s) => (s.sectionType || "").toUpperCase() === "TRAFFIC"
    ).length;
    console.log("TomTom: pintado continuo multiparada", {
      legs: legs.length,
      puntosPolyline: ctx.polyline.length,
      seccionesTrafico: traficoSecs,
      retrasoSeg: rutaPrincipal.summary?.trafficDelayInSeconds ?? 0,
      metrosTrafico: rutaPrincipal.summary?.trafficLengthInMeters ?? 0
    });
    pintarRutaPrincipalFallbackPolylineApp(
      grupoLineasRuta,
      rutaPrincipal,
      opciones
    );
    return grupoLineasRuta.getLayers().length > 0 ? grupoLineasRuta : null;
  }

  let legsPintados = 0;
  legs.forEach((leg) => {
    if (pintarTraficoLegMultiparada(grupoLineasRuta, leg, opciones)) {
      legsPintados += 1;
    }
  });

  if (legsPintados === 0 && polyCompleta.length >= 2) {
    pintarRutaPrincipalFallbackPolylineApp(
      grupoLineasRuta,
      rutaPrincipal,
      opciones
    );
  }

  return grupoLineasRuta.getLayers().length > 0 ? grupoLineasRuta : null;
}

/**
 * SEGUNDO PLANO AISLADO: solo routes[1..n], sin tocar routes[0] ni sus legs.
 */
function pintarRutasAlternativasSegundoPlano(mapaLeaflet, data) {
  if (!mapaLeaflet || !data?.routes || data.routes.length <= 1) return;

  if (!window.capasRuta) window.capasRuta = [];

  data.routes.slice(1).forEach((rutaAlt) => {
    const todosLosPuntosAlt = [];

    (rutaAlt.legs || []).forEach((legAlt) => {
      (legAlt.points || []).forEach((pt) => {
        const lat = Number(pt.latitude ?? pt.lat);
        const lon = Number(pt.longitude ?? pt.lon ?? pt.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        todosLosPuntosAlt.push([lat, lon]);
      });
    });

    if (todosLosPuntosAlt.length < 2) return;

    const lineaAlt = L.polyline(todosLosPuntosAlt, {
      color: "#9E9E9E",
      weight: 3,
      opacity: 0.6,
      dashArray: "5, 10"
    }).addTo(mapaLeaflet);

    lineaAlt._esRutaAlternativaTomTom = true;

    lineaAlt.on("click", function () {
      window.capasRuta.forEach((capa) => {
        if (
          capa instanceof L.Polyline &&
          capa._esRutaAlternativaTomTom &&
          capa.options.color === "#0056b3"
        ) {
          capa.setStyle({ color: "#9E9E9E", weight: 3, dashArray: "5, 10" });
        }
      });
      lineaAlt.setStyle({ color: "#0056b3", weight: 5, dashArray: null });
      console.log("Ruta secundaria seleccionada por el usuario.");
    });

    window.capasRuta.push(lineaAlt);
  });
}

/** Compatibilidad con llamadas existentes (esquivar incidencias, etc.). */
function pintarRutaTraficoFragmentadaEnMapa(mapa, data, opciones = {}) {
  return pintarRutaPrincipalMultiparadaEnMapa(mapa, data, opciones);
}

/** Contador #contador-trafico-personalizado: alineado con pintado continuo multiparada. */
function contarTramosTraficoDesdeDatos(data) {
  const rutaPrincipal = rutaPrincipalTomTomApp(data);
  if (!rutaPrincipal) {
    return { rojo: 0, amarillo: 0, verde: 0 };
  }

  if (usarPintadoContinuoMultiparadaApp(rutaPrincipal)) {
    return contarTramosTraficoGlobalDesdeRutaApp(rutaPrincipal);
  }

  const conteo = { rojo: 0, amarillo: 0, verde: 0 };

  let tramosNoVerdes = 0;
  (rutaPrincipal.legs || []).forEach((leg) => {
    [...(leg.sections || [])]
      .filter((s) => esSeccionPintableEnMapaApp(s))
      .forEach((seccion) => {
        const puntosTramo = puntosTramoSeccionEnLegApp(leg, seccion);
        const tipo = (seccion.sectionType || "").toUpperCase();
        if (puntosTramo.length < 2) {
          if (tipo === "TRAFFIC") {
            incrementarConteoTramoTraficoApp(conteo, seccion);
            if (clasificarTramoTraficoApp(seccion) !== "verde") tramosNoVerdes += 1;
          }
          return;
        }
        incrementarConteoTramoTraficoApp(conteo, seccion);
        if (clasificarTramoTraficoApp(seccion) !== "verde") tramosNoVerdes += 1;
      });
  });

  if (tramosNoVerdes === 0) {
    const nivel = nivelTraficoSinteticoResumenRutaApp(rutaPrincipal);
    if (nivel === "rojo") conteo.rojo += 1;
    else if (nivel === "amarillo") conteo.amarillo += 1;
  }

  const total = conteo.rojo + conteo.amarillo + conteo.verde;
  if (total > 0) return conteo;

  if (multiparadaLegsIncompletosApp(rutaPrincipal)) {
    return contarTramosTraficoGlobalDesdeRutaApp(rutaPrincipal);
  }

  return contarTramosTraficoGlobalDesdeRutaApp(rutaPrincipal);
}

function actualizarTraficoMenuDesdeDatos(data) {
  const rutaPrincipal = rutaPrincipalTomTomApp(data);
  const retrasoGlobal =
    Number(rutaPrincipal?.summary?.trafficDelayInSeconds) || 0;
  actualizarPanelTraficoMenuLateral(
    contarTramosTraficoDesdeDatos(data),
    retrasoGlobal
  );
}

/**
 * 2. PROCESAMIENTO TRAS RESPUESTA TOMTOM (principal aislada + alternativas aparte).
 * PRIORIDAD: data.routes[0].legs → pintarTraficoLegMultiparada (sections + slice).
 */
function procesarDatosTomTomMultiparadaApp(mapa, data, opciones = {}) {
  if (!data?.routes?.length) return null;

  limpiarCapasRutaRegistroApp(mapa);

  const dataOrdenado = datosTomTomRutaPrincipalPrimeroApp(
    data,
    opciones.paradasEsperadas || 0
  );

  // ==============================================================
  // PRIORIDAD MÁXIMA: RUTA PRINCIPAL MULTIPARADA (data.routes[0])
  // ==============================================================
  const capaPrincipal = pintarRutaPrincipalMultiparadaEnMapa(
    mapa,
    dataOrdenado,
    opciones
  );
  if (!capaPrincipal) return null;

  registrarCapasGrupoEnWindowCapasRuta(capaPrincipal);
  actualizarTraficoMenuDesdeDatos(dataOrdenado);

  const rutaPrincipal = dataOrdenado.routes[0];
  void analizarIncidenciasTraficoApp(rutaPrincipal, {
    mapa,
    paradasEsperadas: opciones.paradasEsperadas || 0,
    origen: opciones.origen ?? estadoRutaReponedor?.origen ?? null,
    destinoFinal:
      opciones.destinoFinal ??
      estadoRutaReponedor?.rutaOrdenada?.[
        (estadoRutaReponedor?.rutaOrdenada?.length || 0) - 1
      ] ??
      null,
    apiKey:
      opciones.apiKey ??
      estadoRutaReponedor?.claveTomTom ??
      (typeof obtenerClaveTomTom === "function" ? obtenerClaveTomTom() : ""),
    fechaInput: opciones.fechaInput ?? leerFechaFuturaDesdeUIApp(),
    seqRuta: opciones.seqRuta ?? calcularRutaSeq
  }).catch((err) => {
    console.warn("Análisis pasivo incidencias/ruta secundaria:", err);
  });

  return capaPrincipal;
}

/** Alias usado por esquivar incidencias y recálculos automáticos. */
function aplicarRutaMultiparadaTomTomAlMapa(mapa, datosTomTom, opciones = {}) {
  return procesarDatosTomTomMultiparadaApp(mapa, datosTomTom, opciones);
}

function ensurePanelTraficoMenuLateral() {
  if (document.getElementById("panel-trafico-ruta")) return;

  const resumenDiv = document.getElementById("resumen");
  if (!resumenDiv?.parentNode) return;

  const panel = document.createElement("div");
  panel.id = "panel-trafico-ruta";
  panel.className = "panel-trafico-ruta";
  panel.hidden = true;
  panel.innerHTML =
    '<p id="contador-trafico-personalizado" class="small">Tráfico: calcula una ruta para ver los tramos.</p>';
  resumenDiv.parentNode.insertBefore(panel, resumenDiv);
}

function ocultarPanelTraficoMenuLateral() {
  const panel = document.getElementById("panel-trafico-ruta");
  if (panel) panel.hidden = true;
}

function limpiarPanelTraficoMenuLateral() {
  conteoTraficoRutaApp = { verde: 0, amarillo: 0, rojo: 0 };
  ensurePanelTraficoMenuLateral();
  const el = document.getElementById("contador-trafico-personalizado");
  if (el) {
    el.textContent = "Tráfico: calcula una ruta para ver los tramos.";
  }
  ocultarPanelTraficoMenuLateral();
}

function actualizarPanelTraficoMenuLateral(conteo, retrasoGlobalSegundos = 0) {
  ensurePanelTraficoMenuLateral();
  const rojos = conteo.rojo ?? 0;
  const amarillos = conteo.amarillo ?? 0;
  const verdes = conteo.verde ?? 0;

  conteoTraficoRutaApp = { verde: verdes, amarillo: amarillos, rojo: rojos };

  const panel = document.getElementById("panel-trafico-ruta");
  const el =
    document.getElementById("contador-trafico-personalizado") ||
    document.getElementById("trafico-ruta-texto");
  if (!el) return;

  if (panel) panel.hidden = false;

  let html =
    "<strong>Tráfico:</strong> " +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.rojo}">${rojos} tramos rojos</span>, ` +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.amarillo}">${amarillos} amarillos</span>, ` +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.verde}">${verdes} verdes</span>`;

  const retraso = Number(retrasoGlobalSegundos) || 0;
  if (retraso > 0) {
    html += ` <span class="small">· retraso previsto en ruta: ${Math.round(retraso / 60)} min</span>`;
  }

  el.innerHTML = html;
}

function statsTraficoDesdeConteoApp(conteo) {
  return {
    fluido: conteo.verde,
    lento: conteo.amarillo,
    congestion: conteo.rojo,
    total: conteo.verde + conteo.amarillo + conteo.rojo
  };
}

/** Limpieza física + amnesia de estado antes de cada cálculo nuevo. */
function limpiarRutaAntesDeNuevoCalculo() {
  limpiarLineasRutaDelMapa();
  limpiarCapasRutaRegistroApp(map);
  limpiarGrupoLineasRutaApp(map);
  limpiarEstadoRutaInterno();
  ocultarResumenRutaFlotante();
}

function limpiarRutaEnMapa() {
  limpiarCapasRuta();
  limpiarEstadoRutaInterno();
  limpiarNumeroMarkers();
  ocultarResumenRutaFlotante();
}

function encuadrarRutaEnMapa(bounds) {
  if (bounds && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

/** Origen GPS + paradas + geometría: evita zoom solo a un tramo de tráfico mal indexado. */
function encuadrarVistaRutaCompleta(origen, paradas, boundsCapa) {
  const puntos = [];
  const latO = Number(origen?.lat);
  const lonO = Number(origen?.lon ?? origen?.lng);
  if (Number.isFinite(latO) && Number.isFinite(lonO)) {
    puntos.push(L.latLng(latO, lonO));
  }
  (paradas || []).forEach((p) => {
    const lat = Number(p.lat);
    const lon = Number(p.lon ?? p.lng);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      puntos.push(L.latLng(lat, lon));
    }
  });
  if (boundsCapa?.isValid?.()) {
    puntos.push(boundsCapa.getSouthWest(), boundsCapa.getNorthEast());
  }
  if (puntos.length > 0) {
    map.fitBounds(L.latLngBounds(puntos), { padding: [50, 50] });
  }
}

async function esquivarIncidenciaTomTom(incidencia) {
  if (!estadoRutaReponedor) {
    alert("Calcula primero una ruta óptima para poder esquivar incidencias.");
    return;
  }

  const rect = incidencia.avoidRectangle;
  if (!rect) {
    alert("No se pudo determinar la zona a evitar para esta incidencia.");
    return;
  }

  const { origen, rutaOrdenada, claveTomTom } = estadoRutaReponedor;
  const areasEvitadas = [...estadoRutaReponedor.areasEvitadas];
  const yaExiste = areasEvitadas.some(
    (r) =>
      r.southWestCorner.latitude === rect.southWestCorner.latitude &&
      r.southWestCorner.longitude === rect.southWestCorner.longitude
  );
  if (!yaExiste) {
    areasEvitadas.push(rect);
  }

  const resumenDiv = document.getElementById("resumen");
  limpiarRutaAntesDeNuevoCalculo();
  resumenDiv.innerHTML =
    "<p>Recalculando ruta esquivando incidencia...</p>";

  estadoRutaReponedor = {
    origen,
    rutaOrdenada,
    claveTomTom,
    areasEvitadas
  };

  try {
    const origenOk =
      typeof normalizarPuntoRuta === "function"
        ? normalizarPuntoRuta(origen)
        : origen;
    const paradasOk = rutaOrdenada.map((p) =>
      typeof normalizarPuntoRuta === "function" ? normalizarPuntoRuta(p) : p
    );

    const seqEsquivar = ++calcularRutaSeq;
    window.__rutaSeqActiva = seqEsquivar;

    const resultado = await calcularRutaTomTom(
      map,
      origenOk,
      paradasOk,
      claveTomTom,
      areasEvitadas,
      {
        rutaEsquivada: true,
        autoEvitarRoadblocks: false,
        omitirPintadoMapa: true
      },
      seqEsquivar
    );

    if (resultado?.areasEvitadas?.length) {
      estadoRutaReponedor.areasEvitadas = resultado.areasEvitadas;
    }

    if (!resultado?.data) {
      return;
    }

    const datosTomTom = resultado.data;
    limpiarLineasRutaDelMapa();
    const capaEsquivada = procesarDatosTomTomMultiparadaApp(map, datosTomTom, {
      rutaEsquivada: true
    });
    if (!capaEsquivada) {
      return;
    }

    const summary = datosTomTom.routes[0]?.summary;
    if (!summary) {
      resetearPanelResumenUI();
      ocultarResumenRutaFlotante();
      return;
    }

    const resumenViajeDatos =
      typeof resumenDesdeSummary === "function"
        ? resumenDesdeSummary(datosTomTom)
        : null;
    const kilometros =
      resumenViajeDatos?.kilometros ??
      (Number(summary.lengthInMeters) / 1000).toFixed(1);
    const minutosConduccion =
      resumenViajeDatos?.minutosConduccion ??
      Math.round(Number(summary.travelTimeInSeconds) / 60);
    const tiempoServicioTotal = paradasOk.reduce(
      (acc, p) => acc + tiempoServicioMinutos(p),
      0
    );
    const tiempoTotalEstimado = minutosConduccion + tiempoServicioTotal;

    if (typeof sincronizarEtiquetasResumen === "function") {
      sincronizarEtiquetasResumen(
        kilometros,
        minutosConduccion,
        tiempoServicioTotal
      );
    }

    let html = `<p><strong>Ruta alternativa (esquivando incidencia)</strong></p>`;
    html += `<p>${incidencia.descripcion}</p>`;
    html += `<p><strong>Distancia:</strong> ${kilometros} km · <strong>Tiempo total:</strong> ${tiempoTotalEstimado} min</p>`;
    html += `<p class="small">Conducción ${minutosConduccion} min + servicio ${tiempoServicioTotal} min</p>`;
    html += `<p class="small">Línea fucsia = ruta que evita la zona marcada.</p>`;
    resumenDiv.innerHTML = html;
    guardarEstadoSesion();
  } catch (e) {
    console.error(e);
    resumenDiv.innerHTML = `<p>No se pudo recalcular la ruta: ${e.message}</p>`;
  }
}

window.esquivarIncidenciaTomTom = esquivarIncidenciaTomTom;

function establecerOrigenMaquina(maquina, opciones = {}) {
  const { centrar = true, limpiarRuta = true } = opciones;

  if (limpiarRuta) {
    limpiarRutaEnMapa();
  }

  origenRuta = {
    nombre: maquina.nombre,
    lat: Number(maquina.lat),
    lon: Number(maquina.lng),
    lng: Number(maquina.lng),
    zona: maquina.zona,
    esGPS: false,
    esMaquina: true,
    maquinaId: maquina.id
  };

  colocarMarcadorOrigenMaquina(maquina);
  actualizarInfoOrigen();

  if (centrar) {
    centrarMapaEn(maquina.lat, maquina.lng, 14);
  }

  if (maquinasVisibles.some((m) => m.id === maquina.id)) {
    marcarMaquinaEnLista(maquina.id, true);
  }
}

async function aplicarOrigenMaquinaYRecalcular(maquina) {
  establecerOrigenMaquina(maquina);
  const estado = document.getElementById("geo-estado");
  estado.className = "small geo-estado ok";
  estado.textContent = `Origen: ${maquina.nombre}. Actualizando ruta...`;
  await recalcularRutaAutomaticaAhora();
}

function iniciarSeguimientoGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        mensaje: "Error: Tu navegador no soporta geolocalización."
      });
      return;
    }

    if (!esEntornoSeguroParaGPS()) {
      reject({
        mensaje: mensajeErrorGeolocalizacion({ code: 1 })
      });
      return;
    }

    detenerSeguimientoGPS();

    let primeraLectura = true;

    gpsWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const esPrimera = primeraLectura;
        const ok = aplicarPosicionGPS(position, { esPrimeraLectura: esPrimera });

        if (!ok) {
          if (esPrimera) {
            detenerSeguimientoGPS();
            reject({
              mensaje: "Error: Coordenadas GPS inválidas recibidas del navegador."
            });
          }
          return;
        }

        if (esPrimera) {
          primeraLectura = false;
          resolve(position);
          return;
        }

        const estado = document.getElementById("geo-estado");
        if (estado && origenRuta?.esGPS) {
          estado.className = "small geo-estado ok";
          estado.textContent =
            "Seguimiento GPS activo: el marcador se actualiza al moverte.";
        }
      },
      (error) => {
        const payload = {
          error,
          mensaje: mensajeErrorGeolocalizacion(error)
        };
        if (primeraLectura) {
          detenerSeguimientoGPS();
          reject(payload);
        } else {
          const estado = document.getElementById("geo-estado");
          if (estado) {
            estado.className = "small geo-estado error";
            estado.textContent = payload.mensaje;
          }
        }
      },
      opcionesGPS
    );
  });
}

async function confirmarUbicacionGPS() {
  const btn = document.getElementById("btn-confirmar-gps");
  const select = document.getElementById("select-origen");
  const estado = document.getElementById("geo-estado");
  const textoBtnOriginal =
    btn?.dataset.labelOriginal || btn?.textContent || "Confirmar mi ubicación actual";

  if (btn && !btn.dataset.labelOriginal) {
    btn.dataset.labelOriginal = textoBtnOriginal;
  }

  if (select) {
    select.value = "gps";
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Detectando GPS...";
  }
  if (select) {
    select.disabled = true;
  }

  estado.className = "small geo-estado";
  estado.textContent =
    "Esperando señal GPS (permite el acceso a la ubicación). El marcador se actualizará al moverte...";

  try {
    await iniciarSeguimientoGPS();

    estado.className = "small geo-estado ok";
    estado.textContent =
      "¡Ubicación confirmada! Seguimiento activo: el marcador se mueve contigo.";

    programarGuardadoEstado();
    if (
      misParadasSeleccionadas.length > 0 ||
      obtenerSeleccionados().length > 0
    ) {
      programarEnrutamientoDesdeLista();
    }
    return true;
  } catch (err) {
    detenerSeguimientoGPS();

    const mensaje =
      err.mensaje ||
      (err.error ? mensajeErrorGeolocalizacion(err.error) : String(err));

    estado.className = "small geo-estado error";
    estado.textContent = mensaje;
    alert(mensaje);

    return false;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = textoBtnOriginal;
    }
    if (select) {
      select.disabled = false;
    }
  }
}

async function aplicarOrigenGPS() {
  const ok = await confirmarUbicacionGPS();
  if (!ok) {
    throw new Error("GPS no confirmado");
  }
}

function origenListoParaSelector() {
  const valor = document.getElementById("select-origen")?.value ?? "gps";
  if (
    !origenRuta ||
    typeof coordenadasValidas !== "function" ||
    !coordenadasValidas(origenRuta)
  ) {
    return false;
  }
  if (valor === "gps") {
    return origenRuta.esGPS === true;
  }
  const idMaquina = Number(valor);
  return (
    origenRuta.esMaquina === true && origenRuta.maquinaId === idMaquina
  );
}

/** Alinea misParadasSeleccionadas con los checkboxes marcados en la lista. */
function sincronizarParadasDesdeCheckboxes() {
  const ids = obtenerSeleccionadosIds();
  misParadasSeleccionadas = misParadasSeleccionadas.filter((p) =>
    ids.includes(p.id)
  );
  obtenerSeleccionados().forEach((m) => {
    if (misParadasSeleccionadas.some((p) => p.id === m.id)) return;
    misParadasSeleccionadas.push(paradaParaItinerario(m));
  });
}

function programarEnrutamientoDesdeLista() {
  clearTimeout(recalcularRutaTimer);
  recalcularRutaTimer = setTimeout(() => {
    void invocarEnrutamientoTomTom();
  }, 280);
}

async function resolverOrigenDesdeSelector() {
  const valor = document.getElementById("select-origen").value;

  if (valor === "gps") {
    if (
      !origenRuta?.esGPS ||
      typeof coordenadasValidas !== "function" ||
      !coordenadasValidas(origenRuta)
    ) {
      throw new Error(
        "Confirma tu ubicación con el botón «Confirmar mi ubicación actual» antes de calcular la ruta."
      );
    }
    return;
  }

  const maquina = obtenerMaquinaPorId(valor);
  if (!maquina) {
    throw new Error("Máquina de origen no encontrada.");
  }

  const estado = document.getElementById("geo-estado");
  estado.className = "small geo-estado ok";
  estado.textContent = `Origen: ${maquina.nombre}`;
  establecerOrigenMaquina(maquina);
}

function mismasCoordenadasMaquina(a, b, tolerancia = 0.00015) {
  const latA = Number(a?.lat);
  const lonA = Number(a?.lon ?? a?.lng);
  const latB = Number(b?.lat);
  const lonB = Number(b?.lon ?? b?.lng);
  if (!Number.isFinite(latA) || !Number.isFinite(lonA)) return false;
  if (!Number.isFinite(latB) || !Number.isFinite(lonB)) return false;
  return (
    Math.abs(latA - latB) <= tolerancia && Math.abs(lonA - lonB) <= tolerancia
  );
}

/**
 * Paradas únicas para TomTom: sin origen duplicado ni coordenadas repetidas.
 */
function prepararParadasParaTomTom(origen, seleccionados) {
  const vistos = new Set();
  const paradas = [];

  seleccionados.forEach((m) => {
    if (origen?.maquinaId && m.id === origen.maquinaId) return;
    if (origen && mismasCoordenadasMaquina(origen, m)) return;

    const clave = `id:${m.id}`;
    if (vistos.has(clave)) return;
    vistos.add(clave);
    paradas.push(m);
  });

  return paradas;
}

function obtenerDestinosRuta(seleccionados) {
  const origen = obtenerOrigenRuta();
  if (!origen) return seleccionados;
  return prepararParadasParaTomTom(origen, seleccionados);
}

function distanciaHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function ordenarPorRutaOptima(origen, puntos) {
  if (puntos.length === 0) return [];

  const restantes = [...puntos];
  const ruta = [];
  const lonOrigen = origen.lon ?? origen.lng;
  let actual = { lat: origen.lat, lng: lonOrigen, lon: lonOrigen };

  while (restantes.length > 0) {
    let mejorIdx = 0;
    let mejorDist = Infinity;

    restantes.forEach((p, idx) => {
      const d = distanciaHaversine(actual.lat, actual.lng, p.lat, p.lng);
      if (d < mejorDist) {
        mejorDist = d;
        mejorIdx = idx;
      }
    });

    const siguiente = restantes.splice(mejorIdx, 1)[0];
    ruta.push(siguiente);
    actual = { lat: siguiente.lat, lng: siguiente.lng };
  }

  return ruta;
}

function filtrarMaquinas(texto) {
  const q = texto.trim().toLowerCase();
  if (!q) return [...MAQUINAS];

  return MAQUINAS.filter((m) => {
    const zona = m.zona.toLowerCase();
    const nombre = m.nombre.toLowerCase();
    return zona.includes(q) || nombre.includes(q);
  });
}

function obtenerSeleccionadosIds() {
  const ids = [];
  maquinasVisibles.forEach((m) => {
    const chk = document.getElementById(`maq-${m.id}`);
    if (chk && chk.checked) ids.push(m.id);
  });
  return ids;
}

function obtenerSeleccionados() {
  const ids = obtenerSeleccionadosIds();
  return maquinasVisibles.filter((m) => ids.includes(m.id));
}

function limpiarTodoElMapa() {
  if (!map) return;

  map.closePopup();

  clearTimeout(recalcularRutaTimer);
  recalcularRutaTimer = null;
  calcularRutaSeq += 1;
  window.__rutaSeqActiva = calcularRutaSeq;

  limpiarLineasRutaDelMapa();
  limpiarGrupoLineasRutaApp(map);
  limpiarPanelTraficoMenuLateral();
  limpiarNumeroMarkers();
  limpiarMarcadoresOrigen();

  estadoRutaReponedor = null;
  origenRuta = null;
  maquinaSeleccionadaId = null;
  numeroMarkers = [];

  if (marcadorSeleccionadoLayer) {
    map.removeLayer(marcadorSeleccionadoLayer);
    marcadorSeleccionadoLayer = null;
  }

  if (capasTraficoTomTom?.ocultarDeRuta) {
    capasTraficoTomTom.ocultarDeRuta();
  }

  maquinasVisibles.forEach((m) => marcarMaquinaEnLista(m.id, false));
  misParadasSeleccionadas = [];

  if (typeof resetearEtiquetasResumen === "function") {
    resetearEtiquetasResumen();
  } else {
    const elKm = document.getElementById("distancia-total");
    const elMin = document.getElementById("tiempo-conduccion");
    if (elKm) elKm.textContent = "0.0 km";
    if (elMin) elMin.textContent = "0 min";
  }

  ocultarResumenRutaFlotante();

  const select = document.getElementById("select-origen");
  if (select) select.value = "gps";

  const resumen = document.getElementById("resumen");
  if (resumen) {
    resumen.innerHTML =
      "<p>Selecciona máquinas para calcular la ruta automáticamente en el mapa.</p>";
  }

  const geo = document.getElementById("geo-estado");
  if (geo) {
    geo.className = "small geo-estado";
    geo.textContent =
      "La ruta se dibuja en el mapa. Elige origen y máquinas a visitar.";
  }

  actualizarInfoOrigen();
  map.setView(VISTA_INICIAL_TENERIFE.center, VISTA_INICIAL_TENERIFE.zoom);
  limpiarEstadoGuardado();
}

const VISTA_INICIAL_TENERIFE = {
  center: [28.2916, -16.6291],
  zoom: 10
};

function reiniciarMapa() {
  limpiarTodoElMapa();
}

function limpiarNumeroMarkers() {
  numeroMarkers.forEach((mk) => map.removeLayer(mk));
  numeroMarkers = [];
}

function irAMaquinaEnMapa(maquina) {
  centrarMapaEn(maquina.lat, maquina.lng, 15);
  seleccionarMaquinaEnMapa(maquina);
}

function paradaParaItinerario(maquina) {
  const base = puntoDesdeMaquina(maquina);
  return typeof normalizarPuntoRuta === "function"
    ? normalizarPuntoRuta(base)
    : base;
}

/** Mapa y menú: añade o quita paradas en el mismo array global. */
function actualizarItinerarioParada(maquina, checked) {
  if (checked) {
    if (!misParadasSeleccionadas.some((p) => p.id === maquina.id)) {
      misParadasSeleccionadas.push(paradaParaItinerario(maquina));
    }
  } else {
    misParadasSeleccionadas = misParadasSeleccionadas.filter(
      (p) => p.id !== maquina.id
    );
  }
  marcarMaquinaEnLista(maquina.id, checked);
}

/** Clic en mapa o popup: mismo itinerario que el menú lateral. */
async function onSeleccionMaquinaEnLista(maquina, checked) {
  actualizarItinerarioParada(maquina, checked);
  if (checked) {
    seleccionarMaquinaEnMapa(maquina);
    if (!origenRuta?.esGPS) {
      centrarMapaEn(maquina.lat, maquina.lng, 15);
    }
  }
  programarGuardadoEstado();
  programarEnrutamientoDesdeLista();
}

function seleccionarMaquinaEnMapa(maquina) {
  maquinaSeleccionadaId = maquina.id;

  if (marcadorSeleccionadoLayer) {
    map.removeLayer(marcadorSeleccionadoLayer);
    marcadorSeleccionadoLayer = null;
  }

  marcadorSeleccionadoLayer = L.circleMarker([maquina.lat, maquina.lng], {
    radius: 14,
    color: "#0078d4",
    weight: 3,
    fillColor: "#0078d4",
    fillOpacity: 0.15
  }).addTo(map);

  const estado = document.getElementById("geo-estado");
  estado.className = "small geo-estado ok";
  estado.textContent = `Seleccionada: ${maquina.nombre}`;
}

function crearPopupMaquina(maquina) {
  const cont = document.createElement("div");
  cont.className = "popup-maquina";

  const titulo = document.createElement("b");
  titulo.textContent = maquina.nombre;
  cont.appendChild(titulo);

  const info = document.createElement("p");
  info.className = "popup-maquina__info";
  info.textContent = `Zona: ${maquina.zona} · Servicio: ${tiempoServicioMinutos(maquina)} min`;
  cont.appendChild(info);

  const acciones = document.createElement("div");
  acciones.className = "popup-maquina__acciones";

  const btnCentrar = document.createElement("button");
  btnCentrar.type = "button";
  btnCentrar.className = "popup-btn popup-btn--nav";
  btnCentrar.textContent = "Centrar en mapa";
  btnCentrar.addEventListener("click", () => irAMaquinaEnMapa(maquina));

  const btnOrigen = document.createElement("button");
  btnOrigen.type = "button";
  btnOrigen.className = "popup-btn popup-btn--sec";
  btnOrigen.textContent = "Usar como origen";
  btnOrigen.addEventListener("click", async () => {
    document.getElementById("select-origen").value = String(maquina.id);
    await aplicarOrigenMaquinaYRecalcular(maquina);
  });

  const btnIncluir = document.createElement("button");
  btnIncluir.type = "button";
  btnIncluir.className = "popup-btn popup-btn--sec";
  btnIncluir.textContent = "Incluir en ruta";
  btnIncluir.addEventListener("click", async () => {
    marcarMaquinaEnLista(maquina.id, true);
    map.closePopup();
    await onSeleccionMaquinaEnLista(maquina, true);
  });

  acciones.appendChild(btnCentrar);
  acciones.appendChild(btnOrigen);
  acciones.appendChild(btnIncluir);
  cont.appendChild(acciones);

  return cont;
}

function actualizarMarcadoresMaquinas(maquinas) {
  maquinaMarkers.forEach((mk) => map.removeLayer(mk));
  maquinaMarkers = [];

  if (marcadorSeleccionadoLayer) {
    map.removeLayer(marcadorSeleccionadoLayer);
    marcadorSeleccionadoLayer = null;
  }

  const seleccionadaSigueVisible = maquinas.some(
    (m) => m.id === maquinaSeleccionadaId
  );
  if (!seleccionadaSigueVisible) {
    maquinaSeleccionadaId = null;
  }

  maquinas.forEach((m) => {
    const mk = L.marker([m.lat, m.lng], { title: m.nombre }).addTo(map);
    mk.bindPopup(crearPopupMaquina(m));

    mk.on("click", () => {
      if (!obtenerSeleccionadosIds().includes(m.id)) {
        marcarMaquinaEnLista(m.id, true);
      }
      mk.openPopup();
      void onSeleccionMaquinaEnLista(m, true);
    });

    maquinaMarkers.push(mk);

    if (m.id === maquinaSeleccionadaId) {
      seleccionarMaquinaEnMapa(m);
    }
  });
}

function ajustarVistaMapa(maquinas) {
  const origen = obtenerOrigenRuta();
  const puntos = maquinas.map((m) => L.latLng(m.lat, m.lng));

  if (origen) {
    puntos.push(L.latLng(origen.lat, origen.lng));
  }

  if (puntos.length === 0) {
    map.setView([28.2916, -16.6291], 10);
    return;
  }

  if (puntos.length === 1) {
    const p = puntos[0];
    map.setView([p.lat, p.lng], 12);
    return;
  }

  map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40] });
}

function actualizarIndicadorFiltro(texto, cantidad) {
  const el = document.getElementById("filtro-activo");
  if (!texto.trim()) {
    el.textContent = `Mostrando las ${cantidad} máquinas.`;
    return;
  }
  if (cantidad === 0) {
    el.textContent = `Sin resultados para "${texto.trim()}".`;
    return;
  }
  el.textContent = `${cantidad} máquina(s) en "${texto.trim()}".`;
}

/** Menú lateral: idéntico al mapa (array global + mismo enrutador). */
async function onSeleccionParadaEnMenuLateral(maquina, checked) {
  actualizarItinerarioParada(maquina, checked);
  if (checked) {
    seleccionarMaquinaEnMapa(maquina);
    if (!origenRuta?.esGPS) {
      centrarMapaEn(maquina.lat, maquina.lng, 15);
    }
  }
  programarGuardadoEstado();
  clearTimeout(recalcularRutaTimer);
  recalcularRutaTimer = null;
  await invocarEnrutamientoTomTom();
}

/** Lista lateral: checkboxes → misParadasSeleccionadas → calcularRuta automático. */
function initListaMaquinas(maquinas, idsSeleccionados) {
  renderListaMaquinas(maquinas, idsSeleccionados);
}

function renderListaMaquinas(maquinas, idsSeleccionados) {
  const cont = document.getElementById("lista-maquinas");
  cont.innerHTML = "";

  if (maquinas.length === 0) {
    cont.innerHTML = '<p class="small">No hay máquinas en esta zona.</p>';
    return;
  }

  misParadasSeleccionadas = misParadasSeleccionadas.filter((p) =>
    idsSeleccionados.includes(p.id)
  );
  idsSeleccionados.forEach((id) => {
    if (misParadasSeleccionadas.some((p) => p.id === id)) return;
    const maquina = maquinas.find((m) => m.id === id) || obtenerMaquinaPorId(id);
    if (!maquina) return;
    const punto =
      typeof normalizarPuntoRuta === "function"
        ? normalizarPuntoRuta(puntoDesdeMaquina(maquina))
        : puntoDesdeMaquina(maquina);
    misParadasSeleccionadas.push(punto);
  });

  maquinas.forEach((m) => {
    const div = document.createElement("div");
    div.className = "maquina-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `maq-${m.id}`;
    input.value = m.id;
    input.checked = idsSeleccionados.includes(m.id);
    input.addEventListener("change", () => {
      const checked = input.checked;
      actualizarItinerarioParada(m, checked);
      if (checked) {
        seleccionarMaquinaEnMapa(m);
        centrarMapaEn(m.lat, m.lng, 15);
      }
      programarGuardadoEstado();
      programarEnrutamientoDesdeLista();
    });

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = `${m.nombre} · ${m.zona}`;

    div.appendChild(input);
    div.appendChild(label);
    cont.appendChild(div);
  });
}

const BOUNDS_TENERIFE = L.latLngBounds(
  [27.92, -17.05],
  [28.65, -16.05]
);

function initMap(mapEl) {
  const target = mapEl || document.getElementById("map");
  if (!target) return;

  if (map) {
    map.remove();
    map = null;
    capasTraficoTomTom = null;
  }

  map = L.map(target, { maxZoom: 22 });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 22,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  map.fitBounds(BOUNDS_TENERIFE, { padding: [30, 30] });

  requestAnimationFrame(() => map?.invalidateSize());
  setTimeout(() => map?.invalidateSize(), 250);

  queueMicrotask(() => {
    const claveTomTom = obtenerClaveTomTom();
    capasTraficoTomTom = initCapasTraficoTomTom(map, claveTomTom);
    enlazarControlesTraficoTomTom(capasTraficoTomTom);
  });

  actualizarInfoOrigen();

  actualizarMarcadoresMaquinas(maquinasVisibles);
}

async function aplicarFiltroZona(recalcularRuta = true) {
  const input = document.getElementById("input-zona");
  const texto = input.value;
  const idsPrevios = obtenerSeleccionadosIds();

  textoFiltroActual = texto;
  maquinasVisibles = filtrarMaquinas(texto);

  const idsValidos = idsPrevios.filter((id) =>
    maquinasVisibles.some((m) => m.id === id)
  );

  limpiarRutaEnMapa();
  actualizarMarcadoresMaquinas(maquinasVisibles);
  ajustarVistaMapa(maquinasVisibles);
  renderListaMaquinas(maquinasVisibles, idsValidos);
  actualizarIndicadorFiltro(texto, maquinasVisibles.length);

  const resumenDiv = document.getElementById("resumen");
  if (maquinasVisibles.length === 0) {
    resumenDiv.innerHTML = "<p>No hay máquinas en esta zona.</p>";
    return;
  }

  if (idsValidos.length === 0) {
    resumenDiv.innerHTML =
      "<p>Selecciona al menos una máquina para ver la ruta en el mapa.</p>";
    return;
  }

  if (recalcularRuta) {
    await recalcularRutaAutomaticaAhora();
  }
}

function dibujarNumeroEnMapa(num, lat, lng) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:24px;height:24px;
      background:#0078d4;
      color:white;
      border-radius:50%;
      text-align:center;
      line-height:24px;
      font-size:12px;
      border:2px solid white;
      box-shadow:0 0 4px rgba(0,0,0,0.4);
    ">${num}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const mk = L.marker([lat, lng], { icon }).addTo(map);
  numeroMarkers.push(mk);
}

/**
 * Enrutamiento unificado: map + misParadasSeleccionadas + calcularRutaTomTom global.
 */
async function invocarEnrutamientoTomTom() {
  if (restaurandoSesion) return;

  const resumenDiv = document.getElementById("resumen");
  sincronizarParadasDesdeCheckboxes();

  if (misParadasSeleccionadas.length === 0) {
    limpiarRutaEnMapa();
    limpiarContenedorResumen(
      "<p>Selecciona al menos una máquina para ver la ruta en el mapa.</p>"
    );
    programarGuardadoEstado();
    return;
  }

  const origenRaw = obtenerOrigenRuta();
  if (!origenRaw) {
    if (resumenDiv) {
      resumenDiv.innerHTML = "<p>Selecciona un punto de partida.</p>";
    }
    return;
  }

  if (!coordenadasValidas(origenRaw)) {
    if (resumenDiv) {
      const valorOrigen =
        document.getElementById("select-origen")?.value ?? "gps";
      if (valorOrigen === "gps") {
        resumenDiv.innerHTML =
          "<p>Pulsa «Confirmar mi ubicación actual» para usar el GPS como inicio de la ruta.</p>";
      } else {
        resumenDiv.innerHTML =
          "<p>Confirma tu ubicación GPS o elige un origen de partida para calcular la ruta.</p>";
      }
    }
    return;
  }

  const miSeq = ++calcularRutaSeq;
  window.__rutaSeqActiva = miSeq;

  limpiarEstadoRutaInterno();
  limpiarNumeroMarkers();
  ocultarResumenRutaFlotante();
  limpiarContenedorResumen("<p>Calculando ruta con tráfico TomTom...</p>");

  const origenActual = normalizarPuntoRuta(origenRaw);

  const paradasFiltradas = prepararParadasParaTomTom(origenActual, [
    ...misParadasSeleccionadas
  ]).filter((p) => coordenadasValidas(p));

  if (paradasFiltradas.length === 0) {
    limpiarContenedorResumen(
      "<p>Selecciona al menos una máquina distinta del origen.</p>"
    );
    programarGuardadoEstado();
    return;
  }

  const paradasParaTomTom = ordenarPorRutaOptima(origenActual, paradasFiltradas);
  const apiKey = obtenerClaveTomTom();

  try {
    let avisoRuta = "";
    let statsTrafico = null;

    if (!apiKey) {
      throw new Error("Sin clave TomTom");
    }

    estadoRutaReponedor = {
      origen: origenActual,
      rutaOrdenada: paradasParaTomTom,
      claveTomTom: apiKey,
      areasEvitadas: []
    };

    const numWaypointsUrl = paradasParaTomTom.length + 1;
    console.log("TomTom waypoints (origen + paradas):", numWaypointsUrl, {
      origen: origenActual.nombre,
      paradas: paradasParaTomTom.map((p) => p.nombre)
    });

    const resultadoRuta = await calcularRutaTomTom(
      map,
      origenActual,
      paradasParaTomTom,
      apiKey,
      null,
      { autoEvitarRoadblocks: true, omitirPintadoMapa: true },
      miSeq
    );

    if (resultadoRuta?.areasEvitadas?.length) {
      estadoRutaReponedor.areasEvitadas = resultadoRuta.areasEvitadas;
    }

    if (miSeq !== calcularRutaSeq) {
      return;
    }

    if (!resultadoRuta?.data) {
      limpiarEstadoRutaInterno();
      limpiarContenedorResumen(
        "<p><strong>No se obtuvo respuesta de TomTom.</strong> Comprueba tu conexión y la clave API.</p>"
      );
      return;
    }

    const datosTomTom = resultadoRuta.data;
    const rutaTomTom = rutaPrincipalTomTomApp(datosTomTom);

    limpiarLineasRutaDelMapa();

    const capaRuta = procesarDatosTomTomMultiparadaApp(map, datosTomTom, {
      rutaEsquivada: Boolean(resultadoRuta?.rutaEsquivada),
      paradasEsperadas: paradasParaTomTom.length,
      origen: origenActual,
      destinoFinal: paradasParaTomTom[paradasParaTomTom.length - 1],
      apiKey,
      fechaInput: leerFechaFuturaDesdeUIApp(),
      seqRuta: miSeq
    });
    statsTrafico = statsTraficoDesdeConteoApp(conteoTraficoRutaApp);

    const legsTomTom = rutaTomTom?.legs || [];
    console.log("Ruta multiparada TomTom:", {
      paradas: paradasParaTomTom.length,
      rutasEnRespuesta: datosTomTom.routes?.length ?? 0,
      legs: legsTomTom.length,
      legsConGeometria: contarLegsConGeometriaApp(legsTomTom),
      modoFallbackPolyline: multiparadaLegsIncompletosApp(rutaTomTom),
      alternativasPintadas: (window.capasRuta || []).filter(
        (c) => c?._esRutaAlternativaTomTom
      ).length
    });

    if (!capaRuta) {
      limpiarEstadoRutaInterno();
      limpiarContenedorResumen(
        "<p><strong>TomTom devolvió datos pero no geometría de ruta.</strong> Prueba con otras paradas o recarga la página.</p>"
      );
      console.warn("Ruta sin capa Leaflet:", datosTomTom);
      return;
    }

    if (origenActual.esGPS) {
      encuadrarVistaRutaCompleta(
        origenActual,
        paradasParaTomTom,
        capaRuta?.getBounds?.()
      );
    }

    if (capasTraficoTomTom?.mostrarEnRuta && capaRuta?.getBounds) {
      capasTraficoTomTom.mostrarEnRuta(capaRuta.getBounds());
    }

    const summary = rutaTomTom?.summary;
    if (!summary) {
      limpiarEstadoRutaInterno();
      limpiarContenedorResumen(
        "<p><strong>TomTom no devolvió resumen de ruta.</strong></p>"
      );
      return;
    }

    const resumenViajeDatos =
      resultadoRuta?.resumenViaje ||
      (typeof resumenDesdeSummary === "function"
        ? resumenDesdeSummary(datosTomTom)
        : null);
    const kilometros =
      resumenViajeDatos?.kilometros ??
      (Number(summary.lengthInMeters) / 1000).toFixed(1);
    const minutosConduccion =
      resumenViajeDatos?.minutosConduccion ??
      Math.round(Number(summary.travelTimeInSeconds) / 60);

    const tiempoServicioTotal = paradasParaTomTom.reduce(
      (acc, p) => acc + tiempoServicioMinutos(p),
      0
    );
    const tiempoTotalEstimado = minutosConduccion + tiempoServicioTotal;

    if (typeof sincronizarEtiquetasResumen === "function") {
      sincronizarEtiquetasResumen(
        kilometros,
        minutosConduccion,
        tiempoServicioTotal
      );
    }

    let html = "";
    if (avisoRuta) html += `<p>${avisoRuta}</p>`;
    if (resultadoRuta?.rutaEsquivada) {
      const nBloqueos = resultadoRuta.roadblocks?.length || 1;
      html += `<p><strong>Ruta alternativa:</strong> se esquivó ${nBloqueos} bloqueo(s) en carretera (línea fucsia).</p>`;
    }
    html += `<p><strong>Salida desde:</strong> ${origenActual.nombre}`;
    if (origenActual.esGPS && origenActual.precision) {
      html += ` (±${Math.round(origenActual.precision)} m)`;
    }
    html += "</p>";
    if (textoFiltroActual.trim()) {
      html += `<p><strong>Zona filtrada:</strong> ${textoFiltroActual.trim()}</p>`;
    }
    html += `<p><strong>Paradas a visitar:</strong> ${paradasParaTomTom.length}</p>`;
    html += `<p><strong>Distancia total:</strong> ${kilometros} km</p>`;
    html += `<p><strong>Tiempo conducción:</strong> ${minutosConduccion} min`;
    if (resumenViajeDatos?.kmAutopista > 0) {
      html += ` <span class="small">(autopista: ${resumenViajeDatos.kmAutopista} km a ~75 km/h`;
      if (resumenViajeDatos.pctAutopista) {
        html += `, ${resumenViajeDatos.pctAutopista}% del trayecto`;
      }
      html += ")</span>";
    } else if (
      resumenViajeDatos?.velocidadMediaKmH &&
      !resumenViajeDatos?.tiempoAjustado
    ) {
      html += ` <span class="small">(~${resumenViajeDatos.velocidadMediaKmH} km/h media)</span>`;
    }
    html += "</p>";
    if (resumenViajeDatos?.tiempoAjustado && resumenViajeDatos?.motivoAjuste) {
      html += `<p class="small">${resumenViajeDatos.motivoAjuste} (TomTom: ${resumenViajeDatos.minutosTomTom} min).</p>`;
    }
    if (summary.trafficDelayInSeconds > 0) {
      html += `<p><strong>Retraso por tráfico:</strong> ${Math.round(summary.trafficDelayInSeconds / 60)} min</p>`;
    }
    if (statsTrafico && statsTrafico.total > 0) {
      html += `<p><strong>Tramos en ruta:</strong> `;
      html += `<span style="color:#00E676">■</span> ${statsTrafico.fluido} fluidos `;
      html += `<span style="color:#FFD600">■</span> ${statsTrafico.lento} lentos `;
      html += `<span style="color:#FF1744">■</span> ${statsTrafico.congestion} congestionados</p>`;
    }
    html += `<p><strong>Tiempo servicio en paradas:</strong> ${tiempoServicioTotal} min</p>`;
    html += `<p><strong>Tiempo total estimado:</strong> ${tiempoTotalEstimado} min</p>`;

    html += "<h3>Orden de visita</h3>";
    html += "<ol>";
    html += `<li><strong>Salida:</strong> ${origenActual.nombre}</li>`;
    paradasParaTomTom.forEach((p, idx) => {
      html += `<li>${p.nombre} (${tiempoServicioMinutos(p)} min)</li>`;
      dibujarNumeroEnMapa(idx + 1, p.lat, p.lng ?? p.lon);
    });
    html += `<li><strong>Regreso:</strong> ${origenActual.nombre}</li>`;
    html += "</ol>";

    if (miSeq !== calcularRutaSeq) {
      return;
    }

    limpiarContenedorResumen(html);
    guardarEstadoSesion();
  } catch (e) {
    if (miSeq !== calcularRutaSeq) {
      return;
    }

    console.error("TomTom Routing:", e);

    let html = `<p><strong>No se pudo calcular la ruta por carretera.</strong></p>`;
    html += `<p>${e.message || "Error al conectar con TomTom Routing."}</p>`;
    html += `<p>Revisa la clave API y que la app se ejecute con <code>npm run dev</code>.</p>`;
    html += `<p><strong>Salida desde:</strong> ${origenActual.nombre}</p>`;
    html += `<p><strong>Paradas planificadas:</strong> ${paradasParaTomTom.length}</p>`;
    html += "<h3>Orden de visita (sin línea en mapa)</h3><ol>";
    html += `<li><strong>Salida:</strong> ${origenActual.nombre}</li>`;
    paradasParaTomTom.forEach((p) => {
      html += `<li>${p.nombre} (${tiempoServicioMinutos(p)} min)</li>`;
    });
    html += `<li><strong>Regreso:</strong> ${origenActual.nombre}</li></ol>`;
    limpiarContenedorResumen(html);
  }
}

async function enrutarParadasDesdeUI() {
  if (
    misParadasSeleccionadas.length === 0 &&
    obtenerSeleccionados().length > 0
  ) {
    obtenerSeleccionados().forEach((m) => {
      if (!misParadasSeleccionadas.some((p) => p.id === m.id)) {
        misParadasSeleccionadas.push(paradaParaItinerario(m));
      }
    });
  }
  await calcularRuta({ resolverOrigen: false });
}

function construirPointsTomTomDesdeRutaApp(origen, paradas) {
  const tramos = [];
  const latO = Number(origen?.lat);
  const lonO = Number(origen?.lon ?? origen?.lng);
  if (Number.isFinite(latO) && Number.isFinite(lonO)) {
    tramos.push(`${latO},${lonO}`);
  }
  (paradas || []).forEach((p) => {
    const lat = Number(p?.lat);
    const lon = Number(p?.lon ?? p?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    tramos.push(`${lat},${lon}`);
  });
  return tramos.join(":");
}

/**
 * FUNCIÓN 1 — SOLO PINTA (ruta principal multiparada). No analiza alternativas ni atascos.
 * Mantiene el bucle por legs; si TomTom deja legs[1..n] sin puntos (maxAlternatives),
 * repinta la polyline completa de routes[0] sin romper el flujo anterior.
 */
function pintarRutaPrincipalMultiparadaPlantillaApp(data, paradasEsperadas = 0) {
  if (!data?.routes?.length || !map) return;

  if (window.capasRuta) {
    window.capasRuta.forEach((capa) => {
      if (map.hasLayer(capa)) map.removeLayer(capa);
    });
  }
  window.capasRuta = [];

  if (typeof limpiarLineasRuta === "function") {
    limpiarLineasRuta(map);
  }
  limpiarGrupoLineasRutaApp(map);

  const dataOrdenado = datosTomTomRutaPrincipalPrimeroApp(data, paradasEsperadas);
  const rutaPrincipal = dataOrdenado.routes[0];
  const legs = rutaPrincipal.legs || [];
  const polyCompleta = polylineCompletaRutaPrincipalApp(rutaPrincipal);

  if (polyCompleta.length >= 2) {
    const capaBase = L.polyline(polyCompleta, {
      color: "#00cd00",
      weight: 5,
      opacity: 0.35
    }).addTo(map);
    window.capasRuta.push(capaBase);
  }

  let tramosRojos = 0;
  let tramosAmarillos = 0;
  let legsPintados = 0;

  legs.forEach((leg) => {
    const puntosLeg = leg.points || [];
    let legConGeometria = false;

    if (leg.sections && leg.sections.length > 0) {
      leg.sections.forEach((seccion) => {
        const puntosSeccion = puntosLeg.slice(
          seccion.startPointIndex,
          seccion.endPointIndex + 1
        );
        const coordenadasLeaflet = puntosSeccion
          .map((p) => [
            Number(p.latitude ?? p.lat),
            Number(p.longitude ?? p.lon ?? p.lng)
          ])
          .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]));

        if (coordenadasLeaflet.length < 2) return;

        legConGeometria = true;
        let colorTramo = "#00cd00";
        const magnitud = seccion.magnitudOfDelay ?? seccion.magnitudeOfDelay;

        if (magnitud === 3 || magnitud === 4) {
          colorTramo = "#ff0000";
          tramosRojos++;
        } else if (magnitud === 1 || magnitud === 2) {
          colorTramo = "#ffcc00";
          tramosAmarillos++;
        }

        const polilinea = L.polyline(coordenadasLeaflet, {
          color: colorTramo,
          weight: 6,
          opacity: 0.8
        }).addTo(map);

        window.capasRuta.push(polilinea);
      });
    } else {
      const coordenadasCompletas = puntosLeg
        .map((p) => [
          Number(p.latitude ?? p.lat),
          Number(p.longitude ?? p.lon ?? p.lng)
        ])
        .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]));

      if (coordenadasCompletas.length < 2) return;

      legConGeometria = true;
      const lineaLimpia = L.polyline(coordenadasCompletas, {
        color: "#00cd00",
        weight: 6
      }).addTo(map);
      window.capasRuta.push(lineaLimpia);
    }

    if (legConGeometria) legsPintados += 1;
  });

  const incompleta =
    legs.length > 0 &&
    (legsPintados < legs.length || multiparadaLegsIncompletosApp(rutaPrincipal));

  if (incompleta && polyCompleta.length >= 2) {
    console.warn("TomTom: solo parte de los legs tenía geometría; repintado global", {
      legs: legs.length,
      legsPintados,
      puntosPolyline: polyCompleta.length,
      paradasEsperadas
    });

    const grupoFallback = L.featureGroup();
    if (pintarRutaPrincipalFallbackPolylineApp(grupoFallback, rutaPrincipal, {})) {
      grupoFallback.eachLayer((capa) => {
        capa.addTo(map);
        window.capasRuta.push(capa);
      });
    }

    const conteoGlobal = contarTramosTraficoDesdeDatos(dataOrdenado);
    tramosRojos = conteoGlobal.rojo;
    tramosAmarillos = conteoGlobal.amarillo;
  }

  if (polyCompleta.length >= 2 && map.getBounds) {
    try {
      map.fitBounds(polyCompleta, { padding: [40, 40] });
    } catch {
      /* ignorar bounds inválidos */
    }
  }
}

/**
 * Botón «Calcular ruta»: fetch TomTom → pintar (función 1) → extensiones pasivas (funciones 2 y 3).
 */
async function calcularRuta(opciones = {}) {
  const resumenDiv = document.getElementById("resumen");
  departAtSeleccionadoIsoApp = leerDepartAtSeleccionadoDesdeUI();

  const saltarResolverExplicito = opciones.resolverOrigen === false;
  let resolverOrigen = !saltarResolverExplicito;
  if (saltarResolverExplicito || origenListoParaSelector()) {
    resolverOrigen = false;
  }

  if (resolverOrigen) {
    try {
      await resolverOrigenDesdeSelector();
    } catch (err) {
      const mensaje =
        err?.message ||
        "No se pudo determinar el punto de partida. Confirma el GPS o elige una máquina.";
      const geo = document.getElementById("geo-estado");
      if (geo) {
        geo.className = "small geo-estado error";
        geo.textContent = mensaje;
      }
      if (resumenDiv) resumenDiv.innerHTML = `<p>${mensaje}</p>`;
      return;
    }
  }

  sincronizarParadasDesdeCheckboxes();
  if (misParadasSeleccionadas.length === 0) {
    limpiarRutaEnMapa();
    limpiarContenedorResumen(
      "<p>Selecciona al menos una máquina para ver la ruta en el mapa.</p>"
    );
    programarGuardadoEstado();
    return;
  }

  const origenRaw = obtenerOrigenRuta();
  if (
    !origenRaw ||
    typeof coordenadasValidas !== "function" ||
    !coordenadasValidas(origenRaw)
  ) {
    if (resumenDiv) {
      resumenDiv.innerHTML = "<p>Selecciona un punto de partida válido.</p>";
    }
    return;
  }

  const origenActual =
    typeof normalizarPuntoRuta === "function"
      ? normalizarPuntoRuta(origenRaw)
      : origenRaw;

  const paradasParaTomTom = prepararParadasParaTomTom(origenActual, [
    ...misParadasSeleccionadas
  ]).filter((p) =>
    typeof coordenadasValidas === "function" ? coordenadasValidas(p) : true
  );

  if (paradasParaTomTom.length === 0) {
    limpiarContenedorResumen(
      "<p>Selecciona al menos una máquina distinta del origen.</p>"
    );
    return;
  }

  await invocarEnrutamientoTomTom();
}

// ==================================================================
// FLUJO SECUNDARIO AISLADO (incidencias + ruta de respaldo en paralelo)
// No modifica invocarEnrutamientoTomTom ni el pintado continuo multiparada.
// ==================================================================

/** URL espejo origen→destino final; maxAlternatives=1 solo aquí (numParadas≥2 evita el de multiparada). */
function construirUrlRutaSecundariaRespaldoTomTomApp(origen, destino, apiKey, opciones = {}) {
  const latO = Number(origen?.lat);
  const lonO = Number(origen?.lon ?? origen?.lng);
  const latD = Number(destino?.lat);
  const lonD = Number(destino?.lon ?? destino?.lng);
  const points = `${latO},${lonO}:${latD},${lonD}`;

  let url = construirUrlCalculateRouteTomTomApp(points, apiKey, {
    fechaInput: opciones.fechaInput,
    computeBestOrder: false,
    numParadas: 2
  });

  if (!url.includes("maxAlternatives=")) {
    url = url.replace("&traffic=true", "&traffic=true&maxAlternatives=1");
  }

  return url;
}

function limpiarRutasSecundariasRespaldoEnMapa(mapa) {
  if (!window.capasRuta?.length) return;

  const restantes = [];
  window.capasRuta.forEach((capa) => {
    if (capa?._esRutaSecundariaRespaldoTomTom) {
      if (mapa && capa && mapa.hasLayer(capa)) {
        mapa.removeLayer(capa);
      }
      return;
    }
    restantes.push(capa);
  });
  window.capasRuta = restantes;
}

/**
 * Pinta data.routes[1] de la petición espejo (alternativa directa origen→fin).
 */
function pintarRutaSecundariaDeRespaldoApp(mapa, dataSecundaria) {
  if (!mapa || !dataSecundaria?.routes?.[1]) return null;

  const rutaAlt = dataSecundaria.routes[1];
  const poly = polylineCompletaRutaPrincipalApp(rutaAlt);
  if (poly.length < 2) return null;

  limpiarRutasSecundariasRespaldoEnMapa(mapa);

  const lineaGris = L.polyline(poly, {
    color: "#9E9E9E",
    weight: 3,
    opacity: 0.6,
    dashArray: "5, 10"
  }).addTo(mapa);

  lineaGris._esRutaSecundariaRespaldoTomTom = true;

  lineaGris.on("click", function () {
    window.capasRuta.forEach((capa) => {
      if (
        capa instanceof L.Polyline &&
        capa._esRutaSecundariaRespaldoTomTom &&
        capa.options.color === "#0056b3"
      ) {
        capa.setStyle({
          color: "#9E9E9E",
          weight: 3,
          dashArray: "5, 10",
          opacity: 0.6
        });
      }
    });
    lineaGris.setStyle({
      color: "#0056b3",
      weight: 6,
      dashArray: null,
      opacity: 0.9
    });
    console.log("Ruta secundaria de respaldo activada por el reponedor.");
  });

  if (!window.capasRuta) window.capasRuta = [];
  window.capasRuta.push(lineaGris);
  return lineaGris;
}

function mostrarBannerIncidenciaTraficoApp(retrasoSegundos) {
  const minutos = Math.round(retrasoSegundos / 60);
  let contenedor = document.getElementById("alerta-incidencias-ruta");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "alerta-incidencias-ruta";
    contenedor.style.cssText =
      "background: #ffcccc; color: #cc0000; padding: 10px; margin: 10px 0; font-weight: bold; border-left: 5px solid #cc0000; border-radius: 4px;";
    const sidebar = document.querySelector(".sidebar") || document.body;
    sidebar.prepend(contenedor);
  }

  contenedor.innerHTML = `⚠️ ALERTA DE INCIDENCIA: Retención fuerte detectada en la ruta principal (Retraso: ${minutos} min). Se recomienda activar la ruta secundaria.`;
}

function ocultarBannerIncidenciaTraficoApp() {
  const banner = document.getElementById("alerta-incidencias-ruta");
  if (banner) banner.remove();
}

async function solicitarRutaSecundariaRespaldoTomTomApp(contexto) {
  const { mapa, origen, destinoFinal, apiKey, fechaInput, seqRuta } = contexto;

  if (
    !mapa ||
    !apiKey ||
    typeof coordenadasValidas !== "function" ||
    !coordenadasValidas(origen) ||
    !coordenadasValidas(destinoFinal)
  ) {
    return;
  }

  const miSeqSecundaria = ++seqPeticionSecundariaRespaldoApp;
  const url = construirUrlRutaSecundariaRespaldoTomTomApp(
    origen,
    destinoFinal,
    apiKey,
    { fechaInput }
  );

  const response = await fetch(url);
  if (!response.ok) {
    console.warn("Ruta secundaria respaldo: TomTom respondió", response.status);
    return;
  }

  const data = await response.json();

  if (miSeqSecundaria !== seqPeticionSecundariaRespaldoApp) return;
  if (seqRuta != null && seqRuta !== calcularRutaSeq) return;

  pintarRutaSecundariaDeRespaldoApp(mapa, data);
}

/**
 * Oyente pasivo: banner de atasco + petición espejo origen→fin (paralela, aislada).
 */
async function analizarIncidenciasTraficoApp(rutaPrincipal, contexto = {}) {
  if (!rutaPrincipal) return;

  try {
    const retraso = Number(rutaPrincipal.summary?.trafficDelayInSeconds) || 0;
    if (retraso > 300) {
      mostrarBannerIncidenciaTraficoApp(retraso);
    } else {
      ocultarBannerIncidenciaTraficoApp();
    }
  } catch (err) {
    console.warn("Banner incidencias tráfico:", err);
  }

  const numParadas = Number(contexto.paradasEsperadas) || 0;
  if (numParadas <= 1) return;

  try {
    await solicitarRutaSecundariaRespaldoTomTomApp(contexto);
  } catch (err) {
    console.warn("Ruta secundaria de respaldo (no afecta multiparada):", err);
  }
}

export async function onSelectOrigenChange() {
  try {
    const valor = document.getElementById("select-origen")?.value;

    if (valor === "gps") {
      const geo = document.getElementById("geo-estado");
      if (geo && (!origenRuta?.esGPS || !coordenadasValidas(origenRuta))) {
        geo.className = "small geo-estado";
        geo.textContent =
          "Pulsa «Confirmar mi ubicación actual» para fijar tu ubicación GPS.";
      }
      return;
    }

    const maquina = obtenerMaquinaPorId(valor);
    if (maquina) {
      await aplicarOrigenMaquinaYRecalcular(maquina);
    }
  } catch {
    /* mensaje ya mostrado en geo-estado */
  }
}

function adjuntarListenersUiUnaVez() {
  if (listenersUiAdjuntos) return;
  listenersUiAdjuntos = true;

  document.getElementById("btn-ruta")?.addEventListener("click", () => calcularRuta());
  document.getElementById("btn-reiniciar-mapa")?.addEventListener("click", reiniciarMapa);
  document.getElementById("btn-confirmar-gps")?.addEventListener("click", () => {
    void confirmarUbicacionGPS();
  });
  document.getElementById("select-origen")?.addEventListener("change", () => {
    void onSelectOrigenChange();
  });
  document.getElementById("btn-buscar")?.addEventListener("click", () => {
    void aplicarFiltroZona(true);
  });
  document.getElementById("input-zona")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void aplicarFiltroZona(true);
  });
  document.getElementById("input-zona")?.addEventListener("input", () => {
    const texto = document.getElementById("input-zona")?.value ?? "";
    if (!texto.trim()) void aplicarFiltroZona(false);
  });
}

/** Arranque del motor de ruta (llamado desde React tras montar el DOM). */
export async function bootstrapPlanificador(mapEl) {
  const miSeq = ++bootstrapSeq;

  window.capasRuta = window.capasRuta || [];
  asegurarSelectorFechaFuturaEnSidebar();
  parchearFetchTomTomConDepartAt();
  initSelectOrigen();
  initMap(mapEl);
  if (miSeq !== bootstrapSeq) return false;

  ensurePanelTraficoMenuLateral();
  limpiarPanelTraficoMenuLateral();
  initListaMaquinas(maquinasVisibles, []);
  actualizarIndicadorFiltro("", maquinasVisibles.length);
  adjuntarListenersUiUnaVez();

  await restaurarEstadoDesdeLocalStorage();
  if (miSeq !== bootstrapSeq) return false;

  if (map) {
    map.invalidateSize();
  }
  return true;
}

export {
  calcularRuta,
  reiniciarMapa,
  confirmarUbicacionGPS,
  aplicarFiltroZona
};
