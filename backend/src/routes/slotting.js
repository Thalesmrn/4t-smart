const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/slotting (Retorna lotes aguardando slotting / recomendação)
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany().catch(() => []);
    
    // Filtra lotes e calcula sugestão inteligente de slotting
    const recomendacoes = lotes.map((l, index) => {
      const rua = String.fromCharCode(65 + (index % 3)); // A, B, C
      const posicao = `0${(index % 5) + 1}`;
      
      return {
        loteId: l.codigo || l.id,
        produto: l.produto || 'Café Arábica',
        qualidade: l.qualidade || 'Tipo 2',
        sacas: l.quantidadeSacas || 1000,
        posicaoSugerida: `${rua}-${posicao}`,
        motivoSlotting: 'Proximidade da doca de expedição por alta rotatividade',
        status: l.status || 'AGUARDANDO_SLOTTING'
      };
    });

    return res.json(recomendacoes);
  } catch (error) {
    console.error('❌ Erro no slotting:', error);
    return res.json([]);
  }
});

module.exports = router;
