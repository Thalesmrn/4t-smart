const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 1. Ocupação e posições (buscando contagens diretamente no BD)
    const totalPosicoes = await prisma.lot.count();
    const ocupadas = await prisma.lot.count({ where: { status: "ocupada" } });
    const livres = await prisma.lot.count({ where: { status: "livre" } });
    const bloqueadas = await prisma.lot.count({ where: { status: "bloqueada" } });
    const ocupacaoPct = totalPosicoes > 0 ? Math.round((ocupadas / totalPosicoes) * 100) : 0;

    // 2. Tarefas
    const tarefasAbertas = await prisma.task.count({
      where: { status: { not: "concluida" } },
    });
    const tarefasUrgentes = await prisma.task.count({
      where: {
        status: { not: "concluida" },
        urgente: true,
      },
    });

    // 3. Empilhadeiras
    const totalEmpilhadeiras = await prisma.forklift.count();
    const empilhadeirasDisponiveis = await prisma.forklift.count({
      where: { status: "disponivel" },
    });

    // Soma das distâncias percorridas pelas empilhadeiras
    const distanciaAgregada = await prisma.forklift.aggregate({
      _sum: {
        distanciaPercorridaHojeM: true,
      },
    });
    const distanciaTotal = distanciaAgregada._sum.distanciaPercorridaHojeM || 0;

    // 4. Caminhões no Pátio
    const caminhoes = await prisma.truck.findMany({
      select: {
        id: true,
        placa: true,
        tipoOperacao: true,
        horarioChegada: true,
        status: true,
      },
    });

    // 5. Métricas e Indicadores (Ajustar modelo de métricas se houver tabela própria)
    // Usando fallback seguro para métricas de turno
    const indiceIndireta = 0; 
    const tempoMedio = 0;
    const tarefasConcluidasTurno = await prisma.task.count({
      where: { status: "concluida" },
    });

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
        emTarefa: totalEmpilhadeiras - empilhadeirasDisponiveis,
      },
      indicadores: {
        distanciaTotalPercorridaM: distanciaTotal,
        tempoMedioPorMovimentacaoMin: tempoMedio,
        indiceMovimentacaoIndiretaPct: indiceIndireta,
        eficienciaLogisticaPct: Math.max(
          0,
          100 - indiceIndireta - Math.round(bloqueadas / 2)
        ),
      },
      caminhoesNoPatio: caminhoes,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar dados do dashboard no banco:", error);
    return res.status(500).json({ erro: "Erro interno ao processar dashboard" });
  }
});

module.exports = router;
