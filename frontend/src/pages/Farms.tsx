import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, Farm } from "../api/client";

export default function Farms() {
  const [farms, setFarms]         = useState<Farm[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setCreate]   = useState(false);
  const [form, setForm]           = useState({ name: "", description: "", location: "" });

  useEffect(() => {
    api.farms.list().then((f) => { setFarms(f); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    const farm = await api.farms.create(form);
    setFarms((prev) => [farm, ...prev]);
    setCreate(false);
    setForm({ name: "", description: "", location: "" });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    await api.farms.delete(id);
    setFarms((prev) => prev.filter((f) => f.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full gap-3 text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin">refresh</span> Cargando…
    </div>
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Mis Huertos</h1>
          <p className="text-on-surface-variant text-sm mt-1">{farms.length} huertos registrados</p>
        </div>
        <button
          onClick={() => setCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo huerto
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="border-2 border-dashed border-outline-variant rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">yard</span>
          <p className="mt-4 text-on-surface font-semibold">Aún no tienes huertos</p>
          <p className="text-sm text-on-surface-variant mt-1">Crea tu primer huerto para empezar a gestionar el riego</p>
          <button onClick={() => setCreate(true)}
            className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90">
            Crear primer huerto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map((farm) => (
            <Link key={farm.id} to={`/farms/${farm.id}`}
              className="group bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 hover:border-primary-container hover:shadow-md transition-all flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">yard</span>
                </div>
                <button onClick={(e) => handleDelete(e, farm.id)}
                  className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">{farm.name}</h3>
                {farm.description && <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">{farm.description}</p>}
                {farm.location && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {farm.location}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-outline-variant">
                <span className="text-xs text-on-surface-variant">{farm.zones?.length ?? 0} zonas</span>
                <div className="flex-1" />
                <span className="text-xs text-primary font-semibold group-hover:underline">Ver huerto →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal crear huerto */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-96 shadow-xl border border-outline-variant flex flex-col gap-4">
            <h2 className="font-semibold text-on-surface">Nuevo huerto</h2>
            {[
              { label: "Nombre *", key: "name", placeholder: "Ej: Huerto Principal" },
              { label: "Descripción", key: "description", placeholder: "Descripción opcional" },
              { label: "Ubicación", key: "location", placeholder: "Ej: Parcela Norte, Sector A" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-secondary"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCreate(false)}
                className="flex-1 py-2 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-container">
                Cancelar
              </button>
              <button onClick={handleCreate}
                className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
