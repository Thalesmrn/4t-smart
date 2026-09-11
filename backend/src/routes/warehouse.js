const express = require('express');

module.exports = function (store) {
  const router = express.Router();

  // GET /api/armazem  — resumo (mantido para compatibilidade)
  router.get('/', (req, res) => {
    res.json({
      galpoes: store.buscarGalpoes(),
      posicoes: store.posicoes,
    });
  });

  // GET /api/armazem/galpoes
  router.get('/galpoes', (req, res) => {
    res.json(store.buscarGalpoes());
  });

  // GET /api/armazem/posicoes?galpaoId=G1
  router.get('/posicoes', (req, res) => {
    const { galpaoId } = req.query;
    res.json(store.buscarPosicoes(galpaoId));
  });

  // GET /api/armazem/posicoes/:id
  router.get('/posicoes/:id', (req, res) => {
    const detalhe = store.buscarPosicaoDetalhe(req.params.id);
    if (!detalhe) {
      return res.status(404).json({ erro: "Posição não encontrada." });
    }
    res.json(detalhe);
  });

  // POST /api/armazem/posicoes/:id/liberar
  router.post('/posicoes/:id/liberar', (req, res) => {
    const detalhe = store.liberarPosicao(req.params.id);
    if (!detalhe) {
      return res.status(404).json({ erro: "Posição não encontrada." });
    }
    res.json(detalhe);
  });

  return router;
};
