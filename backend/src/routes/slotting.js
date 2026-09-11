const express = require('express');

module.exports = function (store) {
  const router = express.Router();

  // Rota de busca inicial de sugestões
  router.get('/', (req, res) => {
    res.json({
      sugestoes: [],
      ocupacao: []
    });
  });

  // POST /api/slotting/recomendar — usado pelo botão "Recomendar posições"
  router.post('/recomendar', (req, res) => {
    const { priorizarExpedicaoRapida, precisaRebeneficio } = req.body || {};
    res.json(store.recomendarPosicoes({ priorizarExpedicaoRapida, precisaRebeneficio }));
  });

  return router;
};
