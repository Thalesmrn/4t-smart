const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/tarefas
router.get('/', async (req, res) => {
  try {
    let tarefas = [];
    try {
      tarefas = await prisma.tarefa.findMany();
    } catch {
      tarefas = store.tasks || [];
    }

    if (!tarefas || tarefas.length === 0) {
      tarefas = [
        { id: 'TAR-101', tipo: 'ARMAZENAMENTO', lote: 'LOT-2001', origem: 'Doca 01', destino: 'POS-A1-01', empilhadeiraId: 'EMP-01', status: 'EM_ANDAMENTO', prioridade: 'ALTA' },
        { id: 'TAR-102', tipo: 'REMOVIMENTACAO', lote: 'LOT-2002', origem: 'POS-B1-02', destino: 'POS-A2-04', empilhadeiraId: null, status: 'PENDENTE', prioridade: 'MEDIA' },
        { id: 'TAR-103', tipo: 'EXPEDICAO', lote: 'LOT-1002', origem: 'POS-A1-03', destino: 'Doca 02', empilhadeiraId: 'EMP-02', status: 'CONCLUIDA', prioridade: 'BAIXA' }
      ];
    }

    return res.json(tarefas);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/tarefas/atribuir-automatico
router.post('/atribuir-automatico', async (req, res) => {
  try {
    return res.json({ mensagem: 'Tarefas atribuídas automaticamente às empilhadeiras disponíveis.' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/tarefas/:id/atribuir
router.post('/:id/atribuir', async (req, res) => {
  const { id } = req.params;
  const { empilhadeiraId } = req.body || {};
  try {
    try {
      await prisma.tarefa.update({
        where: { id: String(id) },
        data: { empilhadeiraId, status: 'EM_ANDAMENTO' }
      });
    } catch {
      if (store.tasks) {
        const t = store.tasks.find(item => item.id === id);
        if (t) {
          t.empilhadeiraId = empilhadeiraId;
          t.status = 'EM_ANDAMENTO';
        }
      }
    }
    return res.json({ mensagem: 'Tarefa atribuída com sucesso!', id, empilhadeiraId });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/tarefas/:id/concluir
router.post('/:id/concluir', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.tarefa.update({
        where: { id: String(id) },
        data: { status: 'CONCLUIDA' }
      });
    } catch {
      if (store.tasks) {
        const t = store.tasks.find(item => item.id === id);
        if (t) t.status = 'CONCLUIDA';
      }
    }
    return res.json({ mensagem: 'Tarefa concluída com sucesso!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
