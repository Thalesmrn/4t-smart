const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lot.findMany();

    if (lotes && lotes.length > 0) {
      const formatados = lotes.map(l => ({
        ...l,
        quantidadeBags: l.quantidadeBags ?? 0,
        pesoTotalKg: l.pesoTotalKg ?? 0,
        dataCriacao: l.dataCriacao || new Date().toISOString()
      }));
      return res.json(formatados);
    }

    res.json([]);
  } catch (error) {
    console.error('❌ Erro ao buscar lotes:', error);
    res.json([]);
  }
});

module.exports = router;
