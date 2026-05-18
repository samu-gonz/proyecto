async function calcularRuta() {
  const seleccionados = obtenerSeleccionados();
  const resumenDiv = document.getElementById("resumen");

  if (seleccionados.length === 0) {
    resumenDiv.innerHTML = "<p>Selecciona al menos una máquina.</p>";
    return;
  }

  limpiarNumeroMarkers();

  const rutaOrdenada = ordenarPorRutaOptima(ORIGEN, seleccionados);

  const coords = [
    [ORIGEN.lng, ORIGEN.lat],
    ...rutaOrdenada.map((p) => [p.lng, p.lat]),
    [ORIGEN.lng, ORIGEN.lat]
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
