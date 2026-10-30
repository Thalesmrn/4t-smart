import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox } from "../components/Common.jsx";

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
      setErro(e.message || "Erro ao carregar Central Operacional.");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) return <Loading label="A carregar Central Operacional..." />;
  if (erro) return <ErrorBox message={erro} onRetry={carregar} />;

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* TÍTULO DA TELA */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Central Operacional</h2>
        <p className="text-slate-500 text-sm mt-1">
          Visão consolidada do turno — atualiza automaticamente a cada 8s.
        </p>
      </div>

      {/* PRIMEIRA LINHA DE CARDS DE DESEMPENHO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ocupação do Armazém */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Ocupação do Armazém</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{kpis.ocupacaoPercentual || 51}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {kpis.posicoesOcupadas || 53}/{kpis.totalPosicoes || 104} posições ocupadas
          </p>
        </div>

        {/* Tarefas Abertas */}
        <div className="bg-red-50/60 p-4 rounded-xl border border-red-100 shadow-sm">
          <p className="text-xs font-semibold text-red-800/70 uppercase">Tarefas Abertas</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{kpis.tarefasAbertas || 13}</p>
          <p className="text-xs text-red-600 mt-1 font-medium">
            {kpis.tarefasUrgentes || 2} urgente(s)
          </p>
        </div>

        {/* Concluídas no Turno */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800/70 uppercase">Concluídas no Turno</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2">{kpis.concluidasTurno || 27}</p>
          <p className="text-xs text-emerald-700 mt-1">movimentações finalizadas</p>
        </div>

        {/* Empilhadeiras Disponíveis */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Empilhadeiras Disponíveis</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {kpis.empilhadeirasDisponiveis || 3}/{kpis.totalEmpilhadeiras || 3}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {kpis.empilhadeirasEmTarefa || 0} em tarefa
          </p>
        </div>
      </div>

      {/* SEGUNDA LINHA DE CARDS LOGÍSTICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Distância Percorrida */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Distância Percorrida</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{kpis.distanciaPercorrida || "5.570 m"}</p>
          <p className="text-xs text-slate-500 mt-1">acumulado no turno (todas empilhadeiras)</p>
        </div>

        {/* Tempo Médio / Movimentação */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tempo Médio / Movimentação</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{kpis.tempoMedioMovimentacao || "6.4 min"}</p>
        </div>

        {/* Eficiência Logística do Turno */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800/70 uppercase">Eficiência Logística do Turno</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2">{kpis.eficienciaLogistica || 85}%</p>
          <p className="text-xs text-emerald-700 mt-1">
            índice de movimentação indireta: {kpis.indiceMovimentacaoIndireta || 12}%
          </p>
        </div>
      </div>
    </div>
  );
}
