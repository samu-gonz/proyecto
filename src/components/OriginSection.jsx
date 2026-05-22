import { usePlanificador } from "../context/PlanificadorContext.jsx";
import { confirmarUbicacionGPS, onSelectOrigenChange } from "../js/app.js";

export default function OriginSection() {
  const {
    selectOrigen,
    setSelectOrigen,
    geoEstado,
    origenInfoHtml,
    maquinasOrigenOpciones
  } = usePlanificador();

  return (
    <>
      <h2>Punto de partida</h2>
      <p className="small">
        Elige tu ubicación GPS o una máquina como inicio de la ruta.
      </p>
      <label htmlFor="select-origen" className="label-campo">
        Inicio de ruta
      </label>
      <select
        id="select-origen"
        value={selectOrigen}
        onChange={(e) => {
          setSelectOrigen(e.target.value);
          void onSelectOrigenChange();
        }}
      >
        <option value="gps">Mi ubicación actual</option>
        <optgroup label="Empezar desde una máquina">
          {maquinasOrigenOpciones.map((m) => (
            <option key={m.id} value={String(m.id)}>
              {m.nombre}
            </option>
          ))}
        </optgroup>
      </select>
      <button
        type="button"
        id="btn-confirmar-gps"
        className="btn-confirmar-gps"
        onClick={() => void confirmarUbicacionGPS()}
      >
        Confirmar mi ubicación actual
      </button>
      <p id="geo-estado" className={geoEstado.className}>
        {geoEstado.text}
      </p>
      <div
        id="origen-info"
        dangerouslySetInnerHTML={{ __html: origenInfoHtml }}
      />
    </>
  );
}
