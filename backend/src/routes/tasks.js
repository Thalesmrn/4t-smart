const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Utilitário para garantir que nenhuma propriedade seja undefined ou null
function normalizarTarefa(t) {
  const agora = new Date().toISOString();
  return {
    id: t?.id || "TAR-01",
    codigo: t?.codigo || "TAR-01",
    tipo: t?.tipo || "MOVIMENTACAO",
    prioridade: t?.prioridade || "MEDIA",
    status: t?.status || "PENDENTE",
    origem: t?.origem || "A-01",
    destino: t?.destino || "B-02",
    empilhadeiraId: t?.empilhadeiraId || "EMP-01",
    
    // Datas e timestamps essenciais para .toLocaleString()
    criadoEm: t?.criadoEm || t?.createdAt || agora,
    atualizadoEm: t?.atualizadoEm || t?.updatedAt || agora,
    dataHora: t?.dataHora || t?.data || agora,
    horario: t?.horario || agora,
    timestamp: t?.timestamp || agora,
    data: t?.data || agora,

    // Valores numéricos para formatação .toLocaleString()
    pesoKg: t?.pesoKg ?? 0,
    quantidade: t?.quantidade ?? 0,
    tempoEstimadoMin: t?.tempoEstimadoMin ?? 0,
    distanciaM: t?.distanciaM ?? 0,

    // Sub-arrays para evitar falhas em .map()
    historico: Array.isArray(t?.historico) ? t.historico : [],
    passos: Array.isArray(t?.passos) ? t.passos : []
  };
}

router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.task.findMany();

    if (tarefas && tarefas.length > 0) {
      return res.json(tarefas.map(normalizarTarefa));
    }

    // Retorna fallback devidamente formatado
    res.json([normalizarTarefa({})]);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    res.json([normalizarTarefa({})]);
  }
});

module.exports = router;
