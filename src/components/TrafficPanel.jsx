import { usePlanificador } from "../context/PlanificadorContext.jsx";

export default function TrafficPanel() {
  const { panelTrafico } = usePlanificador();

  return (
    <div
      id="panel-trafico-ruta"
      className="panel-trafico-ruta"
      hidden={panelTrafico.hidden}
    >
      <p
        id="contador-trafico-personalizado"
        className="small"
        dangerouslySetInnerHTML={{ __html: panelTrafico.html }}
      />
    </div>
  );
}
