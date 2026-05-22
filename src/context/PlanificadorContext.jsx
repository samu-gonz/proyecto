import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { MAQUINAS } from "../data/maquinas.js";
import {
  registerPlanificadorUi,
  unregisterPlanificadorUi
} from "../js/planificador-ui-bridge.js";

const PlanificadorContext = createContext(null);

const MAQUINAS_ORDENADAS = [...MAQUINAS].sort((a, b) =>
  a.nombre.localeCompare(b.nombre, "es")
);

const RESUMEN_INICIAL =
  "<p>Selecciona máquinas para calcular la ruta automáticamente en el mapa.</p>";

export function PlanificadorProvider({ children }) {
  const mapRef = useRef(null);
  const [listaMaquinas, setListaMaquinas] = useState(MAQUINAS);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [resumenHtml, setResumenHtml] = useState(RESUMEN_INICIAL);
  const [geoEstado, setGeoEstado] = useState({
    className: "small geo-estado",
    text: "La ruta se dibuja en el mapa. Elige origen y máquinas a visitar."
  });
  const [origenInfoHtml, setOrigenInfoHtml] = useState(
    '<p class="small">Selecciona un punto de partida.</p>'
  );
  const [filtroActivo, setFiltroActivo] = useState(
    `Mostrando las ${MAQUINAS.length} máquinas.`
  );
  const [selectOrigen, setSelectOrigen] = useState("gps");
  const [inputZona, setInputZona] = useState("");
  const [departAt, setDepartAt] = useState("");
  const [panelTrafico, setPanelTrafico] = useState({
    hidden: true,
    html: "Tráfico: calcula una ruta para ver los tramos."
  });

  const getSelectedMaquinaIds = useCallback(
    () => Array.from(selectedIds),
    [selectedIds]
  );

  const setMaquinaChecked = useCallback((id, checked) => {
    const numId = Number(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(numId);
      else next.delete(numId);
      return next;
    });
  }, []);

  const setListaMaquinasFromMotor = useCallback(({ maquinas, idsSeleccionados }) => {
    setListaMaquinas(maquinas);
    setSelectedIds(new Set(idsSeleccionados.map(Number)));
  }, []);

  useEffect(() => {
    registerPlanificadorUi({
      setResumenHtml,
      getDepartAt: () => departAt,
      setDepartAt,
      getSelectOrigen: () => selectOrigen,
      setSelectOrigen,
      getInputZona: () => inputZona,
      setInputZona,
      setGeoEstado,
      setOrigenInfoHtml,
      setFiltroActivo,
      getSelectedMaquinaIds,
      setMaquinaChecked,
      setListaMaquinas: setListaMaquinasFromMotor,
      setPanelTrafico
    });
    return () => unregisterPlanificadorUi();
  }, [
    departAt,
    selectOrigen,
    inputZona,
    getSelectedMaquinaIds,
    setMaquinaChecked,
    setListaMaquinasFromMotor
  ]);

  const value = useMemo(
    () => ({
      mapRef,
      listaMaquinas,
      selectedIds,
      resumenHtml,
      geoEstado,
      origenInfoHtml,
      filtroActivo,
      selectOrigen,
      setSelectOrigen,
      inputZona,
      setInputZona,
      departAt,
      setDepartAt,
      panelTrafico,
      maquinasOrigenOpciones: MAQUINAS_ORDENADAS,
      setMaquinaChecked
    }),
    [
      listaMaquinas,
      selectedIds,
      resumenHtml,
      geoEstado,
      origenInfoHtml,
      filtroActivo,
      selectOrigen,
      inputZona,
      departAt,
      panelTrafico,
      setMaquinaChecked
    ]
  );

  return (
    <PlanificadorContext.Provider value={value}>
      {children}
    </PlanificadorContext.Provider>
  );
}

export function usePlanificador() {
  const ctx = useContext(PlanificadorContext);
  if (!ctx) {
    throw new Error("usePlanificador debe usarse dentro de PlanificadorProvider");
  }
  return ctx;
}
