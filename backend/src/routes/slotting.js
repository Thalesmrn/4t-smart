const express = require("express");
const { recomendarPosicoes } = require("../services/slottingEngine");

module.exports = function (db) {
  const router = express.Router();

  // POST /api/slotting/recomendar
  // body: { loteId, priorizarExpedicaoRapida: bool, precisaRebeneficio: bool, topN }
  router.post("/recomendar", (req, res) => {
    const { loteId, priorizarExpedicaoRapida, precisaRebeneficio, topN } = req.body || {};

    const lote = loteId ? db.lotes.find((l) => l.id === loteId) : null;
    if (loteId && !lote) return res.status(404).json({ erro: "Lote não encontrado" });

    const recomendacoes = recomendarPosicoes(
      db.posicoes,
      {
        loteId,
        priorizarExpedicaoRapida: !!priorizarExpedicaoRapida,
        precisaRebeneficio: !!precisaRebeneficio,
      },
      topN || 3
    );

    res.json({ lote: lote || null, recomendacoes });
  });

  return router;
};
