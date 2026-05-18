/**
 * Tráfico TomTom solo sobre la ruta calculada (no en todo el mapa).
 */

const TOMTOM_SUBDOMINIOS = ["a", "b", "c", "d"];

function urlFlujoTomTom(apiKey) {
  return `https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`;
}

function urlIncidenciasTomTom(apiKey) {
  return `https://{s}.api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`;
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
  if (!map.getPane("trafficIncidents")) {
    map.createPane("trafficIncidents");
    map.getPane("trafficIncidents").style.zIndex = 460;
  }
  if (!map.getPane("routePane")) {
    map.createPane("routePane");
    map.getPane("routePane").style.zIndex = 550;
  }

  const opcionesComunes = {
    subdomains: TOMTOM_SUBDOMINIOS,
    maxZoom: 22,
    minZoom: 0
  };

  const chkFlujo = document.getElementById("chk-trafico-flujo");
  const chkIncidencias = document.getElementById("chk-trafico-incidencias");

  let preferenciaFlujo = chkFlujo?.checked ?? true;
  let preferenciaIncidencias = chkIncidencias?.checked ?? false;
  let rutaBoundsActiva = null;

  const capaFlujo = L.tileLayer(urlFlujoTomTom(apiKey), {
    ...opcionesComunes,
    pane: "trafficFlow",
    opacity: 0.9,
    attribution:
      'Tráfico &copy; <a href="https://www.tomtom.com" target="_blank" rel="noopener">TomTom</a>'
  });

  const capaIncidencias = L.tileLayer(urlIncidenciasTomTom(apiKey), {
    ...opcionesComunes,
    pane: "trafficIncidents",
    opacity: 0.95,
    attribution: "Incidencias &copy; TomTom"
  });

  function aplicarCapasSegunPreferencia() {
    if (!rutaBoundsActiva) {
      quitarCapaDelMapa(map, capaFlujo);
      quitarCapaDelMapa(map, capaIncidencias);
      return;
    }

    capaFlujo.options.bounds = rutaBoundsActiva;
    capaIncidencias.options.bounds = rutaBoundsActiva;

    if (preferenciaFlujo) {
      if (!map.hasLayer(capaFlujo)) capaFlujo.addTo(map);
      capaFlujo.redraw();
    } else {
      quitarCapaDelMapa(map, capaFlujo);
    }

    if (preferenciaIncidencias) {
      if (!map.hasLayer(capaIncidencias)) capaIncidencias.addTo(map);
      capaIncidencias.redraw();
    } else {
      quitarCapaDelMapa(map, capaIncidencias);
    }
  }

  return {
    flow: capaFlujo,
    incidents: capaIncidencias,
    hayRutaActiva() {
      return rutaBoundsActiva !== null;
    },
    mostrarEnRuta(bounds) {
      rutaBoundsActiva = bounds.pad(0.12);
      aplicarCapasSegunPreferencia();
    },
    ocultarDeRuta() {
      rutaBoundsActiva = null;
      quitarCapaDelMapa(map, capaFlujo);
      quitarCapaDelMapa(map, capaIncidencias);
    },
    setFlowVisible(visible) {
      preferenciaFlujo = visible;
      aplicarCapasSegunPreferencia();
    },
    setIncidentsVisible(visible) {
      preferenciaIncidencias = visible;
      aplicarCapasSegunPreferencia();
    },
    redraw() {
      if (rutaBoundsActiva) aplicarCapasSegunPreferencia();
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
