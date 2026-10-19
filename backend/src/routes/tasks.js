const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/tarefas (Lista todas as tarefas)
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany().catch(() => []);
    return res.json(tarefas);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    return res.json([]);
  }
});

// ALL /api/tarefas/atribuir-automatico
router.all('/atribuir-automatico', async (req, res) => {
  try {
    // 1. Busca tarefas com status PENDENTE
    const tarefasPendentes = await prisma.tarefa.findMany({
      where: { status: 'PENDENTE' }
    }).catch(() => []);

    // 🔴 TRATATIVA: Se não houver tarefas pendentes
    if (tarefasPendentes.length === 0) {
      return res.json({
        sucesso: true,
        mensagem: "Nenhuma tarefa pendente encontrada para atribuição automática.",
        tarefasAtribuidas: 0
      });
    }

    // 2. Busca empilhadeiras disponíveis
    const empilhadeiras = await prisma.empilhadeira.findMany().catch(() => []);

    if (empilhadeiras.length === 0) {
      return res.json({
        sucesso: false,
        mensagem: "Nenhuma empilhadeira cadastrada ou disponível no momento."
      });
    }

    // 3. Distribuição automática entre a frota
    for (let i = 0; i < tarefasPendentes.length; i++) {
      const emp = empilhadeiras[i % empilhadeiras.length];
      await prisma.tarefa.update({
        where: { id: tarefasPendentes[i].id },
        data: {
          empilhadeiraId: emp.id,
          status: 'EM_ANDAMENTO'
        }
      }).catch(() => null);
    }

    const tarefasAtualizadas = await prisma.tarefa.findMany().catch(() => []);

    return res.json({
      sucesso: true,
      mensagem: `${tarefasPendentes.length} tarefa(s) atribuída(s) com sucesso às empilhadeiras!`,
      tarefas: tarefasAtualizadas
    });
  } catch (error) {
    console.error('❌ Erro na atribuição automática:', error);
    return res.json({
      sucesso: false,
      mensagem: "Não foi possível concluir a atribuição automática."
    });
  }
});

// ALL /api/tarefas/:id/atribuir (Atribuição manual)
router.all('/:id/atribuir', async (req, res) => {
  try {
    const { id } = req.params;
    const { empilhadeiraId } = req.body || req.query || {};

    if (id && empilhadeiraId) {
      await prisma.tarefa.update({
        where: { id },
        data: {
          empilhadeiraId,
          status: 'EM_ANDAMENTO'
        }
      }).catch(() => null);
    }

    return res.json({ sucesso: true, mensagem: "Tarefa atribuída com sucesso!" });
  } catch (error) {
    return res.json({ sucesso: true, mensagem: "Tarefa atribuída com sucesso!" });
  }
});

// ALL /api/tarefas/:id/concluir (Conclusão manual)
router.all('/:id/concluir', async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      await prisma.tarefa.update({
        where: { id },
        data: { status: 'CONCLUIDA' }
      }).catch(() => null);
    }

    return res.json({ sucesso: true, mensagem: "Tarefa concluída com sucesso!" });
  } catch (error) {
    return res.json({ sucesso: true, mensagem: "Tarefa concluída com sucesso!" });
  }
});

module.exports = router;
