const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 1. Ocupação e posições
    const totalPosicoes = await prisma.posicao.count().catch(() => 0);
    const ocupadas = await prisma.posicao.count({ where: { status: "ocupada" } }).catch(() => 0);
    const livres = await prisma.posicao.count({ where: { status: "DISPONIVEL" } }).catch(() => 0);
    const bloqueadas = await prisma.posicao.count({ where: { status: "bloqueada" } }).catch(() => 0);
    const ocupacaoPct = totalPosicoes > 0 ? Math.round((ocupadas / totalPosicoes) * 100) : 0;

    // 2. Tarefas
    const tarefasAbertas = await prisma.tarefa.count({
      where: { status: { not: "CONCLUIDA" } },
    }).catch(() => 0);

    const tarefasUrgentes = await prisma.tarefa.count({
      where: {
        status: { not: "CONCLUIDA" },
        prioridade: { gte: 3 },
      },
    }).catch(() => 0);

    const tarefasConcluidasTurno = await prisma.tarefa.count({
      where: { status: "CONCLUIDA" },
    }).catch(() => 0);

    // 3. Empilhadeiras
    const totalEmpilhadeiras = await prisma.empilhadeira.count().catch(() => 0);
    const empilhadeirasDisponiveis = await prisma.empilhadeira.count({
      where: { status: "DISPONIVEL" },
    }).catch(() => 0);

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
        concluidasNoTurno: tarefasConcluidasTurno,
      },
      empilhadeiras: {
        total: totalEmpilhadeiras,
        disponiveis: empilhadeirasDisponiveis,
        emTarefa: Math.max(0, totalEmpilhadeiras - empilhadeirasDisponiveis),
      },
      indicadores: {
        distanciaTotalPercorridaM: 0,
        tempoMedioPorMovimentacaoMin: 0,
        indiceMovimentacaoIndiretaPct: 0,
        eficienciaLogisticaPct: 100,
      },
      caminhoesNoPatio: [],
    });
  } catch (error) {
    console.error("❌ Erro ao gerar dados do dashboard no banco:", error);
    return res.status(500).json({ erro: "Erro interno ao processar dashboard" });
  }
});

module.exports = router;
