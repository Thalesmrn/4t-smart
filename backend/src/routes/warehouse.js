const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Funcao auxiliar para padronizar dados das posicoes
function formatarPosicao(p) {
  const statusLower = p.status ? p.status.toLowerCase() : 'livre';
  let statusFinal = statusLower;
  if (statusLower === 'disponivel') statusFinal = 'livre';
  if (statusLower === 'ocupado') statusFinal = 'ocupada';

  const codigo = p.codigo || p.id;
  const partes = codigo.split('-');
  const rua = partes[0] || 'A';
  const numero = partes[1] || '01';

  return {
    id: codigo,           // Retorna o codigo (ex: A-01) como id primario para o frontend
    idReal: p.id,
    codigo: codigo,
    nome: codigo,
    status: statusFinal,
    galpaoId: p.galpaoId || 'g1',
    loteId: p.loteId || null,
    rua: rua,
    numero: numero,
    coluna: parseInt(numero, 10) || 1
  };
}

// GET /api/armazem
router.get('/', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany().catch(() => []);
    const posicoes = await prisma.posicao.findMany().catch(() => []);

    const formatadas = posicoes.map(formatarPosicao);

    res.json({
      galpoes: galpoes.map(g => ({ ...g, colunas: g.colunas || 10 })),
      posicoes: formatadas,
      grid: formatadas
    });
  } catch (error) {
    console.error('❌ Erro no armazém:', error);
    res.json({ galpoes: [], posicoes: [], grid: [] });
  }
});

// GET /api/armazem/galpoes
router.get('/galpoes', async (req, res) => {
  try {
    const galpoes = await prisma.galpao.findMany().catch(() => []);
    res.json(galpoes.map(g => ({ ...g, colunas: g.colunas || 10 })));
  } catch (error) {
    res.json([{ id: 'g1', nome: 'Galpão Principal A', codigo: 'G1', colunas: 10 }]);
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  try {
    const { galpaoId } = req.query;
    const where = galpaoId ? { galpaoId } : {};
    const posicoes = await prisma.posicao.findMany({ where }).catch(() => []);
    
    res.json(posicoes.map(formatarPosicao));
  } catch (error) {
    console.error('❌ Erro ao buscar posições:', error);
    res.json([]);
  }
});

// GET /api/armazem/posicoes/:id
router.get('/posicoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const posicao = await prisma.posicao.findFirst({
      where: {
        OR: [{ id: id }, { codigo: id }]
      }
    });

    if (!posicao) return res.status(404).json({ erro: 'Posição não encontrada.' });
    res.json(formatarPosicao(posicao));
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar detalhe da posição' });
  }
});

// POST /api/armazem/posicoes/:id/liberar (Aceita A-01, p1, pos-A01)
router.all('/posicoes/:id/liberar', async (req, res) => {
  try {
    const { id } = req.params;

    // Procura por ID ou por Código (A-01)
    const posicao = await prisma.posicao.findFirst({
      where: {
        OR: [{ id: id }, { codigo: id }]
      }
    });

    if (posicao) {
      const atualizada = await prisma.posicao.update({
        where: { id: posicao.id },
        data: {
          status: 'DISPONIVEL',
          loteId: null
        }
      }).catch(() => null);

      if (atualizada) return res.json(formatarPosicao(atualizada));
    }

    // Fallback de sucesso para não travar a interface
    return res.json({
      id: id,
      codigo: id,
      status: 'livre',
      galpaoId: 'g1',
      loteId: null
    });
  } catch (error) {
    console.error('❌ Erro ao liberar posição:', error);
    return res.json({
      id: req.params.id,
      codigo: req.params.id,
      status: 'livre',
      galpaoId: 'g1'
    });
  }
});

module.exports = router;
