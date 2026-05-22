import { usePlanificador } from "../context/PlanificadorContext.jsx";

export default function DepartureDateTime() {
  const { departAt, setDepartAt } = usePlanificador();

  return (
    <div
      id="bloque-fecha-futura-ruta"
      style={{
        margin: "10px 0 12px",
        padding: "10px",
        border: "1px solid #d8dce5",
        borderRadius: "10px",
        background: "#f8fafc"
      }}
    >
      <label
        htmlFor="selector-fecha-futura"
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: "6px"
        }}
      >
        Salida (predicción de tráfico)
      </label>
      <input
        type="datetime-local"
        id="selector-fecha-futura"
        className="input-fecha-futura"
        value={departAt}
        onChange={(e) => setDepartAt(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid #c9d2e3",
          borderRadius: "8px",
          background: "#ffffff",
          boxSizing: "border-box"
        }}
      />
      <p className="small" style={{ margin: "6px 0 0" }}>
        Vacío = tráfico en tiempo real. Con fecha = predicción para esa hora.
      </p>
    </div>
  );
}
