const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Listar todas as tarefas
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany({
      orderBy: { prioridade: 'asc' }
    });
    res.json(tarefas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas no banco de dados.' });
  }
});

// Buscar tarefa por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tarefa = await prisma.tarefa.findUnique({ where: { id } });

    if (!tarefa) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    res.json(tarefa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefa.' });
  }
});

// Criar uma nova tarefa
router.post('/', async (req, res) => {
  try {
    const { descricao, tipo, prioridade, status } = req.body;

    const novaTarefa = await prisma.tarefa.create({
      data: {
        descricao,
        tipo,
        prioridade: parseInt(prioridade, 10) || 1,
        status: status || 'PENDENTE'
      }
    });

    res.status(201).json(novaTarefa);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar tarefa.' });
  }
});

// Atualizar status ou dados da tarefa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, tipo, prioridade, status } = req.body;

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id },
      data: {
        descricao,
        tipo,
        prioridade: prioridade ? parseInt(prioridade, 10) : undefined,
        status
      }
    });

    res.json(tarefaAtualizada);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

// Excluir uma tarefa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tarefa.delete({ where: { id } });
    res.json({ message: 'Tarefa removida com sucesso.' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao remover tarefa.' });
  }
});

module.exports = router;