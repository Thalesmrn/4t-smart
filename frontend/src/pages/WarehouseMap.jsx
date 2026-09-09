import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Loading, ErrorBox, Card, Badge } from "../components/Common.jsx";

const CORES_STATUS = {
  livre: "bg-emerald-200 hover:bg-emerald-300 border-emerald-400",
  ocupada: "bg-slate-300 hover:bg-slate-400 border-slate-500",
  bloqueada: "bg-red-300 hover:bg-red-400 border-red-500",
  atencao: "bg-amber-300 hover:bg-amber-400 border-amber-500",
};

export default function WarehouseMap() {
  const [galpoes, setGalpoes] = useState([]);
  const [galpaoAtivo, setGalpaoAtivo] = useState(null);
  const [posicoes, setPosicoes] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [erro, setErro] = useState(null);
  const [liberando, setLiberando] = useState(false);

  useEffect(() => {
    api
      .galpoes()
      .then((gs) => {
        setGalpoes(gs);
        setGalpaoAtivo(gs[0]?.id);
      })
      .catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    if (!galpaoAtivo) return;
    api
      .posicoes({ galpaoId: galpaoAtivo })
      .then(setPosicoes)
      .catch((e) => setErro(e.message));
  }, [galpaoAtivo]);

  async function abrirDetalhe(posId) {
    try {
      const detalhe = await api.posicao(posId);
      setSelecionada(detalhe);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function liberarPosicaoSelecionada() {
    if (!selecionada) return;
    setLiberando(true);
    try {
      await api.liberarPosicao(selecionada.id);
      const [detalhe, listaAtualizada] = await Promise.all([
        api.posicao(selecionada.id),
        api.posicoes({ galpaoId: galpaoAtivo }),
      ]);
      setSelecionada(detalhe);
      setPosicoes(listaAtualizada);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLiberando(false);
    }
  }

  if (erro) return <ErrorBox message={erro} />;
  if (!galpaoAtivo) return <Loading label="Carregando galpões..." />;

  const galpao = galpoes.find((g) => g.id === galpaoAtivo);
  const colunas = galpao ? galpao.colunas : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mapa Digital do Armazém</h2>
          <p className="text-slate-500 text-sm mt-1">
            Grid interativo — clique em uma posição para ver detalhes do lote/big bag.
          </p>
        </div>
        <div className="flex gap-2">
          {galpoes.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setGalpaoAtivo(g.id);
                setSelecionada(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                galpaoAtivo === g.id
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
              }`}
            >
              {g.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries({
          livre: "Livre",
          ocupada: "Ocupada",
          bloqueada: "Bloqueada",
          atencao: "Atenção",
        }).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm border ${CORES_STATUS[status]}`} />
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <Card>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
          >
            {posicoes.map((p) => (
              <button
                key={p.id}
                title={p.id}
                onClick={() => abrirDetalhe(p.id)}
                className={`aspect-square rounded border text-[9px] font-semibold flex items-center justify-center transition-colors ${
                  CORES_STATUS[p.status]
                } ${selecionada?.id === p.id ? "ring-2 ring-brand-600" : ""}`}
              >
                {p.coluna}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Detalhes da Posição">
          {!selecionada && (
            <p className="text-sm text-slate-400">Selecione uma posição no mapa para ver detalhes.</p>
          )}
          {selecionada && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Código</p>
                <p className="font-semibold">{selecionada.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <Badge type={selecionada.status}>{selecionada.status}</Badge>
              </div>
              {selecionada.motivoBloqueio && (
                <div>
                  <p className="text-xs text-slate-400">Motivo do bloqueio</p>
                  <p>{selecionada.motivoBloqueio}</p>
                </div>
              )}
              {selecionada.lote && (
                <>
                  <div>
                    <p className="text-xs text-slate-400">Lote</p>
                    <p>{selecionada.lote.id} — {selecionada.lote.produto}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Qualidade</p>
                    <p>{selecionada.lote.qualidade}</p>
                  </div>
                </>
              )}
              {selecionada.bigBag && (
                <div>
                  <p className="text-xs text-slate-400">Big Bag</p>
                  <p>{selecionada.bigBag.id} — {selecionada.pesoKg} kg</p>
                </div>
              )}
              {selecionada.proprietario && (
                <div>
                  <p className="text-xs text-slate-400">Proprietário</p>
                  <p>{selecionada.proprietario}</p>
                </div>
              )}
              {selecionada.dataEntrada && (
                <div>
                  <p className="text-xs text-slate-400">Data de entrada</p>
                  <p>{new Date(selecionada.dataEntrada).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <p className="text-xs text-slate-400">Dist. à doca</p>
                  <p>{selecionada.distanciaDoca} células</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Dist. rebeneficio</p>
                  <p>{selecionada.distanciaRebeneficio} células</p>
                </div>
              </div>

              {(selecionada.status === "ocupada" || selecionada.status === "atencao") && (
                <div className="pt-3 border-t">
                  <button
                    onClick={liberarPosicaoSelecionada}
                    disabled={liberando}
                    className="w-full py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {liberando ? "Liberando..." : "🗑️ Liberar posição (remover big bag)"}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Atalho administrativo — marca o big bag como expedido e libera a posição
                    imediatamente, sem passar pelo fluxo normal de tarefas.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
