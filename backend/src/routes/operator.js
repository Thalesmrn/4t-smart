const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // GET: Dados do painel do operador
  router.get('/', (req, res) => {
    res.json({
      operador: { id: "OP-01", nome: "Operador Principal" },
      tarefaAtual: null,
      proximasTarefas: []
    });
  });

  // POST/PUT: Concluir ou alterar status de uma tarefa pelo operador
  router.post('/concluir', (req, res) => {
    res.json({ status: "CONCLUIDA", mensagem: "Tarefa atualizada com sucesso!" });
  });

  router.put('/tarefas/:id', (req, res) => {
    res.json({ status: req.body.status || "CONCLUIDA" });
  });

  return router;
};
