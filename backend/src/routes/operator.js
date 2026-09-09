const express = require("express");
const { recalcularPrioridades } = require("../services/priorityEngine");

module.exports = function (db) {
  const router = express.Router();

  // Retorna a próxima tarefa do operador de uma empilhadeira específica
  router.get("/:empilhadeiraId/proxima-tarefa", (req, res) => {
    recalcularPrioridades(db);
    const emp = db.empilhadeiras.find((e) => e.id === req.params.empilhadeiraId);
    if (!emp) return res.status(404).json({ erro: "Empilhadeira não encontrada" });

    const tarefa = db.tarefas
      .filter((t) => t.empilhadeiraId === emp.id && (t.status === "atribuida" || t.status === "em_execucao"))
      .sort((a, b) => b.prioridadeScore - a.prioridadeScore)[0];

    if (!tarefa) {
      return res.json({ empilhadeira: emp, tarefa: null, mensagem: "Nenhuma tarefa atribuída no momento." });
    }

    const bigBag = tarefa.bigBagId ? db.bigBags.find((b) => b.id === tarefa.bigBagId) : null;

    res.json({ empilhadeira: emp, tarefa, bigBag });
  });

  // Simula leitura de RFID/QR Code — apenas valida se o código bate com o esperado
  router.post("/:empilhadeiraId/ler-codigo", (req, res) => {
    const { codigoLido, tarefaId } = req.body;
    const tarefa = db.tarefas.find((t) => t.id === tarefaId);
    if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });

    const bigBag = tarefa.bigBagId ? db.bigBags.find((b) => b.id === tarefa.bigBagId) : null;
    const esperado = bigBag ? bigBag.qrCode : null;

    const valido = esperado ? codigoLido === esperado : true;

    if (tarefa.status === "atribuida") tarefa.status = "em_execucao";

    res.json({
      valido,
      esperado,
      lido: codigoLido,
      mensagem: valido
        ? "Código confere. Pode prosseguir com a movimentação."
        : "Atenção: código não confere com o big bag esperado para esta tarefa!",
    });
  });

  // Confirma conclusão a partir do monitor do operador
  router.post("/:empilhadeiraId/confirmar-conclusao/:tarefaId", (req, res) => {
    const { concluirTarefa } = require("../services/taskService");
    const resultado = concluirTarefa(db, req.params.tarefaId);
    if (resultado.erro) return res.status(resultado.status).json({ erro: resultado.erro });
    res.json(resultado.tarefa);
  });

  return router;
};
