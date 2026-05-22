import { usePlanificador } from "../context/PlanificadorContext.jsx";
import { aplicarFiltroZona } from "../js/app.js";

export default function ZoneSearch() {
  const { inputZona, setInputZona, filtroActivo } = usePlanificador();

  return (
    <>
      <h2>Buscar por zona</h2>
      <div id="busqueda-zona" className="busqueda-zona">
        <input
          type="search"
          id="input-zona"
          value={inputZona}
          onChange={(e) => setInputZona(e.target.value)}
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
      <p id="filtro-activo" className="small filtro-activo">
        {filtroActivo}
      </p>
    </>
  );
}
