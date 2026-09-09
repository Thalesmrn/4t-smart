const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// Listar todas as empilhadeiras
router.get('/', async (req, res) => {
  try {
    const empilhadeiras = await prisma.empilhadeira.findMany();
    res.json(empilhadeiras);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar empilhadeiras no banco de dados.' });
  }
});

// Buscar empilhadeira por ID ou Identificador
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empilhadeira = await prisma.empilhadeira.findFirst({
      where: {
        OR: [{ id: id }, { identificador: id }]
      }
    });

    if (!empilhadeira) {
      return res.status(404).json({ error: 'Empilhadeira não encontrada.' });
    }

    res.json(empilhadeira);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar empilhadeira.' });
  }
});

// Criar nova empilhadeira
router.post('/', async (req, res) => {
  try {
    const { identificador, operador, status, bateria } = req.body;

    const novaEmpilhadeira = await prisma.empilhadeira.create({
      data: {
        identificador,
        operador: operador || null,
        status: status || 'DISPONIVEL',
        bateria: bateria !== undefined ? parseInt(bateria, 10) : 100
      }
    });

    res.status(201).json(novaEmpilhadeira);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar empilhadeira. O identificador deve ser único.' });
  }
});

// Atualizar dados ou status da empilhadeira
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { identificador, operador, status, bateria } = req.body;

    const empilhadeiraAtualizada = await prisma.empilhadeira.update({
      where: { id },
      data: {
        identificador,
        operador,
        status,
        bateria: bateria !== undefined ? parseInt(bateria, 10) : undefined
      }
    });

    res.json(empilhadeiraAtualizada);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar empilhadeira.' });
  }
});

// Excluir empilhadeira
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.empilhadeira.delete({ where: { id } });
    res.json({ message: 'Empilhadeira removida com sucesso.' });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao remover empilhadeira.' });
  }
});

module.exports = router;