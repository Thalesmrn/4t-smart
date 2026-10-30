const express = require('express');
const router = express.Router();
const store = require('../data/store');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://feZuKOTkk1P5usjRVdO5tw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_feZuKOTkk1P5usjRVdO5tw_SwXZ9bGS";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

function formatarEmpilhadeira(e, index) {
  let nomeExibicao = e.nome || e.modelo;

  if (!nomeExibicao || nomeExibicao.length > 20 || nomeExibicao === e.id) {
    nomeExibicao = `EMP-0${index + 1}`;
  }

  return {
    ...e,
    id: e.id,
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
    const response = await fetch(`${SUPABASE_URL}/rest/v1/empilhadeira?select=*`, {
      method: "GET",
      headers
    });

    let empilhadeiras = [];
    if (response.ok) {
      empilhadeiras = await response.json();
    }

    if (!empilhadeiras || empilhadeiras.length === 0) {
      empilhadeiras = store.forklifts || [];
    }

    return res.json(empilhadeiras.map(formatarEmpilhadeira));
  } catch (error) {
    console.error('❌ Erro no GET /api/empilhadeiras via REST:', error.message);
    const mem = store.forklifts || [];
    return res.json(mem.map(formatarEmpilhadeira));
  }
});

// POST /api/empilhadeiras
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = body.nome?.trim() || body.modelo?.trim() || 'EMP-05';
    const operador = body.operador?.trim() || 'Operador Responsável';
    const cap = parseInt(body.capacidadeKg || body.capacidade || 2500, 10);

    const payload = {
      nome,
      operador,
      capacidadeKg: cap,
      status: 'DISPONIVEL'
    };

    let nova;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/empilhadeira`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      nova = data[0] || payload;
      console.log('✅ Empilhadeira salva no Supabase via REST:', nova);
    } else {
      nova = { id: `emp-${Date.now()}`, ...payload };
      if (!store.forklifts) store.forklifts = [];
      store.forklifts.push(nova);
    }

    return res.status(201).json(formatarEmpilhadeira(nova, 0));
  } catch (error) {
    console.error('❌ ERRO AO CADASTRAR EMPILHADEIRA:', error.message);
    return res.status(500).json({ erro: error.message });
  }
});

// DELETE /api/empilhadeiras/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/empilhadeira?id=eq.${id}`, {
      method: "DELETE",
      headers
    });

    if (store.forklifts) {
      store.forklifts = store.forklifts.filter(item => String(item.id) !== String(id));
    }

    return res.json({ mensagem: 'Empilhadeira excluída com sucesso!', id });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
