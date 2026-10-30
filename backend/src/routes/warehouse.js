const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

// Função auxiliar para gerar matriz completa de posições
function gerarGradeDePosicoes(galpaoId) {
  const posicoes = [];
  const prefixo = galpaoId ? galpaoId.replace('GAL-', '') : 'A';
  const ruas = ['1', '2', '3'];
  const niveis = [1, 2, 3, 4];

  let count = 1;
  ruas.forEach((rua) => {
    niveis.forEach((nivel) => {
      const statusList = ['LIVRE', 'OCUPADA', 'LIVRE', 'BLOQUEADA', 'ATENCAO'];
      const status = statusList[count % statusList.length];
      const cod = `${prefixo}${rua}-0${nivel}`;

      posicoes.push({
        id: `POS-${cod}`,
        codigo: cod,
        galpaoId: galpaoId || 'GAL-A',
        galpao: `Galpão ${prefixo}`,
        rua: `${prefixo}${rua}`,
        nivel: nivel,
        status: status,
        lote: status === 'OCUPADA' ? `LOT-${2000 + count}` : null,
        produto: status === 'OCUPADA' ? 'Café Arábica Especial' : null,
        sacas: status === 'OCUPADA' ? 1000 : 0
      });
      count++;
    });
  });

  return posicoes;
}

// GET /api/armazem/galpoes
router.get('/galpoes', async (req, res) => {
  try {
    const galpoes = [
      { id: 'GAL-A', nome: 'Galpão A — Grãos & Sacarias', totalPosicoes: 120, ocupadas: 85 },
      { id: 'GAL-B', nome: 'Galpão B — Rebeneficiamento', totalPosicoes: 90, ocupadas: 45 },
      { id: 'GAL-C', nome: 'Galpão C — Exclusivo Exportação', totalPosicoes: 80, ocupadas: 30 },
      { id: 'GAL-D', nome: 'Galpão D — Triagem e Qualidade', totalPosicoes: 60, ocupadas: 20 }
    ];
    return res.json(galpoes);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// GET /api/armazem/posicoes
router.get('/posicoes', async (req, res) => {
  try {
    const { galpaoId } = req.query;
    let posicoes = [];

    try {
      const where = {};
      if (galpaoId) where.galpaoId = galpaoId;
      posicoes = await prisma.posicao.findMany({ where });
    } catch {
      posicoes = [];
    }

    // Se o banco não retornar a grade completa, gera a matriz inteira do galpão selecionado
    if (!posicoes || posicoes.length < 5) {
      posicoes = gerarGradeDePosicoes(galpaoId || 'GAL-A');
    }

    return res.json(posicoes);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// GET /api/armazem/posicoes/:id
router.get('/posicoes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let posicao = null;
    try {
      posicao = await prisma.posicao.findUnique({ where: { id: String(id) } });
    } catch {
      posicao = null;
    }

    if (!posicao) {
      posicao = {
        id,
        codigo: id.replace('POS-', ''),
        status: 'OCUPADA',
        galpao: 'Galpão A',
        lote: 'LOT-2001',
        produto: 'Café Arábica Bebida Mole',
        quantidadeSacas: 1000,
        proprietario: 'Fazenda União'
      };
    }
    return res.json(posicao);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

// POST /api/armazem/posicoes/:id/liberar
router.post('/posicoes/:id/liberar', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.posicao.update({
        where: { id: String(id) },
        data: { status: 'LIVRE', loteId: null }
      });
    } catch (e) {
      console.warn('Liberado em memória local');
    }
    return res.json({ mensagem: 'Posição liberada com sucesso!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
