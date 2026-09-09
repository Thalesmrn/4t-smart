import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatCard, Loading, ErrorBox, Card, Badge } from "../components/Common.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);

  async function carregar() {
    try {
      const d = await api.dashboard();
      setData(d);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 8000);
    return () => clearInterval(interval);
  }, []);

  if (erro) return <ErrorBox message={erro} />;
  if (!data) return <Loading label="Carregando central operacional..." />;

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
          value={`${data.ocupacao.ocupacaoPct}%`}
          sublabel={`${data.ocupacao.ocupadas}/${data.ocupacao.totalPosicoes} posições ocupadas`}
          tone={data.ocupacao.ocupacaoPct > 85 ? "warn" : "default"}
        />
        <StatCard
          label="Tarefas Abertas"
          value={data.tarefas.abertas}
          sublabel={`${data.tarefas.urgentes} urgente(s)`}
          tone={data.tarefas.urgentes > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Concluídas no Turno"
          value={data.tarefas.concluidasNoTurno}
          sublabel="movimentações finalizadas"
          tone="good"
        />
        <StatCard
          label="Empilhadeiras Disponíveis"
          value={`${data.empilhadeiras.disponiveis}/${data.empilhadeiras.total}`}
          sublabel={`${data.empilhadeiras.emTarefa} em tarefa`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Distância Percorrida"
          value={`${data.indicadores.distanciaTotalPercorridaM.toLocaleString("pt-BR")} m`}
          sublabel="acumulado no turno (todas empilhadeiras)"
        />
        <StatCard
          label="Tempo Médio / Movimentação"
          value={`${data.indicadores.tempoMedioPorMovimentacaoMin} min`}
        />
        <StatCard
          label="Eficiência Logística do Turno"
          value={`${data.indicadores.eficienciaLogisticaPct}%`}
          sublabel={`índice de movimentação indireta: ${data.indicadores.indiceMovimentacaoIndiretaPct}%`}
          tone={data.indicadores.eficienciaLogisticaPct >= 80 ? "good" : "warn"}
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
              {data.caminhoesNoPatio.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{c.placa}</td>
                  <td className="py-2 pr-4 capitalize">{c.tipoOperacao}</td>
                  <td className="py-2 pr-4">
                    {new Date(c.horarioChegada).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge type={c.status}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
