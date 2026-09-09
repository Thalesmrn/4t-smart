/**
 * Motor de Roteirização Interna
 * Sugere a melhor sequência de movimentação de tarefas para uma empilhadeira,
 * minimizando deslocamento vazio (distância percorrida sem carga entre o fim
 * de uma tarefa e o início da próxima).
 *
 * Estratégia: heurística "vizinho mais próximo" (nearest neighbor) a partir
 * da posição atual da empilhadeira — simples, explicável e rápida o
 * suficiente para operação em tempo real. Também calculamos a rota
 * "não otimizada" (ordem de chegada/FIFO) para efeito de comparação.
 */

function coordDe(posicaoId, posicoes) {
  if (!posicaoId || posicaoId.startsWith("DOCA") || posicaoId.startsWith("AREA")) {
    // Pontos fixos fora do grid recebem coordenadas convencionais
    const fixos = {
      "DOCA-RECEBIMENTO": { x: 0, y: 0 },
      "DOCA-EXPEDICAO": { x: 30, y: 0 },
      "AREA-TRIAGEM": { x: 0, y: 2 },
      "AREA-LIGA-G2": { x: 22, y: 4 },
      "AREA-QUALIDADE": { x: 4, y: 10 },
    };
    return fixos[posicaoId] || { x: 0, y: 0 };
  }
  const pos = posicoes.find((p) => p.id === posicaoId);
  if (!pos) return { x: 0, y: 0 };
  const offsetX = pos.galpaoId === "G2" ? 20 : 0;
  return { x: pos.coluna + offsetX, y: pos.linha };
}

function distancia(a, b) {
  // distância Manhattan — mais realista para corredores de armazém que distância euclidiana
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Gera a sequência otimizada de tarefas para uma empilhadeira.
 * @param {Array} tarefas - tarefas candidatas (já filtradas/atribuídas à empilhadeira)
 * @param {Object} posicaoInicial - {x, y} posição atual da empilhadeira
 * @param {Array} posicoes - todas as posições do armazém (para lookup de coordenadas)
 */
function otimizarSequencia(tarefas, posicaoAtualId, posicoes) {
  const pendentes = [...tarefas];
  const sequenciaOtimizada = [];
  let atual = coordDe(posicaoAtualId, posicoes);
  let distanciaTotalOtimizada = 0;

  while (pendentes.length > 0) {
    // Para cada tarefa candidata, o "custo" é: deslocamento vazio até a origem + deslocamento carregado até o destino
    let melhorIdx = 0;
    let melhorCusto = Infinity;

    pendentes.forEach((t, idx) => {
      const origem = coordDe(t.origemId, posicoes);
      const destino = coordDe(t.destinoId, posicoes);
      const deslocamentoVazio = distancia(atual, origem);
      const deslocamentoCarregado = distancia(origem, destino);
      const custo = deslocamentoVazio + deslocamentoCarregado;
      if (custo < melhorCusto) {
        melhorCusto = custo;
        melhorIdx = idx;
      }
    });

    const escolhida = pendentes.splice(melhorIdx, 1)[0];
    const origem = coordDe(escolhida.origemId, posicoes);
    const destino = coordDe(escolhida.destinoId, posicoes);
    const deslocamentoVazio = distancia(atual, origem);
    const deslocamentoCarregado = distancia(origem, destino);

    sequenciaOtimizada.push({
      tarefaId: escolhida.id,
      descricao: escolhida.descricao,
      deslocamentoVazioM: deslocamentoVazio * 3, // 1 célula ≈ 3 metros
      deslocamentoCarregadoM: deslocamentoCarregado * 3,
    });

    distanciaTotalOtimizada += (deslocamentoVazio + deslocamentoCarregado) * 3;
    atual = destino;
  }

  // Rota não otimizada: ordem original (FIFO) de chegada das tarefas
  let atualFifo = coordDe(posicaoAtualId, posicoes);
  let distanciaTotalFifo = 0;
  tarefas.forEach((t) => {
    const origem = coordDe(t.origemId, posicoes);
    const destino = coordDe(t.destinoId, posicoes);
    distanciaTotalFifo += (distancia(atualFifo, origem) + distancia(origem, destino)) * 3;
    atualFifo = destino;
  });

  const economiaM = Math.max(0, distanciaTotalFifo - distanciaTotalOtimizada);
  const economiaPct = distanciaTotalFifo > 0 ? Math.round((economiaM / distanciaTotalFifo) * 100) : 0;

  return {
    sequenciaOtimizada,
    distanciaTotalOtimizadaM: Math.round(distanciaTotalOtimizada),
    distanciaTotalNaoOtimizadaM: Math.round(distanciaTotalFifo),
    economiaEstimadaM: Math.round(economiaM),
    economiaEstimadaPct: economiaPct,
    explicacao:
      economiaPct > 0
        ? `A sequência otimizada reduz em aproximadamente ${economiaPct}% (${Math.round(
            economiaM
          )} m) o deslocamento total, priorizando tarefas cuja origem está mais próxima da posição atual da empilhadeira, evitando trajetos vazios cruzados entre galpões.`
        : `A ordem de chegada (FIFO) já é próxima do ideal para este conjunto de tarefas.`,
  };
}

module.exports = { otimizarSequencia, coordDe, distancia };
