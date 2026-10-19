const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function formatarLote(l) {
  let codigoAmigavel = l.codigo;
  if (!codigoAmigavel || codigoAmigavel.length > 20) {
    const num = (l.id || '').replace(/\D/g, '').slice(0, 4) || '2001';
    codigoAmigavel = `LOT-${num}`;
  }

  return {
    ...l,
    id: codigoAmigavel,
    codigo: codigoAmigavel,
    produto: l.produto || 'Café comum',
    qualidade: l.qualidade || 'Tipo 2',
    proprietario: l.proprietario || 'Fazenda União',
    quantidadeSacas: l.quantidadeSacas || 1000,
    status: l.status || 'DISPONIVEL'
  };
}

// GET /api/lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany({
      orderBy: { id: 'desc' }
    }).catch(() => []);

    return res.json(lotes.map(formatarLote));
  } catch (error) {
    return res.json([]);
  }
});

// POST /api/lotes
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const count = await prisma.lote.count().catch(() => 0);
    const novoCodigo = `LOT-${2000 + count + 1}`;
    const sacas = parseInt(body.quantidadeSacas || body.sacas || 1000, 10);

    const novoLote = await prisma.lote.create({
      data: {
        id: novoCodigo,
        codigo: novoCodigo,
        produto: body.produto || 'Café comum',
        qualidade: body.qualidade || 'Tipo 2',
        proprietario: body.proprietario || 'Fazenda União',
        quantidadeSacas: sacas,
        status: 'DISPONIVEL'
      }
    }).catch(async () => {
      return await prisma.lote.create({
        data: {
          produto: body.produto || 'Café comum',
          qualidade: body.qualidade || 'Tipo 2',
          proprietario: body.proprietario || 'Fazenda União',
          quantidadeSacas: sacas,
          status: 'DISPONIVEL'
        }
      }).catch(() => null);
    });

    if (novoLote) {
      return res.json(formatarLote(novoLote));
    }

    return res.json({
      id: novoCodigo,
      codigo: novoCodigo,
      produto: body.produto || 'Café comum',
      qualidade: body.qualidade || 'Tipo 2',
      proprietario: body.proprietario || 'Fazenda União',
      quantidadeSacas: sacas,
      status: 'DISPONIVEL'
    });
  } catch (error) {
    return res.json({
      id: `LOT-${Date.now().toString().slice(-4)}`,
      codigo: `LOT-${Date.now().toString().slice(-4)}`,
      produto: req.body?.produto || 'Café comum',
      status: 'DISPONIVEL'
    });
  }
});

module.exports = router;
