const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/armazem/galpoes
router.get('/galpoes', async (req, res) => {
  try {
    let galpoes = await prisma.galpao.findMany({
      include: { posicoes: true }
    }).catch(() => []);

    if (!galpoes || galpoes.length === 0) {
      galpoes = store.warehouses || [];
    }

    return res.json(galpoes);
  } catch (error) {
    console.error('❌ Erro GET /armazem/galpoes:', error);
    return res.json(store.warehouses || []);
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  const { galpaoId, status } = req.query;

  try {
    const where = {};
    if (galpaoId) where.galpaoId = galpaoId;
    if (status) where.status = status;

    let posicoes = await prisma.posicao.findMany({
      where,
      include: { lote: true }
    }).catch(() => []);

    if (!posicoes || posicoes.length === 0) {
      posicoes = store.positions || [];
      if (galpaoId) posicoes = posicoes.filter(p => p.galpaoId === galpaoId);
      if (status) posicoes = posicoes.filter(p => p.status === status);
    }

    return res.json(posicoes);
  } catch (error) {
    console.error('❌ Erro GET /armazem/posicoes:', error);
    return res.json(store.positions || []);
  }
});

// GET /api/armazem/posicoes/:id
router.get('/posicoes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let posicao = await prisma.posicao.findUnique({
      where: { id },
      include: { lote: true, galpao: true }
    }).catch(() => null);

    if (!posicao) {
      posicao = (store.positions || []).find(p => p.id === id);
    }

    if (!posicao) {
      return res.status(404).json({ erro: 'Posição não encontrada.' });
    }

    return res.json(posicao);
  } catch (error) {
    console.error(`❌ Erro GET /armazem/posicoes/${id}:`, error);
    return res.status(500).json({ erro: 'Erro ao buscar posição.' });
  }
});

// POST /api/armazem/posicoes/:id/liberar
router.post('/posicoes/:id/liberar', async (req, res) => {
  const { id } = req.params;

  try {
    let posicao = null;
    try {
      posicao = await prisma.posicao.update({
        where: { id },
        data: { status: 'LIVRE', loteId: null }
      });
    } catch {
      posicao = store.liberarPosicao(id);
    }

    return res.json({ mensagem: 'Posição liberada com sucesso!', posicao });
  } catch (error) {
    console.error(`❌ Erro POST /armazem/posicoes/${id}/liberar:`, error);
    return res.status(500).json({ erro: 'Erro ao liberar posição.' });
  }
});

module.exports = router;
