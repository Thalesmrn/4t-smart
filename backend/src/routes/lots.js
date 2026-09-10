const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarLote(l) {
  const agora = new Date().toISOString();
  return {
    id: l?.id || "LOT-01",
    codigo: l?.codigo || "LOT-01",
    produto: l?.produto || "Grãos",
    status: l?.status || "DISPONIVEL",
    quantidadeBags: l?.quantidade ?? 0,
    pesoTotalKg: (l?.quantidade ?? 0) * 1000,
    pesoMedioBagKg: 1000,
    dataCriacao: l?.createdAt || agora,
    criadoEm: l?.createdAt || agora,
    atualizadoEm: l?.updatedAt || agora,
    dataEntrada: l?.createdAt || agora
  };
}

// GET: Lista os lotes gravados no Supabase
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany();

    if (lotes && lotes.length > 0) {
      return res.json(lotes.map(normalizarLote));
    }

    res.json([normalizarLote({})]);
  } catch (error) {
    console.error('❌ Erro ao buscar lotes no Supabase:', error);
    res.json([normalizarLote({})]);
  }
});

// POST: Grava um novo lote de café no Supabase de verdade
router.post('/', async (req, res) => {
  try {
    const { codigo, produto, quantidade, quantidadeBags, pesoTotalKg } = req.body;

    // Converte e trata os valores numéricos vindos do formulário
    const qtdFinal = quantidade ? Number(quantidade) : (quantidadeBags ? Number(quantidadeBags) : 1);
    const codigoFinal = codigo || `LOT-${Date.now()}`;
    const produtoFinal = produto || "Café Beneficiado";

    const novoLote = await prisma.lote.create({
      data: {
        codigo: codigoFinal,
        produto: produtoFinal,
        quantidade: qtdFinal,
        status: "DISPONIVEL"
      }
    });

    console.log('✅ Lote salvo com sucesso no PostgreSQL:', novoLote);
    res.status(201).json(normalizarLote(novoLote));
  } catch (error) {
    console.error('❌ Erro ao cadastrar lote via Prisma:', error);
    res.status(500).json({ erro: "Não foi possível salvar o lote no banco de dados." });
  }
});

module.exports = router;
