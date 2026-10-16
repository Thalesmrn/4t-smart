const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/tarefas
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany().catch(() => []);
    res.json(Array.isArray(tarefas) ? tarefas : []);
  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error);
    res.json([]);
  }
});

// GET /api/empilhadeiras
router.get('/empilhadeiras', async (req, res) => {
  try {
    const empilhadeiras = await prisma.empilhadeira.findMany().catch(() => []);
    res.json(Array.isArray(empilhadeiras) ? empilhadeiras : []);
  } catch (error) {
    console.error('❌ Erro ao buscar empilhadeiras:', error);
    res.json([]);
  }
});

module.exports = router;
