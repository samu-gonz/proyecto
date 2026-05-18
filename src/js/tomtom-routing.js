/**
 * Routing TomTom con tráfico en tiempo real y dibujo por tramos coloreados.
 */

const COLORES_TRAFICO = {
  fluido: "#2dc937",
  lento: "#e7b416",
  congestion: "#cc3232"
};

function construirUrlRutaTomTom(origen, paradas, apiKey) {
  const ubicaciones = [
    `${origen.lat},${origen.lng}`,
    ...paradas.map((p) => `${p.lat},${p.lng}`),
    `${origen.lat},${origen.lng}`
  ].join(":");

  const params = new URLSearchParams({
    key: apiKey,
    traffic: "true",
    travelMode: "car",
    routeType: "fastest",
    routeRepresentation: "polyline",
    sectionType: "traffic"
  });

  return `https://api.tomtom.com/routing/1/calculateRoute/${ubicaciones}/json?${params.toString()}`;
}

async function obtenerRutaTomTom(origen, paradas, apiKey) {
  const url = construirUrlRutaTomTom(origen, paradas, apiKey);
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`TomTom Routing respondió ${resp.status}`);
  }

  const data = await resp.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error("TomTom no devolvió ninguna ruta.");
  }

  const ruta = data.routes[0];
  const puntos = extraerPuntosRutaTomTom(ruta);
  if (puntos.length < 2) {
    throw new Error(
      "TomTom no devolvió geometría detallada de la ruta (legs.points / encodedPolyline)."
    );
  }

  return ruta;
}

function puntoALatLng(p) {
  if (!p) return null;

  if (Array.isArray(p) && p.length >= 2) {
    return [Number(p[0]), Number(p[1])];
  }

  const lat = p.latitude ?? p.lat;
  const lng = p.longitude ?? p.lng ?? p.lon;
  if (lat == null || lng == null) return null;

  return [Number(lat), Number(lng)];
}

/**
 * Decodifica la polyline codificada de TomTom (formato Google, precisión 5 o 7).
 */
function decodificarPolylineTomTom(encoded, precision) {
  if (!encoded || typeof encoded !== "string") return [];

  const factor = Math.pow(10, precision ?? 5);
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let byte;
    let shift = 0;
    let result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

function agregarPuntosRuta(destino, nuevos) {
  nuevos.forEach((punto) => {
    const latLng = puntoALatLng(punto);
    if (!latLng || Number.isNaN(latLng[0]) || Number.isNaN(latLng[1])) {
      return;
    }
    destino.push(latLng);
  });
}

/**
 * Geometría completa de la ruta: concatena legs[].points en orden (sin deduplicar:
 * los índices de sections TRAFFIC coinciden con esa secuencia). Si faltan points,
 * decodifica legs[].encodedPolyline.
 */
function extraerPuntosRutaTomTom(ruta) {
  const puntos = [];
  const legs = ruta.legs || [];

  legs.forEach((leg) => {
    const listaPuntos = leg.points || [];
    if (listaPuntos.length > 0) {
      agregarPuntosRuta(puntos, listaPuntos);
      return;
    }

    if (leg.encodedPolyline) {
      const decodificados = decodificarPolylineTomTom(
        leg.encodedPolyline,
        leg.encodedPolylinePrecision
      );
      agregarPuntosRuta(puntos, decodificados);
    }
  });

  if (puntos.length >= 2) {
    return puntos;
  }

  if (ruta.encodedPolyline) {
    return decodificarPolylineTomTom(
      ruta.encodedPolyline,
      ruta.encodedPolylinePrecision
    );
  }

  return puntos;
}

function colorSegunTramo(section) {
  const categoria = section.simpleCategory;
  const magnitud = section.magnitudeOfDelay ?? 0;
  const retraso = section.delayInSeconds ?? 0;

  if (
    categoria === "JAM" ||
    categoria === "ROAD_CLOSURE" ||
    magnitud >= 3
  ) {
    return COLORES_TRAFICO.congestion;
  }

  if (
    categoria === "ROAD_WORK" ||
    magnitud === 2 ||
    retraso >= 45
  ) {
    return COLORES_TRAFICO.lento;
  }

  if (magnitud === 1 || retraso >= 10) {
    return COLORES_TRAFICO.lento;
  }

  return COLORES_TRAFICO.fluido;
}

function coloresPorIndiceRuta(rutaTomTom, numPuntos) {
  const colores = new Array(numPuntos).fill(COLORES_TRAFICO.fluido);
  const secciones = (rutaTomTom.sections || []).filter(
    (s) => s.sectionType === "TRAFFIC"
  );

  secciones.forEach((seccion) => {
    const inicio = Math.max(0, seccion.startPointIndex ?? 0);
    const fin = Math.min(
      numPuntos - 1,
      seccion.endPointIndex ?? inicio
    );
    const color = colorSegunTramo(seccion);

    for (let i = inicio; i <= fin; i++) {
      colores[i] = color;
    }
  });

  return colores;
}

function agruparTramosPorColor(puntos, colores) {
  if (puntos.length < 2) return [];

  const tramos = [];
  let inicio = 0;
  let colorActual = colores[0] ?? COLORES_TRAFICO.fluido;

  for (let i = 1; i < puntos.length; i++) {
    const color = colores[i] ?? COLORES_TRAFICO.fluido;
    if (color !== colorActual) {
      tramos.push({
        puntos: puntos.slice(inicio, i + 1),
        color: colorActual
      });
      inicio = i;
      colorActual = color;
    }
  }

  tramos.push({
    puntos: puntos.slice(inicio),
    color: colorActual
  });

  return tramos;
}

function crearPolilineaTramo(puntos, color, mapa) {
  if (puntos.length < 2) return null;

  return L.polyline(puntos, {
    color,
    weight: 6,
    opacity: 0.92,
    lineJoin: "round",
    lineCap: "round",
    pane: mapa.getPane("routePane") ? "routePane" : undefined
  });
}

function dibujarRutaTomTomColoreada(mapa, rutaTomTom) {
  const puntos = extraerPuntosRutaTomTom(rutaTomTom);
  if (puntos.length < 2) return null;

  const grupo = L.layerGroup();
  const colores = coloresPorIndiceRuta(rutaTomTom, puntos.length);
  const tramos = agruparTramosPorColor(puntos, colores);

  tramos.forEach(({ puntos: coords, color }) => {
    const linea = crearPolilineaTramo(coords, color, mapa);
    if (linea) grupo.addLayer(linea);
  });

  grupo.addTo(mapa);
  return grupo;
}

function resumenTraficoRuta(rutaTomTom) {
  const secciones = (rutaTomTom.sections || []).filter(
    (s) => s.sectionType === "TRAFFIC"
  );
  let congestion = 0;
  let lento = 0;
  let fluido = 0;

  secciones.forEach((s) => {
    const color = colorSegunTramo(s);
    if (color === COLORES_TRAFICO.congestion) congestion += 1;
    else if (color === COLORES_TRAFICO.lento) lento += 1;
    else fluido += 1;
  });

  return { congestion, lento, fluido, total: secciones.length };
}
