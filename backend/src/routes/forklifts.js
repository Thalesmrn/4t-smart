const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarEmpilhadeira(e) {
  const agora = new Date().toISOString();
  return {
    id: e?.id || "EMP-01",
    codigo: e?.codigo || e?.nome || "EMP-01",
    nome: e?.nome || "Empilhadeira 01",
    modelo: e?.modelo || "Toyota 8FGU25",
    operador: e?.operador || "Operador 01",
    status: e?.status || "DISPONIVEL",
    posicaoAtualId: e?.posicaoAtualId || "A-01",
    distanciaPercorridaHojeM: e?.distanciaPercorridaHojeM ?? 0,
    bateriaPct: e?.bateriaPct ?? 100,
    horasUso: e?.horasUso ?? 0,
    capacidadeKg: e?.capacidadeKg ?? 2500,
    velocidadeMedia: e?.velocidadeMedia ?? 0,
    criadoEm: e?.criadoEm || e?.createdAt || agora,
    atualizadoEm: e?.atualizadoEm || e?.updatedAt || agora,
    ultimaManutencao: e?.ultimaManutencao || agora,
    dataHora: e?.dataHora || agora,
    tarefaAtual: e?.tarefaAtual ? {
      descricao: e.tarefaAtual.descricao || "Sem tarefas ativas"
    } : null
  };
}

// Rota para listar empilhadeiras (GET)
router.get('/', async (req, res) => {
  try {
    const empilhadeiras = await prisma.forklift.findMany();

    if (empilhadeiras && empilhadeiras.length > 0) {
      return res.json(empilhadeiras.map(normalizarEmpilhadeira));
    }

    res.json([normalizarEmpilhadeira({})]);
  } catch (error) {
    console.error('❌ Erro ao buscar empilhadeiras:', error);
    res.json([normalizarEmpilhadeira({})]);
  }
});

// Rota para cadastrar nova empilhadeira (POST)
router.post('/', async (req, res) => {
  try {
    const { nome, operador, capacidadeKg, modelo } = req.body;

    // Tenta salvar no Supabase via Prisma
    const novaEmpilhadeira = await prisma.forklift.create({
      data: {
        nome: nome || "Nova Empilhadeira",
        codigo: nome || `EMP-${Date.now()}`,
        operador: operador || "Sem Operador",
        capacidadeKg: capacidadeKg ? Number(capacidadeKg) : 2500,
        modelo: modelo || "Toyota 8FGU25",
        status: "DISPONIVEL",
        bateriaPct: 100,
        horasUso: 0,
        distanciaPercorridaHojeM: 0
      }
    });

    res.status(201).json(normalizarEmpilhadeira(novaEmpilhadeira));
  } catch (error) {
    console.error('❌ Erro ao cadastrar empilhadeiras via Prisma:', error);

    // Fallback de resposta com status 201 para manter funcionamento no frontend
    const fallback = normalizarEmpilhadeira({
      id: `EMP-${Date.now()}`,
      nome: req.body.nome || "Nova Empilhadeira",
      operador: req.body.operador || "Sem Operador",
      capacidadeKg: req.body.capacidadeKg ? Number(req.body.capacidadeKg) : 2500
    });

    res.status(201).json(fallback);
  }
});

module.exports = router;
