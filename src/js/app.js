// Origen: almacén en Santa Cruz (ejemplo)
const ORIGEN = {
  nombre: "Almacén Central",
  lat: 28.4636,
  lng: -16.2518,
  zona: "Santa Cruz"
};

// Máquinas de ejemplo repartidas por Tenerife
const MAQUINAS = [
  {
    id: 1,
    nombre: "Máquina La Laguna Centro",
    zona: "La Laguna",
    lat: 28.4874,
    lng: -16.3159,
    tiempoServicioMin: 15
  },
  {
    id: 2,
    nombre: "Máquina La Laguna Campus",
    zona: "La Laguna",
    lat: 28.4827,
    lng: -16.3200,
    tiempoServicioMin: 20
  },
  {
    id: 3,
    nombre: "Máquina Santa Cruz Puerto",
    zona: "Santa Cruz",
    lat: 28.4631,
    lng: -16.2470,
    tiempoServicioMin: 10
  },
  {
    id: 4,
    nombre: "Máquina Candelaria",
    zona: "Candelaria",
    lat: 28.3540,
    lng: -16.3720,
    tiempoServicioMin: 15
  },
  {
    id: 5,
    nombre: "Máquina Adeje Centro",
    zona: "Sur",
    lat: 28.1227,
    lng: -16.7260,
    tiempoServicioMin: 25
  },
  {
    id: 6,
    nombre: "Máquina Los Cristianos",
    zona: "Sur",
    lat: 28.0496,
    lng: -16.7160,
    tiempoServicioMin: 20
  },
  ...generarMaquinasEjemplo(7, 50)
];

function generarMaquinasEjemplo(idInicio, cantidad) {
  const plantillas = [
    { zona: "La Laguna", baseLat: 28.4874, baseLng: -16.3159, sitios: [
      "Plaza del Adelantado", "San Benito", "Guajara", "Campus TF", "Mesa Mota",
      "Taco", "El Ortigal", "La Cuesta", "Geneto", "Punta de Hidalgo",
      "Tejina", "Las Mercedes", "San Cristóbal"
    ]},
    { zona: "Santa Cruz", baseLat: 28.4636, baseLng: -16.2518, sitios: [
      "García Sanabria", "Mercado Nuestra Señora", "Plaza España", "Avenida Marítima",
      "Los Llanos", "Cabildo", "Parque Bulevar", "La Salud", "El Toscal",
      "Santa Cruz Norte", "Ofra", "Barranco Santos", "Universidad Anchieta", "Cueva Roja"
    ]},
    { zona: "Candelaria", baseLat: 28.3540, baseLng: -16.3720, sitios: [
      "Basílica", "Playa Candelaria", "Barranco Hondo", "Arafo", "Igueste",
      "Malpaís", "El Socorro", "La Caleta"
    ]},
    { zona: "Sur", baseLat: 28.1227, baseLng: -16.7260, sitios: [
      "Playa Las Américas", "Costa Adeje", "Fanabe", "Los Cristianos Puerto",
      "Las Galletas", "El Médano", "Granadilla", "San Isidro", "Chayofa",
      "Arona Centro", "Guaza", "Callao Salvaje", "La Caleta Adeje", "Puerto Colón",
      "Playa Paraíso", "Valle San Lorenzo"
    ]}
  ];

  const maquinas = [];
  let id = idInicio;
  let i = 0;

  while (maquinas.length < cantidad) {
    const t = plantillas[i % plantillas.length];
    const sitioIdx = Math.floor(i / plantillas.length) % t.sitios.length;
    const sitio = t.sitios[sitioIdx];
    const anillo = Math.floor(i / (plantillas.length * t.sitios.length));
    const angulo = (i * 47) * (Math.PI / 180);
    const radio = 0.006 + anillo * 0.0035;

    maquinas.push({
      id,
      nombre: `Máquina ${sitio}`,
      zona: t.zona,
      lat: t.baseLat + radio * Math.cos(angulo),
      lng: t.baseLng + radio * Math.sin(angulo),
      tiempoServicioMin: 10 + ((id + sitioIdx) % 4) * 5
    });

    id += 1;
    i += 1;
  }

  return maquinas;
}

let map;
let rutaLayer = null;
let numeroMarkers = [];
let maquinaMarkers = [];
let maquinasVisibles = [...MAQUINAS];
let textoFiltroActual = "";
let almacenMarker = null;
let repositorMarker = null;
let origenRuta = { ...ORIGEN, esGPS: false };

const iconoRepositor = L.divIcon({
  className: "marcador-repositor",
  html: `<div class="marcador-repositor__van" title="Tu ubicación">🚐</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

function obtenerOrigenRuta() {
  return origenRuta;
}

function actualizarInfoOrigen() {
  const origen = obtenerOrigenRuta();
  const tipo = origen.esGPS
    ? "Ubicación actual (GPS)"
    : "Almacén de referencia";

  document.getElementById("origen-info").innerHTML =
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
  if (repositorMarker) {
    map.removeLayer(repositorMarker);
  }
  repositorMarker = L.marker([lat, lng], {
    icon: iconoRepositor,
    title: "Tu ubicación",
    zIndexOffset: 1000
  })
    .addTo(map)
    .bindPopup("<b>Tu ubicación</b><br>Punto de partida de la ruta");
}

function usarUbicacionActual() {
  const btn = document.getElementById("btn-ubicacion");
  const estado = document.getElementById("geo-estado");

  if (!navigator.geolocation) {
    estado.className = "small geo-estado error";
    estado.textContent = "Tu navegador no soporta geolocalización.";
    return;
  }

  btn.disabled = true;
  estado.className = "small geo-estado";
  estado.textContent = "Obteniendo ubicación...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      origenRuta = {
        nombre: "Tu ubicación",
        lat: latitude,
        lng: longitude,
        zona: "GPS",
        esGPS: true,
        precision: accuracy
      };

      colocarMarcadorRepositor(latitude, longitude);
      if (almacenMarker) {
        map.removeLayer(almacenMarker);
        almacenMarker = null;
      }

      actualizarInfoOrigen();
      btn.disabled = false;
      btn.classList.add("activo");
      estado.className = "small geo-estado ok";
      estado.textContent = `Ubicación detectada (±${Math.round(accuracy)} m).`;

      map.setView([latitude, longitude], 14);

      const seleccionados = obtenerSeleccionados();
      if (seleccionados.length > 0) {
        await calcularRuta();
      }
    },
    (error) => {
      btn.disabled = false;
      estado.className = "small geo-estado error";
      estado.textContent = mensajeErrorGeolocalizacion(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
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
  const puntos = [
    L.latLng(origen.lat, origen.lng),
    ...maquinas.map((m) => L.latLng(m.lat, m.lng))
  ];

  if (puntos.length === 1) {
    map.setView([origen.lat, origen.lng], 11);
    return;
  }

  const bounds = L.latLngBounds(puntos);
  map.fitBounds(bounds, { padding: [40, 40] });
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

  almacenMarker = L.marker([ORIGEN.lat, ORIGEN.lng], { title: ORIGEN.nombre })
    .addTo(map)
    .bindPopup(`<b>${ORIGEN.nombre}</b><br>Zona: ${ORIGEN.zona}<br>(referencia)`);

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

async function calcularRuta() {
  const seleccionados = obtenerSeleccionados();
  const resumenDiv = document.getElementById("resumen");

  if (seleccionados.length === 0) {
    limpiarRutaEnMapa();
    resumenDiv.innerHTML = "<p>Selecciona al menos una máquina.</p>";
    return;
  }

  limpiarNumeroMarkers();

  const origen = obtenerOrigenRuta();
  const rutaOrdenada = ordenarPorRutaOptima(origen, seleccionados);

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
    html += `<p><strong>Paradas seleccionadas:</strong> ${rutaOrdenada.length}</p>`;
    html += `<p><strong>Distancia total:</strong> ${distanciaKm.toFixed(1)} km</p>`;
    html += `<p><strong>Tiempo conducción:</strong> ${tiempoConduccionMin.toFixed(0)} min</p>`;
    html += `<p><strong>Tiempo servicio:</strong> ${tiempoServicioTotal} min</p>`;
    html += `<p><strong>Tiempo total estimado:</strong> ${tiempoTotal.toFixed(0)} min</p>`;

    html += "<h3>Orden de visita</h3>";
    html += "<ol>";
    rutaOrdenada.forEach((p, idx) => {
      html += `<li>${p.nombre} (${p.tiempoServicioMin} min)</li>`;
      dibujarNumeroEnMapa(idx + 1, p.lat, p.lng);
    });
    html += "</ol>";

    resumenDiv.innerHTML = html;
  } catch (e) {
    console.error(e);
    resumenDiv.innerHTML = "<p>Error al contactar con el servidor de rutas.</p>";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initMap();
  renderListaMaquinas(maquinasVisibles, []);
  actualizarIndicadorFiltro("", maquinasVisibles.length);

  document.getElementById("btn-ruta").addEventListener("click", calcularRuta);
  document.getElementById("btn-ubicacion").addEventListener("click", usarUbicacionActual);
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
