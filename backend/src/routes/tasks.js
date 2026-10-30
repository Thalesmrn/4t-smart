const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// Formatação padronizada para as tarefas de movimentação
function formatarTarefa(t) {
  return {
    id: t.id,
    loteId: t.loteId || 'LOT-2001',
    loteCodigo: t.loteCodigo || t.lote || 'LOT-2001',
    produto: t.produto || 'Café Arábica Especial',
    tipo: t.tipo || 'ARMAZENAMENTO', // ARMAZENAMENTO, REBENEFICIO, EXPEDICAO
    origem: t.origem || 'Doca 01 (Recebimento)',
    destino: t.destino || 'POS-A1-01',
    empilhadeiraId: t.empilhadeiraId || null,
    empilhadeiraNome: t.empilhadeiraNome || (t.empilhadeiraId ? `EMP-${t.empilhadeiraId.slice(-2)}` : 'Não atribuída'),
    status: t.status || 'PENDENTE', // PENDENTE, EM_ANDAMENTO, CONCLUIDA
    criadoEm: t.criadoEm || new Date().toISOString()
  };
}

// GET /api/tarefas — Listar todas as ordens
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
        {
          id: 'TAR-101',
          loteCodigo: 'LOT-2001',
          produto: 'Café Arábica Bebida Mole',
          tipo: 'ARMAZENAMENTO',
          origem: 'Doca 01 (Recebimento)',
          destino: 'POS-A1-01',
          empilhadeiraId: 'EMP-01',
          empilhadeiraNome: 'EMP-01',
          status: 'EM_ANDAMENTO'
        },
        {
          id: 'TAR-102',
          loteCodigo: 'LOT-2002',
          produto: 'Café Conilon Gourmet',
          tipo: 'REBENEFICIO',
          origem: 'POS-A1-04',
          destino: 'POS-A2-02',
          empilhadeiraId: null,
          empilhadeiraNome: 'Não atribuída',
          status: 'PENDENTE'
        },
        {
          id: 'TAR-103',
          loteCodigo: 'LOT-1002',
          produto: 'Café Arábica Tipo 2',
          tipo: 'EXPEDICAO',
          origem: 'POS-A3-01',
          destino: 'Doca 02 (Expedição)',
          empilhadeiraId: 'EMP-02',
          empilhadeiraNome: 'EMP-02',
          status: 'CONCLUIDA'
        }
      ];
      store.tasks = tarefas;
    }

    return res.json(tarefas.map(formatarTarefa));
  } catch (error) {
    console.error('❌ Erro no GET /api/tarefas:', error.message);
    return res.json((store.tasks || []).map(formatarTarefa));
  }
});

// POST /api/tarefas — Criar Nova Ordem de Movimentação para um Lote
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.loteCodigo) {
      return res.status(400).json({ erro: 'Selecione um lote de café para criar a ordem.' });
    }

    const novaTarefa = {
      id: `TAR-${Math.floor(100 + Math.random() * 900)}`,
      loteId: body.loteId || body.loteCodigo,
      loteCodigo: body.loteCodigo,
      produto: body.produto || 'Café Arábica',
      tipo: body.tipo || 'ARMAZENAMENTO',
      origem: body.origem || 'Doca 01',
      destino: body.destino || 'POS-A1-01',
      empilhadeiraId: body.empilhadeiraId || null,
      empilhadeiraNome: body.empilhadeiraNome || 'Não atribuída',
      status: body.empilhadeiraId ? 'EM_ANDAMENTO' : 'PENDENTE',
      criadoEm: new Date().toISOString()
    };

    try {
      await prisma.tarefa.create({ data: novaTarefa });
    } catch {
      if (!store.tasks) store.tasks = [];
      store.tasks.unshift(novaTarefa);
    }

    return res.status(201).json(formatarTarefa(novaTarefa));
  } catch (error) {
    console.error('❌ Erro no POST /api/tarefas:', error.message);
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/tarefas/:id/atribuir — Atribuir Empilhadeira
router.post('/:id/atribuir', async (req, res) => {
  const { id } = req.params;
  const { empilhadeiraId, empilhadeiraNome } = req.body || {};

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
          t.empilhadeiraNome = empilhadeiraNome || empilhadeiraId;
          t.status = 'EM_ANDAMENTO';
        }
      }
    }
    return res.json({ mensagem: 'Empilhadeira atribuída com sucesso!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/tarefas/:id/concluir — Concluir Tarefa
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

// DELETE /api/tarefas/:id — Cancelar / Excluir Ordem
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.tarefa.delete({ where: { id: String(id) } });
    } catch {
      if (store.tasks) {
        store.tasks = store.tasks.filter(t => t.id !== id);
      }
    }
    return res.json({ mensagem: 'Ordem de movimentação cancelada!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
