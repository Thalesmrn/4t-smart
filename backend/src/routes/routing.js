const express = require('express');

module.exports = function(db) {
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

  // Endpoint POST para o botão "Calcular sequência ótima"
  router.post('/calcular', (req, res) => {
    const { empilhadeiraId } = req.body || {};

    res.json({
      empilhadeiraId: empilhadeiraId || "EMP-01",
      sequencia: [
        { ordem: 1, tarefaId: "TAR-01", origem: "A-01", destino: "B-02" },
        { ordem: 2, tarefaId: "TAR-02", origem: "B-02", destino: "C-05" }
      ],
      distanciaEstimadaMeters: 120,
      tempoEstimadoMinutos: 4.5
    });
  });

  return router;
};
