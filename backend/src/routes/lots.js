const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarLote(l) {
  const agora = new Date().toISOString();
  
  // Se o codigo estiver ausente ou for igual ao UUID, gera um código amigável estilo LOT-XXXX
  const codigoFormatado = (l?.codigo && !l.codigo.includes('-')) 
    ? l.codigo 
    : `LOT-${l?.id ? l.id.slice(0, 5).toUpperCase() : '01'}`;

  return {
    id: l?.id || "LOT-01",
    codigo: codigoFormatado,
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

// POST: Grava um novo lote e garante o salvamento do código amigável
router.post('/', async (req, res) => {
  try {
    const { codigo, produto, quantidade, quantidadeBags } = req.body;

    const qtdFinal = quantidade ? Number(quantidade) : (quantidadeBags ? Number(quantidadeBags) : 1);
    const codigoFinal = codigo && codigo.trim() !== '' ? codigo : `LOT-${Math.floor(1000 + Math.random() * 9000)}`;
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
