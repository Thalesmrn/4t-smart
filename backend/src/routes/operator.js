const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarTarefa(t) {
  const agora = new Date().toISOString();
  return {
    id: t?.id || "TAR-01",
    codigo: t?.codigo || t?.id || "TAR-01",
    tipo: t?.tipo || "MOVIMENTACAO",
    prioridade: t?.prioridade ? String(t.prioridade) : "1",
    status: t?.status || "PENDENTE",
    descricao: t?.descricao || "Movimentação de carga de café",
    origem: t?.origem || "A-01",
    destino: t?.destino || "B-02",
    empilhadeiraId: t?.empilhadeiraId || "EMP-01",
    criadoEm: t?.createdAt || agora,
    atualizadoEm: t?.updatedAt || agora,
    historico: [],
    passos: []
  };
}

// GET /api/operador
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany();
    const tarefasArray = Array.isArray(tarefas) ? tarefas : [];

    const tarefaAtual = tarefasArray.find(t => t.status === "EM_ANDAMENTO") || tarefasArray[0] || null;
    const proximasTarefas = tarefasArray.filter(t => t.id !== tarefaAtual?.id);

    res.json({
      operador: { id: "OP-01", nome: "Operador Principal" },
      tarefaAtual: tarefaAtual ? normalizarTarefa(tarefaAtual) : null,
      proximasTarefas: proximasTarefas.map(normalizarTarefa),
      tarefas: tarefasArray.map(normalizarTarefa)
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do operador:', error);
    res.status(500).json({ erro: "Erro ao buscar tarefas do operador." });
  }
});

// GET /api/operador/:empilhadeiraId/proxima-tarefa
router.get('/:empilhadeiraId/proxima-tarefa', async (req, res) => {
  try {
    const proxima = await prisma.tarefa.findFirst({
      where: {
        empilhadeiraId: req.params.empilhadeiraId,
        status: "PENDENTE"
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(proxima ? normalizarTarefa(proxima) : null);
  } catch (error) {
    console.error('❌ Erro ao buscar próxima tarefa:', error);
    res.status(500).json({ erro: "Erro ao buscar próxima tarefa." });
  }
});

// POST /api/operador/:empilhadeiraId/confirmar-conclusao/:tarefaId
router.post('/:empilhadeiraId/confirmar-conclusao/:tarefaId', async (req, res) => {
  try {
    const { tarefaId } = req.params;

    const tarefaConcluida = await prisma.tarefa.update({
      where: { id: tarefaId },
      data: { status: "CONCLUIDA" }
    });

    res.json({
      sucesso: true,
      mensagem: "Tarefa concluída com sucesso!",
      tarefa: normalizarTarefa(tarefaConcluida)
    });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    res.status(500).json({ erro: "Erro ao concluir tarefa no banco de dados." });
  }
});

router.post('/concluir', async (req, res) => {
  try {
    const { tarefaId } = req.body;
    if (tarefaId) {
      await prisma.tarefa.update({
        where: { id: tarefaId },
        data: { status: "CONCLUIDA" }
      });
    }
    res.json({ status: "CONCLUIDA", mensagem: "Tarefa atualizada com sucesso!" });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    res.status(500).json({ erro: "Erro ao concluir tarefa." });
  }
});

module.exports = router;
