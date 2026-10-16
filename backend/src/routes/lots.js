const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany().catch(() => []);
    res.json(Array.isArray(lotes) ? lotes : []);
  } catch (error) {
    console.error('❌ Erro ao buscar lotes:', error);
    res.json([]);
  }
});

module.exports = router;
