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

function formatarLote(l) {
  let codigoAmigavel = l.codigo || l.id;
  if (!codigoAmigavel || String(codigoAmigavel).length > 20) {
    const num = String(l.id || '').replace(/\D/g, '').slice(0, 4) || '2001';
    codigoAmigavel = `LOT-${num}`;
  }

  return {
    ...l,
    id: l.id,
    codigo: codigoAmigavel,
    produto: l.produto || 'Café comum',
    qualidade: l.qualidade || 'Tipo 2',
    proprietario: l.proprietario || 'Fazenda União',
    quantidadeSacas: l.quantidade || l.quantidadeSacas || l.sacas || 1000,
    status: l.status || 'AGUARDANDO_DESCARGA'
  };
}

// GET /api/lotes
router.get('/', async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/lote?select=*`, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      throw new Error(`Erro Supabase REST: ${response.status}`);
    }

    const lotes = await response.json();
    return res.json(lotes.map(formatarLote));
  } catch (error) {
    console.error('❌ Erro no GET /api/lotes via REST:', error.message);
    const lotesMemoria = store.lots || [];
    return res.json(lotesMemoria.map(formatarLote));
  }
});

// POST /api/lotes (Gravação definitiva no Supabase)
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.produto || !body.produto.trim()) {
      return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    }

    const qtdNum = parseInt(body.quantidadeSacas || body.quantidade || body.sacas || 1000, 10);

    let count = 0;
    try {
      const resCount = await fetch(`${SUPABASE_URL}/rest/v1/lote?select=id`, { headers });
      if (resCount.ok) {
        const dataCount = await resCount.json();
        count = dataCount.length;
      }
    } catch (e) {
      count = store.lots?.length || 0;
    }

    const codigoFormatado = `LOT-${2000 + count + 1}`;

    const novoLotePayload = {
      codigo: codigoFormatado,
      produto: body.produto.trim(),
      qualidade: body.qualidade?.trim() || 'Tipo 2',
      proprietario: body.proprietario?.trim() || 'Fazenda União',
      quantidade: qtdNum,
      status: 'AGUARDANDO_DESCARGA'
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/lote`, {
      method: "POST",
      headers,
      body: JSON.stringify(novoLotePayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Erro Supabase REST POST:', errText);
      throw new Error(`Erro Supabase: ${response.status}`);
    }

    const lotesSalvos = await response.json();
    const novoLote = lotesSalvos[0] || novoLotePayload;

    console.log('✅ Lote gravado no Supabase via REST:', novoLote);
    return res.status(201).json(formatarLote(novoLote));

  } catch (error) {
    console.error('⚠️ Falha ao gravar no Supabase REST, salvando em memória:', error.message);

    const id = `lot-${Date.now()}`;
    const novoLoteMemoria = {
      id,
      codigo: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      produto: req.body?.produto?.trim() || 'Café Comum',
      qualidade: req.body?.qualidade?.trim() || 'Tipo 2',
      proprietario: req.body?.proprietario?.trim() || 'Fazenda União',
      quantidade: parseInt(req.body?.quantidadeSacas || 1000, 10),
      status: 'AGUARDANDO_DESCARGA'
    };

    if (!store.lots) store.lots = [];
    store.lots.push(novoLoteMemoria);

    return res.status(201).json(formatarLote(novoLoteMemoria));
  }
});

// DELETE /api/lotes/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/lote?id=eq.${id}`, {
      method: "DELETE",
      headers
    });

    if (!response.ok) {
      console.warn(`⚠️ Não foi possível deletar lote ${id} no Supabase.`);
    }

    if (store.lots) {
      store.lots = store.lots.filter(l => String(l.id) !== String(id));
    }

    return res.json({ mensagem: 'Lote excluído com sucesso!', id });
  } catch (error) {
    console.error(`❌ Erro ao deletar lote ${id}:`, error.message);
    return res.status(500).json({ erro: `Erro ao excluir lote: ${error.message}` });
  }
});

module.exports = router;
