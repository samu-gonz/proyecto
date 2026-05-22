import { usePlanificador } from "../context/PlanificadorContext.jsx";

export default function MapView() {
  const { mapRef } = usePlanificador();

  return <div id="map" ref={mapRef} />;
}
