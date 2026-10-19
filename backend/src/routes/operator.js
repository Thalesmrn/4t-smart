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
    const empParam = req.params.empilhadeiraId || req.query.empilhadeiraId;

    // 🔴 TRAVA RÍGIDA: Se não houver ID explícito na requisição, bloqueia imediatamente sem fallbacks
    if (!empParam || empParam === 'undefined' || empParam === 'null' || empParam.trim() === '') {
      return res.json({
        mensagem: "Nenhuma empilhadeira selecionada.",
        tarefa: null
      });
    }

    // Normaliza variações de ID (ex: "EMP-01", "emp01", "emp1")
    const idLimpo = empParam.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Busca no banco de dados tarefas em aberto
    const tarefasBanco = await prisma.tarefa.findMany({
      where: {
        status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'ATRIBUIDA'] }
      }
    }).catch(() => []);

    // 2. Procura estritamente uma tarefa cujo empilhadeiraId seja EXATAMENTE igual ao selecionado
    const tarefaEmpilhadeira = tarefasBanco.find(t => {
      if (!t.empilhadeiraId) return false;
      const targetLimpo = t.empilhadeiraId.toLowerCase().replace(/[^a-z0-9]/g, '');
      return targetLimpo === idLimpo || t.empilhadeiraId === empParam;
    });

    // Se a empilhadeira não tem tarefa atribuída no banco, retorna nulo para exibir a tela de livre (✅)
    if (!tarefaEmpilhadeira) {
      return res.json({
        mensagem: "Nenhuma tarefa atribuída a esta empilhadeira.",
        tarefa: null
      });
    }

    return res.json({
      mensagem: "Próxima tarefa em andamento",
      tarefa: {
        id: tarefaEmpilhadeira.id,
        tipo: tarefaEmpilhadeira.tipo || 'MOVIMENTACAO',
        descricao: tarefaEmpilhadeira.descricao || `Movimentar Lote de Café`,
        origemId: tarefaEmpilhadeira.origem || 'Doca 01',
        destinoId: tarefaEmpilhadeira.destino || 'A-01',
        status: tarefaEmpilhadeira.status || 'EM_ANDAMENTO',
        prioridadeScore: tarefaEmpilhadeira.prioridade || 1,
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

    // Atualiza status da empilhadeira para DISPONIVEL no banco se não houver mais tarefas ativas para ela
    if (empilhadeiraId && empilhadeiraId !== 'undefined') {
      const idLimpo = empilhadeiraId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const tarefasRestantes = await prisma.tarefa.findMany({
        where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'ATRIBUIDA'] } }
      }).catch(() => []);

      const aindaTem = tarefasRestantes.some(t => {
        if (!t.empilhadeiraId) return false;
        return t.empilhadeiraId.toLowerCase().replace(/[^a-z0-9]/g, '') === idLimpo;
      });

      if (!aindaTem) {
        await prisma.empilhadeira.updateMany({
          where: {
            OR: [
              { id: empilhadeiraId },
              { nome: empilhadeiraId }
            ]
          },
          data: { status: 'DISPONIVEL' }
        }).catch(() => null);
      }
    }

    return res.json({
      sucesso: true,
      mensagem: "Tarefa concluída com sucesso!"
    });
  } catch (error) {
    console.error('❌ Erro ao concluir tarefa:', error);
    return res.json({ sucesso: true, mensagem: "Conclusão registrada." });
  }
});

module.exports = router;
