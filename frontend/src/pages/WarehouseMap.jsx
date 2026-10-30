import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge, Card } from "../components/Common.jsx";

export default function WarehouseMap() {
  const [galpoes, setGalpoes] = useState([]);
  const [galpaoSel, setGalpaoSel] = useState(null);
  const [posicoes, setPosicoes] = useState([]);
  const [posicaoDetalhe, setPosicaoDetalhe] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarGalpoes();
  }, []);

  async function carregarGalpoes() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await api.galpoes();
      const list = Array.isArray(res) && res.length > 0 ? res : [
        { id: "GAL-A", nome: "Galpão A — Grãos & Sacarias" },
        { id: "GAL-B", nome: "Galpão B — Rebeneficiamento" },
        { id: "GAL-C", nome: "Galpão C — Exclusivo Exportação" },
        { id: "GAL-D", nome: "Galpão D — Triagem e Qualidade" }
      ];
      setGalpoes(list);
      if (list.length > 0) {
        selecionarGalpao(list[0]);
      }
    } catch (e) {
      setErro(e.message || "Erro ao carregar galpões.");
    } finally {
      setCarregando(false);
    }
  }

  async function selecionarGalpao(g) {
    setGalpaoSel(g);
    setPosicaoDetalhe(null);
    try {
      const res = await api.posicoes({ galpaoId: g.id });
      setPosicoes(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setPosicoes([]);
    }
  }

  async function handleLiberarPosicao(id) {
    if (!window.confirm("Deseja realmente liberar esta posição do armazém?")) return;
    try {
      await api.liberarPosicao(id);
      
      // Atualiza o estado da posição selecionada localmente para "LIVRE"
      setPosicaoDetalhe((prev) => prev ? { ...prev, status: "LIVRE", lote: null } : null);
      
      // Recarrega a grade de posições
      if (galpaoSel) selecionarGalpao(galpaoSel);
    } catch (e) {
      alert("Erro ao liberar posição: " + e.message);
    }
  }

  if (carregando) return <Loading label="A carregar mapa digital..." />;
  if (erro) return <ErrorBox message={erro} onRetry={carregarGalpoes} />;

  // Agrupa posições por rua para desenhar os corredores
  const ruasAgrupadas = posicoes.reduce((acc, p) => {
    const rua = p.rua || "Geral";
    if (!acc[rua]) acc[rua] = [];
    acc[rua].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mapa Digital do Armazém</h2>
          <p className="text-slate-500 text-sm mt-1">
            Grid interativo — clique em uma posição para ver detalhes do lote/big bag.
          </p>
        </div>

        {/* TABS DE GALPÕES (MÚLTIPLOS GALPÕES) */}
        <div className="flex flex-wrap gap-2">
          {galpoes.map((g) => (
            <button
              key={g.id}
              onClick={() => selecionarGalpao(g)}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
                galpaoSel?.id === g.id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {g.nome}
            </button>
          ))}
        </div>
      </div>

      {/* LEGENDA DE STATUS */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400"></span>
          <span>Livre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-300 border border-slate-400"></span>
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-200 border border-red-400"></span>
          <span>Bloqueada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span>
          <span>Atenção</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRID INTERATIVO DO MAPA */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
          {Object.keys(ruasAgrupadas).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Nenhuma posição cadastrada para este galpão.</p>
          ) : (
            Object.entries(ruasAgrupadas).map(([rua, posList]) => (
              <div key={rua} className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rua / Corredor {rua}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {posList.map((p) => {
                    const isSelected = posicaoDetalhe?.id === p.id;
                    let bgColor = "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300";
                    if (p.status === "OCUPADA") bgColor = "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-400";
                    if (p.status === "BLOQUEADA") bgColor = "bg-red-100 hover:bg-red-200 text-red-900 border-red-300";
                    if (p.status === "ATENCAO") bgColor = "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300";

                    return (
                      <button
                        key={p.id}
                        onClick={() => setPosicaoDetalhe(p)}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center min-h-[50px] ${bgColor} ${
                          isSelected ? "ring-2 ring-emerald-700 ring-offset-1 scale-105" : ""
                        }`}
                      >
                        <span>{p.codigo || p.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* CARD DE DETALHES DA POSIÇÃO E LIBERAÇÃO MANUAL */}
        <Card title="Detalhes da Posição">
          {posicaoDetalhe ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-lg font-bold text-slate-800">{posicaoDetalhe.codigo || posicaoDetalhe.id}</span>
                <Badge type={posicaoDetalhe.status}>{posicaoDetalhe.status}</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-500">
                  <strong className="text-slate-700">Rua:</strong> {posicaoDetalhe.rua || "—"} |{" "}
                  <strong className="text-slate-700">Nível:</strong> {posicaoDetalhe.nivel || "—"}
                </p>
              </div>

              {posicaoDetalhe.lote ? (
                <div className="p-3 bg-slate-50 rounded-lg border space-y-2 text-xs">
                  <p className="font-bold text-slate-800 uppercase border-b pb-1">Informações do Lote</p>
                  <p><strong className="text-slate-600">Código:</strong> {posicaoDetalhe.lote.codigo || posicaoDetalhe.lote.id}</p>
                  <p><strong className="text-slate-600">Produto:</strong> {posicaoDetalhe.lote.produto}</p>
                  <p><strong className="text-slate-600">Qualidade:</strong> {posicaoDetalhe.lote.qualidade || "Tipo 2"}</p>
                  <p><strong className="text-slate-600">Proprietário:</strong> {posicaoDetalhe.lote.proprietario || "Fazenda União"}</p>
                  <p><strong className="text-slate-600">Sacas:</strong> {posicaoDetalhe.lote.quantidade || posicaoDetalhe.lote.quantidadeSacas || 1000}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Esta posição está livre para receber sacarias.</p>
              )}

              {posicaoDetalhe.status === "OCUPADA" && (
                <button
                  type="button"
                  onClick={() => handleLiberarPosicao(posicaoDetalhe.id)}
                  className="w-full py-2 bg-red-50 text-red-700 font-bold text-xs rounded-lg border border-red-200 hover:bg-red-100 transition-colors mt-4"
                >
                  Liberar esta posição
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              Selecione uma posição no mapa para ver os detalhes do lote armazenado.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
