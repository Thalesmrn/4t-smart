const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Funcao de formatacao para compatibilidade com a grelha/mapa do frontend
function formatarPosicaoParaMapa(p) {
  const statusNormalizado = p.status ? p.status.toLowerCase() : 'livre';
  const statusFinal = statusNormalizado === 'disponivel' ? 'livre' : statusNormalizado;

  return {
    id: p.codigo || p.id,
    idReal: p.id,
    codigo: p.codigo || p.id,
    nome: p.codigo || p.id,
    status: statusFinal,
    galpaoId: p.galpaoId || 'g1',
    loteId: p.loteId || null,
    rua: p.codigo ? p.codigo.split('-')[0] : 'A',
    numero: p.codigo ? p.codigo.split('-')[1] : '01'
  };
}

// GET /api/armazem (Retorna galpões e posições agrupados)
router.get('/', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany().catch(() => []);
    const posicoes = await prisma.posicao.findMany().catch(() => []);
    res.json({
      galpoes,
      posicoes: posicoes.map(formatarPosicaoParaMapa)
    });
  } catch (error) {
    console.error('❌ Erro ao buscar armazém:', error);
    res.json({ galpoes: [], posicoes: [] });
  }
});

// GET /api/armazem/galpoes (Rota que causou o erro 404)
router.get('/galpoes', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany().catch(() => []);
    
    // Se a base de dados ainda nao tiver galpoes, devolve um padrão para nao quebrar a UI
    if (galpoes.length === 0) {
      return res.json([
        { id: 'g1', nome: 'Galpão Principal A', codigo: 'G1', capacidade: 500 }
      ]);
    }

    res.json(galpoes);
  } catch (error) {
    console.error('❌ Erro ao buscar galpões:', error);
    res.json([
      { id: 'g1', nome: 'Galpão Principal A', codigo: 'G1', capacidade: 500 }
    ]);
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  try {
    const { galpaoId } = req.query;
    const where = galpaoId ? { galpaoId } : {};
    const posicoes = await prisma.posicao.findMany({ where }).catch(() => []);
    
    res.json(posicoes.map(formatarPosicaoParaMapa));
  } catch (error) {
    console.error('❌ Erro ao buscar posições:', error);
    res.json([]);
  }
});

// GET /api/armazem/posicoes/:id
router.get('/posicoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const posicao = await prisma.posicao.findFirst({
      where: {
        OR: [
          { id: id },
          { codigo: id }
        ]
      }
    });

    if (!posicao) return res.status(404).json({ erro: 'Posição não encontrada.' });
    res.json(formatarPosicaoParaMapa(posicao));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar detalhe da posição' });
  }
});

// POST /api/armazem/posicoes/:id/liberar
router.post('/posicoes/:id/liberar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const posicao = await prisma.posicao.findFirst({
      where: {
        OR: [
          { id: id },
          { codigo: id }
        ]
      }
    });

    if (!posicao) return res.status(404).json({ erro: 'Posição não encontrada.' });

    const posicaoAtualizada = await prisma.posicao.update({
      where: { id: posicao.id },
      data: {
        status: 'DISPONIVEL',
        loteId: null
      }
    });

    res.json(formatarPosicaoParaMapa(posicaoAtualizada));
  } catch (error) {
    console.error('❌ Erro ao liberar posição:', error);
    res.status(500).json({ erro: 'Não foi possível liberar a posição.' });
  }
});

module.exports = router;
