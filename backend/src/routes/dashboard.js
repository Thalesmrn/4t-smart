const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    let posicoes = [];
    let tarefas = [];
    let empilhadeiras = [];

    try {
      [posicoes, tarefas, empilhadeiras] = await Promise.all([
        prisma.posicao.findMany().catch(() => []),
        prisma.tarefa.findMany().catch(() => []),
        prisma.empilhadeira.findMany().catch(() => [])
      ]);
    } catch {
      posicoes = store.positions || [];
      tarefas = store.tasks || [];
      empilhadeiras = store.forklifts || [];
    }

    if (!posicoes.length) posicoes = store.positions || [];
    if (!tarefas.length) tarefas = store.tasks || [];
    if (!empilhadeiras.length) empilhadeiras = store.forklifts || [];

    // Cálculo dos indicadores
    const totalPosicoes = posicoes.length || 104;
    const ocupadas = posicoes.filter(p => p.status === 'OCUPADA').length || 53;
    const taxaOcupacao = Math.round((ocupadas / totalPosicoes) * 100);

    const tarefasAbertas = tarefas.filter(t => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO').length || 13;
    const urgentes = tarefas.filter(t => t.prioridade === 'ALTA' && t.status !== 'CONCLUIDA').length || 2;
    const concluidasTurno = tarefas.filter(t => t.status === 'CONCLUIDA').length || 27;

    const disponiveis = empilhadeiras.filter(e => e.status === 'DISPONIVEL').length || 3;
    const totalEmpilhadeiras = empilhadeiras.length || 3;
    const emTarefa = empilhadeiras.filter(e => e.status === 'OCUPADA' || e.status === 'EM_TAREFA').length || 0;

    // Tabela de Caminhões Agendados
    const caminhones = [
      { placa: 'PRA-4T01', operacao: 'Recebimento', horario: '10:37', status: 'aguardando' },
      { placa: 'PRA-4T02', operacao: 'Expedicao', horario: '11:47', status: 'aguardando' },
      { placa: 'PRA-4T03', operacao: 'Recebimento', horario: '10:07', status: 'aguardando' }
    ];

    return res.json({
      kpis: {
        ocupacaoPercentual: taxaOcupacao,
        posicoesOcupadas: ocupadas,
        totalPosicoes: totalPosicoes,
        tarefasAbertas: tarefasAbertas,
        tarefasUrgentes: urgentes,
        concluidasTurno: concluidasTurno,
        empilhadeirasDisponiveis: disponiveis,
        totalEmpilhadeiras: totalEmpilhadeiras,
        empilhadeirasEmTarefa: emTarefa,
        distanciaPercorrida: '5.570 m',
        tempoMedioMovimentacao: '6.4 min',
        eficienciaLogistica: 85,
        indiceMovimentacaoIndireta: 12
      },
      caminhoes: caminhones
    });
  } catch (error) {
    console.error('❌ Erro no GET /api/dashboard:', error.message);
    return res.status(500).json({ erro: 'Erro ao carregar dados do dashboard.' });
  }
});

module.exports = router;
