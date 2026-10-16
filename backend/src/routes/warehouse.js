const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/armazem
router.get('/', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany();
    const posicoes = await prisma.posicao.findMany();
    res.json({ galpoes, posicoes });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do armazém:', error);
    res.status(500).json({ erro: 'Erro ao buscar armazém' });
  }
});

// GET /api/armazem/galpoes
router.get('/galpoes', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany();
    res.json(galpoes);
  } catch (error) {
    console.error('❌ Erro ao buscar galpões:', error);
    res.status(500).json({ erro: 'Erro ao buscar galpões' });
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  try {
    const { galpaoId } = req.query;
    const where = galpaoId ? { galpaoId } : {};
    const posicoes = await prisma.posicao.findMany({ where });
    res.json(posicoes);
  } catch (error) {
    console.error('❌ Erro ao buscar posições:', error);
    res.status(500).json({ erro: 'Erro ao buscar posições' });
  }
});

// GET /api/armazem/posicoes/:id
router.get('/posicoes/:id', async (req, res) => {
  try {
    const posicao = await prisma.posicao.findUnique({
      where: { id: req.params.id }
    });
    if (!posicao) {
      return res.status(404).json({ erro: 'Posição não encontrada.' });
    }
    res.json(posicao);
  } catch (error) {
    console.error('❌ Erro ao buscar detalhe da posição:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// POST /api/armazem/posicoes/:id/liberar - PERSISTENTE NO BANCO DE DADOS
router.post('/posicoes/:id/liberar', async (req, res) => {
  try {
    const { id } = req.params;

    const posicaoExistente = await prisma.posicao.findUnique({ where: { id } });
    if (!posicaoExistente) {
      return res.status(404).json({ erro: 'Posição não encontrada.' });
    }

    const posicaoAtualizada = await prisma.posicao.update({
      where: { id },
      data: {
        status: 'DISPONIVEL',
        loteId: null
      }
    });

    console.log(`✅ Posição ${id} liberada com sucesso no PostgreSQL.`);
    res.json(posicaoAtualizada);
  } catch (error) {
    console.error('❌ Erro ao liberar posição no banco de dados:', error);
    res.status(500).json({ erro: 'Não foi possível liberar a posição no banco.' });
  }
});

module.exports = router;
