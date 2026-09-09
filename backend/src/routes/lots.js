const express = require("express");

function proximoIdLote(lotes) {
  const numeros = lotes.map((l) => parseInt(l.id.split("-")[1], 10)).filter((n) => !isNaN(n));
  const proximo = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
  return `LOTE-${String(proximo).padStart(3, "0")}`;
}

function proximoIdTarefa(tarefas) {
  const numeros = tarefas.map((t) => parseInt(t.id.split("-")[1], 10)).filter((n) => !isNaN(n));
  const proximo = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
  return `TSK-${String(proximo).padStart(3, "0")}`;
}

module.exports = function (db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.json(db.lotes);
  });

  router.get("/:id", (req, res) => {
    const lote = db.lotes.find((l) => l.id === req.params.id);
    if (!lote) return res.status(404).json({ erro: "Lote não encontrado" });
    const bigBags = db.bigBags.filter((b) => b.loteId === lote.id);
    res.json({ ...lote, bigBags });
  });

  // Cadastra um novo lote de café. Entra sempre como "aguardando_descarga" —
  // ainda não tem big bags/posições associadas, pois representa um lote que
  // vai ser fisicamente recebido no armazém (consistente com o fluxo de
  // tarefas de recebimento já existente).
  router.post("/", (req, res) => {
    const { produto, qualidade, proprietario, sacas } = req.body || {};
    if (!produto || !proprietario) {
      return res.status(400).json({ erro: "Informe ao menos produto e proprietário." });
    }

    const novoLote = {
      id: proximoIdLote(db.lotes),
      produto: produto.trim(),
      qualidade: (qualidade || "A classificar").trim(),
      proprietario: proprietario.trim(),
      sacas: Number(sacas) > 0 ? Number(sacas) : 0,
      status: "aguardando_descarga",
    };
    db.lotes.push(novoLote);
    res.status(201).json(novoLote);
  });

  // Gera a tarefa de recebimento para um lote "aguardando_descarga". A tarefa
  // ainda não tem destino/posição definida — isso só é decidido pelo slotting
  // engine no momento em que a tarefa for concluída (ver taskService.js).
  router.post("/:id/registrar-recebimento", (req, res) => {
    const lote = db.lotes.find((l) => l.id === req.params.id);
    if (!lote) return res.status(404).json({ erro: "Lote não encontrado" });

    if (lote.status !== "aguardando_descarga") {
      return res.status(400).json({ erro: "Este lote não está aguardando descarga." });
    }

    const jaExiste = db.tarefas.some(
      (t) => t.loteId === lote.id && t.tipo === "recebimento" && t.status !== "concluida"
    );
    if (jaExiste) {
      return res.status(400).json({ erro: "Já existe uma tarefa de recebimento pendente para este lote." });
    }

    const novaTarefa = {
      id: proximoIdTarefa(db.tarefas),
      tipo: "recebimento",
      descricao: `Receber lote ${lote.id} (${lote.produto}) — ${lote.sacas || "?"} sacas, proprietário ${lote.proprietario}`,
      bigBagId: null,
      loteId: lote.id,
      origemId: "DOCA-RECEBIMENTO",
      destinoId: null,
      prioridadeScore: 0,
      prioridadeExplicacao: "",
      empilhadeiraId: null,
      status: "pendente",
      criadoEm: new Date().toISOString(),
      prazoLimite: null,
      urgente: false,
    };

    db.tarefas.push(novaTarefa);
    res.status(201).json(novaTarefa);
  });

  return router;
};
