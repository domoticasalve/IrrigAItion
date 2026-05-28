import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, Farm, Zone } from "../api/client";
import FarmViewer3D from "../components/FarmViewer3D";
import IrrigationPanel from "../components/IrrigationPanel";

const COLORS = ["#4ade80","#22d3ee","#f59e0b","#f87171","#a78bfa","#34d399","#fb923c","#60a5fa"];

export default function FarmDetail() {
  const { id } = useParams<{ id: string }>();
  const [farm, setFarm]             = useState<Farm | null>(null);
  const [selectedZone, setSelected] = useState<Zone | null>(null);
  const [runningZones, setRunning]  = useState<Set<string>>(new Set());
  const [runningEvents, setEvents]  = useState<Map<string, string>>(new Map());
  const [loading, setLoading]       = useState(true);
  const [showAddZone, setShowAdd]   = useState(false);
  const [newZone, setNewZone]       = useState({ name: "", haEntityId: "", posX: 0, posZ: 0, width: 2, depth: 2, color: COLORS[0] });

  useEffect(() => {
    if (!id) return;
    api.farms.get(id).then((f) => { setFarm(f); setLoading(false); });
  }, [id]);

  const handleSelectZone = useCallback((zoneId: string | null) => {
    if (!farm) return;
    setSelected(zoneId ? (farm.zones.find((z) => z.id === zoneId) ?? null) : null);
  }, [farm]);

  const handleIrrigationChange = useCallback((zoneId: string, running: boolean, eventId?: string) => {
    setRunning((prev) => {
      const next = new Set(prev);
      running ? next.add(zoneId) : next.delete(zoneId);
      return next;
    });
    if (eventId) setEvents((prev) => new Map(prev).set(zoneId, eventId));
    else setEvents((prev) => { const m = new Map(prev); m.delete(zoneId); return m; });
  }, []);

  const handleAddZone = async () => {
    if (!id || !newZone.name || !newZone.haEntityId) return;
    const zone = await api.zones.create(id, newZone);
    setFarm((f) => f ? { ...f, zones: [...f.zones, zone] } : f);
    setShowAdd(false);
    setNewZone({ name: "", haEntityId: "", posX: 0, posZ: 0, width: 2, depth: 2, color: COLORS[0] });
  };

  const handleDeleteZone = async (zoneId: string) => {
    await api.zones.delete(zoneId);
    setFarm((f) => f ? { ...f, zones: f.zones.filter((z) => z.id !== zoneId) } : f);
    if (selectedZone?.id === zoneId) setSelected(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-on-surface-variant gap-3">
      <span className="material-symbols-outlined animate-spin">refresh</span> Cargando…
    </div>
  );
  if (!farm) return <div className="p-8 text-error">Huerto no encontrado.</div>;

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <Link to="/farms" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-on-surface">{farm.name}</h1>
            {farm.location && <p className="text-sm text-on-surface-variant">{farm.location}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">{farm.zones.length} zonas</span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-fixed text-primary">
            {runningZones.size} regando
          </span>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Añadir zona
          </button>
        </div>
      </div>

      {/* Contenido: visor 3D + panel lateral */}
      <div className="flex flex-1 gap-4 p-6 min-h-0">
        {/* 3D viewer */}
        <div className="flex-1 min-h-0">
          <FarmViewer3D
            zones={farm.zones}
            runningZoneIds={runningZones}
            selectedZoneId={selectedZone?.id ?? null}
            onSelectZone={handleSelectZone}
          />
        </div>

        {/* Panel lateral: irrigación o lista de zonas */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto hide-scrollbar">
          {selectedZone ? (
            <IrrigationPanel
              zone={selectedZone}
              onClose={() => setSelected(null)}
              onIrrigationChange={handleIrrigationChange}
            />
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
              <p className="text-sm text-on-surface-variant mb-3 font-semibold">
                Zonas del huerto
              </p>
              {farm.zones.length === 0 && (
                <p className="text-sm text-on-surface-variant py-4 text-center">
                  Sin zonas. Añade la primera.
                </p>
              )}
              <div className="flex flex-col gap-2">
                {farm.zones.map((zone) => (
                  <div
                    key={zone.id}
                    onClick={() => setSelected(zone)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container cursor-pointer border border-outline-variant/50 transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: zone.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-on-surface truncate">{zone.name}</div>
                      <div className="text-xs text-on-surface-variant font-mono truncate">{zone.haEntityId}</div>
                    </div>
                    {runningZones.has(zone.id) && (
                      <span className="material-symbols-outlined text-secondary text-[18px] animate-pulse">water_drop</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                      className="text-on-surface-variant hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal añadir zona */}
      {showAddZone && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-96 shadow-xl border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-on-surface">Nueva zona</h2>
              <button onClick={() => setShowAdd(false)}>
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            {[
              { label: "Nombre de la zona", key: "name", type: "text", placeholder: "Ej: Zona Norte" },
              { label: "Entidad Home Assistant", key: "haEntityId", type: "text", placeholder: "switch.electrovalvula_zona_1" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={(newZone as any)[key]}
                  onChange={(e) => setNewZone((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-secondary"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Pos X", key: "posX" }, { label: "Pos Z", key: "posZ" },
                { label: "Ancho (m)", key: "width" }, { label: "Largo (m)", key: "depth" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">{label}</label>
                  <input
                    type="number"
                    value={(newZone as any)[key]}
                    onChange={(e) => setNewZone((p) => ({ ...p, [key]: parseFloat(e.target.value) }))}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-secondary"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setNewZone((p) => ({ ...p, color: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${newZone.color === c ? "border-primary scale-125" : "border-transparent"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-container">
                Cancelar
              </button>
              <button onClick={handleAddZone}
                className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90">
                Crear zona
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
