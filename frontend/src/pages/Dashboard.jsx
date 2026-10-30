import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Card } from "../components/Common.jsx";

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await api.dashboard();
      setDados(res);
    } catch (e) {
      setErro(e.message || "Erro ao carregar dados do dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) return <Loading label="A carregar Central Operacional..." />;
  if (erro) return <ErrorBox message={erro} onRetry={carregarDashboard} />;

  const resumo = dados?.resumo || {};
  const movimentacoes = dados?.movimentacoesPorHora || [];
  const ocupacao = dados?.ocupacaoPorGalpao || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Central Operacional</h2>
        <p className="text-slate-500 text-sm mt-1">
          Visão geral do armazém, métricas em tempo real e gráficos de movimentação.
        </p>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total de Lotes</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{resumo.totalLotes || 0}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tarefas Pendentes</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">{resumo.tarefasPendentes || 0}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Empilhadeiras Ativas</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{resumo.empilhadeirasAtivas || 0}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Ocupação do Armazém</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{resumo.ocupacaoArmazem || 0}%</p>
        </div>
      </div>

      {/* GRÁFICOS E MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="📈 Movimentações por Hora">
          <div className="space-y-3 mt-4">
            {movimentacoes.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>{item.hora}</span>
                  <span>{item.quantidade} movimentações</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(item.quantidade * 3, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="🏢 Ocupação por Galpão">
          <div className="space-y-4 mt-4">
            {ocupacao.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>{item.galpao}</span>
                  <span>{item.ocupacao}% ocupado</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.ocupacao > 70 ? 'bg-amber-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${item.ocupacao}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
