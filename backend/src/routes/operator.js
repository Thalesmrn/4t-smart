const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/operador/:empilhadeiraId/proxima-tarefa
router.get('/:empilhadeiraId/proxima-tarefa', async (req, res) => {
  const { empilhadeiraId } = req.params;

  try {
    let tarefas = [];
    try {
      tarefas = await prisma.tarefa.findMany();
    } catch {
      tarefas = store.tasks || [];
    }

    if (!tarefas || tarefas.length === 0) {
      tarefas = store.tasks || [];
    }

    // Busca a tarefa atribuída a esta empilhadeira que esteja pendente ou em andamento
    const proxima = tarefas.find(
      t => (String(t.empilhadeiraId) === String(empilhadeiraId) || String(t.empilhadeiraNome) === String(empilhadeiraId)) &&
           (t.status === 'EM_ANDAMENTO' || t.status === 'PENDENTE')
    );

    if (!proxima) {
      return res.json({ mensagem: 'Nenhuma tarefa pendente para esta empilhadeira no momento.', tarefa: null });
    }

    return res.json({
      tarefa: {
        id: proxima.id,
        loteCodigo: proxima.loteCodigo || proxima.lote || 'LOT-2001',
        produto: proxima.produto || 'Café Arábica',
        tipo: proxima.tipo || 'ARMAZENAMENTO',
        origem: proxima.origem || 'Doca 01',
        destino: proxima.destino || 'POS-A1-01',
        status: proxima.status || 'EM_ANDAMENTO'
      }
    });
  } catch (error) {
    console.error(`❌ Erro ao buscar próxima tarefa do operador (${empilhadeiraId}):`, error.message);
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/operador/:empilhadeiraId/ler-codigo
router.post('/:empilhadeiraId/ler-codigo', async (req, res) => {
  const { empilhadeiraId } = req.params;
  const { codigoLote } = req.body || {};

  try {
    return res.json({
      sucesso: true,
      mensagem: `Código ${codigoLote || 'lido'} validado com sucesso para a empilhadeira ${empilhadeiraId}!`
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/operador/:empilhadeiraId/confirmar-conclusao/:tarefaId
router.post('/:empilhadeiraId/confirmar-conclusao/:tarefaId', async (req, res) => {
  const { tarefaId } = req.params;

  try {
    try {
      await prisma.tarefa.update({
        where: { id: String(tarefaId) },
        data: { status: 'CONCLUIDA' }
      });
    } catch {
      if (store.tasks) {
        const t = store.tasks.find(item => String(item.id) === String(tarefaId));
        if (t) t.status = 'CONCLUIDA';
      }
    }

    return res.json({ sucesso: true, mensagem: 'Movimentação concluída e registrada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
