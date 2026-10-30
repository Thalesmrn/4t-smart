const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

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
    let lotes = [];
    try {
      lotes = await prisma.lote.findMany();
    } catch {
      lotes = store.lots || [];
    }

    if (!lotes || lotes.length === 0) {
      lotes = store.lots || [];
    }

    return res.json(lotes.map(formatarLote));
  } catch (error) {
    console.error('❌ Erro no GET /api/lotes:', error);
    return res.json((store.lots || []).map(formatarLote));
  }
});

// POST /api/lotes
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.produto || !body.produto.trim()) {
      return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    }

    const qtdNum = parseInt(body.quantidadeSacas || body.quantidade || body.sacas || 1000, 10);
    let novoLote;

    try {
      const count = await prisma.lote.count().catch(() => 0);
      const codigoFormatado = `LOT-${2000 + count + 1}`;

      novoLote = await prisma.lote.create({
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
    } catch (dbError) {
      console.warn('⚠️ Erro ao salvar no Prisma/Supabase, gravando em memória:', dbError.message);
      
      const id = `lot-${Date.now()}`;
      novoLote = {
        id,
        codigo: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
        produto: body.produto.trim(),
        qualidade: body.qualidade?.trim() || 'Tipo 2',
        proprietario: body.proprietario?.trim() || 'Fazenda União',
        quantidade: qtdNum,
        quantidadeSacas: qtdNum,
        status: 'AGUARDANDO_DESCARGA'
      };

      if (!store.lots) store.lots = [];
      store.lots.push(novoLote);
    }

    return res.status(201).json(formatarLote(novoLote));

  } catch (error) {
    console.error('❌ ERRO CRÍTICO AO GRAVAR LOTE:', error.message);
    return res.status(500).json({ erro: `Falha ao cadastrar lote: ${error.message}` });
  }
});

// DELETE /api/lotes/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.lote.delete({ where: { id: String(id) } });
    } catch (dbErr) {
      if (store.lots) {
        store.lots = store.lots.filter(l => String(l.id) !== String(id));
      }
    }
    return res.json({ mensagem: 'Lote excluído com sucesso!', id });
  } catch (error) {
    console.error(`❌ Erro ao deletar lote ${id}:`, error.message);
    return res.status(500).json({ erro: 'Não foi possível excluir o lote.' });
  }
});

module.exports = router;
