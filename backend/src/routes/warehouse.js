const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Auxiliar para normalizar posições individuais
function formatarPosicao(p) {
  const statusLower = p.status ? p.status.toLowerCase() : 'livre';
  let statusFinal = statusLower;
  if (statusLower === 'disponivel') statusFinal = 'livre';
  if (statusLower === 'ocupado') statusFinal = 'ocupada';

  const codigo = p.codigo || p.id;
  const partes = codigo.split('-');
  const rua = partes[0] || 'A';
  const numero = partes[1] || '01';

  return {
    id: codigo,
    idReal: p.id,
    codigo: codigo,
    nome: codigo,
    status: statusFinal,
    galpaoId: p.galpaoId || 'g1',
    loteId: p.loteId || null,
    rua: rua,
    numero: numero,
    coluna: parseInt(numero, 10) || 1
  };
}

// GET /api/armazem (Agrupado completo)
router.get('/', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany().catch(() => []);
    const posicoes = await prisma.posicao.findMany().catch(() => []);

    const posicoesFormatadas = posicoes.map(formatarPosicao);

    res.json({
      galpoes: galpoes.length > 0 ? galpoes : [{ id: 'g1', nome: 'Galpão Principal A', codigo: 'G1' }],
      posicoes: posicoesFormatadas,
      grid: posicoesFormatadas
    });
  } catch (error) {
    console.error('❌ Erro ao buscar armazém:', error);
    res.json({ galpoes: [], posicoes: [], grid: [] });
  }
});

// GET /api/armazem/galpoes
router.get('/galpoes', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany().catch(() => []);
    if (galpoes.length === 0) {
      return res.json([{ id: 'g1', nome: 'Galpão Principal A', codigo: 'G1', capacidade: 500 }]);
    }
    res.json(galpoes);
  } catch (error) {
    res.json([{ id: 'g1', nome: 'Galpão Principal A', codigo: 'G1', capacidade: 500 }]);
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  try {
    const { galpaoId } = req.query;
    const where = galpaoId ? { galpaoId } : {};
    const posicoes = await prisma.posicao.findMany({ where }).catch(() => []);
    
    res.json(posicoes.map(formatarPosicao));
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
        OR: [{ id: id }, { codigo: id }]
      }
    });

    if (!posicao) return res.status(404).json({ erro: 'Posição não encontrada.' });
    res.json(formatarPosicao(posicao));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar detalhe da posição' });
  }
});

module.exports = router;
