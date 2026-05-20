// 62 máquinas repartidas por toda la isla (norte, sur, este, oeste y valle)
const PUNTOS_ISLA = [
  { nombre: "La Laguna Centro", zona: "La Laguna", lat: 28.4874, lng: -16.3159 },
  { nombre: "La Laguna Campus", zona: "La Laguna", lat: 28.4827, lng: -16.3200 },
  { nombre: "Santa Cruz Puerto", zona: "Santa Cruz", lat: 28.4631, lng: -16.2470 },
  { nombre: "Candelaria Basílica", zona: "Candelaria", lat: 28.3540, lng: -16.3720 },
  { nombre: "Adeje Centro", zona: "Sur", lat: 28.1227, lng: -16.7260 },
  { nombre: "Los Cristianos", zona: "Sur", lat: 28.0496, lng: -16.7160 },
  { nombre: "Plaza del Adelantado", zona: "La Laguna", lat: 28.4855, lng: -16.3142 },
  { nombre: "San Benito", zona: "La Laguna", lat: 28.4910, lng: -16.3080 },
  { nombre: "Guajara", zona: "La Laguna", lat: 28.4780, lng: -16.3280 },
  { nombre: "Mesa Mota", zona: "La Laguna", lat: 28.4940, lng: -16.3250 },
  { nombre: "Tegueste", zona: "La Laguna", lat: 28.5240, lng: -16.3390 },
  { nombre: "Punta de Hidalgo", zona: "Norte", lat: 28.5710, lng: -16.3420 },
  { nombre: "Tejina", zona: "Norte", lat: 28.5380, lng: -16.3610 },
  { nombre: "García Sanabria", zona: "Santa Cruz", lat: 28.4680, lng: -16.2560 },
  { nombre: "Mercado Nuestra Señora", zona: "Santa Cruz", lat: 28.4605, lng: -16.2495 },
  { nombre: "Plaza España", zona: "Santa Cruz", lat: 28.4665, lng: -16.2488 },
  { nombre: "Avenida Marítima", zona: "Santa Cruz", lat: 28.4580, lng: -16.2440 },
  // En el macizo TomTom enruta >90 km por TF-12; pin en zona urbana TF-1
  { nombre: "Anaga - Taganana", zona: "Norte", lat: 28.4780, lng: -16.2500 },
  { nombre: "San Andrés", zona: "Santa Cruz", lat: 28.5010, lng: -16.1820 },
  { nombre: "El Rosario", zona: "Santa Cruz", lat: 28.4510, lng: -16.3060 },
  { nombre: "Tacoronte", zona: "Norte", lat: 28.4770, lng: -16.4100 },
  { nombre: "El Sauzal", zona: "Norte", lat: 28.4785, lng: -16.4410 },
  { nombre: "La Matanza", zona: "Norte", lat: 28.4650, lng: -16.4480 },
  { nombre: "La Victoria", zona: "Norte", lat: 28.4520, lng: -16.4580 },
  { nombre: "Santa Úrsula", zona: "Norte", lat: 28.4280, lng: -16.4920 },
  { nombre: "La Orotava", zona: "Norte", lat: 28.3905, lng: -16.5230 },
  { nombre: "Los Realejos", zona: "Norte", lat: 28.3870, lng: -16.5890 },
  { nombre: "Puerto de la Cruz", zona: "Norte", lat: 28.4180, lng: -16.5490 },
  { nombre: "Los Silos", zona: "Oeste", lat: 28.3580, lng: -16.8180 },
  { nombre: "Garachico", zona: "Oeste", lat: 28.3725, lng: -16.7630 },
  { nombre: "Icod de los Vinos", zona: "Oeste", lat: 28.3680, lng: -16.7130 },
  { nombre: "Buenavista del Norte", zona: "Oeste", lat: 28.3790, lng: -16.8640 },
  { nombre: "Santiago del Teide", zona: "Oeste", lat: 28.2950, lng: -16.8160 },
  { nombre: "Tamaimo", zona: "Oeste", lat: 28.2200, lng: -16.8500 },
  { nombre: "Guía de Isora", zona: "Oeste", lat: 28.2110, lng: -16.7790 },
  { nombre: "Chío", zona: "Oeste", lat: 28.2650, lng: -16.7520 },
  { nombre: "Playa San Juan", zona: "Oeste", lat: 28.2380, lng: -16.7380 },
  { nombre: "Güímar", zona: "Este", lat: 28.3200, lng: -16.4150 },
  { nombre: "Fasnia", zona: "Este", lat: 28.2980, lng: -16.4380 },
  { nombre: "Arafo", zona: "Candelaria", lat: 28.3410, lng: -16.4210 },
  { nombre: "Igueste", zona: "Candelaria", lat: 28.3620, lng: -16.3980 },
  { nombre: "Playa Candelaria", zona: "Candelaria", lat: 28.3480, lng: -16.3810 },
  { nombre: "El Socorro", zona: "Candelaria", lat: 28.3360, lng: -16.3650 },
  { nombre: "Granadilla", zona: "Sur", lat: 28.0890, lng: -16.5770 },
  { nombre: "El Médano", zona: "Sur", lat: 28.0450, lng: -16.5360 },
  { nombre: "San Isidro", zona: "Sur", lat: 28.0780, lng: -16.5580 },
  { nombre: "Las Galletas", zona: "Sur", lat: 28.0180, lng: -16.6510 },
  { nombre: "Playa Las Américas", zona: "Sur", lat: 28.0620, lng: -16.7310 },
  { nombre: "Costa Adeje", zona: "Sur", lat: 28.1080, lng: -16.7350 },
  { nombre: "Fanabe", zona: "Sur", lat: 28.1150, lng: -16.7180 },
  { nombre: "Arona", zona: "Sur", lat: 28.0990, lng: -16.6810 },
  { nombre: "Vilaflor", zona: "Valle", lat: 28.1580, lng: -16.6350 },
  { nombre: "San Miguel", zona: "Valle", lat: 28.0980, lng: -16.6170 },
  { nombre: "La Esperanza", zona: "Valle", lat: 28.4450, lng: -16.4410 },
  // Acceso TF-24 (Portillo): en el cráter TomTom enruta ~80 km por vías lentas del parque
  { nombre: "Las Cañadas del Teide", zona: "Valle", lat: 28.3508, lng: -16.5197 },
  { nombre: "Arico", zona: "Este", lat: 28.1720, lng: -16.4780 },
  { nombre: "Porís de Abona", zona: "Sur", lat: 28.1350, lng: -16.5120 },
  { nombre: "Callao Salvaje", zona: "Sur", lat: 28.1420, lng: -16.7580 },
  { nombre: "Puerto Colón", zona: "Sur", lat: 28.0780, lng: -16.7420 },
  { nombre: "Playa Paraíso", zona: "Sur", lat: 28.1280, lng: -16.7710 },
  { nombre: "Valle San Lorenzo", zona: "Sur", lat: 28.1320, lng: -16.6980 },
  { nombre: "Chayofa", zona: "Sur", lat: 28.0880, lng: -16.7050 }
];

const MAQUINAS = PUNTOS_ISLA.map((punto, index) => ({
  id: index + 1,
  nombre: `Máquina ${punto.nombre}`,
  zona: punto.zona,
  lat: punto.lat,
  lng: punto.lng,
  tiempoServicioMin: 10 + (index % 4) * 5
}));

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

  if (fechaFinal) {
    urlBase +=
      "?" +
      params.toString() +
      "&traffic=true&computeTravelTimeFor=all&maxAlternatives=2&departAt=" +
      fechaFinal;
  } else {
    urlBase +=
      "?" +
      params.toString() +
      "&traffic=true&departAt=now&maxAlternatives=2";
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

      const urlTomTom = construirUrlCalculateRouteTomTomApp(points, apiKey, {
        fechaInput: leerFechaFuturaDesdeUIApp(),
        computeBestOrder: urlParseada.searchParams.get("computeBestOrder") === "true"
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

  if (!window.capasRutaAlternativas) window.capasRutaAlternativas = [];
  window.capasRutaAlternativas.forEach((capa) => {
    if (mapa && capa && mapa.hasLayer(capa)) {
      mapa.removeLayer(capa);
    }
  });
  window.capasRutaAlternativas = [];
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

/** Misma regla para pintar el mapa y para el contador del menú. */
function clasificarTramoTraficoApp(seccion) {
  const retraso = Number(seccion.delayInSeconds) || 0;
  const magnitude = Number(seccion.magnitudeOfDelay) || 0;

  if (magnitude >= 3 || retraso > 60) return "rojo";
  if (
    (magnitude >= 1 && magnitude <= 2) ||
    (retraso > 0 && retraso <= 60)
  ) {
    return "amarillo";
  }
  return "verde";
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

/**
 * Pinta data.routes[0] recorriendo todos sus legs (multiparada).
 * Devuelve el grupo Leaflet o null si no hay geometría usable.
 */
function pintarRutaPrincipalMultiparadaEnMapa(mapa, data, opciones = {}) {
  limpiarGrupoLineasRutaApp(mapa);
  if (typeof limpiarLineasRuta === "function") {
    limpiarLineasRuta(mapa);
  }

  const rutaPrincipal = rutaPrincipalTomTomApp(data);
  const legs = rutaPrincipal?.legs || [];
  if (!legs.length) {
    console.warn("TomTom: routes[0] sin legs (multiparada)");
    return null;
  }

  const grupoLineasRuta = L.featureGroup().addTo(mapa);
  grupoLineasRutaApp = grupoLineasRuta;

  if (opciones.rutaEsquivada) {
    const contorno = polylineConcatenandoLegsApp(rutaPrincipal);
    if (contorno.length >= 2) {
      grupoLineasRuta.addLayer(
        L.polyline(contorno, {
          color: "#ff00aa",
          weight: 10,
          opacity: 0.35,
          lineJoin: "round",
          lineCap: "round"
        })
      );
    }
  }

  let legsPintados = 0;
  legs.forEach((leg) => {
    if (pintarTraficoLegMultiparada(grupoLineasRuta, leg, opciones)) {
      legsPintados += 1;
    }
  });

  if (legsPintados === 0) {
    limpiarGrupoLineasRutaApp(mapa);
    console.warn("TomTom: ningún leg con geometría pintable", {
      legsTotales: legs.length
    });
    return null;
  }

  return grupoLineasRuta.getLayers().length > 0 ? grupoLineasRuta : null;
}

/**
 * SEGUNDO PLANO AISLADO: solo routes[1..n], sin tocar routes[0] ni sus legs.
 */
function pintarRutasAlternativasSegundoPlano(mapa, data) {
  if (!mapa || !data?.routes || data.routes.length <= 1) return;

  if (!window.capasRutaAlternativas) window.capasRutaAlternativas = [];

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
      dashArray: "5, 10",
      lineJoin: "round",
      lineCap: "round"
    }).addTo(mapa);

    window.capasRutaAlternativas.push(lineaAlt);
  });
}

/** Compatibilidad con llamadas existentes (esquivar incidencias, etc.). */
function pintarRutaTraficoFragmentadaEnMapa(mapa, data, opciones = {}) {
  return pintarRutaPrincipalMultiparadaEnMapa(mapa, data, opciones);
}

/** Contador #contador-trafico-personalizado: todas las sections de todos los legs de routes[0]. */
function contarTramosTraficoDesdeDatos(data) {
  let rojos = 0;
  let amarillos = 0;
  let verdes = 0;

  const rutaPrincipal = rutaPrincipalTomTomApp(data);
  if (!rutaPrincipal?.legs?.length) {
    return { rojo: 0, amarillo: 0, verde: 0 };
  }

  rutaPrincipal.legs.forEach((leg) => {
    [...(leg.sections || [])]
      .filter((s) => esSeccionPintableEnMapaApp(s))
      .forEach((seccion) => {
        if (puntosTramoSeccionEnLegApp(leg, seccion).length < 2) return;
        const nivel = clasificarTramoTraficoApp(seccion);
        if (nivel === "rojo") rojos++;
        else if (nivel === "amarillo") amarillos++;
        else verdes++;
      });
  });

  return { rojo: rojos, amarillo: amarillos, verde: verdes };
}

function actualizarTraficoMenuDesdeDatos(data) {
  actualizarPanelTraficoMenuLateral(contarTramosTraficoDesdeDatos(data));
}

/**
 * 2. PROCESAMIENTO TRAS RESPUESTA TOMTOM (principal aislada + alternativas aparte).
 * PRIORIDAD: data.routes[0].legs → pintarTraficoLegMultiparada (sections + slice).
 */
function procesarDatosTomTomMultiparadaApp(mapa, data, opciones = {}) {
  if (!data?.routes?.length) return null;

  limpiarCapasRutaRegistroApp(mapa);

  // ==============================================================
  // PRIORIDAD MÁXIMA: RUTA PRINCIPAL MULTIPARADA (data.routes[0])
  // ==============================================================
  const capaPrincipal = pintarRutaPrincipalMultiparadaEnMapa(mapa, data, opciones);
  if (!capaPrincipal) return null;

  registrarCapasGrupoEnWindowCapasRuta(capaPrincipal);
  actualizarTraficoMenuDesdeDatos(data);

  // ==============================================================
  // SEGUNDO PLANO AISLADO: RUTAS ALTERNATIVAS (data.routes.slice(1))
  // ==============================================================
  pintarRutasAlternativasSegundoPlano(mapa, data);

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
  panel.innerHTML =
    '<p id="contador-trafico-personalizado" class="small">Tráfico: sin ruta calculada</p>';
  resumenDiv.parentNode.insertBefore(panel, resumenDiv);
}

function limpiarPanelTraficoMenuLateral() {
  conteoTraficoRutaApp = { verde: 0, amarillo: 0, rojo: 0 };
  const el =
    document.getElementById("contador-trafico-personalizado") ||
    document.getElementById("trafico-ruta-texto");
  if (!el) return;

  el.innerHTML =
    "<strong>Tráfico:</strong> " +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.rojo}">0 tramos rojos</span>, ` +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.amarillo}">0 amarillos</span>, ` +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.verde}">0 verdes</span>`;
}

function actualizarPanelTraficoMenuLateral(conteo) {
  ensurePanelTraficoMenuLateral();
  const rojos = conteo.rojo ?? 0;
  const amarillos = conteo.amarillo ?? 0;
  const verdes = conteo.verde ?? 0;

  conteoTraficoRutaApp = { verde: verdes, amarillo: amarillos, rojo: rojos };

  const el =
    document.getElementById("contador-trafico-personalizado") ||
    document.getElementById("trafico-ruta-texto");
  if (!el) return;

  el.innerHTML =
    "<strong>Tráfico:</strong> " +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.rojo}">${rojos} tramos rojos</span>, ` +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.amarillo}">${amarillos} amarillos</span>, ` +
    `<span style="color:${COLORES_TRAMO_TRAFICO_APP.verde}">${verdes} verdes</span>`;
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
      { rutaEsquivada: true, autoEvitarRoadblocks: false },
      seqEsquivar
    );

    if (resultado?.areasEvitadas?.length) {
      estadoRutaReponedor.areasEvitadas = resultado.areasEvitadas;
    }

    if (!resultado?.data) {
      return;
    }

    const datosTomTom = resultado.data;
    const capaEsquivada = aplicarRutaMultiparadaTomTomAlMapa(map, datosTomTom, {
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
    void calcularRuta({ resolverOrigen: false });
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

function initMap() {
  map = L.map("map", { maxZoom: 22 });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 22,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  map.fitBounds(BOUNDS_TENERIFE, { padding: [30, 30] });

  queueMicrotask(() => {
    if (typeof initCapasTraficoTomTom !== "function") return;
    const claveTomTom =
      typeof obtenerClaveTomTom === "function"
        ? obtenerClaveTomTom()
        : window.TOMTOM_API_KEY || "";
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

  if (
    typeof coordenadasValidas !== "function" ||
    !coordenadasValidas(origenRaw)
  ) {
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

  const origenActual =
    typeof normalizarPuntoRuta === "function"
      ? normalizarPuntoRuta(origenRaw)
      : origenRaw;

  const paradasFiltradas = prepararParadasParaTomTom(origenActual, [
    ...misParadasSeleccionadas
  ]).filter((p) =>
    typeof coordenadasValidas === "function" ? coordenadasValidas(p) : true
  );

  if (paradasFiltradas.length === 0) {
    limpiarContenedorResumen(
      "<p>Selecciona al menos una máquina distinta del origen.</p>"
    );
    programarGuardadoEstado();
    return;
  }

  const paradasParaTomTom = ordenarPorRutaOptima(origenActual, paradasFiltradas);
  const apiKey =
    typeof obtenerClaveTomTom === "function"
      ? obtenerClaveTomTom()
      : window.TOMTOM_API_KEY || "";

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

    const resultadoRuta = await calcularRutaTomTom(
      map,
      origenActual,
      paradasParaTomTom,
      apiKey,
      null,
      { autoEvitarRoadblocks: true },
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

    // Procesado defensivo: routes[0] por legs; alternativas en bloque aparte.
    const capaRuta = procesarDatosTomTomMultiparadaApp(map, datosTomTom, {
      rutaEsquivada: Boolean(resultadoRuta?.rutaEsquivada)
    });
    statsTrafico = statsTraficoDesdeConteoApp(conteoTraficoRutaApp);

    const legsTomTom = rutaTomTom?.legs || [];
    console.log("Ruta multiparada TomTom:", {
      paradas: paradasParaTomTom.length,
      rutasEnRespuesta: datosTomTom.routes?.length ?? 0,
      legs: legsTomTom.length,
      legsConGeometria: legsTomTom.filter(
        (leg) => puntosLegComoPolylineApp(leg).length >= 2
      ).length,
      alternativasPintadas: window.capasRutaAlternativas?.length ?? 0
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
  await invocarEnrutamientoTomTom();
}

/**
 * Botón «Calcular ruta»:
 * 1) Fecha futura → URL TomTom (departAt sin %3A, maxAlternatives=2) vía fetch parcheado.
 * 2) Petición TomTom (calcularRutaTomTom + roadblocks).
 * 3) Procesado: routes[0].legs (tráfico por colores) y, aparte, routes.slice(1) en gris.
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
      resumenDiv.innerHTML = `<p>${mensaje}</p>`;
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

  await invocarEnrutamientoTomTom();
}

window.addEventListener("DOMContentLoaded", async () => {
  window.capasRuta = window.capasRuta || [];
  window.capasRutaAlternativas = window.capasRutaAlternativas || [];
  asegurarSelectorFechaFuturaEnSidebar();
  parchearFetchTomTomConDepartAt();
  initSelectOrigen();
  initMap();
  ensurePanelTraficoMenuLateral();
  limpiarPanelTraficoMenuLateral();
  initListaMaquinas(maquinasVisibles, []);
  actualizarIndicadorFiltro("", maquinasVisibles.length);

  await restaurarEstadoDesdeLocalStorage();

  document.getElementById("btn-ruta").addEventListener("click", calcularRuta);

  document.getElementById("btn-reiniciar-mapa").addEventListener("click", reiniciarMapa);

  document.getElementById("btn-confirmar-gps").addEventListener("click", () => {
    confirmarUbicacionGPS();
  });

  document.getElementById("select-origen").addEventListener("change", async () => {
    try {
      const valor = document.getElementById("select-origen").value;

      if (valor === "gps") {
        const geo = document.getElementById("geo-estado");
        if (
          geo &&
          (!origenRuta?.esGPS ||
            typeof coordenadasValidas !== "function" ||
            !coordenadasValidas(origenRuta))
        ) {
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
  });
  document.getElementById("btn-buscar").addEventListener("click", () => {
    aplicarFiltroZona(true);
  });
  document.getElementById("input-zona").addEventListener("keydown", (e) => {
    if (e.key === "Enter") aplicarFiltroZona(true);
  });
  document.getElementById("input-zona").addEventListener("input", () => {
    const texto = document.getElementById("input-zona").value;
    if (!texto.trim()) aplicarFiltroZona(false);
  });
});
