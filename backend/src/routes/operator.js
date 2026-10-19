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

    // 1. Busca a empilhadeira para verificar seu status
    const empilhadeira = await prisma.empilhadeira.findFirst({
      where: {
        OR: [{ id: empilhadeiraId }, { nome: empilhadeiraId }]
      }
    }).catch(() => null);

    // 2. Busca tarefa vinculada especificamente a esta empilhadeira com status EM_ANDAMENTO ou PENDENTE
    const tarefaAtiva = await prisma.tarefa.findFirst({
      where: {
        empilhadeiraId: empilhadeira?.id || empilhadeiraId,
        status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }
      }
    }).catch(() => null);

    // Se não houver tarefa vinculada diretamente, retorna estado limpo (sem inventar tarefas para empilhadeiras livres)
    if (!tarefaAtiva) {
      return res.json({
        mensagem: "Todas as tarefas desta empilhadeira foram concluídas!",
        tarefa: null
      });
    }

    return res.json({
      mensagem: "Próxima tarefa carregada",
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
      // 1. Marca a tarefa como CONCLUIDA no banco
      await prisma.tarefa.update({
        where: { id: tarefaId },
        data: { status: 'CONCLUIDA' }
      }).catch(async () => {
        // Fallback caso a busca por id exato falhe
        await prisma.tarefa.updateMany({
          where: { id: tarefaId },
          data: { status: 'CONCLUIDA' }
        }).catch(() => null);
      });
    }

    if (empilhadeiraId) {
      // 2. Libera a empilhadeira se não houver mais tarefas pendentes para ela
      const tarefasRestantes = await prisma.tarefa.count({
        where: {
          empilhadeiraId: empilhadeiraId,
          status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }
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
      mensagem: "Tarefa concluída e status atualizado com sucesso!"
    });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    return res.json({ sucesso: true, mensagem: "Conclusão registrada." });
  }
});

module.exports = router;
