const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({
      rotas: [],
      sugestoesSlotting: [],
      metricas: {
        economiaDistanciaPct: 0,
        movimentacoesReduzidas: 0
      }
    });
  });

  return router;
};
