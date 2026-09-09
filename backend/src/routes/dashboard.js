const express = require("express");

module.exports = function (db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const totalPosicoes = db.posicoes.length;
    const ocupadas = db.posicoes.filter((p) => p.status === "ocupada").length;
    const livres = db.posicoes.filter((p) => p.status === "livre").length;
    const bloqueadas = db.posicoes.filter((p) => p.status === "bloqueada").length;
    const ocupacaoPct = Math.round((ocupadas / totalPosicoes) * 100);

    const tarefasAbertas = db.tarefas.filter((t) => t.status !== "concluida").length;
    const tarefasUrgentes = db.tarefas.filter((t) => t.status !== "concluida" && t.urgente).length;
    const empilhadeirasDisponiveis = db.empilhadeiras.filter((e) => e.status === "disponivel").length;

    const distanciaTotal = db.empilhadeiras.reduce((s, e) => s + e.distanciaPercorridaHojeM, 0);

    res.json({
      ocupacao: {
        totalPosicoes,
        ocupadas,
        livres,
        bloqueadas,
        ocupacaoPct,
      },
      tarefas: {
        abertas: tarefasAbertas,
        urgentes: tarefasUrgentes,
        concluidasNoTurno: db.metricasTurno.tarefasConcluidas,
      },
      empilhadeiras: {
        total: db.empilhadeiras.length,
        disponiveis: empilhadeirasDisponiveis,
        emTarefa: db.empilhadeiras.length - empilhadeirasDisponiveis,
      },
      indicadores: {
        distanciaTotalPercorridaM: distanciaTotal,
        tempoMedioPorMovimentacaoMin: db.metricasTurno.tempoMedioPorMovimentacaoMin,
        indiceMovimentacaoIndiretaPct: db.metricasTurno.indiceMovimentacaoIndiretaPct,
        eficienciaLogisticaPct: Math.max(
          0,
          100 - db.metricasTurno.indiceMovimentacaoIndiretaPct - Math.round(bloqueadas / 2)
        ),
      },
      caminhoesNoPatio: db.caminhoes.map((c) => ({
        id: c.id,
        placa: c.placa,
        tipoOperacao: c.tipoOperacao,
        horarioChegada: c.horarioChegada,
        status: c.status,
      })),
    });
  });

  return router;
};
