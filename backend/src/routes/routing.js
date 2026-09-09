const express = require("express");
const { otimizarSequencia } = require("../services/routingEngine");

module.exports = function (db) {
  const router = express.Router();

  // Retorna a sequência otimizada de tarefas atribuídas a uma empilhadeira,
  // comparando com a rota não otimizada (FIFO).
  router.get("/sequencia/:empilhadeiraId", (req, res) => {
    const emp = db.empilhadeiras.find((e) => e.id === req.params.empilhadeiraId);
    if (!emp) return res.status(404).json({ erro: "Empilhadeira não encontrada" });

    const tarefas = db.tarefas.filter(
      (t) => t.empilhadeiraId === emp.id && (t.status === "atribuida" || t.status === "em_execucao")
    );

    if (tarefas.length === 0) {
      return res.json({
        empilhadeiraId: emp.id,
        sequenciaOtimizada: [],
        mensagem: "Nenhuma tarefa atribuída no momento para esta empilhadeira.",
      });
    }

    const resultado = otimizarSequencia(tarefas, emp.posicaoAtualId, db.posicoes);
    res.json({ empilhadeiraId: emp.id, ...resultado });
  });

  // Simula/compara a rota para um conjunto arbitrário de tarefas pendentes (não atribuídas ainda)
  router.post("/simular", (req, res) => {
    const { tarefaIds, posicaoAtualId } = req.body;
    const tarefas = db.tarefas.filter((t) => tarefaIds.includes(t.id));
    if (tarefas.length === 0) return res.status(400).json({ erro: "Nenhuma tarefa válida informada" });

    const resultado = otimizarSequencia(tarefas, posicaoAtualId || "DOCA-RECEBIMENTO", db.posicoes);
    res.json(resultado);
  });

  return router;
};
