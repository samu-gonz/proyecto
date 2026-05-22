import PlanificadorApp from "./components/PlanificadorApp.jsx";
import { PlanificadorProvider } from "./context/PlanificadorContext.jsx";

export default function App() {
  return (
    <PlanificadorProvider>
      <PlanificadorApp />
    </PlanificadorProvider>
  );
}
