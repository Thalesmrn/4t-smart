const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Listar todos os lotes
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(lotes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lotes no banco de dados.' });
  }
});

// Buscar lote por ID ou Código
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lote = await prisma.lote.findFirst({
      where: {
        OR: [{ id: id }, { codigo: id }]
      }
    });

    if (!lote) {
      return res.status(404).json({ error: 'Lote não encontrado.' });
    }

    res.json(lote);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lote.' });
  }
});

// Criar um novo lote
router.post('/', async (req, res) => {
  try {
    const { codigo, produto, quantidade, status } = req.body;

    const novoLote = await prisma.lote.create({
      data: {
        codigo,
        produto,
        quantidade: parseInt(quantidade, 10),
        status: status || 'DISPONIVEL'
      }
    });

    res.status(201).json(novoLote);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar lote. Verifique se o código já existe.' });
  }
});

// Atualizar um lote
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, produto, quantidade, status } = req.body;

    const loteAtualizado = await prisma.lote.update({
      where: { id },
      data: {
        codigo,
        produto,
        quantidade: quantidade ? parseInt(quantidade, 10) : undefined,
        status
      }
    });

    res.json(loteAtualizado);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar lote.' });
  }
});

// Excluir um lote
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lote.delete({ where: { id } });
    res.json({ message: 'Lote removido com sucesso.' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao remover lote.' });
  }
});

module.exports = router;