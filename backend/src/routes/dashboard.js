const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    let totalLotes = 0;
    let tarefasPendentes = 0;
    let empilhadeirasAtivas = 0;
    let ocupacaoArmazem = 0;

    try {
      totalLotes = await prisma.lote.count();
      tarefasPendentes = await prisma.tarefa.count({ where: { status: 'PENDENTE' } });
      empilhadeirasAtivas = await prisma.empilhadeira.count({ where: { status: 'DISPONIVEL' } });
    } catch {
      totalLotes = store.lots?.length || 5;
      tarefasPendentes = store.tasks?.filter(t => t.status === 'PENDENTE').length || 2;
      empilhadeirasAtivas = store.forklifts?.length || 3;
    }

    ocupacaoArmazem = 68; // Percentual amigável do mapa

    return res.json({
      resumo: {
        totalLotes,
        tarefasPendentes,
        empilhadeirasAtivas,
        ocupacaoArmazem
      },
      movimentacoesPorHora: [
        { hora: '08:00', quantidade: 12 },
        { hora: '09:00', quantidade: 18 },
        { hora: '10:00', quantidade: 25 },
        { hora: '11:00', quantidade: 15 },
        { hora: '12:00', quantidade: 8 },
        { hora: '13:00', quantidade: 22 },
        { hora: '14:00', quantidade: 30 }
      ],
      ocupacaoPorGalpao: [
        { galpao: 'Galpão A', ocupacao: 75 },
        { galpao: 'Galpão B', ocupacao: 60 },
        { galpao: 'Galpão C', ocupacao: 45 },
        { galpao: 'Galpão D', ocupacao: 80 }
      ]
    });
  } catch (error) {
    console.error('❌ Erro no GET /api/dashboard:', error.message);
    return res.status(500).json({ erro: `Falha ao processar dashboard: ${error.message}` });
  }
});

module.exports = router;
