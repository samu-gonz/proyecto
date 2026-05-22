import { usePlanificador } from "../context/PlanificadorContext.jsx";
import { onSeleccionParadaEnMenuLateral } from "../js/app.js";

export default function MachineList() {
  const { listaMaquinas, selectedIds } = usePlanificador();

  if (listaMaquinas.length === 0) {
    return (
      <div id="lista-maquinas">
        <p className="small">No hay máquinas en esta zona.</p>
      </div>
    );
  }

  return (
    <div id="lista-maquinas">
      {listaMaquinas.map((m) => (
        <div key={m.id} className="maquina-item">
          <input
            type="checkbox"
            id={`maq-${m.id}`}
            value={m.id}
            checked={selectedIds.has(m.id)}
            onChange={(e) => {
              void onSeleccionParadaEnMenuLateral(m, e.target.checked);
            }}
          />
          <label htmlFor={`maq-${m.id}`}>
            {m.nombre} · {m.zona}
          </label>
        </div>
      ))}
    </div>
  );
}
