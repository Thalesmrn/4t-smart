const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Formatação para padronizar a resposta para o frontend
function formatarLote(l) {
  let codigoAmigavel = l.codigo || l.id;
  if (!codigoAmigavel || String(codigoAmigavel).length > 20) {
    const num = String(l.id || '').replace(/\D/g, '').slice(0, 4) || '2001';
    codigoAmigavel = `LOT-${num}`;
  }

  return {
    ...l,
    id: l.id,
    codigo: codigoAmigavel,
    produto: l.produto || 'Café comum',
    qualidade: l.qualidade || 'Tipo 2',
    proprietario: l.proprietario || 'Fazenda União',
    quantidadeSacas: l.quantidade || l.quantidadeSacas || l.sacas || 1000,
    status: l.status || 'AGUARDANDO_DESCARGA'
  };
}

// GET /api/lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany().catch(() => []);
    return res.json(lotes.map(formatarLote));
  } catch (error) {
    console.error('❌ Erro no GET /api/lotes:', error);
    return res.json([]);
  }
});

// POST /api/lotes (Cadastrar Lote Real no Supabase)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.produto || !body.produto.trim()) {
      return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    }

    const count = await prisma.lote.count().catch(() => 0);
    const codigoFormatado = `LOT-${2000 + count + 1}`;
    const qtdNum = parseInt(body.quantidadeSacas || body.quantidade || body.sacas || 1000, 10);

    // Gravação estrita conforme o schema do Prisma/Supabase
    const novoLote = await prisma.lote.create({
      data: {
        codigo: codigoFormatado,
        produto: body.produto.trim(),
        qualidade: body.qualidade?.trim() || 'Tipo 2',
        proprietario: body.proprietario?.trim() || 'Fazenda União',
        quantidade: qtdNum,
        status: 'AGUARDANDO_DESCARGA'
      }
    });

    console.log('✅ Lote gravado com sucesso no Supabase:', novoLote);
    return res.json(formatarLote(novoLote));

  } catch (error) {
    console.error('❌ ERRO CRÍTICO AO GRAVAR NO SUPABASE:', error.message);
    return res.status(500).json({ erro: `Falha no Supabase/Prisma: ${error.message}` });
  }
});

module.exports = router;
