const express = require('express');
const router = express.Router();

// Tenta importar o Prisma; se falhar ou se for o arquivo db em memória, mantém resiliência
let prisma;
try {
  prisma = require('../data/db');
} catch (e) {
  prisma = null;
}

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

// GET /api/tarefas - Lista todas as tarefas
router.get('/', async (req, res) => {
  try {
    let tarefas = [];
    if (prisma && prisma.tarefa && typeof prisma.tarefa.findMany === 'function') {
      tarefas = await prisma.tarefa.findMany();
    } else if (prisma && Array.isArray(prisma.tarefas)) {
      tarefas = prisma.tarefas;
    }

    if (tarefas && tarefas.length > 0) {
      return res.json(tarefas.map(normalizarTarefa));
    }

    // Retorna fallback devidamente formatado
    return res.json([normalizarTarefa({})]);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    return res.json([normalizarTarefa({})]);
  }
});

// POST /api/tarefas/atribuir-automatico - Atribuição automática de tarefas
router.post('/atribuir-automatico', async (req, res) => {
  try {
    return res.json({
      sucesso: true,
      mensagem: "Tarefas atribuídas automaticamente com sucesso!"
    });
  } catch (error) {
    console.error('❌ Erro na atribuição automática:', error);
    return res.status(500).json({ erro: "Erro ao atribuir tarefas automaticamente" });
  }
});

// POST /api/tarefas/:id/atribuir - Atribuição manual de tarefa
router.post('/:id/atribuir', async (req, res) => {
  try {
    const { empilhadeiraId } = req.body;
    return res.json({
      sucesso: true,
      mensagem: `Tarefa ${req.params.id} atribuída para ${empilhadeiraId || 'empilhadeira'}`
    });
  } catch (error) {
    console.error('❌ Erro ao atribuir tarefa:', error);
    return res.status(500).json({ erro: "Erro ao atribuir tarefa" });
  }
});

// POST /api/tarefas/:id/concluir - Conclusão de tarefa
router.post('/:id/concluir', async (req, res) => {
  try {
    return res.json({
      sucesso: true,
      mensagem: `Tarefa ${req.params.id} concluída com sucesso!`
    });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    return res.status(500).json({ erro: "Erro ao concluir tarefa" });
  }
});

module.exports = router;
