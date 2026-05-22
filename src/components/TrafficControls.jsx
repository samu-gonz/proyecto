export default function TrafficControls() {
  return (
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
  );
}
