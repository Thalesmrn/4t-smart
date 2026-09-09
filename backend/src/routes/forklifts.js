const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

function normalizarEmpilhadeira(e) {
  const agora = new Date().toISOString();
  return {
    id: e?.id || "EMP-01",
    codigo: e?.codigo || "EMP-01",
    nome: e?.nome || "Empilhadeira 01",
    modelo: e?.modelo || "Toyota 8FGU25",
    operador: e?.operador || "Operador 01",
    status: e?.status || "DISPONIVEL",
    
    // Números protegidos contra undefined
    bateriaPct: e?.bateriaPct ?? 100,
    horasUso: e?.horasUso ?? 0,
    capacidadeKg: e?.capacidadeKg ?? 2500,
    velocidadeMedia: e?.velocidadeMedia ?? 0,

    // Datas protegidas para .toLocaleString()
    criadoEm: e?.criadoEm || e?.createdAt || agora,
    atualizadoEm: e?.atualizadoEm || e?.updatedAt || agora,
    ultimaManutencao: e?.ultimaManutencao || agora,
    dataHora: e?.dataHora || agora
  };
}

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

module.exports = router;
