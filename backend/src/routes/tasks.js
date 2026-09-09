const express = require("express");
const { recalcularPrioridades } = require("../services/priorityEngine");

module.exports = function (db) {
  const router = express.Router();

  // Lista tarefas já ordenadas por prioridade (recalcula a cada consulta — reflete o "tempo real")
  router.get("/", (req, res) => {
    recalcularPrioridades(db);
    const { status, empilhadeiraId } = req.query;
    let resultado = db.tarefas;
    if (status) resultado = resultado.filter((t) => t.status === status);
    if (empilhadeiraId) resultado = resultado.filter((t) => t.empilhadeiraId === empilhadeiraId);
    res.json(resultado);
  });

  router.get("/:id", (req, res) => {
    const tarefa = db.tarefas.find((t) => t.id === req.params.id);
    if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });
    res.json(tarefa);
  });

  // Atribuição automática: pega a tarefa pendente de maior prioridade e a empilhadeira
  // disponível mais próxima de sua origem.
  router.post("/atribuir-automatico", (req, res) => {
    const { otimizarSequencia, coordDe, distancia } = require("../services/routingEngine");
    recalcularPrioridades(db);

    const pendentes = db.tarefas.filter((t) => t.status === "pendente");
    const disponiveis = db.empilhadeiras.filter((e) => e.status === "disponivel");

    if (pendentes.length === 0 || disponiveis.length === 0) {
      return res.json({ atribuidas: [], mensagem: "Sem tarefas pendentes ou empilhadeiras disponíveis." });
    }

    const atribuidas = [];
    for (const tarefa of pendentes) {
      const livre = db.empilhadeiras.filter((e) => e.status === "disponivel");
      if (livre.length === 0) break;

      // Escolhe a empilhadeira com menor distância até a origem da tarefa (proximidade),
      // priorizando também a capacidade em relação ao peso do big bag.
      let melhor = null;
      let melhorDist = Infinity;
      livre.forEach((emp) => {
        const origem = coordDe(tarefa.origemId, db.posicoes);
        const atual = coordDe(emp.posicaoAtualId, db.posicoes);
        const d = distancia(atual, origem);
        if (d < melhorDist) {
          melhorDist = d;
          melhor = emp;
        }
      });

      if (melhor) {
        tarefa.empilhadeiraId = melhor.id;
        tarefa.status = "atribuida";
        melhor.status = "em_tarefa";
        atribuidas.push({
          tarefaId: tarefa.id,
          empilhadeiraId: melhor.id,
          distanciaAteOrigemCelulas: melhorDist,
          motivo: `${melhor.nome} estava a ${melhorDist} células da origem (${tarefa.origemId}) — a mais próxima entre as disponíveis.`,
        });
      }
    }

    res.json({ atribuidas });
  });

  // Atribuição manual
  router.post("/:id/atribuir", (req, res) => {
    const { empilhadeiraId } = req.body;
    const tarefa = db.tarefas.find((t) => t.id === req.params.id);
    const empilhadeira = db.empilhadeiras.find((e) => e.id === empilhadeiraId);

    if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });
    if (!empilhadeira) return res.status(404).json({ erro: "Empilhadeira não encontrada" });
    if (empilhadeira.status !== "disponivel")
      return res.status(400).json({ erro: "Empilhadeira não está disponível" });

    tarefa.empilhadeiraId = empilhadeira.id;
    tarefa.status = "atribuida";
    empilhadeira.status = "em_tarefa";

    res.json(tarefa);
  });

  // Operador confirma conclusão (via Monitor do Operador)
  router.post("/:id/concluir", (req, res) => {
    const { concluirTarefa } = require("../services/taskService");
    const resultado = concluirTarefa(db, req.params.id);
    if (resultado.erro) return res.status(resultado.status).json({ erro: resultado.erro });
    res.json(resultado.tarefa);
  });

  return router;
};
