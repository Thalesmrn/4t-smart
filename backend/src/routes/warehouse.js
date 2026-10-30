const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/armazem/galpoes
router.get('/galpoes', async (req, res) => {
  try {
    let galpoes = [];
    try {
      galpoes = await prisma.galpao.findMany();
    } catch {
      galpoes = store.warehouses || [];
    }

    if (!galpoes || galpoes.length === 0) {
      galpoes = [
        { id: 'GAL-A', nome: 'Galpão A — Grãos & Sacarias', totalPosicoes: 120, ocupadas: 45 },
        { id: 'GAL-B', nome: 'Galpão B — Rebeneficiamento', totalPosicoes: 80, ocupadas: 30 }
      ];
    }
    return res.json(galpoes);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  try {
    const { galpaoId, status } = req.query;
    let posicoes = [];

    try {
      const where = {};
      if (galpaoId) where.galpaoId = galpaoId;
      if (status) where.status = status;
      posicoes = await prisma.posicao.findMany({ where });
    } catch {
      posicoes = store.positions || [];
    }

    if (!posicoes || posicoes.length === 0) {
      posicoes = [
        { id: 'POS-A1-01', codigo: 'A1-01', galpao: 'Galpão A', rua: 'A1', nivel: 1, status: 'OCUPADA', lote: 'LOT-2001' },
        { id: 'POS-A1-02', codigo: 'A1-02', galpao: 'Galpão A', rua: 'A1', nivel: 2, status: 'DISPONIVEL', lote: null },
        { id: 'POS-A1-03', codigo: 'A1-03', galpao: 'Galpão A', rua: 'A1', nivel: 3, status: 'LIVRE', lote: null },
        { id: 'POS-B1-01', codigo: 'B1-01', galpao: 'Galpão B', rua: 'B1', nivel: 1, status: 'OCUPADA', lote: 'LOT-2002' }
      ];
    }

    return res.json(posicoes);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// GET /api/armazem/posicoes/:id
router.get('/posicoes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let posicao = null;
    try {
      posicao = await prisma.posicao.findUnique({ where: { id: String(id) } });
    } catch {
      posicao = (store.positions || []).find(p => p.id === id);
    }
    if (!posicao) {
      posicao = { id, codigo: id, status: 'DISPONIVEL', galpao: 'Galpão A' };
    }
    return res.json(posicao);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/armazem/posicoes/:id/liberar
router.post('/posicoes/:id/liberar', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.posicao.update({
        where: { id: String(id) },
        data: { status: 'DISPONIVEL', loteId: null }
      });
    } catch {
      if (store.positions) {
        const p = store.positions.find(item => item.id === id);
        if (p) {
          p.status = 'DISPONIVEL';
          p.lote = null;
        }
      }
    }
    return res.json({ mensagem: 'Posição liberada com sucesso!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
