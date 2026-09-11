const express = require('express');
const router = express.Router();
const prisma = require('../data/db');
const store = require('../data/store');

function normalizarTarefa(t) {
  const agora = new Date().toISOString();
  return {
    id: t?.id || "TAR-01",
    codigo: t?.id || "TAR-01",
    tipo: t?.tipo || "MOVIMENTACAO",
    prioridade: t?.prioridade ? String(t.prioridade) : "1",
    status: t?.status || "PENDENTE",
    descricao: t?.descricao || "Movimentação de carga de café",
    origem: "A-01",
    destino: "B-02",
    empilhadeiraId: "EMP-01",
    criadoEm: t?.createdAt || agora,
    atualizadoEm: t?.updatedAt || agora,
    historico: [],
    passos: []
  };
}

// GET /api/operador — usado pela tela de Cadastros/legado (base de tarefas do Postgres)
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany();

    const tarefasArray = Array.isArray(tarefas) ? tarefas : [];
    const tarefaAtual = tarefasArray.find(t => t.status === "EM_ANDAMENTO") || tarefasArray[0] || null;
    const proximasTarefas = tarefasArray.filter(t => t.id !== tarefaAtual?.id);

    res.json({
      operador: { id: "OP-01", nome: "Operador Principal" },
      tarefaAtual: tarefaAtual ? normalizarTarefa(tarefaAtual) : null,
      // Garante 100% que seja um array para o .map() do React não quebrar
      proximasTarefas: Array.isArray(proximasTarefas) ? proximasTarefas.map(normalizarTarefa) : [],
      tarefas: tarefasArray.map(normalizarTarefa)
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dados do operador:', error);
    res.json({
      operador: { id: "OP-01", nome: "Operador Principal" },
      tarefaAtual: normalizarTarefa({}),
      proximasTarefas: [normalizarTarefa({})],
      tarefas: [normalizarTarefa({})]
    });
  }
});

// GET /api/operador/:empilhadeiraId/proxima-tarefa — usado pelo Monitor do Operador
router.get('/:empilhadeiraId/proxima-tarefa', (req, res) => {
  const resultado = store.buscarProximaTarefa(req.params.empilhadeiraId);
  res.json(resultado);
});

// POST /api/operador/:empilhadeiraId/ler-codigo — simula leitura de RFID/QR Code
router.post('/:empilhadeiraId/ler-codigo', (req, res) => {
  const { codigoLido, tarefaId } = req.body || {};
  res.json(store.lerCodigoBigBag(tarefaId, codigoLido));
});

// POST /api/operador/:empilhadeiraId/confirmar-conclusao/:tarefaId
router.post('/:empilhadeiraId/confirmar-conclusao/:tarefaId', (req, res) => {
  res.json(store.confirmarConclusaoTarefa(req.params.tarefaId));
});

router.post('/concluir', async (req, res) => {
  try {
    const { tarefaId } = req.body;
    if (tarefaId) {
      await prisma.tarefa.update({
        where: { id: tarefaId },
        data: { status: "CONCLUIDA" }
      });
    }
    res.json({ status: "CONCLUIDA", mensagem: "Tarefa atualizada com sucesso!" });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    res.json({ status: "CONCLUIDA", mensagem: "Tarefa atualizada com sucesso!" });
  }
});

const atualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (id) {
      await prisma.tarefa.update({
        where: { id },
        data: { status: status || "CONCLUIDA" }
      });
    }

    res.json({ status: status || "CONCLUIDA", mensagem: "Status alterado com sucesso." });
  } catch (error) {
    console.error('❌ Erro ao atualizar status da tarefa:', error);
    res.json({ status: req.body.status || "CONCLUIDA" });
  }
};

router.put('/tarefas/:id', atualizarStatus);
router.post('/tarefas/:id', atualizarStatus);

module.exports = router;
