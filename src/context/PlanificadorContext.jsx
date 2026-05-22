import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { MAQUINAS } from "../data/maquinas.js";
import {
  registerPlanificadorUi,
  unregisterPlanificadorUi
} from "../js/planificador-ui-bridge.js";
import { MSG_RUTA } from "../js/mensajes-ruta.js";

const PlanificadorContext = createContext(null);

const MAQUINAS_ORDENADAS = [...MAQUINAS].sort((a, b) =>
  a.nombre.localeCompare(b.nombre, "es")
);

export function PlanificadorProvider({ children }) {
  const mapRef = useRef(null);
  const [listaMaquinas, setListaMaquinas] = useState(MAQUINAS);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [resumenHtml, setResumenHtml] = useState(MSG_RUTA.resumenInicial);
  const [geoEstado, setGeoEstado] = useState({
    className: "small geo-estado",
    text: MSG_RUTA.geoInicial
  });
  const [origenInfoHtml, setOrigenInfoHtml] = useState(MSG_RUTA.origenInfoVacio);
  const [filtroActivo, setFiltroActivo] = useState(
    `Mostrando las ${MAQUINAS.length} máquinas.`
  );
  const [selectOrigen, setSelectOrigen] = useState("gps");
  const [gpsConfirmando, setGpsConfirmando] = useState(false);
  const [origenGpsConfirmado, setOrigenGpsConfirmado] = useState(false);
  const [inputZona, setInputZona] = useState("");
  const [departAt, setDepartAt] = useState("");
  const [panelTrafico, setPanelTrafico] = useState({
    hidden: false,
    html: MSG_RUTA.panelTraficoInicial
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

  useLayoutEffect(() => {
    registerPlanificadorUi({
      setResumenHtml,
      getDepartAt: () => departAt,
      setDepartAt,
      getSelectOrigen: () => selectOrigen,
      setSelectOrigen,
      getInputZona: () => inputZona,
      setInputZona,
      setGeoEstado,
      setGpsConfirmando,
      setOrigenGpsConfirmado,
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
      gpsConfirmando,
      origenGpsConfirmado,
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
      gpsConfirmando,
      origenGpsConfirmado,
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
