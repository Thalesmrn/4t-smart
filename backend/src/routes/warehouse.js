const express = require('express');

module.exports = function(db) {
  const router = express.Router();
  const agora = new Date().toISOString();

  router.get('/', (req, res) => {
    res.json({
      galpoes: [
        {
          id: "G1",
          nome: "Galpão Principal",
          larguraM: 50,
          comprimentoM: 100,
          ruas: [],
          posicoes: [
            {
              id: "POS-01",
              codigo: "A-01",
              status: "LIVRE",
              capacidadeKg: 1000,
              ocupacaoPct: 0,
              atualizadoEm: agora,
              criadoEm: agora
            }
          ]
        }
      ],
      posicoes: [
        {
          id: "POS-01",
          codigo: "A-01",
          status: "LIVRE",
          capacidadeKg: 1000,
          ocupacaoPct: 0,
          atualizadoEm: agora,
          criadoEm: agora
        }
      ]
    });
  });

  return router;
};
