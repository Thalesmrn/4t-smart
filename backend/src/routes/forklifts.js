const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

router.get('/', async (req, res) => {
  try {
    const empilhadeiras = await prisma.forklift.findMany();

    if (empilhadeiras && empilhadeiras.length > 0) {
      // Garante que todo objeto vindo do Supabase tenha os números e datas para o .toLocaleString()
      const formatadas = empilhadeiras.map(e => ({
        ...e,
        bateriaPct: e.bateriaPct ?? 100,
        horasUso: e.horasUso ?? 0,
        capacidadeKg: e.capacidadeKg ?? 2500,
        criadoEm: e.criadoEm || new Date().toISOString()
      }));
      return res.json(formatadas);
    }

    // Fallback completo caso a tabela esteja vazia
    res.json([
      {
        id: "EMP-01",
        codigo: "EMP-01",
        nome: "Empilhadeira 01",
        modelo: "Toyota 8FGU25",
        operador: "Operador 01",
        status: "DISPONIVEL",
        bateriaPct: 100,
        horasUso: 0,
        capacidadeKg: 2500,
        criadoEm: new Date().toISOString()
      }
    ]);
  } catch (error) {
    console.error('❌ Erro ao buscar empilhadeiras:', error);
    res.json([
      {
        id: "EMP-01",
        codigo: "EMP-01",
        nome: "Empilhadeira 01",
        modelo: "Toyota 8FGU25",
        operador: "Operador 01",
        status: "DISPONIVEL",
        bateriaPct: 100,
        horasUso: 0,
        capacidadeKg: 2500,
        criadoEm: new Date().toISOString()
      }
    ]);
  }
});

module.exports = router;
