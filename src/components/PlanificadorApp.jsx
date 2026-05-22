import { useLayoutEffect } from "react";
import { usePlanificador } from "../context/PlanificadorContext.jsx";
import { bootstrapPlanificador, reiniciarMapa } from "../js/app.js";
import MapView from "./MapView.jsx";
import Sidebar from "./Sidebar.jsx";
import TrafficControls from "./TrafficControls.jsx";

export default function PlanificadorApp() {
  const { mapRef } = usePlanificador();

  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    void bootstrapPlanificador(el);
  }, [mapRef]);

  return (
    <div id="app">
      <Sidebar />
      <div className="map-wrap">
        <MapView />
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
        <TrafficControls />
        <p id="tomtom-aviso" className="tomtom-aviso" hidden>
          Configura tu clave TomTom en{" "}
          <code>src/js/tomtom-config.js</code> o en <code>.env</code> como{" "}
          <code>VITE_TOMTOM_API_KEY</code>.
        </p>
      </div>
    </div>
  );
}
