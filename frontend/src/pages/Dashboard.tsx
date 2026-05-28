import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, Farm, IrrigationEvent } from "../api/client";

export default function Dashboard() {
  const [farms, setFarms]   = useState<Farm[]>([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    api.farms.list().then((f) => { setFarms(f); setLoad(false); });
  }, []);

  const totalZones = farms.reduce((a, f) => a + (f.zones?.length ?? 0), 0);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-on-surface-variant text-sm mt-1">Vista general del sistema de riego</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Huertos", value: farms.length, icon: "yard", color: "bg-primary-fixed text-primary" },
          { label: "Zonas totales", value: totalZones, icon: "grid_view", color: "bg-secondary-container text-on-secondary" },
          { label: "Regando ahora", value: "—", icon: "water_drop", color: "bg-surface-container-high text-on-surface" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-on-surface">{loading ? "…" : value}</div>
              <div className="text-xs text-on-surface-variant font-semibold uppercase tracking-wide">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Huertos recientes */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-on-surface">Huertos</h2>
          <Link to="/farms" className="text-xs text-secondary font-semibold hover:underline">Ver todos →</Link>
        </div>
        {loading ? (
          <div className="py-6 text-center text-on-surface-variant text-sm">Cargando…</div>
        ) : farms.length === 0 ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">yard</span>
            <p className="mt-3 text-sm text-on-surface-variant">No hay huertos aún.</p>
            <Link to="/farms" className="mt-3 inline-block px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold">
              Crear primer huerto
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant">
            {farms.slice(0, 5).map((farm) => (
              <Link key={farm.id} to={`/farms/${farm.id}`}
                className="flex items-center justify-between py-3 hover:text-primary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[16px]">yard</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-on-surface">{farm.name}</div>
                    {farm.location && <div className="text-xs text-on-surface-variant">{farm.location}</div>}
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant">{farm.zones?.length ?? 0} zonas</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
