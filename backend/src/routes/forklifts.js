const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/empilhadeiras
router.get('/', async (req, res) => {
  try {
    const empilhadeiras = await prisma.empilhadeira.findMany();
    return res.json(empilhadeiras);
  } catch (error) {
    const mem = store.forklifts || [];
    return res.json(mem);
  }
});

// POST /api/empilhadeiras
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = body.nome || body.modelo || 'EMP-00';
    const operador = body.operador || 'Operador Responsável';
    const cap = parseInt(body.capacidadeKg || body.capacidade || 2500, 10);

    let nova;
    try {
      nova = await prisma.empilhadeira.create({
        data: {
          nome,
          operador,
          capacidadeKg: cap,
          status: 'DISPONIVEL'
        }
      });
    } catch (e) {
      nova = {
        id: `emp-${Date.now()}`,
        nome,
        operador,
        capacidadeKg: cap,
        status: 'DISPONIVEL'
      };
      if (!store.forklifts) store.forklifts = [];
      store.forklifts.push(nova);
    }

    return res.status(201).json(nova);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// DELETE /api/empilhadeiras/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.empilhadeira.delete({
        where: { id: String(id) }
      });
    } catch (e) {
      if (store.forklifts) {
        store.forklifts = store.forklifts.filter(item => String(item.id) !== String(id));
      }
    }
    return res.json({ mensagem: 'Empilhadeira excluída com sucesso!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
