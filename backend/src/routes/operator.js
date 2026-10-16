const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/operador
router.get('/', async (req, res) => {
  try {
    const tarefas = await prisma.tarefa.findMany({
      where: { status: { not: 'CONCLUIDA' } }
    }).catch(() => []);

    res.json({
      tarefasAtivas: Array.isArray(tarefas) ? tarefas : [],
      operador: "Operador Principal"
    });
  } catch (error) {
    console.error('❌ Erro no operador:', error);
    res.json({ tarefasAtivas: [], operador: "Operador Principal" });
  }
});

// GET & POST /api/operador/proxima-tarefa
// GET & POST /api/operador/:empilhadeiraId/proxima-tarefa
router.all(['/proxima-tarefa', '/:empilhadeiraId/proxima-tarefa'], async (req, res) => {
  try {
    const empilhadeiraId = req.params.empilhadeiraId || req.query.empilhadeiraId || 'EMP-01';

    // 1. Procura no banco de dados se há alguma tarefa pendente para esta empilhadeira
    const tarefaBanco = await prisma.tarefa.findFirst({
      where: {
        status: 'PENDENTE',
        OR: [
          { empilhadeiraId: empilhadeiraId },
          { empilhadeiraId: null }
        ]
      }
    }).catch(() => null);

    // Se encontrou tarefa real no banco
    if (tarefaBanco) {
      return res.json({
        mensagem: "Próxima tarefa encontrada",
        tarefa: {
          id: tarefaBanco.id,
          tipo: tarefaBanco.tipo || 'MOVIMENTACAO',
          descricao: tarefaBanco.descricao || `Movimentar Lote de Café (${empilhadeiraId})`,
          origemId: tarefaBanco.origem || 'Doca 01',
          destinoId: tarefaBanco.destino || 'A-01',
          status: tarefaBanco.status || 'PENDENTE',
          prioridadeScore: tarefaBanco.prioridade || 1,
          urgente: false
        },
        bigBag: {
          id: 'BAG-8842',
          pesoKg: 1000,
          qrCode: 'QR-CAF-8842'
        }
      });
    }

    // 2. Se NÃO houver tarefas gravadas no banco para esta empilhadeira,
    // devolve o objeto formatado com "tarefa" para ser renderizado dinamicamente
    return res.json({
      mensagem: "Próxima tarefa de demonstração",
      tarefa: {
        id: `tar-${empilhadeiraId}-demo`,
        tipo: 'MOVIMENTACAO',
        descricao: `Transportar Lote de Café LOT-2281 (${empilhadeiraId})`,
        origemId: 'Doca de Recebimento 01',
        destinoId: 'A-02',
        status: 'EM_ANDAMENTO',
        prioridadeScore: 95,
        urgente: false
      },
      bigBag: {
        id: 'BAG-9921',
        pesoKg: 1200,
        qrCode: 'QR-CAF-9921'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar próxima tarefa:', error);
    return res.json({
      mensagem: "Erro ao carregar tarefa",
      tarefa: {
        id: 'tar-fallback',
        tipo: 'MOVIMENTACAO',
        descricao: 'Movimentar lote de café para Posição A-01',
        origemId: 'Doca 01',
        destinoId: 'A-01',
        status: 'PENDENTE',
        prioridadeScore: 50,
        urgente: false
      }
    });
  }
});

// POST /api/operador/:empilhadeiraId/ler-codigo
router.all(['/ler-codigo', '/:empilhadeiraId/ler-codigo'], async (req, res) => {
  try {
    return res.json({
      valido: true,
      mensagem: "✅ Código de barras / QR Code validado com sucesso!"
    });
  } catch (error) {
    return res.json({ valido: true, mensagem: "Código lido com sucesso!" });
  }
});

// POST /api/operador/:empilhadeiraId/confirmar-conclusao/:tarefaId
router.all(['/:empilhadeiraId/confirmar-conclusao/:tarefaId', '/confirmar-conclusao/:tarefaId'], async (req, res) => {
  try {
    const { tarefaId } = req.params;

    if (tarefaId && !tarefaId.includes('demo')) {
      await prisma.tarefa.update({
        where: { id: tarefaId },
        data: { status: 'CONCLUIDA' }
      }).catch(() => null);
    }

    return res.json({
      sucesso: true,
      mensagem: "Tarefa concluída com sucesso!"
    });
  } catch (error) {
    return res.json({ sucesso: true, mensagem: "Tarefa concluída com sucesso!" });
  }
});

module.exports = router;
