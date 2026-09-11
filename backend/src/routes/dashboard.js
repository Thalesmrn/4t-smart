const express = require("express");

module.exports = function (db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    try {
      // Garantia de fallbacks para evitar erros de array indefinido
      const posicoes = Array.isArray(db?.posicoes) ? db.posicoes : [];
      const tarefas = Array.isArray(db?.tarefas) ? db.tarefas : [];
      const empilhadeiras = Array.isArray(db?.empilhadeiras) ? db.empilhadeiras : [];
      const caminhoes = Array.isArray(db?.caminhoes) ? db.caminhoes : [];
      const metricasTurno = db?.metricasTurno || {};

      const totalPosicoes = posicoes.length;
      const ocupadas = posicoes.filter((p) => p.status === "ocupada").length;
      const livres = posicoes.filter((p) => p.status === "livre").length;
      const bloqueadas = posicoes.filter((p) => p.status === "bloqueada").length;
      const ocupacaoPct = totalPosicoes > 0 ? Math.round((ocupadas / totalPosicoes) * 100) : 0;

      const tarefasAbertas = tarefas.filter((t) => t.status !== "concluida").length;
      const tarefasUrgentes = tarefas.filter((t) => t.status !== "concluida" && t.urgente).length;
      const empilhadeirasDisponiveis = empilhadeiras.filter((e) => e.status === "disponivel").length;

      const distanciaTotal = empilhadeiras.reduce((s, e) => s + (e.distanciaPercorridaHojeM || 0), 0);
      const indiceIndireta = metricasTurno.indiceMovimentacaoIndiretaPct || 0;

      return res.json({
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
          concluidasNoTurno: metricasTurno.tarefasConcluidas || 0,
        },
        empilhadeiras: {
          total: empilhadeiras.length,
          disponiveis: empilhadeirasDisponiveis,
          emTarefa: empilhadeiras.length - empilhadeirasDisponiveis,
        },
        indicadores: {
          distanciaTotalPercorridaM: distanciaTotal,
          tempoMedioPorMovimentacaoMin: metricasTurno.tempoMedioPorMovimentacaoMin || 0,
          indiceMovimentacaoIndiretaPct: indiceIndireta,
          eficienciaLogisticaPct: Math.max(
            0,
            100 - indiceIndireta - Math.round(bloqueadas / 2)
          ),
        },
        caminhoesNoPatio: caminhoes.map((c) => ({
          id: c.id,
          placa: c.placa,
          tipoOperacao: c.tipoOperacao,
          horarioChegada: c.horarioChegada,
          status: c.status,
        })),
      });
    } catch (error) {
      console.error("❌ Erro ao gerar dados do dashboard:", error);
      return res.status(500).json({ erro: "Erro interno ao processar dashboard" });
    }
  });

  return router;
};
