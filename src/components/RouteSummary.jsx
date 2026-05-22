import { usePlanificador } from "../context/PlanificadorContext.jsx";
import TrafficPanel from "./TrafficPanel.jsx";

export default function RouteSummary() {
  const { resumenHtml } = usePlanificador();

  return (
    <>
      <h2>Resumen</h2>
      <p className="resumen-stats">
        <strong>Distancia:</strong> <span id="distancia-total">0 km</span>
        {" · "}
        <strong>Tiempo total:</strong>{" "}
        <span id="tiempo-conduccion">0 min</span>
      </p>
      <TrafficPanel />
      <div
        id="resumen"
        dangerouslySetInnerHTML={{ __html: resumenHtml }}
      />
    </>
  );
}
