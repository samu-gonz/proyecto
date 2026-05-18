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
let rutaLayer = null;
let numeroMarkers = [];
let maquinaMarkers = [];
let maquinasVisibles = [...MAQUINAS];
let textoFiltroActual = "";
let repositorMarker = null;
let origenMaquinaMarker = null;
let origenRuta = null;

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

function limpiarMarcadoresOrigen() {
  if (repositorMarker) {
    map.removeLayer(repositorMarker);
    repositorMarker = null;
  }
  if (origenMaquinaMarker) {
    map.removeLayer(origenMaquinaMarker);
    origenMaquinaMarker = null;
  }
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

function mensajeErrorGeolocalizacion(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Permiso denegado. Activa la ubicación en el navegador.";
    case error.POSITION_UNAVAILABLE:
      return "No se pudo obtener tu posición. Comprueba el GPS.";
    case error.TIMEOUT:
      return "Tiempo de espera agotado. Vuelve a intentarlo.";
    default:
      return "Error al obtener la ubicación.";
  }
}

function colocarMarcadorRepositor(lat, lng) {
  limpiarMarcadoresOrigen();
  repositorMarker = L.marker([lat, lng], {
    icon: iconoRepositor,
    title: "Tu ubicación",
    zIndexOffset: 1000
  })
    .addTo(map)
    .bindPopup("<b>Tu ubicación</b><br>Punto de partida de la ruta");
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

function establecerOrigenMaquina(maquina) {
  origenRuta = {
    nombre: maquina.nombre,
    lat: maquina.lat,
    lng: maquina.lng,
    zona: maquina.zona,
    esGPS: false,
    esMaquina: true,
    maquinaId: maquina.id
  };

  colocarMarcadorOrigenMaquina(maquina);
  actualizarInfoOrigen();
  map.setView([maquina.lat, maquina.lng], 13);

  if (maquinasVisibles.some((m) => m.id === maquina.id)) {
    marcarMaquinaEnLista(maquina.id, true);
  }
}

function obtenerUbicacionGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

async function aplicarOrigenGPS() {
  const estado = document.getElementById("geo-estado");
  const select = document.getElementById("select-origen");

  select.disabled = true;
  estado.className = "small geo-estado";
  estado.textContent = "Obteniendo ubicación...";

  try {
    const position = await obtenerUbicacionGPS();
    const { latitude, longitude, accuracy } = position.coords;

    origenRuta = {
      nombre: "Tu ubicación",
      lat: latitude,
      lng: longitude,
      zona: "GPS",
      esGPS: true,
      esMaquina: false,
      maquinaId: null,
      precision: accuracy
    };

    limpiarMarcadoresOrigen();
    colocarMarcadorRepositor(latitude, longitude);
    actualizarInfoOrigen();

    estado.className = "small geo-estado ok";
    estado.textContent = `Ubicación detectada (±${Math.round(accuracy)} m).`;
    map.setView([latitude, longitude], 14);
  } catch (error) {
    estado.className = "small geo-estado error";
    if (error.message === "unsupported") {
      estado.textContent = "Tu navegador no soporta geolocalización.";
    } else {
      estado.textContent = mensajeErrorGeolocalizacion(error);
    }
    throw error;
  } finally {
    select.disabled = false;
  }
}

async function resolverOrigenDesdeSelector() {
  const valor = document.getElementById("select-origen").value;

  if (valor === "gps") {
    await aplicarOrigenGPS();
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
  let actual = { lat: origen.lat, lng: origen.lng };

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
  if (rutaLayer) {
    map.removeLayer(rutaLayer);
    rutaLayer = null;
  }
}

function limpiarNumeroMarkers() {
  numeroMarkers.forEach((mk) => map.removeLayer(mk));
  numeroMarkers = [];
}

function actualizarMarcadoresMaquinas(maquinas) {
  maquinaMarkers.forEach((mk) => map.removeLayer(mk));
  maquinaMarkers = [];

  maquinas.forEach((m) => {
    const mk = L.marker([m.lat, m.lng], { title: m.nombre })
      .addTo(map)
      .bindPopup(
        `<b>${m.nombre}</b><br>` +
        `Zona: ${m.zona}<br>` +
        `Servicio estimado: ${m.tiempoServicioMin} min`
      );
    maquinaMarkers.push(mk);
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
    label.textContent = `${m.nombre} (${m.tiempoServicioMin} min)`;

    div.appendChild(input);
    div.appendChild(label);
    cont.appendChild(div);
  });
}

function initMap() {
  map = L.map("map").setView([28.2916, -16.6291], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  actualizarInfoOrigen();

  actualizarMarcadoresMaquinas(maquinasVisibles);
  ajustarVistaMapa(maquinasVisibles);
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
    } catch {
      return;
    }
  }

  const origen = obtenerOrigenRuta();
  if (!origen) {
    resumenDiv.innerHTML = "<p>Selecciona un punto de partida.</p>";
    return;
  }
  const seleccionados = obtenerSeleccionados();
  const destinos = obtenerDestinosRuta(seleccionados);

  if (destinos.length === 0) {
    limpiarRutaEnMapa();
    resumenDiv.innerHTML =
      "<p>Selecciona al menos una máquina para visitar (distinta del origen si partes de una máquina).</p>";
    return;
  }

  limpiarNumeroMarkers();

  const rutaOrdenada = ordenarPorRutaOptima(origen, destinos);

  const coords = [
    [origen.lng, origen.lat],
    ...rutaOrdenada.map((p) => [p.lng, p.lat]),
    [origen.lng, origen.lat]
  ];

  const coordStr = coords.map((c) => c.join(",")).join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

  resumenDiv.innerHTML = "<p>Calculando ruta...</p>";

  try {
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.routes || data.routes.length === 0) {
      resumenDiv.innerHTML = "<p>No se ha podido calcular la ruta.</p>";
      return;
    }

    const route = data.routes[0];

    if (rutaLayer) {
      map.removeLayer(rutaLayer);
    }
    rutaLayer = L.geoJSON(route.geometry, {
      style: { color: "#0078d4", weight: 4 }
    }).addTo(map);

    map.fitBounds(rutaLayer.getBounds(), { padding: [20, 20] });

    const distanciaKm = route.distance / 1000;
    const tiempoConduccionMin = route.duration / 60;
    const tiempoServicioTotal = rutaOrdenada.reduce(
      (acc, p) => acc + p.tiempoServicioMin,
      0
    );
    const tiempoTotal = tiempoConduccionMin + tiempoServicioTotal;

    let html = "";
    html += `<p><strong>Salida desde:</strong> ${origen.nombre}`;
    if (origen.esGPS && origen.precision) {
      html += ` (±${Math.round(origen.precision)} m)`;
    }
    html += "</p>";
    if (textoFiltroActual.trim()) {
      html += `<p><strong>Zona filtrada:</strong> ${textoFiltroActual.trim()}</p>`;
    }
    html += `<p><strong>Paradas a visitar:</strong> ${rutaOrdenada.length}</p>`;
    html += `<p><strong>Distancia total:</strong> ${distanciaKm.toFixed(1)} km</p>`;
    html += `<p><strong>Tiempo conducción:</strong> ${tiempoConduccionMin.toFixed(0)} min</p>`;
    html += `<p><strong>Tiempo servicio:</strong> ${tiempoServicioTotal} min</p>`;
    html += `<p><strong>Tiempo total estimado:</strong> ${tiempoTotal.toFixed(0)} min</p>`;

    html += "<h3>Orden de visita</h3>";
    html += "<ol>";
    html += `<li><strong>Salida:</strong> ${origen.nombre}</li>`;
    rutaOrdenada.forEach((p, idx) => {
      html += `<li>${p.nombre} (${p.tiempoServicioMin} min)</li>`;
      dibujarNumeroEnMapa(idx + 1, p.lat, p.lng);
    });
    html += `<li><strong>Regreso:</strong> ${origen.nombre}</li>`;
    html += "</ol>";

    resumenDiv.innerHTML = html;
  } catch (e) {
    console.error(e);
    resumenDiv.innerHTML = "<p>Error al contactar con el servidor de rutas.</p>";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initSelectOrigen();
  initMap();
  renderListaMaquinas(maquinasVisibles, []);
  actualizarIndicadorFiltro("", maquinasVisibles.length);

  document.getElementById("btn-ruta").addEventListener("click", calcularRuta);
  document.getElementById("select-origen").addEventListener("change", async () => {
    try {
      await resolverOrigenDesdeSelector();
      const destinos = obtenerDestinosRuta(obtenerSeleccionados());
      if (destinos.length > 0) {
        await calcularRuta({ resolverOrigen: false });
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
