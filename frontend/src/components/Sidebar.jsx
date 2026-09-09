import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Central Operacional", icon: "📊" },
  { to: "/mapa", label: "Mapa do Armazém", icon: "🗺️" },
  { to: "/tarefas", label: "Tarefas & Empilhadeiras", icon: "🚜" },
  { to: "/slotting", label: "Roteirização & Slotting", icon: "📦" },
  { to: "/operador", label: "Monitor do Operador", icon: "📱" },
  { to: "/cadastros", label: "Cadastros", icon: "📋" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-coffee-900 text-coffee-50 min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-coffee-800">
        <h1 className="text-xl font-bold tracking-tight text-white">4T Smart Warehouse</h1>
        <p className="text-xs text-coffee-200 mt-1">Waze do Armazém — ERP 4T-Grãos</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500 text-white shadow"
                  : "text-coffee-100 hover:bg-coffee-800 hover:text-white"
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-coffee-800 text-xs text-coffee-300">
        Cenário de demonstração ativo — dados simulados.
      </div>
    </aside>
  );
}
