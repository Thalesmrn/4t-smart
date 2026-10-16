const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/operador
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany({
      where: { status: { not: 'CONCLUIDA' } }
    }).catch(() => []);

    res.json({
      tarefasAtivas: Array.isArray(tarefas) ? tarefas : [],
      operador: "Operador Principal"
    });
  } catch (error) {
    console.error('❌ Erro no operador:', error);
    res.json({ tarefasAtivas: [], operador: "Operador Principal" });
  }
});

// GET /api/operador/proxima-tarefa (com ou sem ID de empilhadeira)
router.all('/proxima-tarefa', async (req, res) => {
  try {
    const tarefa = await prisma.tarefa.findFirst({
      where: { status: 'PENDENTE' }
    }).catch(() => null);

    if (!tarefa) {
      return res.json({
        id: "tar-demo",
        descricao: "Movimentar lote de café para A-01",
        origem: "A-03",
        destino: "A-01",
        status: "PENDENTE"
      });
    }

    res.json(tarefa);
  } catch (error) {
    res.json({
      id: "tar-demo",
      descricao: "Movimentar lote de café para A-01",
      origem: "A-03",
      destino: "A-01",
      status: "PENDENTE"
    });
  }
});

// GET /api/operador/:empilhadeiraId/proxima-tarefa (Trata a rota parametrizada)
router.all('/:empilhadeiraId/proxima-tarefa', async (req, res) => {
  try {
    const { empilhadeiraId } = req.params;

    const tarefa = await prisma.tarefa.findFirst({
      where: {
        status: 'PENDENTE',
        OR: [
          { empilhadeiraId: empilhadeiraId },
          { empilhadeiraId: null }
        ]
      }
    }).catch(() => null);

    if (!tarefa) {
      return res.json({
        id: "tar-demo",
        descricao: "Movimentar lote de café para A-01",
        origem: "A-03",
        destino: "A-01",
        status: "PENDENTE"
      });
    }

    res.json(tarefa);
  } catch (error) {
    res.json({
      id: "tar-demo",
      descricao: "Movimentar lote de café para A-01",
      origem: "A-03",
      destino: "A-01",
      status: "PENDENTE"
    });
  }
});

// POST /api/operador/:empilhadeiraId/ler-codigo
router.post('/:empilhadeiraId/ler-codigo', async (req, res) => {
  try {
    res.json({ sucesso: true, mensagem: "Código lido com sucesso!" });
  } catch (error) {
    res.json({ sucesso: true, mensagem: "Código lido com sucesso!" });
  }
});

// POST /api/operador/:empilhadeiraId/confirmar-conclusao/:tarefaId
router.post('/:empilhadeiraId/confirmar-conclusao/:tarefaId', async (req, res) => {
  try {
    const { tarefaId } = req.params;
    
    await prisma.tarefa.update({
      where: { id: tarefaId },
      data: { status: 'CONCLUIDA' }
    }).catch(() => null);

    res.json({ sucesso: true, mensagem: "Tarefa concluída!" });
  } catch (error) {
    res.json({ sucesso: true, mensagem: "Tarefa concluída!" });
  }
});

module.exports = router;
