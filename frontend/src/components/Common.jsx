export function StatCard({ label, value, sublabel, tone = "default" }) {
  const tones = {
    default: "bg-white text-slate-900",
    warn: "bg-amber-50 text-amber-900 border border-amber-200",
    danger: "bg-red-50 text-red-900 border border-red-200",
    good: "bg-brand-50 text-brand-900 border border-brand-200",
  };
  return (
    <div className={`rounded-xl p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sublabel && <p className="text-xs opacity-70 mt-1">{sublabel}</p>}
    </div>
  );
}

const badgeStyles = {
  livre: "bg-emerald-100 text-emerald-800",
  ocupada: "bg-slate-200 text-slate-800",
  bloqueada: "bg-red-100 text-red-800",
  atencao: "bg-amber-100 text-amber-800",
  pendente: "bg-slate-200 text-slate-700",
  atribuida: "bg-blue-100 text-blue-800",
  em_execucao: "bg-indigo-100 text-indigo-800",
  concluida: "bg-emerald-100 text-emerald-800",
  disponivel: "bg-emerald-100 text-emerald-800",
  em_tarefa: "bg-blue-100 text-blue-800",
  manutencao: "bg-red-100 text-red-800",
};

export function Badge({ children, type }) {
  const cls = badgeStyles[type] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function Loading({ label = "Carregando..." }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
      <span className="w-4 h-4 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function ErrorBox({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4">
      ⚠️ {message}
    </div>
  );
}

export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
