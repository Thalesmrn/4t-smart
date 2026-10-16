const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarTarefa(t) {
  const agora = new Date().toISOString();
  return {
    id: t?.id || "TAR-01",
    codigo: t?.codigo || t?.id || "TAR-01",
    tipo: t?.tipo || "MOVIMENTACAO",
    prioridade: t?.prioridade || "MEDIA",
    status: t?.status || "PENDENTE",
    origem: t?.origem || "A-01",
    destino: t?.destino || "B-02",
    empilhadeiraId: t?.empilhadeiraId || "EMP-01",
    criadoEm: t?.criadoEm || t?.createdAt || agora,
    atualizadoEm: t?.atualizadoEm || t?.updatedAt || agora,
    pesoKg: t?.pesoKg ?? 0,
    quantidade: t?.quantidade ?? 0,
    tempoEstimadoMin: t?.tempoEstimadoMin ?? 0,
    distanciaM: t?.distanciaM ?? 0,
    historico: Array.isArray(t?.historico) ? t.historico : [],
    passos: Array.isArray(t?.passos) ? t.passos : []
  };
}

// GET /api/tarefas
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany();
    return res.json(tarefas.map(normalizarTarefa));
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    return res.status(500).json({ erro: 'Erro ao buscar tarefas' });
  }
});

// POST /api/tarefas/:id/atribuir
router.post('/:id/atribuir', async (req, res) => {
  try {
    const { id } = req.params;
    const { empilhadeiraId } = req.body;

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id },
      data: {
        empilhadeiraId: empilhadeiraId,
        status: "EM_ANDAMENTO"
      }
    });

    return res.json({
      sucesso: true,
      mensagem: `Tarefa ${id} atribuída com sucesso.`,
      tarefa: normalizarTarefa(tarefaAtualizada)
    });
  } catch (error) {
    console.error('❌ Erro ao atribuir tarefa:', error);
    return res.status(500).json({ erro: "Erro ao atribuir tarefa" });
  }
});

// POST /api/tarefas/:id/concluir
router.post('/:id/concluir', async (req, res) => {
  try {
    const { id } = req.params;

    const tarefaConcluida = await prisma.tarefa.update({
      where: { id },
      data: { status: "CONCLUIDA" }
    });

    return res.json({
      sucesso: true,
      mensagem: `Tarefa ${id} concluída com sucesso!`,
      tarefa: normalizarTarefa(tarefaConcluida)
    });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    return res.status(500).json({ erro: "Erro ao concluir tarefa" });
  }
});

module.exports = router;
