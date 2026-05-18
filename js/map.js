let map;
let rutaLayer = null;
let numeroMarkers = [];

function initMap() {
  map = L.map("map").setView([28.2916, -16.6291], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  L.marker([ORIGEN.lat, ORIGEN.lng], { title: ORIGEN.nombre })
    .addTo(map)
    .bindPopup(`<b>${ORIGEN.nombre}</b>`);

  document.getElementById("origen-info").innerHTML =
    `<p><strong>${ORIGEN.nombre}</strong><br>` +
    `Lat: ${ORIGEN.lat.toFixed(4)}, Lng: ${ORIGEN.lng.toFixed(4)}</p>`;

  MAQUINAS.forEach((m) => {
    L.marker([m.lat, m.lng], { title: m.nombre })
      .addTo(map)
      .bindPopup(
        `<b>${m.nombre}</b><br>` +
        `Servicio estimado: ${m.tiempoServicioMin} min`
      );
  });
}

function limpiarNumeroMarkers() {
  numeroMarkers.forEach((mk) => map.removeLayer(mk));
  numeroMarkers = [];
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
