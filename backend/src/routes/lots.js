const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarLote(l) {
  const agora = new Date().toISOString();
  const codigoLegivel = l?.codigo || `LOT-${l?.id ? l.id.slice(0, 5).toUpperCase() : '0000'}`;

  return {
    id: codigoLegivel,
    idReal: l?.id,
    codigo: codigoLegivel,
    produto: l?.produto || "Café Arábico",
    status: l?.status || "DISPONIVEL",
    quantidadeBags: l?.quantidade ?? 0,
    pesoTotalKg: (l?.quantidade ?? 0) * 1000,
    pesoMedioBagKg: 1000,
    criadoEm: l?.createdAt || agora,
    atualizadoEm: l?.updatedAt || agora
  };
}

// GET: Lista lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany();
    res.json(lotes.map(normalizarLote));
  } catch (error) {
    console.error('❌ Erro ao buscar lotes no banco:', error);
    res.status(500).json({ erro: "Erro ao buscar lotes." });
  }
});

// POST: Grava novo lote
router.post('/', async (req, res) => {
  try {
    const { codigo, produto, quantidade, quantidadeBags } = req.body;

    const qtdFinal = quantidade ? Number(quantidade) : (quantidadeBags ? Number(quantidadeBags) : 1);
    const codigoFinal = codigo && codigo.trim() !== '' ? codigo : `LOT-${Math.floor(1000 + Math.random() * 9000)}`;
    const produtoFinal = produto || "Café Arábico";

    const novoLote = await prisma.lote.create({
      data: {
        codigo: codigoFinal,
        produto: produtoFinal,
        quantidade: qtdFinal,
        status: "DISPONIVEL"
      }
    });

    res.status(201).json(normalizarLote(novoLote));
  } catch (error) {
    console.error('❌ Erro ao cadastrar lote via Prisma:', error);
    res.status(500).json({ erro: "Não foi possível salvar o lote no banco de dados." });
  }
});

module.exports = router;
