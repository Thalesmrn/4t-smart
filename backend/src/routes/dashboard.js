const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    let galpoes = [];
    let lotes = [];
    let empilhadeiras = [];
    let tarefas = [];

    try {
      [galpoes, lotes, empilhadeiras, tarefas] = await Promise.all([
        prisma.galpao.findMany().catch(() => []),
        prisma.lote.findMany().catch(() => []),
        prisma.empilhadeira.findMany().catch(() => []),
        prisma.tarefa.findMany().catch(() => [])
      ]);
    } catch {
      galpoes = store.warehouses || [];
      lotes = store.lots || [];
      empilhadeiras = store.forklifts || [];
      tarefas = store.tasks || [];
    }

    if (!galpoes.length) galpoes = store.warehouses || [];
    if (!lotes.length) lotes = store.lots || [];
    if (!empilhadeiras.length) empilhadeiras = store.forklifts || [];
    if (!tarefas.length) tarefas = store.tasks || [];

    const totalPosicoes = galpoes.reduce((acc, g) => acc + (g.capacidadePosicoes || 0), 0) || 120;
    const posicoesOcupadas = lotes.filter(l => l.posicaoId || l.status === 'ARMAZENADO').length;
    const taxaOcupacao = totalPosicoes > 0 ? Math.round((posicoesOcupadas / totalPosicoes) * 100) : 0;

    const lotesAguardando = lotes.filter(l => l.status === 'AGUARDANDO_DESCARGA' || !l.posicaoId).length;
    const tarefasPendentes = tarefas.filter(t => t.status === 'PENDENTE').length;

    const porStatusLote = {
      AGUARDANDO_DESCARGA: lotes.filter(l => l.status === 'AGUARDANDO_DESCARGA').length,
      ARMAZENADO: lotes.filter(l => l.status === 'ARMAZENADO').length,
      EM_MOVIMENTACAO: lotes.filter(l => l.status === 'EM_MOVIMENTACAO').length
    };

    const porGalpao = galpoes.map(g => {
      const lotesNoGalpao = lotes.filter(l => l.galpaoId === g.id);
      return {
        id: g.id,
        nome: g.nome,
        codigo: g.codigo,
        capacidade: g.capacidadePosicoes,
        ocupadas: lotesNoGalpao.length,
        taxa: g.capacidadePosicoes > 0 ? Math.round((lotesNoGalpao.length / g.capacidadePosicoes) * 100) : 0
      };
    });

    return res.json({
      kpis: {
        totalGalpoes: galpoes.length,
        totalLotes: lotes.length,
        lotesAguardandoDescarga: lotesAguardando,
        taxaOcupacaoGeral: taxaOcupacao,
        tarefasPendentes,
        empilhadeirasAtivas: empilhadeiras.filter(e => e.status !== 'INATIVA').length
      },
      distribuicao: {
        porStatusLote,
        porGalpao
      },
      alertas: [
        { tipo: 'INFO', mensagem: `${lotesAguardando} lote(s) aguardando alocação no armazém.` },
        { tipo: 'WARNING', mensagem: `${tarefasPendentes} tarefa(s) de movimentação pendentes.` }
      ]
    });
  } catch (error) {
    console.error('❌ Erro no GET /api/dashboard:', error);
    return res.status(500).json({ erro: 'Erro ao carregar dados do dashboard.' });
  }
});

module.exports = router;
