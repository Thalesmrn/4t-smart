const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarLote(l) {
  const agora = new Date().toISOString();
  
  // Se o lote veio do banco com um código preenchido (sem ser UUID), usa ele;
  // se o código for um UUID ou estiver vazio, gera o formato legível LOT-XXXX
  const codigoLegivel = (l?.codigo && !l.codigo.includes('-')) 
    ? l.codigo 
    : `LOT-${l?.id ? l.id.slice(0, 5).toUpperCase() : Math.floor(1000 + Math.random() * 9000)}`;

  return {
    // Sobrescrevemos a propriedade id com o código amigável para enganar o frontend
    id: codigoLegivel,
    idReal: l?.id,
    codigo: codigoLegivel,
    produto: l?.produto || "Café Arábico",
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

// GET: Lista os lotes formatados
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

// POST: Grava novo lote no Supabase
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

    console.log('✅ Lote salvo com sucesso no PostgreSQL:', novoLote);
    res.status(201).json(normalizarLote(novoLote));
  } catch (error) {
    console.error('❌ Erro ao cadastrar lote via Prisma:', error);
    res.status(500).json({ erro: "Não foi possível salvar o lote no banco de dados." });
  }
});

module.exports = router;
