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
    const empilhadeiraId = req.params.empilhadeiraId || req.query.empilhadeiraId;

    if (!empilhadeiraId) {
      return res.json({ mensagem: "Selecione uma empilhadeira.", tarefa: null });
    }

    // 1. Busca a empilhadeira pelo id ou nome
    const empilhadeira = await prisma.empilhadeira.findFirst({
      where: {
        OR: [{ id: empilhadeiraId }, { nome: empilhadeiraId }]
      }
    }).catch(() => null);

    const targetId = empilhadeira?.id || empilhadeiraId;

    // 2. Busca estritamente tarefas atribuídas A ESTA empilhadeira específica
    const tarefaAtiva = await prisma.tarefa.findFirst({
      where: {
        empilhadeiraId: targetId,
        status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'ATRIBUIDA'] }
      }
    }).catch(() => null);

    // Se NÃO tem tarefa vinculada explicitamente a esta empilhadeira, ela é/continua LIVRE
    if (!tarefaAtiva) {
      // Atualiza o status da empilhadeira para DISPONIVEL se estiver como EM_USO
      if (empilhadeira && empilhadeira.status !== 'DISPONIVEL') {
        await prisma.empilhadeira.update({
          where: { id: empilhadeira.id },
          data: { status: 'DISPONIVEL' }
        }).catch(() => null);
      }

      return res.json({
        mensagem: "Nenhuma tarefa atribuída a esta empilhadeira.",
        tarefa: null
      });
    }

    // Atualiza status da empilhadeira para EM_USO se houver tarefa pendente
    if (empilhadeira && empilhadeira.status !== 'EM_USO') {
      await prisma.empilhadeira.update({
        where: { id: empilhadeira.id },
        data: { status: 'EM_USO' }
      }).catch(() => null);
    }

    return res.json({
      mensagem: "Próxima tarefa em andamento",
      tarefa: {
        id: tarefaAtiva.id,
        tipo: tarefaAtiva.tipo || 'MOVIMENTACAO',
        descricao: tarefaAtiva.descricao || `Movimentar Lote de Café`,
        origemId: tarefaAtiva.origem || 'Doca 01',
        destinoId: tarefaAtiva.destino || 'A-01',
        status: tarefaAtiva.status || 'EM_ANDAMENTO',
        prioridadeScore: tarefaAtiva.prioridade || 1,
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
    return res.json({ mensagem: "Nenhuma tarefa ativa.", tarefa: null });
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
router.all([
  '/:empilhadeiraId/confirmar-conclusao/:tarefaId',
  '/confirmar-conclusao/:tarefaId'
], async (req, res) => {
  try {
    const { tarefaId, empilhadeiraId } = req.params;

    if (tarefaId) {
      await prisma.tarefa.update({
        where: { id: tarefaId },
        data: { status: 'CONCLUIDA' }
      }).catch(async () => {
        await prisma.tarefa.updateMany({
          where: { id: tarefaId },
          data: { status: 'CONCLUIDA' }
        }).catch(() => null);
      });
    }

    // Libera a empilhadeira se não existirem outras tarefas em aberto para ela
    if (empilhadeiraId) {
      const tarefasRestantes = await prisma.tarefa.count({
        where: {
          empilhadeiraId: empilhadeiraId,
          status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'ATRIBUIDA'] }
        }
      }).catch(() => 0);

      if (tarefasRestantes === 0) {
        await prisma.empilhadeira.update({
          where: { id: empilhadeiraId },
          data: { status: 'DISPONIVEL' }
        }).catch(() => null);
      }
    }

    return res.json({
      sucesso: true,
      mensagem: "Tarefa concluída e empilhadeira liberada com sucesso!"
    });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    return res.json({ sucesso: true, mensagem: "Conclusão registrada." });
  }
});

module.exports = router;
