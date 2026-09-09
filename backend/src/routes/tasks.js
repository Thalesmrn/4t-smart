const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.task.findMany();
    // Se o banco estiver vazio, retorna um array vazio
    res.json(tarefas || []);
  } catch (error) {
    console.error('❌ Erro na busca de tarefas:', error);
    res.json([]);
  }
});

module.exports = router;
