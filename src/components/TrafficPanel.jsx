import { usePlanificador } from "../context/PlanificadorContext.jsx";

/** Contador de tramos de tráfico de la ruta calculada (estado desde app.js vía bridge). */
export default function TrafficPanel() {
  const { panelTrafico } = usePlanificador();

  if (panelTrafico.hidden) {
    return null;
  }

  return (
    <div id="panel-trafico-ruta" className="panel-trafico-ruta" aria-live="polite">
      <p
        id="contador-trafico-personalizado"
        className="small"
        dangerouslySetInnerHTML={{ __html: panelTrafico.html }}
      />
    </div>
  );
}
