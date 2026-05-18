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

  return data.routes[0];
}

function extraerPuntosRutaTomTom(ruta) {
  const puntos = [];

  (ruta.legs || []).forEach((leg) => {
    (leg.points || []).forEach((p) => {
      puntos.push([p.latitude, p.longitude]);
    });
  });

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
  const seccionesTrafico = (rutaTomTom.sections || [])
    .filter((s) => s.sectionType === "TRAFFIC")
    .sort((a, b) => a.startPointIndex - b.startPointIndex);

  if (seccionesTrafico.length === 0) {
    const linea = crearPolilineaTramo(puntos, COLORES_TRAFICO.fluido, mapa);
    if (linea) grupo.addLayer(linea);
    grupo.addTo(mapa);
    return grupo;
  }

  let indiceActual = 0;

  seccionesTrafico.forEach((seccion) => {
    const inicio = seccion.startPointIndex;
    const fin = seccion.endPointIndex;

    if (inicio > indiceActual) {
      const tramoLibre = puntos.slice(indiceActual, inicio + 1);
      const lineaLibre = crearPolilineaTramo(
        tramoLibre,
        COLORES_TRAFICO.fluido,
        mapa
      );
      if (lineaLibre) grupo.addLayer(lineaLibre);
    }

    const tramoTrafico = puntos.slice(inicio, fin + 1);
    const lineaTrafico = crearPolilineaTramo(
      tramoTrafico,
      colorSegunTramo(seccion),
      mapa
    );
    if (lineaTrafico) grupo.addLayer(lineaTrafico);

    indiceActual = fin;
  });

  if (indiceActual < puntos.length - 1) {
    const tramoFinal = puntos.slice(indiceActual);
    const lineaFinal = crearPolilineaTramo(
      tramoFinal,
      COLORES_TRAFICO.fluido,
      mapa
    );
    if (lineaFinal) grupo.addLayer(lineaFinal);
  }

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
