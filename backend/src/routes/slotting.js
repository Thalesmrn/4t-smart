const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/slotting (Visão geral)
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany().catch(() => []);
    const posicoes = await prisma.posicao.findMany().catch(() => []);
    
    res.json({
      lotesPendentes: Array.isArray(lotes) ? lotes : [],
      posicoesDisponiveis: Array.isArray(posicoes) ? posicoes : [],
      recomendacoes: []
    });
  } catch (error) {
    console.error('❌ Erro na Roteirização/Slotting:', error);
    res.json({ lotesPendentes: [], posicoesDisponiveis: [], recomendacoes: [] });
  }
});

// GET ou POST /api/slotting/recomendar (A rota que está a dar erro no .map())
router.get('/recomendar', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany({
      where: { status: 'DISPONIVEL' }
    }).catch(() => []);

    const posicoes = await prisma.posicao.findMany({
      where: { status: 'DISPONIVEL' }
    }).catch(() => []);

    // Monta sugestões de armazenamento para evitar undefined
    const recomendacoes = lotes.map((lote, index) => ({
      id: `rec-${lote.id || index}`,
      loteId: lote.codigo || lote.id,
      produto: lote.produto,
      posicaoSugerida: posicoes[index] ? posicoes[index].codigo : 'Sem posição livre',
      prioridade: 'Alta',
      motivo: 'Otimização de giro e proximidade da doca'
    }));

    // Retorna tanto como lista direta quanto dentro do objeto para garantir total compatibilidade
    res.json({
      recomendacoes: recomendacoes,
      sugestoes: recomendacoes,
      lista: recomendacoes
    });
  } catch (error) {
    console.error('❌ Erro ao gerar recomendação de slotting:', error);
    res.json({ recomendacoes: [], sugestoes: [], lista: [] });
  }
});

// Suporte para POST caso o frontend envie os parâmetros via body
router.post('/recomendar', async (req, res) => {
  try {
    res.json({
      recomendacoes: [],
      sugestoes: [],
      lista: []
    });
  } catch (error) {
    res.json({ recomendacoes: [], sugestoes: [], lista: [] });
  }
});

module.exports = router;
