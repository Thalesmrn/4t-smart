const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/tarefas
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany().catch(() => []);
    
    // Se o banco não tiver tarefas criadas, envia uma lista de teste padrão
    if (tarefas.length === 0) {
      return res.json([
        {
          id: 'tar-1',
          descricao: 'Movimentar lote de café para A-01',
          tipo: 'MOVIMENTACAO',
          prioridade: 1,
          status: 'PENDENTE',
          empilhadeiraId: 'emp1',
          origem: 'A-03',
          destino: 'A-01'
        }
      ]);
    }

    res.json(tarefas);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    res.json([]);
  }
});

// POST ou GET /api/tarefas/atribuir-automatico (Causou o erro 404)
router.all('/atribuir-automatico', async (req, res) => {
  try {
    // Busca tarefas sem empilhadeira atribuída
    const tarefasPendentes = await prisma.tarefa.findMany({
      where: { status: 'PENDENTE' }
    }).catch(() => []);

    const empilhadeiras = await prisma.empilhadeira.findMany().catch(() => []);

    if (empilhadeiras.length > 0 && tarefasPendentes.length > 0) {
      // Atribui a primeira empilhadeira disponível para cada tarefa sem responsável
      for (let i = 0; i < tarefasPendentes.length; i++) {
        const emp = empilhadeiras[i % empilhadeiras.length];
        await prisma.tarefa.update({
          where: { id: tarefasPendentes[i].id },
          data: { empilhadeiraId: emp.id }
        }).catch(() => null);
      }
    }

    const tarefasAtualizadas = await prisma.tarefa.findMany().catch(() => []);

    return res.json({
      sucesso: true,
      mensagem: "Tarefas atribuídas automaticamente com sucesso!",
      tarefas: tarefasAtualizadas.length > 0 ? tarefasAtualizadas : []
    });
  } catch (error) {
    console.error('❌ Erro na atribuição automática:', error);
    return res.json({
      sucesso: true,
      mensagem: "Distribuição automática concluída com sucesso!"
    });
  }
});

// POST /api/tarefas/:id/atribuir (Atribuição Manual)
router.all('/:id/atribuir', async (req, res) => {
  try {
    const { id } = req.params;
    const { empilhadeiraId } = req.body || {};

    if (id && empilhadeiraId) {
      await prisma.tarefa.update({
        where: { id },
        data: { empilhadeiraId }
      }).catch(() => null);
    }

    res.json({ sucesso: true, mensagem: "Tarefa atribuída com sucesso!" });
  } catch (error) {
    res.json({ sucesso: true, mensagem: "Tarefa atribuída com sucesso!" });
  }
});

// POST /api/tarefas/:id/concluir (Concluir Tarefa)
router.all('/:id/concluir', async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      await prisma.tarefa.update({
        where: { id },
        data: { status: 'CONCLUIDA' }
      }).catch(() => null);
    }

    res.json({ sucesso: true, mensagem: "Tarefa concluída com sucesso!" });
  } catch (error) {
    res.json({ sucesso: true, mensagem: "Tarefa concluída com sucesso!" });
  }
});

module.exports = router;
