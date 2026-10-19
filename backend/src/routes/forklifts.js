const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/empilhadeiras
router.get('/', async (req, res) => {
  try {
    const lista = await prisma.empilhadeira.findMany().catch(() => []);
    return res.json(Array.isArray(lista) ? lista : []);
  } catch (error) {
    return res.json([]);
  }
});

// POST /api/empilhadeiras (Cadastrar Nova Empilhadeira)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = body.nome || body.identificacao;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O nome da empilhadeira é obrigatório.' });
    }

    const capacidade = parseInt(body.capacidadeKg || body.capacidade || 2500, 10);
    const operador = body.operador || body.operadorResponsavel || 'Operador Responsável';

    // Tenta gravar no Prisma / Supabase
    let novaEmp = await prisma.empilhadeira.create({
      data: {
        nome: nome.trim(),
        operador: operador.trim(),
        capacidadeKg: capacidade,
        status: 'DISPONIVEL'
      }
    }).catch(async (err) => {
      console.warn('⚠️ Tentativa 1 de empilhadeira falhou:', err.message);
      // Tentativa 2 sem o campo capacidadeKg caso o schema divirja
      return await prisma.empilhadeira.create({
        data: {
          nome: nome.trim(),
          operador: operador.trim(),
          status: 'DISPONIVEL'
        }
      }).catch((err2) => {
        throw new Error(err2.message);
      });
    });

    console.log('✅ Empilhadeira criada com sucesso:', novaEmp);
    return res.json(novaEmp);
  } catch (error) {
    console.error('❌ Erro ao criar empilhadeira:', error.message);
    return res.status(500).json({ erro: `Erro ao salvar empilhadeira: ${error.message}` });
  }
});

module.exports = router;
