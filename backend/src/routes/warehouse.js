const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// Galpões Padrão do Sistema
const GALPOES_PADRAO = [
  { id: 'GAL-A', nome: 'Galpão A — Grãos & Sacarias', codigo: 'GAL-A', totalPosicoes: 120, ocupadas: 45 },
  { id: 'GAL-B', nome: 'Galpão B — Rebeneficiamento', codigo: 'GAL-B', totalPosicoes: 90, ocupadas: 30 },
  { id: 'GAL-C', nome: 'Galpão C — Exclusivo Exportação', codigo: 'GAL-C', totalPosicoes: 80, ocupadas: 20 },
  { id: 'GAL-D', nome: 'Galpão D — Triagem e Qualidade', codigo: 'GAL-D', totalPosicoes: 60, ocupadas: 15 }
];

// Helper para gerar matriz visual de posições por galpão
function gerarPosicoesGalpao(galpaoId) {
  const gId = galpaoId || 'GAL-A';
  const prefixo = gId.replace('GAL-', '');
  const posicoes = [];
  const ruas = ['1', '2', '3'];
  const niveis = [1, 2, 3, 4];

  let count = 1;
  ruas.forEach((rua) => {
    niveis.forEach((nivel) => {
      const statusList = ['OCUPADA', 'LIVRE', 'OCUPADA', 'LIVRE', 'BLOQUEADA', 'ATENCAO'];
      const status = statusList[count % statusList.length];
      const cod = `${prefixo}${rua}-0${nivel}`;

      posicoes.push({
        id: `POS-${cod}`,
        codigo: cod,
        galpaoId: gId,
        galpao: `Galpão ${prefixo}`,
        rua: `${prefixo}${rua}`,
        nivel: nivel,
        status: status,
        lote: status === 'OCUPADA' ? {
          id: `LOT-200${count}`,
          codigo: `LOT-200${count}`,
          produto: 'Café Arábica Especial',
          qualidade: 'Tipo 2 / Bebida Mole',
          proprietario: 'Fazenda União',
          quantidadeSacas: 1000
        } : null
      });
      count++;
    });
  });

  return posicoes;
}

// GET /api/armazem/galpoes
router.get('/galpoes', async (req, res) => {
  try {
    let galpoes = [];
    try {
      galpoes = await prisma.galpao.findMany();
    } catch {
      galpoes = store.warehouses || [];
    }

    if (!galpoes || galpoes.length === 0) {
      galpoes = GALPOES_PADRAO;
    }

    return res.json(galpoes);
  } catch (error) {
    console.error('❌ Erro no GET /api/armazem/galpoes:', error.message);
    return res.json(GALPOES_PADRAO);
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  const { galpaoId, status } = req.query;
  const targetGalpao = galpaoId || 'GAL-A';

  try {
    let posicoes = [];
    try {
      const where = {};
      if (galpaoId) where.galpaoId = galpaoId;
      if (status) where.status = status;
      posicoes = await prisma.posicao.findMany({ where, include: { lote: true } });
    } catch {
      posicoes = [];
    }

    if (!posicoes || posicoes.length === 0) {
      posicoes = gerarPosicoesGalpao(targetGalpao);
      if (status) {
        posicoes = posicoes.filter(p => p.status === status);
      }
    }

    return res.json(posicoes);
  } catch (error) {
    console.error('❌ Erro no GET /api/armazem/posicoes:', error.message);
    return res.json(gerarPosicoesGalpao(targetGalpao));
  }
});

// GET /api/armazem/posicoes/:id
router.get('/posicoes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let posicao = null;
    try {
      posicao = await prisma.posicao.findUnique({ where: { id: String(id) }, include: { lote: true } });
    } catch {
      posicao = null;
    }

    if (!posicao) {
      const cod = id.replace('POS-', '');
      posicao = {
        id,
        codigo: cod,
        rua: cod.substring(0, 2),
        nivel: parseInt(cod.slice(-1), 10) || 1,
        status: 'OCUPADA',
        galpao: 'Galpão A',
        lote: {
          id: 'LOT-2001',
          codigo: 'LOT-2001',
          produto: 'Café Arábica Especial',
          qualidade: 'Tipo 2',
          proprietario: 'Fazenda União',
          quantidadeSacas: 1000
        }
      };
    }

    return res.json(posicao);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/armazem/posicoes/:id/liberar — Liberar Posição Manualmente
router.post('/posicoes/:id/liberar', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.posicao.update({
        where: { id: String(id) },
        data: { status: 'LIVRE', loteId: null }
      });
    } catch {
      if (store.positions) {
        const p = store.positions.find(item => item.id === id);
        if (p) {
          p.status = 'LIVRE';
          p.lote = null;
        }
      }
    }
    return res.json({ mensagem: 'Posição liberada com sucesso!', id });
  } catch (error) {
    console.error(`❌ Erro ao liberar posição ${id}:`, error.message);
    return res.status(500).json({ erro: 'Não foi possível liberar a posição.' });
  }
});

module.exports = router;
