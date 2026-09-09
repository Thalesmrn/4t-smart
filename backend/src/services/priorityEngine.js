/**
 * Motor de Priorização Dinâmica
 * Calcula um score de prioridade (0-100) para cada tarefa e gera uma
 * explicação textual (explicabilidade) do porquê daquele score.
 *
 * Fatores considerados:
 *  - Urgência declarada da tarefa
 *  - Proximidade do prazo (SLA) — quanto mais perto, maior o score
 *  - Tipo de operação (recebimento com caminhão parado pesa mais que reorganização)
 *  - Bloqueios relacionados (lote bloqueado / pendência documental)
 *  - Impacto de fila (tarefas do mesmo caminhão/doca já atrasadas)
 */

const PESO_TIPO = {
  recebimento: 30,
  expedicao: 25,
  formacao_liga: 15,
  separacao: 10,
  transferencia: 8,
};

function minutosAteISO(iso) {
  if (!iso) return Infinity;
  return (new Date(iso).getTime() - Date.now()) / 60000;
}

function calcularPrioridade(tarefa, contexto = {}) {
  const motivos = [];
  let score = 0;

  // 1) Peso base pelo tipo de operação
  const pesoTipo = PESO_TIPO[tarefa.tipo] || 5;
  score += pesoTipo;
  motivos.push(`operação de ${tarefa.tipo.replace("_", " ")} tem peso-base ${pesoTipo}`);

  // 2) Urgência declarada
  if (tarefa.urgente) {
    score += 25;
    motivos.push("marcada como urgente");
  }

  // 3) Proximidade do prazo/SLA
  const minutosRestantes = minutosAteISO(tarefa.prazoLimite);
  if (minutosRestantes <= 0) {
    score += 30;
    motivos.push("prazo já vencido (caminhão/operação em espera)");
  } else if (minutosRestantes <= 20) {
    score += 25;
    motivos.push(`apenas ${Math.round(minutosRestantes)} min para o prazo`);
  } else if (minutosRestantes <= 60) {
    score += 12;
    motivos.push(`${Math.round(minutosRestantes)} min para o prazo`);
  } else if (minutosRestantes <= 180) {
    score += 5;
    motivos.push(`${Math.round(minutosRestantes / 60)}h para o prazo`);
  }

  // 4) Posição de origem bloqueada (gera pendência de liberação)
  if (contexto.posicaoOrigem && contexto.posicaoOrigem.status === "bloqueada") {
    score += 10;
    motivos.push(`posição de origem ${contexto.posicaoOrigem.id} está bloqueada (${contexto.posicaoOrigem.motivoBloqueio})`);
  }

  // 5) Caminhão relacionado já no pátio (chegada <= 0 min)
  if (contexto.caminhaoRelacionado) {
    const chegadaMin = minutosAteISO(contexto.caminhaoRelacionado.horarioChegada);
    if (chegadaMin <= 0) {
      score += 15;
      motivos.push(`caminhão ${contexto.caminhaoRelacionado.placa} já está no pátio parado`);
    }
  }

  score = Math.min(100, Math.round(score));

  const explicacao =
    motivos.length > 0
      ? `Score ${score}/100 — ${motivos.join("; ")}.`
      : `Score ${score}/100 — sem fatores críticos identificados.`;

  return { score, explicacao };
}

/**
 * Recalcula a prioridade de todas as tarefas pendentes/atribuídas, usando
 * o estado atual do banco mock para contexto (posições, caminhões).
 */
function recalcularPrioridades(db) {
  db.tarefas
    .filter((t) => t.status !== "concluida")
    .forEach((tarefa) => {
      const posicaoOrigem = db.posicoes.find((p) => p.id === tarefa.origemId);
      const caminhaoRelacionado = db.caminhoes.find(
        (c) => c.loteId && c.loteId === tarefa.loteId
      );
      const { score, explicacao } = calcularPrioridade(tarefa, {
        posicaoOrigem,
        caminhaoRelacionado,
      });
      tarefa.prioridadeScore = score;
      tarefa.prioridadeExplicacao = explicacao;
    });

  db.tarefas.sort((a, b) => b.prioridadeScore - a.prioridadeScore);
  return db.tarefas;
}

module.exports = { calcularPrioridade, recalcularPrioridades };
