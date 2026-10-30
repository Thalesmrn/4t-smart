const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// POST /api/slotting/recomendar
router.post('/recomendar', async (req, res) => {
  try {
    const { loteId, priorizarExpedicao, rebeneficiar } = req.body || {};

    let posicoesRecomendadas = [];

    try {
      // Tenta buscar posições disponíveis no Supabase
      posicoesRecomendadas = await prisma.posicao.findMany({
        take: 5
      });
    } catch (e) {
      // Caso não encontre ou falhe o banco, usa posições simuladas/memória
      posicoesRecomendadas = store.positions || [];
    }

    // Se a lista continuar vazia, gera recomendações padrão
    if (!posicoesRecomendadas || posicoesRecomendadas.length === 0) {
      posicoesRecomendadas = [
        { id: 'POS-A1-01', galpao: 'Galpão A', rua: 'A1', nivel: 1, pontuacao: 98, motivo: 'Próximo à área de descarga e rebeneficiamento' },
        { id: 'POS-A1-02', galpao: 'Galpão A', rua: 'A1', nivel: 2, pontuacao: 92, motivo: 'Fácil acesso para empilhadeiras' },
        { id: 'POS-B2-05', galpao: 'Galpão B', rua: 'B2', nivel: 1, pontuacao: 85, motivo: 'Zona otimizada para expedição rápida' }
      ];
    } else {
      posicoesRecomendadas = posicoesRecomendadas.map((p, idx) => ({
        ...p,
        pontuacao: 100 - (idx * 5),
        motivo: priorizarExpedicao 
          ? 'Posição próxima à doca de expedição' 
          : 'Posição ideal para armazenamento de médio prazo'
      }));
    }

    return res.json({
      loteId: loteId || null,
      recomendacoes: posicoesRecomendadas
    });
  } catch (error) {
    console.error('❌ Erro no POST /api/slotting/recomendar:', error.message);
    return res.status(500).json({ erro: `Erro ao calcular recomendações: ${error.message}` });
  }
});

// GET /api/slotting/sequencia-otimizada
router.get('/sequencia-otimizada', async (req, res) => {
  try {
    const { empilhadeiraId } = req.query;

    let tarefas = [];
    try {
      tarefas = await prisma.tarefa.findMany({
        where: { status: 'PENDENTE' }
      });
    } catch (e) {
      tarefas = store.tasks || [];
    }

    if (!tarefas || tarefas.length === 0) {
      tarefas = [
        { id: 'TAR-101', tipo: 'ARMAZENAMENTO', lote: 'LOT-2001', origem: 'Doca Descarga 1', destino: 'POS-A1-01', prioridade: 1 },
        { id: 'TAR-102', tipo: 'REMOVIMENTACAO', lote: 'LOT-2002', origem: 'POS-B1-02', destino: 'POS-A2-04', prioridade: 2 }
      ];
    }

    return res.json({
      empilhadeiraId: empilhadeiraId || 'EMP-01',
      sequencia: tarefas
    });
  } catch (error) {
    console.error('❌ Erro no GET /api/slotting/sequencia-otimizada:', error.message);
    return res.status(500).json({ erro: `Erro ao calcular sequência: ${error.message}` });
  }
});

module.exports = router;
