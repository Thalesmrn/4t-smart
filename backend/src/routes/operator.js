const express = require('express');
const router = express.Router();

// Função auxiliar para lidar com chamadas que recebem db no estilo antigo
module.exports = function(db) {
  const r = express.Router();

  // Endpoint chamado pelo Monitor do Operador após selecionar a empilhadeira
  r.get('/:empilhadeiraId/proxima-tarefa', (req, res) => {
    const { empilhadeiraId } = req.params;
    
    // Retorna nulo com 200 OK indicando que não há tarefas pendentes para a empilhadeira no momento
    res.json({
      empilhadeiraId,
      tarefa: null,
      mensagem: "Nenhuma tarefa pendente."
    });
  });

  // Endpoints adicionais de apoio do operador
  r.get('/', (req, res) => {
    res.json({ status: "ok" });
  });

  return r;
};
