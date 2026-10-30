import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Card, Badge } from "../components/Common.jsx";

export default function Slotting() {
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [empilhadeiraSel, setEmpilhadeiraSel] = useState("");
  const [loteSel, setLoteSel] = useState("");
  
  const [priorizarExpedicao, setPriorizarExpedicao] = useState(false);
  const [rebeneficiar, setRebeneficiar] = useState(true);

  const [sequencia, setSequencia] = useState(null);
  const [recomendacoes, setRecomendacoes] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [calculandoSeq, setCalculandoSeq] = useState(false);
  const [calculandoRec, setCalculandoRec] = useState(false);
  
  const [erro, setErro] = useState(null);
  const [mensagemErro, setMensagemErro] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const [listEmp, listLotes] = await Promise.all([
        api.empilhadeiras().catch(() => []),
        api.lotes().catch(() => [])
      ]);
      
      const emps = Array.isArray(listEmp) ? listEmp : [];
      const lts = Array.isArray(listLotes) ? listLotes : [];

      setEmpilhadeiras(emps);
      setLotes(lts);

      if (emps.length > 0) setEmpilhadeiraSel(emps[0].id);
      if (lts.length > 0) setLoteSel(lts[0].id);
    } catch (e) {
      setErro(e.message || "Erro ao carregar dados da página.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleCalcularSequencia(e) {
    e?.preventDefault();
    if (!empilhadeiraSel) return;
    setCalculandoSeq(true);
    setMensagemErro(null);
    try {
      const res = await api.sequenciaOtimizada(empilhadeiraSel);
      setSequencia(res.sequencia || []);
    } catch (err) {
      setMensagemErro(err.message || "Erro ao calcular sequência de movimentação.");
    } finally {
      setCalculandoSeq(false);
    }
  }

  async function handleRecomendarPosicoes(e) {
    e?.preventDefault();
    setCalculandoRec(true);
    setMensagemErro(null);
    try {
      const res = await api.recomendarSlotting({
        loteId: loteSel || null,
        priorizarExpedicao,
        rebeneficiar
      });
      setRecomendacoes(res.recomendacoes || []);
    } catch (err) {
      setMensagemErro(err.message || "Erro ao recomendar posições de slotting.");
    } finally {
      setCalculandoRec(false);
    }
  }

  if (carregando) return <Loading label="Carregando módulo de slotting..." />;
  if (erro) return <ErrorBox message={erro} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Roteirização Interna & Slotting Inteligente</h2>
        <p className="text-slate-500 text-sm mt-1">
          Otimize sequências de movimentação e descubra a melhor posição para novos lotes.
        </p>
      </div>

      {mensagemErro && (
        <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-800 border border-red-200">
          ⚠️ {mensagemErro}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ROTEIRIZAÇÃO */}
        <Card title="Roteirização — melhor sequência de movimentação">
          <form onSubmit={handleCalcularSequencia} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Empilhadeira
              </label>
              <select
                value={empilhadeiraSel}
                onChange={(e) => setEmpilhadeiraSel(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              >
                <option value="">Selecione...</option>
                {empilhadeiras.map((emp, idx) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nome || emp.modelo || `EMP-0${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={calculandoSeq || !empilhadeiraSel}
              className="py-2.5 px-4 rounded-lg bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {calculandoSeq ? "Calculando..." : "Calcular sequência ótima"}
            </button>
          </form>

          {sequencia && (
            <div className="mt-6 border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500">Sequência sugerida ({sequencia.length} tarefas)</p>
              {sequencia.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma tarefa pendente para esta empilhadeira.</p>
              ) : (
                sequencia.map((item, i) => (
                  <div key={item.id || i} className="p-3 bg-slate-50 rounded-lg text-sm border flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{i + 1}. {item.tipo} — {item.lote}</p>
                      <p className="text-xs text-slate-500">{item.origem} ➔ {item.destino}</p>
                    </div>
                    <Badge type="EM_ANDAMENTO">Ordem {i + 1}</Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        {/* SLOTTING INTELIGENTE */}
        <Card title="Slotting Inteligente — onde armazenar o próximo lote?">
          <form onSubmit={handleRecomendarPosicoes} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Lote (opcional — para consolidação)
              </label>
              <select
                value={loteSel}
                onChange={(e) => setLoteSel(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
              >
                <option value="">Selecione um lote...</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.codigo || l.id} — {l.produto || "Café Comum"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priorizarExpedicao}
                  onChange={(e) => setPriorizarExpedicao(e.target.checked)}
                  className="rounded border-slate-300 text-amber-800 focus:ring-amber-800"
                />
                Priorizar expedição rápida
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rebeneficiar}
                  onChange={(e) => setRebeneficiar(e.target.checked)}
                  className="rounded border-slate-300 text-amber-800 focus:ring-amber-800"
                />
                Lote ainda será rebeneficiado
              </label>
            </div>

            <button
              type="submit"
              disabled={calculandoRec}
              className="py-2.5 px-4 rounded-lg bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 disabled:opacity-50 transition-colors"
            >
              {calculandoRec ? "Calculando..." : "Recomendar posições"}
            </button>
          </form>

          {recomendacoes && (
            <div className="mt-6 border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500">Posições Recomendadas ({recomendacoes.length})</p>
              {recomendacoes.map((rec, idx) => (
                <div key={rec.id || idx} className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900">{rec.id || rec.codigo} — {rec.galpao}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                      Score: {rec.pontuacao}%
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">{rec.motivo}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
