const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarEmpilhadeira(e) {
  const agora = new Date().toISOString();
  return {
    id: e?.id || "EMP-01",
    codigo: e?.identificador || e?.codigo || "EMP-01",
    nome: e?.identificador || e?.nome || "Empilhadeira 01",
    modelo: "Toyota 8FGU25",
    operador: e?.operador || "Sem Operador",
    status: e?.status || "DISPONIVEL",
    posicaoAtualId: "A-01",
    distanciaPercorridaHojeM: 0,
    bateriaPct: e?.bateria ?? 100,
    horasUso: 0,
    capacidadeKg: 2500,
    velocidadeMedia: 0,
    criadoEm: agora,
    atualizadoEm: agora,
    ultimaManutencao: agora,
    dataHora: agora,
    tarefaAtual: null
  };
}

// GET: Lista empilhadeiras do Supabase
router.get('/', async (req, res) => {
  try {
    const empilhadeiras = await prisma.empilhadeira.findMany();

    if (empilhadeiras && empilhadeiras.length > 0) {
      return res.json(empilhadeiras.map(normalizarEmpilhadeira));
    }

    res.json([normalizarEmpilhadeira({})]);
  } catch (error) {
    console.error('❌ Erro ao buscar empilhadeiras no Supabase:', error);
    res.json([normalizarEmpilhadeira({})]);
  }
});

// POST: Salva a nova empilhadeira no Supabase de verdade
router.post('/', async (req, res) => {
  try {
    const { nome, identificador, operador } = req.body;
    const nomeIdentificador = identificador || nome || `EMP-${Date.now()}`;

    const novaEmpilhadeira = await prisma.empilhadeira.create({
      data: {
        identificador: nomeIdentificador,
        operador: operador || "Sem Operador",
        status: "DISPONIVEL",
        bateria: 100
      }
    });

    console.log('✅ Empilhadeira gravada com sucesso no PostgreSQL:', novaEmpilhadeira);
    res.status(201).json(normalizarEmpilhadeira(novaEmpilhadeira));
  } catch (error) {
    console.error('❌ Erro ao salvar empilhadeira no Supabase:', error);
    res.status(500).json({ erro: "Erro ao gravar empilhadeira no banco de dados." });
  }
});

module.exports = router;
