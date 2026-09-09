import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Card, Badge } from "../components/Common.jsx";

export default function Slotting() {
  const [empilhadeiras, setEmpilhadeiras] = useState([]);
  const [empSelecionada, setEmpSelecionada] = useState("");
  const [rota, setRota] = useState(null);
  const [erroRota, setErroRota] = useState(null);

  const [lotes, setLotes] = useState([]);
  const [loteId, setLoteId] = useState("");
  const [priorizarExpedicao, setPriorizarExpedicao] = useState(false);
  const [precisaRebeneficio, setPrecisaRebeneficio] = useState(true);
  const [recomendacoes, setRecomendacoes] = useState(null);
  const [erroSlotting, setErroSlotting] = useState(null);

  useEffect(() => {
    api.empilhadeiras().then(setEmpilhadeiras).catch(() => {});
    api.lotes().then(setLotes).catch(() => {});
  }, []);

  async function buscarSequencia() {
    if (!empSelecionada) return;
    setErroRota(null);
    try {
      const res = await api.sequenciaOtimizada(empSelecionada);
      setRota(res);
    } catch (e) {
      setErroRota(e.message);
    }
  }

  async function buscarSlotting() {
    setErroSlotting(null);
    try {
      const res = await api.recomendarSlotting({
        loteId: loteId || undefined,
        priorizarExpedicaoRapida: priorizarExpedicao,
        precisaRebeneficio,
      });
      setRecomendacoes(res);
    } catch (e) {
      setErroSlotting(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Roteirização Interna & Slotting Inteligente</h2>
        <p className="text-slate-500 text-sm mt-1">
          Otimize sequências de movimentação e descubra a melhor posição para novos lotes.
        </p>
      </div>

      <Card title="Roteirização — melhor sequência de movimentação">
        <div className="flex items-end gap-3 flex-wrap mb-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Empilhadeira</label>
            <select
              value={empSelecionada}
              onChange={(e) => setEmpSelecionada(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm min-w-[220px]"
            >
              <option value="">Selecione...</option>
              {empilhadeiras.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={buscarSequencia}
            disabled={!empSelecionada}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 transition-colors"
          >
            Calcular sequência ótima
          </button>
        </div>

        {erroRota && <ErrorBox message={erroRota} />}

        {rota && rota.sequenciaOtimizada?.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Rota otimizada</p>
                <p className="font-bold text-brand-600">{rota.distanciaTotalOtimizadaM} m</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Rota não otimizada (FIFO)</p>
                <p className="font-bold text-slate-500">{rota.distanciaTotalNaoOtimizadaM} m</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Economia estimada</p>
                <p className="font-bold text-emerald-600">
                  {rota.economiaEstimadaM} m ({rota.economiaEstimadaPct}%)
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">{rota.explicacao}</p>
            <ol className="space-y-2">
              {rota.sequenciaOtimizada.map((s, idx) => (
                <li key={s.tarefaId} className="flex items-center gap-3 text-sm border rounded-lg p-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{s.descricao}</p>
                    <p className="text-xs text-slate-400">
                      deslocamento vazio: {Math.round(s.deslocamentoVazioM)} m · carregado:{" "}
                      {Math.round(s.deslocamentoCarregadoM)} m
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {rota && rota.sequenciaOtimizada?.length === 0 && (
          <p className="text-sm text-slate-400">{rota.mensagem}</p>
        )}
      </Card>

      <Card title="Slotting Inteligente — onde armazenar o próximo lote?">
        <div className="flex items-end gap-4 flex-wrap mb-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Lote (opcional — para consolidação)</label>
            <select
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm min-w-[220px]"
            >
              <option value="">Novo lote (sem consolidação)</option>
              {lotes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} — {l.produto}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={priorizarExpedicao}
              onChange={(e) => setPriorizarExpedicao(e.target.checked)}
            />
            Priorizar expedição rápida
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={precisaRebeneficio}
              onChange={(e) => setPrecisaRebeneficio(e.target.checked)}
            />
            Lote ainda será rebeneficiado
          </label>
          <button
            onClick={buscarSlotting}
            className="px-4 py-2 rounded-lg bg-coffee-600 text-white text-sm font-semibold hover:bg-coffee-700 transition-colors"
          >
            Recomendar posições
          </button>
        </div>

        {erroSlotting && <ErrorBox message={erroSlotting} />}

        {recomendacoes && (
          <div className="space-y-3">
            {recomendacoes.recomendacoes.map((r) => (
              <div key={r.posicaoId} className="border rounded-lg p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
                  #{r.ranking}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {r.posicaoId} <Badge type="livre">score {r.score}</Badge>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{r.explicacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
