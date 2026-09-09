/**
 * Lógica compartilhada de conclusão de tarefa — usada tanto pela rota
 * de Tarefas (painel operacional) quanto pelo Monitor do Operador.
 */
const { recomendarPosicoes } = require("./slottingEngine");

function proximoIdBigBag(bigBags) {
  const numeros = bigBags.map((b) => parseInt(b.id.split("-")[1], 10)).filter((n) => !isNaN(n));
  const proximo = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
  return `BAG-${String(proximo).padStart(3, "0")}`;
}

function concluirTarefa(db, tarefaId) {
  const tarefa = db.tarefas.find((t) => t.id === tarefaId);
  if (!tarefa) return { erro: "Tarefa não encontrada", status: 404 };

  tarefa.status = "concluida";
  db.metricasTurno.tarefasConcluidas += 1;

  // Caso especial: tarefa de recebimento de um lote que ainda não tem big bag
  // nem posição definida (criada via "Registrar recebimento" em Cadastros).
  // Ao concluir, o slotting engine escolhe a melhor posição livre e o big bag
  // é criado ali — só então o lote passa de "aguardando_descarga" para "armazenado".
  if (tarefa.tipo === "recebimento" && tarefa.loteId && !tarefa.bigBagId) {
    const lote = db.lotes.find((l) => l.id === tarefa.loteId);
    if (lote) {
      const [recomendacao] = recomendarPosicoes(
        db.posicoes,
        { loteId: lote.id, precisaRebeneficio: true },
        1
      );
      if (recomendacao) {
        const posicao = db.posicoes.find((p) => p.id === recomendacao.posicaoId);
        // Um big bag carrega, na prática, entre ~900kg e ~1.500kg. Usamos as sacas
        // do lote como referência (1 saca ≈ 60kg), mas limitamos à capacidade real
        // de um único big bag — lotes maiores seguirão sendo recebidos aos poucos,
        // com uma tarefa de recebimento por leva física.
        const pesoEstimado = lote.sacas > 0 ? lote.sacas * 60 : 1200;
        const pesoKg = Math.min(1500, Math.max(900, Math.round(pesoEstimado)));
        const novoBagId = proximoIdBigBag(db.bigBags);

        db.bigBags.push({
          id: novoBagId,
          loteId: lote.id,
          pesoKg,
          posicaoId: posicao.id,
          qrCode: `QR-${novoBagId}`,
          status: "armazenado",
        });

        posicao.status = "ocupada";
        posicao.bigBagId = novoBagId;
        posicao.loteId = lote.id;
        posicao.produto = lote.produto;
        posicao.pesoKg = pesoKg;
        posicao.dataEntrada = new Date().toISOString();
        posicao.proprietario = lote.proprietario;

        lote.status = "armazenado";
        tarefa.bigBagId = novoBagId;
        tarefa.destinoId = posicao.id;
        tarefa.descricao += ` — alocado em ${posicao.id} (${recomendacao.explicacao})`;
      }
    }
  }

  if (tarefa.bigBagId) {
    const bag = db.bigBags.find((b) => b.id === tarefa.bigBagId);
    const origemPos = db.posicoes.find((p) => p.id === tarefa.origemId);
    const destinoPos = db.posicoes.find((p) => p.id === tarefa.destinoId);

    if (origemPos && origemPos.bigBagId === tarefa.bigBagId) {
      origemPos.status = "livre";
      origemPos.bigBagId = null;
      origemPos.loteId = null;
      origemPos.produto = null;
      origemPos.pesoKg = null;
      origemPos.dataEntrada = null;
      origemPos.proprietario = null;
    }
    if (destinoPos && bag) {
      destinoPos.status = "ocupada";
      destinoPos.bigBagId = bag.id;
      destinoPos.loteId = bag.loteId;
      destinoPos.dataEntrada = new Date().toISOString();
      bag.posicaoId = destinoPos.id;
    }
  }

  if (tarefa.empilhadeiraId) {
    const emp = db.empilhadeiras.find((e) => e.id === tarefa.empilhadeiraId);
    if (emp) {
      emp.status = "disponivel";
      emp.posicaoAtualId =
        tarefa.destinoId && db.posicoes.find((p) => p.id === tarefa.destinoId)
          ? tarefa.destinoId
          : emp.posicaoAtualId;
      emp.distanciaPercorridaHojeM += 30;
    }
  }

  return { tarefa, status: 200 };
}

module.exports = { concluirTarefa };
