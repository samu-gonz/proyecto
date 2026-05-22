import { calcularRuta } from "../js/app.js";
import DepartureDateTime from "./DepartureDateTime.jsx";
import MachineList from "./MachineList.jsx";
import OriginSection from "./OriginSection.jsx";
import RouteSummary from "./RouteSummary.jsx";
import ZoneSearch from "./ZoneSearch.jsx";

export default function Sidebar() {
  return (
    <aside id="sidebar">
      <h1>Planificador de ruta</h1>
      <p>
        <strong>Zona:</strong> Tenerife
      </p>

      <OriginSection />
      <ZoneSearch />

      <h2>Máquinas a visitar</h2>
      <MachineList />

      <DepartureDateTime />

      <button type="button" id="btn-ruta" onClick={() => void calcularRuta()}>
        Calcular ruta óptima
      </button>

      <RouteSummary />
    </aside>
  );
}
