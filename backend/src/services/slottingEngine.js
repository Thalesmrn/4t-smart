/**
 * Motor de Slotting Inteligente
 * Recomenda a(s) melhor(es) posição(ões) livre(s) para armazenar um novo
 * lote/big bag, com score explicável baseado em:
 *  - Distância até a doca de expedição (produtos com giro rápido/expedição
 *    programada devem ficar mais perto)
 *  - Distância até a máquina de rebeneficiamento (se o lote ainda será
 *    processado)
 *  - Proximidade a big bags do mesmo lote (consolidação — reduz tarefas
 *    futuras de reagrupamento)
 *  - Evitar corredores já congestionados (heurística simples por densidade)
 */

function calcularDensidadeCorredor(posicoes, linha, galpaoId) {
  const doCorredor = posicoes.filter((p) => p.galpaoId === galpaoId && p.linha === linha);
  const ocupadas = doCorredor.filter((p) => p.status !== "livre").length;
  return doCorredor.length > 0 ? ocupadas / doCorredor.length : 0;
}

function pontuarPosicao(pos, opcoes, posicoes) {
  const motivos = [];
  let score = 100;

  // Penaliza distância até a doca de expedição, se prioridade for giro rápido
  if (opcoes.priorizarExpedicaoRapida) {
    const penalidade = pos.distanciaDoca * 0.8;
    score -= penalidade;
    motivos.push(`${Math.round(penalidade)} pts de penalidade por distância à doca de expedição (${pos.distanciaDoca} células)`);
  } else {
    const penalidade = pos.distanciaDoca * 0.2;
    score -= penalidade;
  }

  // Penaliza distância ao rebeneficiamento, se o lote ainda será processado
  if (opcoes.precisaRebeneficio) {
    const penalidade = pos.distanciaRebeneficio * 0.6;
    score -= penalidade;
    motivos.push(`${Math.round(penalidade)} pts de penalidade por distância ao rebeneficiamento (${pos.distanciaRebeneficio} células)`);
  }

  // Bônus por proximidade a big bags do mesmo lote (consolidação)
  if (opcoes.loteId) {
    const vizinhos = posicoes.filter(
      (p) =>
        p.galpaoId === pos.galpaoId &&
        Math.abs(p.linha - pos.linha) <= 1 &&
        p.loteId === opcoes.loteId
    );
    if (vizinhos.length > 0) {
      const bonus = Math.min(20, vizinhos.length * 8);
      score += bonus;
      motivos.push(`+${bonus} pts por consolidar com ${vizinhos.length} big bag(s) do mesmo lote nas proximidades`);
    }
  }

  // Penaliza corredores muito congestionados (dificulta manobra)
  const densidade = calcularDensidadeCorredor(posicoes, pos.linha, pos.galpaoId);
  if (densidade > 0.8) {
    score -= 15;
    motivos.push(`-15 pts por corredor congestionado (${Math.round(densidade * 100)}% ocupado)`);
  }

  return { score: Math.round(score), motivos };
}

/**
 * @param {Object} opcoes - { loteId, priorizarExpedicaoRapida: bool, precisaRebeneficio: bool }
 */
function recomendarPosicoes(posicoes, opcoes = {}, topN = 3) {
  const livres = posicoes.filter((p) => p.status === "livre");

  const pontuadas = livres.map((pos) => {
    const { score, motivos } = pontuarPosicao(pos, opcoes, posicoes);
    return { posicaoId: pos.id, galpaoId: pos.galpaoId, score, motivos };
  });

  pontuadas.sort((a, b) => b.score - a.score);

  return pontuadas.slice(0, topN).map((p, idx) => ({
    ...p,
    ranking: idx + 1,
    explicacao:
      p.motivos.length > 0
        ? `Posição ${p.posicaoId} — score ${p.score}: ${p.motivos.join("; ")}.`
        : `Posição ${p.posicaoId} — score ${p.score}: posição neutra, sem fatores de destaque.`,
  }));
}

module.exports = { recomendarPosicoes };
