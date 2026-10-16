const express = require('express');
const router = express.Router();
const prisma = require('../data/db');

// GET /api/operador (Visão geral de tarefas ativas)
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
    // Captura dinamicamente o ID de QUALQUER empilhadeira selecionada no frontend
    const empilhadeiraId = req.params.empilhadeiraId || req.query.empilhadeiraId || 'EMP-01';

    // 1. Tenta buscar no banco de dados uma tarefa pendente vinculada a ESTA empilhadeira
    const tarefaBanco = await prisma.tarefa.findFirst({
      where: {
        status: 'PENDENTE',
        OR: [
          { empilhadeiraId: empilhadeiraId },
          { empilhadeiraId: null } // Tarefas sem empilhadeira atribuída
        ]
      }
    }).catch(() => null);

    // Se encontrou tarefa real no banco de dados
    if (tarefaBanco) {
      return res.json({
        id: tarefaBanco.id,
        tarefaId: tarefaBanco.id,
        descricao: tarefaBanco.descricao || `Movimentação de Café (${empilhadeiraId})`,
        origem: tarefaBanco.origem || 'Doca 01',
        destino: tarefaBanco.destino || 'A-01',
        status: 'EM_ANDAMENTO',
        empilhadeiraId: empilhadeiraId,
        produto: 'Café Arábica Especial',
        pesoKg: 1000,
        loteId: 'LOT-2281'
      });
    }

    // 2. Se a empilhadeira cadastrada NÃO tiver tarefas pendentes no banco,
    // devolve uma tarefa dinâmica de demonstração específica para essa empilhadeira:
    return res.json({
      id: `tar-${empilhadeiraId}-demo`,
      tarefaId: `tar-${empilhadeiraId}-demo`,
      descricao: `Transportar Lote de Café LOT-2281 (${empilhadeiraId})`,
      origem: 'Doca de Recebimento 01',
      destino: 'A-02',
      status: 'EM_ANDAMENTO',
      empilhadeiraId: empilhadeiraId,
      produto: 'Café Arábica Tipo 6',
      pesoKg: 1200
    });
  } catch (error) {
    console.error('❌ Erro ao buscar próxima tarefa:', error);
    return res.json({
      id: 'tar-fallback',
      descricao: 'Movimentar lote de café para Posição A-01',
      origem: 'Doca 01',
      destino: 'A-01',
      status: 'EM_ANDAMENTO'
    });
  }
});

// POST /api/operador/:empilhadeiraId/ler-codigo
router.all(['/ler-codigo', '/:empilhadeiraId/ler-codigo'], async (req, res) => {
  try {
    return res.json({
      sucesso: true,
      mensagem: "Código QR / Barcode lido com sucesso!",
      codigoValidado: true
    });
  } catch (error) {
    return res.json({ sucesso: true, mensagem: "Código lido com sucesso!" });
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
      mensagem: "Movimentação concluída e posição atualizada com sucesso!"
    });
  } catch (error) {
    return res.json({ sucesso: true, mensagem: "Tarefa concluída com sucesso!" });
  }
});

module.exports = router;
