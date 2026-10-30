import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Badge, Card } from "../components/Common.jsx";

export default function WarehouseMap() {
  const [posicoes, setPosicoes] = useState([]);
  const [posicaoDetalhe, setPosicaoDetalhe] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [alterando, setAlterando] = useState(false);

  useEffect(() => {
    carregarPosicoes();
  }, []);

  async function carregarPosicoes() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await api.posicoes();
      setPosicoes(Array.isArray(res) ? res : []);
    } catch (e) {
      setErro(e.message || "Erro ao carregar posições do armazém.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleAlterarStatus(novoStatus) {
    if (!posicaoDetalhe) return;

    const acaoTexto = novoStatus === "BLOQUEADA" ? "bloquear" : novoStatus === "LIVRE" ? "desbloquear/liberar" : "alterar";
    if (!window.confirm(`Deseja realmente ${acaoTexto} a posição ${posicaoDetalhe.codigo || posicaoDetalhe.id}?`)) return;

    setAlterando(true);
    try {
      const id = posicaoDetalhe.id;
      
      // Chamada HTTP para salvar o novo status
      await fetch(`${import.meta.env.VITE_API_URL || "https://fourt-smart.onrender.com"}/api/armazem/posicoes/${id}/alterar-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novoStatus })
      });

      // Atualização no estado local
      setPosicoes((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: novoStatus, lote: novoStatus === "LIVRE" || novoStatus === "BLOQUEADA" ? null : p.lote }
            : p
        )
      );

      setPosicaoDetalhe((prev) =>
        prev ? { ...prev, status: novoStatus, lote: novoStatus === "LIVRE" || novoStatus === "BLOQUEADA" ? null : prev.lote } : null
      );
    } catch (e) {
      alert("Erro ao alterar status: " + e.message);
    } finally {
      setAlterando(false);
    }
  }

  if (carregando) return <Loading label="A carregar mapa digital..." />;
  if (erro) return <ErrorBox message={erro} onRetry={carregarPosicoes} />;

  // Agrupa as posições por Rua / Corredor (A1, A2, A3, A4, A5)
  const ruasAgrupadas = posicoes.reduce((acc, p) => {
    const rua = p.rua || (p.codigo ? p.codigo.split('-')[0] : "Rua A1");
    const ruaFormatada = rua.startsWith("RUA") ? rua : `RUA / CORREDOR ${rua}`;
    if (!acc[ruaFormatada]) acc[ruaFormatada] = [];
    acc[ruaFormatada].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* CABEÇALHO LIMPO SEM DIVISÃO DE GALPÕES NO TOPO */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mapa Digital do Armazém</h2>
        <p className="text-slate-500 text-sm mt-1">
          Grid interativo — clique em uma posição para ver detalhes do lote/big bag e gerenciar status.
        </p>
      </div>

      {/* LEGENDA DE STATUS */}
      <div className="flex items-center gap-6 text-xs font-medium text-slate-600 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-400"></span>
          <span>Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-200 border border-slate-400"></span>
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-red-100 border border-red-400"></span>
          <span>Bloqueada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-400"></span>
          <span>Atenção</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRID INTERATIVO DO MAPA (RUAS E QUADRADOS DE POSIÇÕES) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
          {Object.keys(ruasAgrupadas).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Nenhuma posição cadastrada.</p>
          ) : (
            Object.entries(ruasAgrupadas).map(([ruaNome, posList]) => (
              <div key={ruaNome} className="space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {ruaNome}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {posList.map((p) => {
                    const isSelected = posicaoDetalhe?.id === p.id;
                    let bgColor = "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300";
                    if (p.status === "OCUPADA") bgColor = "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-400";
                    if (p.status === "BLOQUEADA") bgColor = "bg-red-50 hover:bg-red-100 text-red-900 border-red-300";
                    if (p.status === "ATENCAO") bgColor = "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300";

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPosicaoDetalhe(p)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center min-h-[52px] ${bgColor} ${
                          isSelected ? "ring-2 ring-emerald-700 ring-offset-2 scale-105 shadow-md" : ""
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

        {/* CARD LATERAL COM ACOES MANUAIS (BLOQUEAR, DESBLOQUEAR, LIBERAR) */}
        <Card title="Detalhes da Posição">
          {posicaoDetalhe ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xl font-bold text-slate-800">{posicaoDetalhe.codigo || posicaoDetalhe.id}</span>
                <Badge type={posicaoDetalhe.status}>{posicaoDetalhe.status}</Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p><strong className="text-slate-700">Rua/Corredor:</strong> {posicaoDetalhe.rua || "—"}</p>
                <p><strong className="text-slate-700">Nível:</strong> {posicaoDetalhe.nivel || "1"}</p>
              </div>

              {posicaoDetalhe.lote ? (
                <div className="p-3 bg-slate-50 rounded-lg border space-y-1.5 text-xs">
                  <p className="font-bold text-slate-800 uppercase border-b pb-1">Informações do Lote</p>
                  <p><strong className="text-slate-600">Código:</strong> {posicaoDetalhe.lote.codigo || posicaoDetalhe.lote.id}</p>
                  <p><strong className="text-slate-600">Produto:</strong> {posicaoDetalhe.lote.produto || "Café Arábica"}</p>
                  <p><strong className="text-slate-600">Qualidade:</strong> {posicaoDetalhe.lote.qualidade || "Tipo 2"}</p>
                  <p><strong className="text-slate-600">Proprietário:</strong> {posicaoDetalhe.lote.proprietario || "Fazenda União"}</p>
                  <p><strong className="text-slate-600">Quantidade:</strong> {posicaoDetalhe.lote.quantidade || posicaoDetalhe.lote.quantidadeSacas || 1000} sacas</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-1">
                  {posicaoDetalhe.status === "BLOQUEADA"
                    ? "Esta posição está bloqueada e não pode receber sacarias até ser desbloqueada."
                    : "Esta posição está livre para receber sacarias."}
                </p>
              )}

              {/* BOTOES DE AÇÕES MANUAIS */}
              <div className="pt-2 space-y-2">
                {posicaoDetalhe.status === "BLOQUEADA" ? (
                  <button
                    type="button"
                    disabled={alterando}
                    onClick={() => handleAlterarStatus("LIVRE")}
                    className="w-full py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    🔓 Desbloquear posição
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={alterando}
                    onClick={() => handleAlterarStatus("BLOQUEADA")}
                    className="w-full py-2.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    🔒 Bloquear posição manual
                  </button>
                )}

                {posicaoDetalhe.status === "OCUPADA" && (
                  <button
                    type="button"
                    disabled={alterando}
                    onClick={() => handleAlterarStatus("LIVRE")}
                    className="w-full py-2.5 bg-slate-700 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    📦 Liberar posição (Remover Lote)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              Selecione uma posição no mapa para ver os detalhes ou alterar o status.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
