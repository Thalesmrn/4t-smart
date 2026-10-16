const express = require('express');
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

router.get('/sequencia/:empilhadeiraId', (req, res) => {
  res.json([]);
});

module.exports = router;
