import { usePlanificador } from "../context/PlanificadorContext.jsx";
import { onFechaSalidaCambiada } from "../js/app.js";

export default function DepartureDateTime() {
  const { departAt, setDepartAt } = usePlanificador();

  return (
    <div id="bloque-fecha-futura-ruta" className="bloque-fecha-futura-ruta">
      <label
        htmlFor="selector-fecha-futura"
        className="bloque-fecha-futura-ruta__label"
      >
        Salida (predicción de tráfico)
      </label>
      <input
        type="datetime-local"
        id="selector-fecha-futura"
        className="input-fecha-futura"
        value={departAt}
        onChange={(e) => {
          setDepartAt(e.target.value);
          onFechaSalidaCambiada();
        }}
      />
      <p className="small bloque-fecha-futura-ruta__nota">
        Vacío = tráfico en tiempo real. Con fecha = predicción para esa hora en la
        ruta.
      </p>
    </div>
  );
}
