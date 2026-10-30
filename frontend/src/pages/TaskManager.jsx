import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge, Card } from "../components/Common.jsx";

export default function TaskManager() {
  const [tarefas, setTarefas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [posicoes, setPosicoes] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  // Formulário de Nova Ordem de Movimentação
  const [loteSelId, setLoteSelId] = useState("");
  const [tipoOperacao, setTipoOperacao] = useState("ARMAZENAMENTO");
  const [origem, setOrigem] = useState("Doca 01 (Recebimento)");
  const [destino, setDestino] = useState("POS-A1-01");
  const [empilhadeiraSelId, setEmpilhadeiraSelId] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const [listTarefas, listLotes, listEmp, listPos] = await Promise.all([
        api.tarefas().catch(() => []),
        api.lotes().catch(() => []),
        api.empilhadeiras().catch(() => []),
        api.posicoes().catch(() => [])
      ]);

      setTarefas(Array.isArray(listTarefas) ? listTarefas : []);
      
      const lts = Array.isArray(listLotes) ? listLotes : [];
      setLotes(lts);
      if (lts.length > 0) setLoteSelId(lts[0].id);

      const emps = Array.isArray(listEmp) ? listEmp : [];
      setEmpilhadeiras(emps);

      const pos = Array.isArray(listPos) ? listPos : [];
      setPosicoes(pos);
      if (pos.length > 0) setDestino(pos[0].codigo || pos[0].id);

    } catch (e) {
      setErro(e.message || "Erro ao carregar tarefas.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriarOrdem(e) {
    e.preventDefault();
    if (!loteSelId) {
      setMensagem({ tipo: "erro", texto: "Selecione um lote cadastrado." });
      return;
    }

    const loteObjeto = lotes.find((l) => String(l.id) === String(loteSelId));
    const empObjeto = empilhadeiras.find((e) => String(e.id) === String(empilhadeiraSelId));

    try {
      setMensagem(null);
      
      const payload = {
        loteId: loteObjeto?.id || loteSelId,
        loteCodigo: loteObjeto?.codigo || loteObjeto?.id || loteSelId,
        produto: loteObjeto?.produto || "Café Arábica",
        tipo: tipoOperacao,
        origem: origem.trim() || "Doca 01",
        destino: destino.trim() || "POS-A1-01",
        empilhadeiraId: empObjeto?.id || null,
        empilhadeiraNome: empObjeto?.nome || empObjeto?.modelo || "Não atribuída"
      };

      await fetch(`${import.meta.env.VITE_API_URL || "https://fourt-smart.onrender.com"}/api/tarefas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setMensagem({ tipo: "sucesso", texto: "Ordem de movimentação criada com sucesso!" });
      await carregarDados();
    } catch (err) {
      setMensagem({ tipo: "erro", texto: err.message || "Erro ao criar ordem de movimentação." });
    }
  }

  async function handleAtribuirEmpilhadeira(tarefaId, empId) {
    if (!empId) return;
    const empObjeto = empilhadeiras.find((e) => String(e.id) === String(empId));
    try {
      await api.atribuirManual(tarefaId, empId);
      setMensagem({ tipo: "sucesso", texto: `Empilhadeira ${empObjeto?.nome || empId} atribuída à tarefa!` });
      await carregarDados();
    } catch (err) {
      alert("Erro ao atribuir empilhadeira: " + err.message);
    }
  }

  async function handleConcluirTarefa(tarefaId) {
    try {
      await api.concluirTarefa(tarefaId);
      setMensagem({ tipo: "sucesso", texto: "Tarefa concluída com sucesso!" });
      await carregarDados();
    } catch (err) {
      alert("Erro ao concluir tarefa: " + err.message);
    }
  }

  async function handleCancelarTarefa(tarefaId) {
    if (!window.confirm("Deseja realmente cancelar esta ordem de movimentação?")) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "https://fourt-smart.onrender.com"}/api/tarefas/${tarefaId}`, {
        method: "DELETE"
      });
      setMensagem({ tipo: "sucesso", texto: "Ordem de movimentação cancelada." });
      await carregarDados();
    } catch (err) {
      alert("Erro ao cancelar tarefa: " + err.message);
    }
  }

  if (carregando) return <Loading label="A carregar gestão de ordens..." />;
  if (erro) return <ErrorBox message={erro} onRetry={carregarDados} />;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO LIMPO (SEM BOTÃO DE ATRIBUIR AUTOMÁTICO) */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Ordens de Movimentação & Frota</h2>
        <p className="text-slate-500 text-sm mt-1">
          Crie ordens de trabalho para os lotes de café cadastrados e atribua empilhadeiras.
        </p>
      </div>

      {mensagem && (
        <div
          className={`p-4 rounded-xl text-sm font-medium transition-all ${
            mensagem.tipo === "sucesso"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULÁRIO DE CRIAR ORDEM PARA LOTE */}
        <Card title="📦 Nova Ordem para Lote de Café">
          <form onSubmit={handleCriarOrdem} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Lote de Café
              </label>
              <select
                value={loteSelId}
                onChange={(e) => setLoteSelId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                required
              >
                {lotes.length === 0 ? (
                  <option value="">Nenhum lote cadastrado</option>
                ) : (
                  lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.codigo || l.id} — {l.produto || "Café Arábica"} ({l.quantidade || l.quantidadeSacas || 1000} sacas)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Operação / Objetivo
              </label>
              <select
                value={tipoOperacao}
                onChange={(e) => setTipoOperacao(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              >
                <option value="ARMAZENAMENTO">📥 Armazenamento (Doca ➔ Posição)</option>
                <option value="REBENEFICIO">⚙️ Movimentar para Rebenefício</option>
                <option value="EXPEDICAO">🚚 Expedição (Posição ➔ Doca)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Origem
                </label>
                <input
                  type="text"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                  placeholder="Ex: Doca 01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Destino
                </label>
                <select
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
                >
                  <option value="Doca 02 (Expedição)">Doca 02 (Expedição)</option>
                  {posicoes.map((p) => (
                    <option key={p.id} value={p.codigo || p.id}>
                      {p.codigo || p.id} ({p.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Atribuir Empilhadeira (Opcional)
              </label>
              <select
                value={empilhadeiraSelId}
                onChange={(e) => setEmpilhadeiraSelId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              >
                <option value="">Deixar pendente (Atribuir depois)</option>
                {empilhadeiras.map((e, idx) => (
                  <option key={e.id} value={e.id}>
                    {e.nome || e.modelo || `EMP-0${idx + 1}`} ({e.operador || "Operador"})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors shadow-sm"
            >
              + Criar ordem de trabalho
            </button>
          </form>
        </Card>

        {/* LISTA DE ORDENS REGISTRADAS */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800">Ordens de Movimentação Ativas</h3>

          {tarefas.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              Nenhuma ordem registrada no momento.
            </div>
          ) : (
            tarefas.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <span className="font-extrabold text-slate-900 text-base">{t.loteCodigo}</span>
                    <span className="text-xs text-slate-500 ml-2">({t.produto})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge type={t.tipo}>{t.tipo}</Badge>
                    <Badge type={t.status}>{t.status}</Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
                  <p>
                    📍 <strong className="text-slate-800">De:</strong> {t.origem} ➔ <strong className="text-slate-800">Para:</strong> {t.destino}
                  </p>
                  <p>
                    🚜 <strong className="text-slate-800">Empilhadeira:</strong> {t.empilhadeiraNome}
                  </p>
                </div>

                {/* ACOES DA TAREFA */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                  {/* Seleção rápida de empilhadeira caso esteja sem */}
                  {!t.empilhadeiraId && t.status !== "CONCLUIDA" && (
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => handleAtribuirEmpilhadeira(t.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 bg-slate-50"
                        defaultValue=""
                      >
                        <option value="" disabled>Atribuir empilhadeira...</option>
                        {empilhadeiras.map((emp, idx) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nome || emp.modelo || `EMP-0${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {t.status !== "CONCLUIDA" && (
                      <button
                        type="button"
                        onClick={() => handleConcluirTarefa(t.id)}
                        className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800 transition-colors"
                      >
                        ✓ Concluir
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCancelarTarefa(t.id)}
                      className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-bold text-xs rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
