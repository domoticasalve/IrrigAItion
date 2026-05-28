import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar      from "./components/Sidebar";
import Dashboard    from "./pages/Dashboard";
import Farms        from "./pages/Farms";
import FarmDetail   from "./pages/FarmDetail";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl">construction</span>
        <p className="mt-4 font-semibold text-on-surface">{title}</p>
        <p className="text-sm mt-1">Próximamente</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/farms"         element={<Farms />} />
          <Route path="/farms/:id"     element={<FarmDetail />} />
          <Route path="/schedule"      element={<Placeholder title="Programación" />} />
          <Route path="/analytics"     element={<Placeholder title="Analíticas" />} />
          <Route path="/devices"       element={<Placeholder title="Dispositivos" />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
