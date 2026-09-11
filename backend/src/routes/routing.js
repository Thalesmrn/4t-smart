const express = require('express');

module.exports = function (store) {
  const router = express.Router();

  // GET Inicial
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

  // GET /api/roteirizacao/sequencia/:empilhadeiraId — usado pelo botão "Calcular sequência ótima"
  router.get('/sequencia/:empilhadeiraId', (req, res) => {
    res.json(store.gerarSequenciaOtimizada(req.params.empilhadeiraId));
  });

  return router;
};
