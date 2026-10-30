import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge, Card } from "../components/Common.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await api.dashboard();
      setData(res);
    } catch (e) {
      setErro(e.message || "Erro ao carregar dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) return <Loading label="A carregar dashboard..." />;
  if (erro) return <ErrorBox message={erro} onRetry={carregar} />;

  const { kpis, distribuicao, alertas } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Visão Geral do Armazém</h2>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhamento em tempo real das posições, lotes de café e operação de empilhadeiras.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <p className="text-xs text-slate-500 font-medium">Galpões</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{kpis?.totalGalpoes || 0}</p>
        </Card>

        <Card>
          <p className="text-xs text-slate-500 font-medium">Total de Lotes</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">{kpis?.totalLotes || 0}</p>
        </Card>

        <Card>
          <p className="text-xs text-slate-500 font-medium">Aguardando Descarga</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{kpis?.lotesAguardandoDescarga || 0}</p>
        </Card>

        <Card>
          <p className="text-xs text-slate-500 font-medium">Ocupação Geral</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{kpis?.taxaOcupacaoGeral || 0}%</p>
        </Card>

        <Card>
          <p className="text-xs text-slate-500 font-medium">Tarefas Pendentes</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{kpis?.tarefasPendentes || 0}</p>
        </Card>

        <Card>
          <p className="text-xs text-slate-500 font-medium">Empilhadeiras Ativas</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{kpis?.empilhadeirasAtivas || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OCUPAÇÃO POR GALPÃO */}
        <Card title="Ocupação por Galpão">
          <div className="space-y-4">
            {distribuicao?.porGalpao?.map((g) => (
              <div key={g.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{g.nome} ({g.codigo})</span>
                  <span>{g.ocupadas} / {g.capacidade} posições ({g.taxa}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      g.taxa > 85 ? "bg-amber-600" : "bg-emerald-600"
                    }`}
                    style={{ width: `${Math.min(g.taxa, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* STATUS DOS LOTES */}
        <Card title="Status dos Lotes no Fluxo">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg text-sm border border-amber-100">
              <div className="flex items-center gap-2">
                <Badge type="AGUARDANDO_DESCARGA">Aguardando</Badge>
                <span className="text-slate-700 font-medium">Lotes recebidos aguardando guarda</span>
              </div>
              <span className="font-bold text-amber-900">
                {distribuicao?.porStatusLote?.AGUARDANDO_DESCARGA || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg text-sm border border-emerald-100">
              <div className="flex items-center gap-2">
                <Badge type="ARMAZENADO">Armazenados</Badge>
                <span className="text-slate-700 font-medium">Lotes alocados em posições válidas</span>
              </div>
              <span className="font-bold text-emerald-900">
                {distribuicao?.porStatusLote?.ARMAZENADO || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg text-sm border border-blue-100">
              <div className="flex items-center gap-2">
                <Badge type="EM_MOVIMENTACAO">Em Trânsito</Badge>
                <span className="text-slate-700 font-medium">Tarefas ativas de rebenefício/expedição</span>
              </div>
              <span className="font-bold text-blue-900">
                {distribuicao?.porStatusLote?.EM_MOVIMENTACAO || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ALERTAS OPERACIONAIS */}
      {alertas && alertas.length > 0 && (
        <Card title="Alertas Operacionais Inteligentes">
          <div className="space-y-2">
            {alertas.map((alerta, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                  alerta.tipo === "WARNING"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <span>{alerta.tipo === "WARNING" ? "⚠️" : "ℹ️"}</span>
                <span>{alerta.mensagem}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
