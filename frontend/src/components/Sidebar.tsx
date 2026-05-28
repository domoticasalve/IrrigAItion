import { NavLink } from "react-router-dom";

const NAV = [
  { path: "/",          label: "Dashboard",   icon: "dashboard",  end: true },
  { path: "/farms",     label: "Mis Huertos", icon: "yard" },
  { path: "/schedule",  label: "Programación",icon: "schedule" },
  { path: "/analytics", label: "Analíticas",  icon: "monitoring" },
  { path: "/devices",   label: "Dispositivos",icon: "sensors" },
];

export default function Sidebar() {
  return (
    <aside className="w-[280px] h-screen sticky top-0 bg-surface-container-lowest shadow-sm flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">eco</span>
        </div>
        <div>
          <div className="font-semibold text-on-surface">AgroFlow</div>
          <div className="text-xs text-on-surface-variant font-medium tracking-wide">Smart Irrigation</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors
               ${isActive
                 ? "bg-primary-fixed text-primary font-semibold"
                 : "text-on-surface-variant hover:bg-surface-container"}`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-bold">
            JA
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-on-surface">Juan Antonio</div>
            <div className="text-xs text-on-surface-variant">Administrador</div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px] cursor-pointer">logout</span>
        </div>
      </div>
    </aside>
  );
}
