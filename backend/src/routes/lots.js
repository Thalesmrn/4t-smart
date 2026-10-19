const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Formatação padronizada para retorno visual
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
    quantidadeSacas: l.quantidadeSacas || l.sacas || 1000,
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

// POST /api/lotes (Cadastrar Lote Real)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.produto || !body.produto.trim()) {
      return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    }

    const count = await prisma.lote.count().catch(() => 0);
    const codigoFormatado = `LOT-${2000 + count + 1}`;
    const sacasNum = parseInt(body.quantidadeSacas || body.sacas || 1000, 10);

    let novoLote = null;

    // Tentativa principal: Inserção com todos os campos exigidos pelo Prisma
    try {
      novoLote = await prisma.lote.create({
        data: {
          codigo: codigoFormatado,
          produto: body.produto.trim(),
          qualidade: body.qualidade?.trim() || 'Tipo 2',
          proprietario: body.proprietario?.trim() || 'Fazenda União',
          sacas: sacasNum,
          status: 'AGUARDANDO_DESCARGA'
        }
      });
    } catch (err1) {
      // Tentativa alternativa caso o nome da coluna no schema seja quantidadeSacas
      try {
        novoLote = await prisma.lote.create({
          data: {
            codigo: codigoFormatado,
            produto: body.produto.trim(),
            qualidade: body.qualidade?.trim() || 'Tipo 2',
            proprietario: body.proprietario?.trim() || 'Fazenda União',
            quantidadeSacas: sacasNum,
            status: 'AGUARDANDO_DESCARGA'
          }
        });
      } catch (err2) {
        // Tentativa alternativa só com os campos obrigatórios incluindo 'codigo'
        try {
          novoLote = await prisma.lote.create({
            data: {
              codigo: codigoFormatado,
              produto: body.produto.trim(),
              qualidade: body.qualidade?.trim() || 'Tipo 2',
              proprietario: body.proprietario?.trim() || 'Fazenda União',
              status: 'AGUARDANDO_DESCARGA'
            }
          });
        } catch (err3) {
          console.error('❌ ERRO AO GRAVAR NO SUPABASE:', err3.message);
          return res.status(500).json({ erro: `Falha no Supabase/Prisma: ${err3.message}` });
        }
      }
    }

    console.log('✅ Lote gravado com sucesso no Supabase:', novoLote);
    return res.json(formatarLote(novoLote));

  } catch (error) {
    console.error('❌ Erro inesperado ao criar lote:', error);
    return res.status(500).json({ erro: error.message || 'Erro interno no servidor.' });
  }
});

module.exports = router;
