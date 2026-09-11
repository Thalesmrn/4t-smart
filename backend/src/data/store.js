/**
 * 4T Smart Warehouse — Store de demonstração (dados simulados em memória)
 *
 * Galpão, Posição, Big Bag e "tarefa do operador" ainda não existem como
 * tabelas no banco (ver prisma/schema.prisma: só há Lote, Tarefa e
 * Empilhadeira). Por isso essas telas — Central Operacional, Mapa do
 * Armazém e Monitor do Operador — funcionam com este store simulado em
 * memória, exatamente como indicado no rodapé do menu ("Cenário de
 * demonstração ativo — dados simulados").
 *
 * Isso é independente das rotas que já usam o Postgres/Prisma de verdade
 * (empilhadeiras, lotes, tarefas de cadastro).
 */

function agora() {
  return new Date().toISOString();
}

const GALPAO_ID = "G1";
const COLUNAS = 8;
const LINHAS = 5;

function gerarPosicoes() {
  const posicoes = [];
  let contador = 1;
  for (let linha = 1; linha <= LINHAS; linha++) {
    for (let coluna = 1; coluna <= COLUNAS; coluna++) {
      const codigo = `${String.fromCharCode(64 + linha)}-${String(coluna).padStart(2, "0")}`;
      posicoes.push({
        id: `POS-${String(contador).padStart(2, "0")}`,
        codigo,
        coluna: codigo,
        galpaoId: GALPAO_ID,
        status: "livre",
        capacidadeKg: 1000,
        distanciaDoca: linha + coluna,
        distanciaRebeneficio: LINHAS - linha + coluna,
        loteId: null,
        bigBagId: null,
        proprietario: null,
        dataEntrada: null,
        motivoBloqueio: null,
      });
      contador++;
    }
  }
  return posicoes;
}

const posicoes = gerarPosicoes();

const lotes = [
  { id: "LOTE-01", produto: "Café Arábico", qualidade: "Tipo 2 / Fine Cup" },
  { id: "LOTE-02", produto: "Café Conilon", qualidade: "Tipo 4" },
  { id: "LOTE-03", produto: "Café Arábico", qualidade: "Tipo 3 / Bebida Dura" },
];

const bigBags = [
  { id: "BB-1001", loteId: "LOTE-01", pesoKg: 1000, qrCode: "QR-1001" },
  { id: "BB-1002", loteId: "LOTE-01", pesoKg: 980, qrCode: "QR-1002" },
  { id: "BB-1003", loteId: "LOTE-02", pesoKg: 1020, qrCode: "QR-1003" },
  { id: "BB-1004", loteId: "LOTE-03", pesoKg: 1000, qrCode: "QR-1004" },
];

function ocuparPosicao(posId, bigBagId, proprietario) {
  const pos = posicoes.find((p) => p.id === posId);
  const bigBag = bigBags.find((b) => b.id === bigBagId);
  if (!pos || !bigBag) return;
  pos.status = "ocupada";
  pos.bigBagId = bigBag.id;
  pos.loteId = bigBag.loteId;
  pos.proprietario = proprietario;
  pos.dataEntrada = agora();
}

ocuparPosicao("POS-03", "BB-1001", "Fazenda Bela Vista");
ocuparPosicao("POS-04", "BB-1002", "Fazenda Bela Vista");
ocuparPosicao("POS-12", "BB-1003", "Cooperativa Sul de Minas");
ocuparPosicao("POS-20", "BB-1004", "Fazenda Santa Rita");

const posBloqueada = posicoes.find((p) => p.id === "POS-40");
if (posBloqueada) {
  posBloqueada.status = "bloqueada";
  posBloqueada.motivoBloqueio = "Piso danificado — aguardando manutenção";
}

const posAtencao = posicoes.find((p) => p.id === "POS-25");
if (posAtencao) {
  posAtencao.status = "atencao";
  posAtencao.motivoBloqueio = "Umidade acima do limite — verificar big bag";
}

const empilhadeiras = [
  { id: "EMP-01", status: "disponivel", distanciaPercorridaHojeM: 1240 },
  { id: "EMP-02", status: "ocupada", distanciaPercorridaHojeM: 860 },
];

const caminhoes = [
  {
    id: "CAM-01",
    placa: "ABC-1D23",
    tipoOperacao: "recebimento",
    horarioChegada: agora(),
    status: "aguardando",
  },
  {
    id: "CAM-02",
    placa: "XYZ-9F45",
    tipoOperacao: "expedicao",
    horarioChegada: agora(),
    status: "carregando",
  },
];

const tarefas = [
  {
    id: "TAR-01",
    tipo: "movimentacao",
    descricao: "Levar big bag da doca de recebimento até a posição B-04",
    origemId: "DOCA-01",
    destinoId: "B-04",
    status: "pendente",
    urgente: true,
    prioridadeScore: 92,
    bigBagId: "BB-1002",
    empilhadeiraId: null,
  },
  {
    id: "TAR-02",
    tipo: "rebeneficiamento",
    descricao: "Transferir big bag para a linha de rebeneficiamento",
    origemId: "A-03",
    destinoId: "REBENEF-01",
    status: "pendente",
    urgente: false,
    prioridadeScore: 58,
    bigBagId: "BB-1001",
    empilhadeiraId: null,
  },
  {
    id: "TAR-03",
    tipo: "expedicao",
    descricao: "Carregar caminhão XYZ-9F45 com lote de café conilon",
    origemId: "C-05",
    destinoId: "DOCA-02",
    status: "concluida",
    urgente: false,
    prioridadeScore: 40,
    bigBagId: "BB-1003",
    empilhadeiraId: "EMP-02",
  },
];

const metricasTurno = {
  inicioTurno: agora(),
  tarefasConcluidas: 6,
  distanciaTotalPercorridaM: 2100,
  tempoMedioPorMovimentacaoMin: 4.2,
  indiceMovimentacaoIndiretaPct: 12,
};

const galpoes = [{ id: GALPAO_ID, nome: "Galpão Principal", colunas: COLUNAS }];

// ---- helpers usados pelas rotas ----

function buscarGalpoes() {
  return galpoes;
}

function buscarPosicoes(galpaoId) {
  if (!galpaoId) return posicoes;
  return posicoes.filter((p) => p.galpaoId === galpaoId);
}

function montarDetalhePosicao(pos) {
  if (!pos) return null;
  const lote = pos.loteId ? lotes.find((l) => l.id === pos.loteId) : null;
  const bigBag = pos.bigBagId ? bigBags.find((b) => b.id === pos.bigBagId) : null;
  return {
    id: pos.id,
    status: pos.status,
    motivoBloqueio: pos.motivoBloqueio || undefined,
    lote: lote ? { id: lote.id, produto: lote.produto, qualidade: lote.qualidade } : undefined,
    bigBag: bigBag ? { id: bigBag.id } : undefined,
    pesoKg: bigBag ? bigBag.pesoKg : undefined,
    proprietario: pos.proprietario || undefined,
    dataEntrada: pos.dataEntrada || undefined,
    distanciaDoca: pos.distanciaDoca,
    distanciaRebeneficio: pos.distanciaRebeneficio,
  };
}

function buscarPosicaoDetalhe(id) {
  const pos = posicoes.find((p) => p.id === id);
  return montarDetalhePosicao(pos);
}

function liberarPosicao(id) {
  const pos = posicoes.find((p) => p.id === id);
  if (!pos) return null;
  pos.status = "livre";
  pos.loteId = null;
  pos.bigBagId = null;
  pos.proprietario = null;
  pos.dataEntrada = null;
  pos.motivoBloqueio = null;
  return montarDetalhePosicao(pos);
}

function montarBigBagDaTarefa(tarefa) {
  if (!tarefa?.bigBagId) return undefined;
  const bigBag = bigBags.find((b) => b.id === tarefa.bigBagId);
  if (!bigBag) return undefined;
  return { id: bigBag.id, pesoKg: bigBag.pesoKg, qrCode: bigBag.qrCode };
}

function buscarProximaTarefa(empilhadeiraId) {
  const candidata = tarefas
    .filter((t) => t.status !== "concluida" && (!t.empilhadeiraId || t.empilhadeiraId === empilhadeiraId))
    .sort((a, b) => b.prioridadeScore - a.prioridadeScore)[0];

  if (!candidata) {
    return { tarefa: null, mensagem: "Nenhuma tarefa pendente no momento. Bom trabalho!" };
  }

  candidata.empilhadeiraId = empilhadeiraId;
  candidata.status = "atribuida";

  return { tarefa: { ...candidata }, bigBag: montarBigBagDaTarefa(candidata) };
}

function lerCodigoBigBag(tarefaId, codigoLido) {
  const tarefa = tarefas.find((t) => t.id === tarefaId);
  const bigBag = tarefa ? montarBigBagDaTarefa(tarefa) : undefined;
  const valido = !!bigBag && codigoLido === bigBag.qrCode;
  return {
    valido,
    mensagem: valido
      ? "Código lido confere com o big bag esperado."
      : "Código lido não confere com o big bag esperado. Verifique antes de continuar.",
  };
}

function confirmarConclusaoTarefa(tarefaId) {
  const tarefa = tarefas.find((t) => t.id === tarefaId);
  if (!tarefa) {
    return { status: "concluida", mensagem: "Tarefa não encontrada, mas marcada como concluída." };
  }
  tarefa.status = "concluida";
  metricasTurno.tarefasConcluidas += 1;
  return { status: "concluida", mensagem: "Tarefa concluída com sucesso!" };
}

module.exports = {
  galpoes,
  posicoes,
  lotes,
  bigBags,
  empilhadeiras,
  caminhoes,
  tarefas,
  metricasTurno,
  buscarGalpoes,
  buscarPosicoes,
  buscarPosicaoDetalhe,
  liberarPosicao,
  buscarProximaTarefa,
  lerCodigoBigBag,
  confirmarConclusaoTarefa,
};
