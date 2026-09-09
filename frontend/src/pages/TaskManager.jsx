import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Card, Badge } from "../components/Common.jsx";

export default function TaskManager() {
  const [tarefas, setTarefas] = useState([]);
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [expandida, setExpandida] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  async function carregar() {
    try {
      const [t, e] = await Promise.all([api.tarefas(), api.empilhadeiras()]);
      setTarefas(t);
      setEmpilhadeiras(e);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 10000);
    return () => clearInterval(interval);
  }, []);

  async function atribuirAutomatico() {
    try {
      const res = await api.atribuirAutomatico();
      setMensagem(
        res.atribuidas.length > 0
          ? `${res.atribuidas.length} tarefa(s) atribuída(s) automaticamente.`
          : res.mensagem || "Nenhuma atribuição realizada."
      );
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function atribuirManual(tarefaId, empilhadeiraId) {
    try {
      await api.atribuirManual(tarefaId, empilhadeiraId);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function concluir(tarefaId) {
    try {
      await api.concluirTarefa(tarefaId);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  if (carregando) return <Loading label="Carregando tarefas..." />;
  if (erro) return <ErrorBox message={erro} />;

  const pendentes = tarefas.filter((t) => t.status !== "concluida");
  const concluidas = tarefas.filter((t) => t.status === "concluida");
  const disponiveis = empilhadeiras.filter((e) => e.status === "disponivel");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tarefas & Orquestração de Empilhadeiras</h2>
          <p className="text-slate-500 text-sm mt-1">
            Priorização dinâmica com explicabilidade — ordenado do mais crítico ao menos crítico.
          </p>
        </div>
        <button
          onClick={atribuirAutomatico}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
        >
          ⚡ Atribuir automaticamente
        </button>
      </div>

      {mensagem && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-3">
          {mensagem}
        </div>
      )}

      <Card title="Empilhadeiras">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {empilhadeiras.map((emp) => (
            <div key={emp.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{emp.nome}</p>
                <Badge type={emp.status}>{emp.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">Operador: {emp.operador}</p>
              <p className="text-xs text-slate-500">Posição atual: {emp.posicaoAtualId}</p>
              <p className="text-xs text-slate-500">
                Distância hoje: {emp.distanciaPercorridaHojeM.toLocaleString("pt-BR")} m
              </p>
              {emp.tarefaAtual && (
                <p className="text-xs mt-2 bg-slate-50 rounded p-2">
                  🔧 {emp.tarefaAtual.descricao}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title={`Fila de Tarefas (${pendentes.length} abertas)`}>
        <div className="space-y-3">
          {pendentes.map((t) => (
            <div key={t.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{t.descricao}</span>
                    <Badge type={t.status}>{t.status.replace("_", " ")}</Badge>
                    {t.urgente && <Badge type="bloqueada">urgente</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.tipo.replace("_", " ")} · origem: {t.origemId} → destino: {t.destinoId || "a definir"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-600">{t.prioridadeScore}</p>
                    <p className="text-[10px] text-slate-400 uppercase">prioridade</p>
                  </div>
                  <button
                    onClick={() => setExpandida(expandida === t.id ? null : t.id)}
                    className="text-xs text-brand-600 font-medium hover:underline"
                  >
                    {expandida === t.id ? "ocultar motivo" : "por que essa prioridade?"}
                  </button>
                </div>
              </div>

              {expandida === t.id && (
                <p className="mt-3 text-xs bg-slate-50 rounded p-3 text-slate-600">
                  {t.prioridadeExplicacao}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {t.status === "pendente" && (
                  <select
                    className="text-xs border rounded px-2 py-1.5"
                    defaultValue=""
                    onChange={(e) => e.target.value && atribuirManual(t.id, e.target.value)}
                  >
                    <option value="" disabled>
                      Atribuir empilhadeira...
                    </option>
                    {disponiveis.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))}
                  </select>
                )}
                {(t.status === "atribuida" || t.status === "em_execucao") && (
                  <button
                    onClick={() => concluir(t.id)}
                    className="text-xs px-3 py-1.5 rounded bg-emerald-500 text-white font-medium hover:bg-emerald-600"
                  >
                    ✔ Marcar como concluída
                  </button>
                )}
              </div>
            </div>
          ))}
          {pendentes.length === 0 && (
            <p className="text-sm text-slate-400">Nenhuma tarefa pendente. 🎉</p>
          )}
        </div>
      </Card>

      {concluidas.length > 0 && (
        <Card title={`Concluídas recentemente (${concluidas.length})`}>
          <ul className="text-sm space-y-1 text-slate-500">
            {concluidas.slice(0, 8).map((t) => (
              <li key={t.id}>✔ {t.descricao}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
