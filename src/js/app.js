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
  { nombre: "Anaga - Taganana", zona: "Norte", lat: 28.5500, lng: -16.1950 },
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
  { nombre: "Las Cañadas del Teide", zona: "Valle", lat: 28.2720, lng: -16.6420 },
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

function tiempoServicioMinutos(parada) {
  const minutos = Number(parada?.tiempoServicioMin);
  return Number.isFinite(minutos) ? minutos : 10;
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
    limpiarRutaEnMapa();
    colocarMarcadorGpsUsuario(lat, lon, accuracy);
    actualizarInfoOrigen();
    centrarMapaEn(lat, lon, 15);
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

function limpiarCapasRuta() {
  if (typeof limpiarRutaTomTom === "function") {
    limpiarRutaTomTom(map);
  }
  if (capasTraficoTomTom) {
    capasTraficoTomTom.ocultarDeRuta();
  }
}

function encuadrarRutaEnMapa(bounds) {
  if (bounds && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

function mostrarResumenRutaFlotante(datosTomTom) {
  const panel = document.getElementById("ruta-stats-flotante");
  if (!panel || typeof extraerResumenRutaTomTom !== "function") return;

  const stats = extraerResumenRutaTomTom(datosTomTom);
  if (!stats) {
    ocultarResumenRutaFlotante();
    return;
  }

  panel.textContent = `Distancia: ${stats.distanciaKm.toFixed(1)} km | Tiempo: ${stats.tiempoMin.toFixed(0)} min`;
  panel.hidden = false;
}

function ocultarResumenRutaFlotante() {
  const panel = document.getElementById("ruta-stats-flotante");
  if (panel) panel.hidden = true;
}

function pintarRutaTomTomEnMapa(datosTomTom, opciones = {}) {
  if (!opciones.rutaEsquivada) {
    limpiarCapasRuta();
  } else if (typeof limpiarRutaTomTom === "function") {
    limpiarRutaTomTom(map);
  }

  const capaRuta = pintarRutaPorCarretera(map, datosTomTom, opciones);
  if (capaRuta && capaRuta.getBounds) {
    encuadrarRutaEnMapa(capaRuta.getBounds());
  }
  mostrarResumenRutaFlotante(datosTomTom);
  return capaRuta;
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
  const yaExiste = estadoRutaReponedor.areasEvitadas.some(
    (r) =>
      r.southWestCorner.latitude === rect.southWestCorner.latitude &&
      r.southWestCorner.longitude === rect.southWestCorner.longitude
  );
  if (!yaExiste) {
    estadoRutaReponedor.areasEvitadas.push(rect);
  }

  const resumenDiv = document.getElementById("resumen");
  resumenDiv.innerHTML =
    "<p>Recalculando ruta esquivando incidencia...</p>";

  try {
    const origenOk =
      typeof normalizarPuntoRuta === "function"
        ? normalizarPuntoRuta(origen)
        : origen;
    const paradasOk = rutaOrdenada.map((p) =>
      typeof normalizarPuntoRuta === "function" ? normalizarPuntoRuta(p) : p
    );

    const resultado = await calcularRutaTomTom(
      map,
      origenOk,
      paradasOk,
      claveTomTom,
      estadoRutaReponedor.areasEvitadas,
      { rutaEsquivada: true }
    );

    if (!resultado?.data) {
      return;
    }

    const datosTomTom = resultado.data;
    if (resultado.capa?.getBounds) {
      encuadrarRutaEnMapa(resultado.capa.getBounds());
    }

    mostrarResumenRutaFlotante(datosTomTom);

    const stats = extraerResumenRutaTomTom(datosTomTom);
    const distanciaKm = stats?.distanciaKm ?? 0;
    const tiempoMin = stats?.tiempoMin ?? 0;

    let html = `<p><strong>Ruta alternativa (esquivando incidencia)</strong></p>`;
    html += `<p>${incidencia.descripcion}</p>`;
    html += `<p><strong>Distancia:</strong> ${distanciaKm.toFixed(1)} km · <strong>Tiempo:</strong> ${tiempoMin.toFixed(0)} min</p>`;
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
  estado.textContent = `Origen: ${maquina.nombre}. Calculando ruta en el mapa...`;
  await calcularRuta({ resolverOrigen: false });
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

function obtenerDestinosRuta(seleccionados) {
  const origen = obtenerOrigenRuta();
  if (!origen || !origen.maquinaId) return seleccionados;
  return seleccionados.filter((m) => m.id !== origen.maquinaId);
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

function limpiarRutaEnMapa() {
  limpiarNumeroMarkers();
  limpiarCapasRuta();
}

const VISTA_INICIAL_TENERIFE = {
  center: [28.2916, -16.6291],
  zoom: 10
};

function reiniciarMapa() {
  if (!map) return;

  map.closePopup();

  limpiarRutaEnMapa();
  limpiarMarcadoresOrigen();
  ocultarResumenRutaFlotante();

  estadoRutaReponedor = null;
  origenRuta = null;
  maquinaSeleccionadaId = null;

  if (marcadorSeleccionadoLayer) {
    map.removeLayer(marcadorSeleccionadoLayer);
    marcadorSeleccionadoLayer = null;
  }

  const select = document.getElementById("select-origen");
  if (select) select.value = "gps";

  const resumen = document.getElementById("resumen");
  if (resumen) {
    resumen.innerHTML = '<p>Selecciona máquinas y pulsa "Calcular ruta".</p>';
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

function limpiarNumeroMarkers() {
  numeroMarkers.forEach((mk) => map.removeLayer(mk));
  numeroMarkers = [];
}

function irAMaquinaEnMapa(maquina) {
  centrarMapaEn(maquina.lat, maquina.lng, 15);
  seleccionarMaquinaEnMapa(maquina);
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
    irAMaquinaEnMapa(maquina);
    await calcularRuta({ resolverOrigen: false });
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
      seleccionarMaquinaEnMapa(m);
      mk.openPopup();
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

function renderListaMaquinas(maquinas, idsSeleccionados) {
  const cont = document.getElementById("lista-maquinas");
  cont.innerHTML = "";

  if (maquinas.length === 0) {
    cont.innerHTML = '<p class="small">No hay máquinas en esta zona.</p>';
    return;
  }

  maquinas.forEach((m) => {
    const div = document.createElement("div");
    div.className = "maquina-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `maq-${m.id}`;
    input.value = m.id;
    input.checked = idsSeleccionados.includes(m.id);

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = `${m.nombre} (${tiempoServicioMinutos(m)} min)`;

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
      "<p>Selecciona máquinas y pulsa \"Calcular ruta\".</p>";
    return;
  }

  if (recalcularRuta) {
    await calcularRuta();
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

async function calcularRuta(opciones = {}) {
  const { resolverOrigen = true } = opciones;
  const resumenDiv = document.getElementById("resumen");

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

  const origenRaw = obtenerOrigenRuta();
  if (!origenRaw) {
    resumenDiv.innerHTML = "<p>Selecciona un punto de partida.</p>";
    return;
  }

  if (
    typeof coordenadasValidas !== "function" ||
    !coordenadasValidas(origenRaw)
  ) {
    console.error("Origen con coordenadas inválidas:", origenRaw);
    resumenDiv.innerHTML =
      "<p>El origen no tiene coordenadas válidas. Si usas GPS, pulsa «Confirmar mi ubicación actual».</p>";
    return;
  }

  const origen =
    typeof normalizarPuntoRuta === "function"
      ? normalizarPuntoRuta(origenRaw)
      : origenRaw;

  const seleccionados = obtenerSeleccionados();
  const destinosRaw = obtenerDestinosRuta(seleccionados);
  const destinos = destinosRaw
    .map((m) =>
      typeof normalizarPuntoRuta === "function" ? normalizarPuntoRuta(m) : m
    )
    .filter((m) =>
      typeof coordenadasValidas === "function" ? coordenadasValidas(m) : true
    );

  if (destinos.length === 0) {
    limpiarRutaEnMapa();
    ocultarResumenRutaFlotante();
    resumenDiv.innerHTML =
      "<p>Selecciona al menos una máquina para visitar (distinta del origen si partes de una máquina).</p>";
    return;
  }

  limpiarRutaEnMapa();
  limpiarNumeroMarkers();
  ocultarResumenRutaFlotante();
  estadoRutaReponedor = null;

  const rutaOrdenada = ordenarPorRutaOptima(origen, destinos);

  const claveTomTom =
    typeof obtenerClaveTomTom === "function"
      ? obtenerClaveTomTom()
      : window.TOMTOM_API_KEY || "";

  resumenDiv.innerHTML = "<p>Calculando ruta con tráfico TomTom...</p>";

  try {
    let distanciaKm = 0;
    let tiempoConduccionMin = 0;
    let avisoRuta = "";
    let statsTrafico = null;

    if (!claveTomTom) {
      throw new Error("Sin clave TomTom");
    }

    estadoRutaReponedor = {
      origen,
      rutaOrdenada,
      claveTomTom,
      areasEvitadas: []
    };

    const resultadoRuta = await calcularRutaTomTom(
      map,
      origen,
      rutaOrdenada,
      claveTomTom,
      null,
      {}
    );

    if (!resultadoRuta?.data) {
      ocultarResumenRutaFlotante();
      resumenDiv.innerHTML =
        "<p><strong>No se obtuvo respuesta de TomTom.</strong> Comprueba tu conexión y la clave API.</p>";
      return;
    }

    const datosTomTom = resultadoRuta.data;
    const capaRuta = resultadoRuta.capa;
    const rutaTomTom = datosTomTom.routes[0];

    if (!capaRuta) {
      resumenDiv.innerHTML =
        "<p><strong>TomTom devolvió datos pero no geometría de ruta.</strong> Prueba con otras paradas o recarga la página.</p>";
      console.warn("Ruta sin capa Leaflet:", datosTomTom);
      return;
    }

    if (capaRuta?.getBounds) {
      encuadrarRutaEnMapa(capaRuta.getBounds());
    }

    if (capasTraficoTomTom?.mostrarEnRuta && capaRuta?.getBounds) {
      capasTraficoTomTom.mostrarEnRuta(capaRuta.getBounds());
    }

    mostrarResumenRutaFlotante(datosTomTom);

    const resumen = rutaTomTom.summary || {};
    const statsViaje = extraerResumenRutaTomTom(datosTomTom);
    distanciaKm = statsViaje?.distanciaKm ?? 0;
    tiempoConduccionMin = statsViaje?.tiempoMin ?? 0;
    statsTrafico = resumenTraficoRuta(rutaTomTom);

    const tiempoServicioTotal = rutaOrdenada.reduce(
      (acc, p) => acc + tiempoServicioMinutos(p),
      0
    );
    const tiempoTotal = tiempoConduccionMin + tiempoServicioTotal;

    let html = "";
    if (avisoRuta) html += `<p>${avisoRuta}</p>`;
    html += `<p><strong>Salida desde:</strong> ${origen.nombre}`;
    if (origen.esGPS && origen.precision) {
      html += ` (±${Math.round(origen.precision)} m)`;
    }
    html += "</p>";
    if (textoFiltroActual.trim()) {
      html += `<p><strong>Zona filtrada:</strong> ${textoFiltroActual.trim()}</p>`;
    }
    html += `<p><strong>Paradas a visitar:</strong> ${rutaOrdenada.length}</p>`;
    if (distanciaKm > 0) {
      html += `<p><strong>Distancia total:</strong> ${distanciaKm.toFixed(1)} km</p>`;
      html += `<p><strong>Tiempo conducción:</strong> ${tiempoConduccionMin.toFixed(0)} min</p>`;
    }
    if (resumen.trafficDelayInSeconds > 0) {
      html += `<p><strong>Retraso por tráfico:</strong> ${Math.round(resumen.trafficDelayInSeconds / 60)} min</p>`;
    }
    if (statsTrafico && statsTrafico.total > 0) {
      html += `<p><strong>Tramos en ruta:</strong> `;
      html += `<span style="color:#00E676">■</span> ${statsTrafico.fluido} fluidos `;
      html += `<span style="color:#FFD600">■</span> ${statsTrafico.lento} lentos `;
      html += `<span style="color:#FF1744">■</span> ${statsTrafico.congestion} congestionados</p>`;
    }
    html += `<p><strong>Tiempo servicio:</strong> ${tiempoServicioTotal} min</p>`;
    if (tiempoConduccionMin > 0) {
      html += `<p><strong>Tiempo total estimado:</strong> ${tiempoTotal.toFixed(0)} min</p>`;
    }

    html += "<h3>Orden de visita</h3>";
    html += "<ol>";
    html += `<li><strong>Salida:</strong> ${origen.nombre}</li>`;
    rutaOrdenada.forEach((p, idx) => {
      html += `<li>${p.nombre} (${tiempoServicioMinutos(p)} min)</li>`;
      dibujarNumeroEnMapa(idx + 1, p.lat, p.lng ?? p.lon);
    });
    html += `<li><strong>Regreso:</strong> ${origen.nombre}</li>`;
    html += "</ol>";

    resumenDiv.innerHTML = html;
    guardarEstadoSesion();
  } catch (e) {
    console.error("TomTom Routing:", e);
    limpiarCapasRuta();
    ocultarResumenRutaFlotante();

    let html = `<p><strong>No se pudo calcular la ruta por carretera.</strong></p>`;
    html += `<p>${e.message || "Error al conectar con TomTom Routing."}</p>`;
    html += `<p>Revisa la clave API y que la app se ejecute con <code>npm run dev</code>.</p>`;
    html += `<p><strong>Salida desde:</strong> ${origen.nombre}</p>`;
    html += `<p><strong>Paradas planificadas:</strong> ${rutaOrdenada.length}</p>`;
    html += "<h3>Orden de visita (sin línea en mapa)</h3><ol>";
    html += `<li><strong>Salida:</strong> ${origen.nombre}</li>`;
    rutaOrdenada.forEach((p) => {
      html += `<li>${p.nombre} (${tiempoServicioMinutos(p)} min)</li>`;
    });
    html += `<li><strong>Regreso:</strong> ${origen.nombre}</li></ol>`;
    resumenDiv.innerHTML = html;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  initSelectOrigen();
  initMap();
  renderListaMaquinas(maquinasVisibles, []);
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
