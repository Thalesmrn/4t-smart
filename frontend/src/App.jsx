import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import WarehouseMap from "./pages/WarehouseMap.jsx";
import TaskManager from "./pages/TaskManager.jsx";
import Slotting from "./pages/Slotting.jsx";
import OperatorView from "./pages/OperatorView.jsx";
import Cadastros from "./pages/Cadastros.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mapa" element={<WarehouseMap />} />
          <Route path="/tarefas" element={<TaskManager />} />
          <Route path="/slotting" element={<Slotting />} />
          <Route path="/operador" element={<OperatorView />} />
          <Route path="/cadastros" element={<Cadastros />} />
        </Routes>
      </main>
    </div>
  );
}
