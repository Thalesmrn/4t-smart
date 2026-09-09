const express = require("express");

function proximoIdEmpilhadeira(empilhadeiras) {
  const numeros = empilhadeiras
    .map((e) => parseInt(e.id.split("-")[1], 10))
    .filter((n) => !isNaN(n));
  const proximo = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
  return `EMP-${String(proximo).padStart(2, "0")}`;
}

module.exports = function (db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const resultado = db.empilhadeiras.map((emp) => {
      const tarefaAtual = db.tarefas.find(
        (t) => t.empilhadeiraId === emp.id && (t.status === "atribuida" || t.status === "em_execucao")
      );
      return { ...emp, tarefaAtual: tarefaAtual || null };
    });
    res.json(resultado);
  });

  // Cadastra uma nova empilhadeira na frota. Entra sempre como "disponível",
  // posicionada na doca de recebimento por padrão, pronta para receber tarefas.
  router.post("/", (req, res) => {
    const { nome, operador, capacidadeKg } = req.body || {};
    if (!nome || !operador) {
      return res.status(400).json({ erro: "Informe ao menos nome e operador." });
    }

    const nova = {
      id: proximoIdEmpilhadeira(db.empilhadeiras),
      nome: nome.trim(),
      operador: operador.trim(),
      status: "disponivel",
      posicaoAtualId: "DOCA-RECEBIMENTO",
      capacidadeKg: Number(capacidadeKg) > 0 ? Number(capacidadeKg) : 2500,
      distanciaPercorridaHojeM: 0,
    };
    db.empilhadeiras.push(nova);
    res.status(201).json(nova);
  });

  router.get("/:id", (req, res) => {
    const emp = db.empilhadeiras.find((e) => e.id === req.params.id);
    if (!emp) return res.status(404).json({ erro: "Empilhadeira não encontrada" });
    const tarefas = db.tarefas.filter((t) => t.empilhadeiraId === emp.id);
    res.json({ ...emp, tarefas });
  });

  router.post("/:id/status", (req, res) => {
    const { status } = req.body;
    const validos = ["disponivel", "em_tarefa", "manutencao"];
    if (!validos.includes(status)) return res.status(400).json({ erro: "Status inválido" });

    const emp = db.empilhadeiras.find((e) => e.id === req.params.id);
    if (!emp) return res.status(404).json({ erro: "Empilhadeira não encontrada" });

    emp.status = status;
    res.json(emp);
  });

  return router;
};
