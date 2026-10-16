const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

router.get('/', async (req, res) => {
  try {
    const posicoes = await prisma.posicao.findMany();
    res.json({ sugestoes: [], posicoes });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao carregar dados de slotting." });
  }
});

router.post('/recomendar', async (req, res) => {
  try {
    const posicoesLivres = await prisma.posicao.findMany({
      where: { status: "DISPONIVEL" },
      take: 5
    });
    res.json({ sugestoes: posicoesLivres });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao recomendar posições." });
  }
});

module.exports = router;
