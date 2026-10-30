const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

function formatarEmpilhadeira(e, index) {
  let nomeExibicao = e.nome || e.modelo;

  if (!nomeExibicao || nomeExibicao.length > 20 || nomeExibicao === e.id) {
    nomeExibicao = `EMP-0${index + 1}`;
  }

  return {
    ...e,
    id: String(e.id),
    nome: nomeExibicao,
    modelo: nomeExibicao,
    operador: e.operador || 'Operador Responsável',
    capacidadeKg: e.capacidadeKg || e.capacidade || 2500,
    status: e.status || 'DISPONIVEL'
  };
}

// GET /api/empilhadeiras
router.get('/', async (req, res) => {
  try {
    let empilhadeiras = [];
    try {
      empilhadeiras = await prisma.empilhadeira.findMany();
    } catch {
      empilhadeiras = store.forklifts || [];
    }

    if (!empilhadeiras || empilhadeiras.length === 0) {
      empilhadeiras = store.forklifts || [];
    }

    return res.json(empilhadeiras.map(formatarEmpilhadeira));
  } catch (error) {
    console.error('❌ Erro no GET /api/empilhadeiras:', error.message);
    return res.json((store.forklifts || []).map(formatarEmpilhadeira));
  }
});

// POST /api/empilhadeiras — Gravação Persistente
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = body.nome?.trim() || body.modelo?.trim() || 'EMP-05';
    const operador = body.operador?.trim() || 'Operador Responsável';
    const cap = parseInt(body.capacidadeKg || body.capacidade || 2500, 10);

    let nova;
    try {
      nova = await prisma.empilhadeira.create({
        data: {
          nome,
          operador,
          capacidadeKg: cap,
          status: 'DISPONIVEL'
        }
      });
      console.log('✅ Empilhadeira salva no Supabase:', nova);
    } catch (e) {
      console.warn('⚠️ Erro ao salvar no Supabase, salvando em memória local:', e.message);
      nova = {
        id: `emp-${Date.now()}`,
        nome,
        modelo: nome,
        operador,
        capacidadeKg: cap,
        status: 'DISPONIVEL'
      };
      if (!store.forklifts) store.forklifts = [];
      store.forklifts.unshift(nova);
    }

    const count = store.forklifts?.length || 1;
    return res.status(201).json(formatarEmpilhadeira(nova, count - 1));
  } catch (error) {
    console.error('❌ Erro ao cadastrar empilhadeira:', error.message);
    return res.status(500).json({ erro: error.message });
  }
});

// DELETE /api/empilhadeiras/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    try {
      await prisma.empilhadeira.delete({ where: { id: String(id) } });
    } catch (e) {
      if (store.forklifts) {
        store.forklifts = store.forklifts.filter(item => String(item.id) !== String(id));
      }
    }
    return res.json({ mensagem: 'Empilhadeira excluída com sucesso!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
