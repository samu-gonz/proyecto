import { useLayoutEffect, useRef } from "react";
import {
  aplicarFiltroZona,
  bootstrapPlanificador,
  calcularRuta,
  confirmarUbicacionGPS,
  onSelectOrigenChange,
  reiniciarMapa
} from "./js/app.js";

export default function App() {
  const mapRef = useRef(null);

  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    void bootstrapPlanificador(el);
  }, []);

  return (
    <div id="app">
      <aside id="sidebar">
        <h1>Planificador de ruta</h1>
        <p>
          <strong>Zona:</strong> Tenerife
        </p>

        <h2>Punto de partida</h2>
        <p className="small">
          Elige tu ubicación GPS o una máquina como inicio de la ruta.
        </p>
        <label htmlFor="select-origen" className="label-campo">
          Inicio de ruta
        </label>
        <select
          id="select-origen"
          defaultValue="gps"
          onChange={() => void onSelectOrigenChange()}
        >
          <option value="gps">Mi ubicación actual</option>
        </select>
        <button
          type="button"
          id="btn-confirmar-gps"
          className="btn-confirmar-gps"
          onClick={() => void confirmarUbicacionGPS()}
        >
          Confirmar mi ubicación actual
        </button>
        <p id="geo-estado" className="small geo-estado">
          La ruta se dibuja en el mapa. Elige origen y máquinas a visitar.
        </p>
        <div id="origen-info" />

        <h2>Buscar por zona</h2>
        <div id="busqueda-zona" className="busqueda-zona">
          <input
            type="search"
            id="input-zona"
            placeholder="Ej: Norte, Sur, La Laguna, Oeste..."
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter") void aplicarFiltroZona(true);
            }}
            onInput={(e) => {
              if (!e.currentTarget.value.trim()) void aplicarFiltroZona(false);
            }}
          />
          <button type="button" id="btn-buscar" onClick={() => void aplicarFiltroZona(true)}>
            Buscar
          </button>
        </div>
        <p id="filtro-activo" className="small filtro-activo" />

        <h2>Máquinas a visitar</h2>
        <div id="lista-maquinas" />

        <button type="button" id="btn-ruta" onClick={() => void calcularRuta()}>
          Calcular ruta óptima
        </button>

        <h2>Resumen</h2>
        <p className="resumen-stats">
          <strong>Distancia:</strong> <span id="distancia-total">0 km</span>
          {" · "}
          <strong>Tiempo total:</strong>{" "}
          <span id="tiempo-conduccion">0 min</span>
        </p>
        <div id="resumen">
          <p>
            Selecciona máquinas para calcular la ruta automáticamente en el mapa.
          </p>
        </div>
      </aside>

      <div className="map-wrap">
        <div id="map" ref={mapRef} />
        <div
          id="ruta-stats-flotante"
          className="ruta-stats-flotante"
          hidden
          aria-live="polite"
        >
          Distancia: — km | Tiempo: — min
        </div>
        <button
          type="button"
          id="btn-reiniciar-mapa"
          className="btn-reiniciar-mapa"
          title="Quitar ruta, ubicación GPS y volver a la vista de Tenerife"
          onClick={() => reiniciarMapa()}
        >
          Reiniciar mapa
        </button>
        <div className="map-controls map-controls--traffic" id="traffic-controls">
          <strong>Tráfico TomTom en vivo</strong>
          <p className="small traffic-nota">
            Incidencias solo en tu ruta calculada. Clic → Esquivar incidencia.
          </p>
          <label className="traffic-toggle">
            <input type="checkbox" id="chk-trafico-flujo" />
            Capa flujo (mapa)
          </label>
          <label className="traffic-toggle">
            <input type="checkbox" id="chk-trafico-incidencias" defaultChecked />
            Incidencias en la ruta
          </label>
          <div className="traffic-leyenda">
            <span
              className="leyenda-item leyenda-item--fluido"
              data-capa="flujo"
              title="Clic: mostrar/ocultar flujo"
            >
              Fluido
            </span>
            <span
              className="leyenda-item leyenda-item--lento"
              data-capa="flujo"
              title="Clic: mostrar/ocultar flujo"
            >
              Lento
            </span>
            <span
              className="leyenda-item leyenda-item--congestion"
              data-capa="flujo"
              title="Clic: mostrar/ocultar flujo"
            >
              Congestión
            </span>
            <span
              className="leyenda-item leyenda-item--incidencia"
              data-capa="incidencias"
              title="Clic: mostrar/ocultar incidencias"
            >
              Incidencias
            </span>
          </div>
        </div>
        <p id="tomtom-aviso" className="tomtom-aviso" hidden>
          Configura tu clave TomTom en{" "}
          <code>src/js/tomtom-config.js</code> o en <code>.env</code> como{" "}
          <code>VITE_TOMTOM_API_KEY</code>.
        </p>
      </div>
    </div>
  );
}
