const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Auxiliar de formatação para garantir retorno consistente
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
    const lotes = await prisma.lote.findMany({
      orderBy: { createdAt: 'desc' }
    }).catch(async () => {
      // Fallback sem ordenação caso createdAt não exista no schema
      return await prisma.lote.findMany().catch(() => []);
    });

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
    console.log('📥 Payload recebido no /api/lotes:', body);

    if (!body.produto || !body.produto.trim()) {
      return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    }

    const sacas = parseInt(body.quantidadeSacas || body.sacas || 1000, 10);
    const count = await prisma.lote.count().catch(() => 0);
    const codigoFormatado = `LOT-${2000 + count + 1}`;

    let novoLote = null;

    // Tentativa 1: Inserção padrão com código customizado
    try {
      novoLote = await prisma.lote.create({
        data: {
          codigo: codigoFormatado,
          produto: body.produto.trim(),
          qualidade: body.qualidade?.trim() || 'Tipo 2',
          proprietario: body.proprietario?.trim() || 'Fazenda União',
          quantidadeSacas: sacas,
          status: 'AGUARDANDO_DESCARGA'
        }
      });
    } catch (err1) {
      console.warn('⚠️ Tentativa 1 falhou no Prisma:', err1.message);

      // Tentativa 2: Mapeamento alternativo de nomes de colunas
      try {
        novoLote = await prisma.lote.create({
          data: {
            produto: body.produto.trim(),
            qualidade: body.qualidade?.trim() || 'Tipo 2',
            proprietario: body.proprietario?.trim() || 'Fazenda União',
            status: 'AGUARDANDO_DESCARGA'
          }
        });
      } catch (err2) {
        console.error('❌ ERRO CRÍTICO NO BANCO (Tentativa 2):', err2.message);
        // Lança o erro real para o frontend em vez de mascarar!
        return res.status(500).json({ 
          erro: `Falha no Supabase/Prisma: ${err2.message}` 
        });
      }
    }

    console.log('✅ Lote salvo com sucesso no banco:', novoLote);
    return res.json(formatarLote(novoLote));

  } catch (error) {
    console.error('❌ Erro inesperado ao criar lote:', error);
    return res.status(500).json({ erro: error.message || 'Erro interno no servidor.' });
  }
});

module.exports = router;
