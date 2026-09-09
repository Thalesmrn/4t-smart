/**
 * 4T Smart Warehouse — Banco Limpo / Vazio para Producaoo (Supabase)
 */

function criarBancoMock() {
  return {
    galpoes: [],
    posicoes: [],
    lotes: [],
    bigBags: [],
    empilhadeiras: [],
    caminhoes: [],
    tarefas: [],
    metricasTurno: {
      inicioTurno: new Date().toISOString(),
      tarefasConcluidas: 0,
      distanciaTotalPercorridaM: 0,
      tempoMedioPorMovimentacaoMin: 0,
      indiceMovimentacaoIndiretaPct: 0,
    },
  };
}

module.exports = { criarBancoMock };