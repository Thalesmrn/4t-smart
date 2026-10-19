const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function formatarLote(l) {
  let codigoAmigavel = l.codigo || l.id;
  if (!codigoAmigavel || codigoAmigavel.length > 20) {
    const num = (l.id || '').replace(/\D/g, '').slice(0, 4) || '2001';
    codigoAmigavel = `LOT-${num}`;
  }

  return {
    ...l,
    id: codigoAmigavel,
    codigo: codigoAmigavel,
    produto: l.produto || 'Café Arábica',
    qualidade: l.qualidade || 'Tipo 2',
    proprietario: l.proprietario || 'Produtor Local',
    quantidadeSacas: l.quantidadeSacas || l.sacas || 1000,
    status: l.status || 'AGUARDANDO_DESCARGA'
  };
}

// GET /api/lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany().catch(() => []);
    
    // Transforma e formata os lotes do banco
    const lotesFormatados = lotes.map(formatarLote);

    return res.json(lotesFormatados);
  } catch (error) {
    console.error('❌ Erro ao buscar lotes:', error);
    return res.json([]);
  }
});

// POST /api/lotes
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    
    if (!body.produto || !body.produto.trim()) {
      return res.status(400).json({ erro: "O nome do produto é obrigatório." });
    }

    const count = await prisma.lote.count().catch(() => 0);
    const novoCodigo = `LOT-${2000 + count + 1}`;
    const sacas = parseInt(body.quantidadeSacas || body.sacas || 1000, 10);

    // Tenta salvar no Supabase via Prisma
    let novoLote = null;
    try {
      novoLote = await prisma.lote.create({
        data: {
          id: novoCodigo,
          codigo: novoCodigo,
          produto: body.produto.trim(),
          qualidade: body.qualidade?.trim() || 'Tipo 2',
          proprietario: body.proprietario?.trim() || 'Produtor Local',
          quantidadeSacas: sacas,
          status: 'AGUARDANDO_DESCARGA'
        }
      });
    } catch (dbErr) {
      console.warn('⚠️ Fallback na criação do lote (tentando sem ID manual):', dbErr.message);
      novoLote = await prisma.lote.create({
        data: {
          produto: body.produto.trim(),
          qualidade: body.qualidade?.trim() || 'Tipo 2',
          proprietario: body.proprietario?.trim() || 'Produtor Local',
          quantidadeSacas: sacas,
          status: 'AGUARDANDO_DESCARGA'
        }
      }).catch(() => null);
    }

    // Se o banco salvou com sucesso
    if (novoLote) {
      return res.json(formatarLote(novoLote));
    }

    // Retorno estruturado caso o banco não responda
    return res.json({
      id: novoCodigo,
      codigo: novoCodigo,
      produto: body.produto.trim(),
      qualidade: body.qualidade?.trim() || 'Tipo 2',
      proprietario: body.proprietario?.trim() || 'Produtor Local',
      quantidadeSacas: sacas,
      status: 'AGUARDANDO_DESCARGA'
    });
  } catch (error) {
    console.error('❌ Erro ao criar lote:', error);
    return res.status(500).json({ erro: 'Erro interno ao cadastrar lote.' });
  }
});

module.exports = router;
