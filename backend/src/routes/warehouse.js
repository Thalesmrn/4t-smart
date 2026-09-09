const express = require("express");

module.exports = function (db) {
  const router = express.Router();

  // Lista galpões + grid de posições
  router.get("/galpoes", (req, res) => {
    res.json(db.galpoes);
  });

  router.get("/posicoes", (req, res) => {
    const { galpaoId, status } = req.query;
    let resultado = db.posicoes;
    if (galpaoId) resultado = resultado.filter((p) => p.galpaoId === galpaoId);
    if (status) resultado = resultado.filter((p) => p.status === status);
    res.json(resultado);
  });

  router.get("/posicoes/:id", (req, res) => {
    const pos = db.posicoes.find((p) => p.id === req.params.id);
    if (!pos) return res.status(404).json({ erro: "Posição não encontrada" });

    const bigBag = pos.bigBagId ? db.bigBags.find((b) => b.id === pos.bigBagId) : null;
    const lote = pos.loteId ? db.lotes.find((l) => l.id === pos.loteId) : null;

    res.json({ ...pos, bigBag, lote });
  });

  // Libera manualmente uma posição (atalho administrativo/demonstração).
  // Diferente da conclusão de uma tarefa (fluxo operacional normal), este
  // endpoint não exige que exista uma tarefa associada — útil para destravar
  // posições do cenário mock que não têm uma tarefa pré-carregada movendo o
  // big bag para fora. Marca o big bag como "expedido" (saiu do armazém).
  router.post("/posicoes/:id/liberar", (req, res) => {
    const pos = db.posicoes.find((p) => p.id === req.params.id);
    if (!pos) return res.status(404).json({ erro: "Posição não encontrada" });

    if (pos.status === "bloqueada") {
      return res.status(400).json({
        erro: "Posição bloqueada não pode ser liberada por aqui — resolva o motivo do bloqueio primeiro.",
      });
    }

    if (pos.bigBagId) {
      const bag = db.bigBags.find((b) => b.id === pos.bigBagId);
      if (bag) {
        bag.status = "expedido";
        bag.posicaoId = null;
      }
    }

    pos.status = "livre";
    pos.bigBagId = null;
    pos.loteId = null;
    pos.produto = null;
    pos.pesoKg = null;
    pos.dataEntrada = null;
    pos.proprietario = null;

    res.json(pos);
  });

  return router;
};
