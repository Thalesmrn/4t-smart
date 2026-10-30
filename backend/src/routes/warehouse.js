const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// Função para gerar as posições da grade do armazém (Ruas A1 a A5 com níveis 01 a 04)
function gerarGradeArmazem() {
  const posicoes = [];
  const ruas = ['A1', 'A2', 'A3', 'A4', 'A5'];
  const niveis = [1, 2, 3, 4];

  let count = 1;
  ruas.forEach((rua) => {
    niveis.forEach((nivel) => {
      const statusList = ['LIVRE', 'OCUPADA', 'LIVRE', 'BLOQUEADA', 'ATENCAO', 'OCUPADA'];
      const status = statusList[(count - 1) % statusList.length];
      const cod = `${rua}-0${nivel}`;

      posicoes.push({
        id: `POS-${cod}`,
        codigo: cod,
        rua: rua,
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

// GET /api/armazem/galpoes (Retorna galpão único)
router.get('/galpoes', async (req, res) => {
  return res.json([
    { id: 'GAL-A', nome: 'Armazém Central — Grãos & Sacarias', totalPosicoes: 100 }
  ]);
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  try {
    let posicoes = [];
    try {
      posicoes = await prisma.posicao.findMany({ include: { lote: true } });
    } catch {
      posicoes = store.positions || [];
    }

    if (!posicoes || posicoes.length === 0) {
      posicoes = gerarGradeArmazem();
      store.positions = posicoes;
    }

    return res.json(posicoes);
  } catch (error) {
    console.error('❌ Erro GET /api/armazem/posicoes:', error.message);
    return res.json(gerarGradeArmazem());
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
      posicao = (store.positions || []).find(p => p.id === id);
    }

    if (!posicao) {
      const cod = id.replace('POS-', '');
      posicao = {
        id,
        codigo: cod,
        rua: cod.substring(0, 2),
        nivel: parseInt(cod.slice(-1), 10) || 1,
        status: 'LIVRE',
        lote: null
      };
    }

    return res.json(posicao);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/armazem/posicoes/:id/alterar-status (Bloquear / Desbloquear / Alterar Status)
router.post('/posicoes/:id/alterar-status', async (req, res) => {
  const { id } = req.params;
  const { novoStatus } = req.body || {};

  if (!novoStatus) {
    return res.status(400).json({ erro: 'O novo status é obrigatório.' });
  }

  try {
    try {
      await prisma.posicao.update({
        where: { id: String(id) },
        data: {
          status: novoStatus,
          loteId: novoStatus === 'LIVRE' || novoStatus === 'BLOQUEADA' ? null : undefined
        }
      });
    } catch {
      if (store.positions) {
        const p = store.positions.find(item => item.id === id);
        if (p) {
          p.status = novoStatus;
          if (novoStatus === 'LIVRE' || novoStatus === 'BLOQUEADA') {
            p.lote = null;
          }
        }
      }
    }
    return res.json({ mensagem: `Status alterado para ${novoStatus} com sucesso!`, id, novoStatus });
  } catch (error) {
    console.error(`❌ Erro ao alterar status da posição ${id}:`, error.message);
    return res.status(500).json({ erro: 'Não foi possível alterar o status da posição.' });
  }
});

// POST /api/armazem/posicoes/:id/liberar (Compatibilidade)
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
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
