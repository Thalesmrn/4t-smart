import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatCard, Loading, ErrorBox, Card, Badge } from "../components/Common.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);

  async function carregar() {
    try {
      const d = await api.dashboard();
      setData(d);
      setErro(null); // Limpa eventuais erros assim que a API responder com sucesso
    } catch (e) {
      // Se ainda não temos dados carregados, exibe o erro na tela
      setErro(e.message || "Erro ao conectar com o servidor.");
    } finally {
      setCarregandoInicial(false);
    }
  }

  useEffect(() => {
    carregar();
    // Tenta reconectar a cada 8 segundos caso o servidor esteja acordando no Render
    const interval = setInterval(carregar, 8000);
    return () => clearInterval(interval);
  }, []);

  // Exibe tela de carregamento no primeiro acesso
  if (carregandoInicial && !data) {
    return <Loading label="Conectando à Central Operacional (aguarde a API iniciar)..." />;
  }

  // Se deu erro e ainda não temos nenhum dado na tela
  if (erro && !data) {
    return (
      <div className="space-y-4">
        <ErrorBox message={`${erro} (O servidor no Render pode estar inicializando. Tentando reconectar...)`} />
        <button 
          onClick={carregar} 
          className="px-4 py-2 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Central Operacional</h2>
        <p className="text-slate-500 text-sm mt-1">
          Visão consolidada do turno — atualiza automaticamente a cada 8s.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Ocupação do Armazém"
          value={`${data.ocupacao?.ocupacaoPct ?? 0}%`}
          sublabel={`${data.ocupacao?.ocupadas ?? 0}/${data.ocupacao?.totalPosicoes ?? 0} posições ocupadas`}
          tone={(data.ocupacao?.ocupacaoPct ?? 0) > 85 ? "warn" : "default"}
        />
        <StatCard
          label="Tarefas Abertas"
          value={data.tarefas?.abertas ?? 0}
          sublabel={`${data.tarefas?.urgentes ?? 0} urgente(s)`}
          tone={(data.tarefas?.urgentes ?? 0) > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Concluídas no Turno"
          value={data.tarefas?.concluidasNoTurno ?? 0}
          sublabel="movimentações finalizadas"
          tone="good"
        />
        <StatCard
          label="Empilhadeiras Disponíveis"
          value={`${data.empilhadeiras?.disponiveis ?? 0}/${data.empilhadeiras?.total ?? 0}`}
          sublabel={`${data.empilhadeiras?.emTarefa ?? 0} em tarefa`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Distância Percorrida"
          value={`${(data.indicadores?.distanciaTotalPercorridaM ?? 0).toLocaleString("pt-BR")} m`}
          sublabel="acumulado no turno (todas empilhadeiras)"
        />
        <StatCard
          label="Tempo Médio / Movimentação"
          value={`${data.indicadores?.tempoMedioPorMovimentacaoMin ?? 0} min`}
        />
        <StatCard
          label="Eficiência Logística do Turno"
          value={`${data.indicadores?.eficienciaLogisticaPct ?? 0}%`}
          sublabel={`índice de movimentação indireta: ${data.indicadores?.indiceMovimentacaoIndiretaPct ?? 0}%`}
          tone={(data.indicadores?.eficienciaLogisticaPct ?? 0) >= 80 ? "good" : "warn"}
        />
      </div>

      <Card title="Caminhões no Pátio / Agendados">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-4">Placa</th>
                <th className="py-2 pr-4">Operação</th>
                <th className="py-2 pr-4">Horário</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Proteção com Optional Chaining ?. para evitar o erro de map em undefined */}
              {data.caminhoesNoPatio?.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{c.placa}</td>
                  <td className="py-2 pr-4 capitalize">{c.tipoOperacao}</td>
                  <td className="py-2 pr-4">
                    {c.horarioChegada
                      ? new Date(c.horarioChegada).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge type={c.status}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
              {(!data.caminhoesNoPatio || data.caminhoesNoPatio.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">
                    Nenhum caminhão no pátio no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
