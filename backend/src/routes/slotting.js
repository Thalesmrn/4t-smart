const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Rota de busca inicial de sugestões
  router.get('/', (req, res) => {
    res.json({
      sugestoes: [],
      ocupacao: []
    });
  });

  // Endpoint POST chamado pelo botão "Recomendar posições"
  router.post('/recomendar', (req, res) => {
    const { loteId, priorizarExpedicao, rebeneficiamento } = req.body || {};

    res.json({
      posicoesRecomendadas: [
        {
          posicaoId: "POS-A-01",
          codigo: "A-01-N1",
          galpao: "Galpão Principal",
          score: 98,
          motivo: "Próximo à moega de entrada / área de rebeneficiamento"
        },
        {
          posicaoId: "POS-A-02",
          codigo: "A-02-N1",
          galpao: "Galpão Principal",
          score: 92,
          motivo: "Facilidade de acesso para empilhadeiras"
        }
      ],
      mensagem: "Recomendação gerada com sucesso."
    });
  });

  return router;
};
