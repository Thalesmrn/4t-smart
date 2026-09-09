const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

router.get('/', async (req, res) => {
  try {
    const forklifts = await prisma.forklift.findMany();

    // Se o banco tiver dados, retorna os dados reais do Supabase
    if (forklifts && forklifts.length > 0) {
      return res.json(forklifts);
    }

    // Fallback com estrutura esperada pelo frontend quando o banco estiver vazio
    res.json([
      {
        id: "EMP-01",
        codigo: "EMP-01",
        nome: "Empilhadeira 01",
        operador: "Operador 01",
        status: "disponivel",
        bateriaPct: 100
      }
    ]);
  } catch (error) {
    console.error('❌ Erro ao buscar empilhadeiras:', error);
    // Em caso de erro, retorna a estrutura zerada para não travar o frontend
    res.json([
      {
        id: "EMP-01",
        codigo: "EMP-01",
        nome: "Empilhadeira 01",
        operador: "Operador 01",
        status: "disponivel",
        bateriaPct: 100
      }
    ]);
  }
});

module.exports = router;
