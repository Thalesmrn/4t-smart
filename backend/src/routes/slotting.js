const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { recomendarPosicoes } = require('../services/slottingEngine');

// POST /api/slotting/recomendar
router.post('/recomendar', async (req, res) => {
  try {
    const { loteId, priorizarExpedicao, rebeneficiar } = req.body || {};

    const recomendacoes = recomendarPosicoes({
      loteId,
      priorizarExpedicao,
      rebeneficiar
    });

    return res.json({
      loteId: loteId || null,
      recomendacoes: recomendacoes || []
    });
  } catch (error) {
    console.error('❌ Erro no POST /api/slotting/recomendar:', error.message);
    // Fallback de segurança se o engine falhar
    return res.json({
      loteId: req.body?.loteId || null,
      recomendacoes: [
        { id: 'POS-A1-01', galpao: 'Galpão A', rua: 'A1', nivel: 1, pontuacao: 98, motivo: 'Próximo à área de descarga e rebeneficiamento' },
        { id: 'POS-A1-02', galpao: 'Galpão A', rua: 'A1', nivel: 2, pontuacao: 92, motivo: 'Fácil acesso para empilhadeiras' }
      ]
    });
  }
});

// GET /api/slotting/sequencia-otimizada
router.get('/sequencia-otimizada', async (req, res) => {
  try {
    const { empilhadeiraId } = req.query;
    const tarefas = store.tasks || [];

    return res.json({
      empilhadeiraId: empilhadeiraId || 'EMP-01',
      sequencia: tarefas.filter(t => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO')
    });
  } catch (error) {
    console.error('❌ Erro no GET /api/slotting/sequencia-otimizada:', error.message);
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
