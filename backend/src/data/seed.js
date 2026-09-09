/**
 * 4T Smart Warehouse — Seed de dados de demonstração
 * Gera um cenário coerente: 2 galpões, 100+ posições, 3 empilhadeiras,
 * 50+ big bags, 5 lotes, 3 caminhões, posições bloqueadas e tarefas urgentes.
 */

function uid(prefix, n) {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

function isoOffsetMinutes(min) {
  return new Date(Date.now() + min * 60000).toISOString();
}

const PRODUTOS = [
  { nome: "Café Arábica Cereja Descascado", qualidade: "Tipo 4, Bica Corrida" },
  { nome: "Café Arábica Bóia", qualidade: "Tipo 6, Bica Corrida" },
  { nome: "Café Conilon Natural", qualidade: "Tipo 7/8" },
  { nome: "Café Arábica Despolpado", qualidade: "Tipo 2/3, Fine Cup" },
  { nome: "Café Arábica Natural", qualidade: "Tipo 5, Bebida Dura" },
];

const PROPRIETARIOS = [
  "Cooperativa 4T-Grãos",
  "Fazenda Santa Rita",
  "Fazenda Boa Esperança",
  "Sítio Água Limpa",
  "Fazenda Recanto do Café",
];

function gerarGalpoes() {
  return [
    { id: "G1", nome: "Galpão 1 — Recepção/Armazenagem", linhas: 8, colunas: 7 }, // 56 posições
    { id: "G2", nome: "Galpão 2 — Expedição/Liga", linhas: 8, colunas: 6 }, // 48 posições
  ];
}

function gerarPosicoes(galpoes) {
  const posicoes = [];
  galpoes.forEach((g) => {
    for (let l = 1; l <= g.linhas; l++) {
      for (let c = 1; c <= g.colunas; c++) {
        const id = `${g.id}-${String.fromCharCode(64 + l)}${String(c).padStart(2, "0")}`;
        // Distância simulada: quanto mais longe da linha 1 / coluna 1 (doca), maior a distância.
        const distanciaDoca = g.id === "G1" ? (l - 1) * 3 + c : (g.linhas - l) * 3 + (g.colunas - c) + 20;
        const distanciaRebeneficio = Math.abs(l - Math.ceil(g.linhas / 2)) * 2 + c;
        posicoes.push({
          id,
          galpaoId: g.id,
          linha: l,
          coluna: c,
          status: "livre",
          loteId: null,
          bigBagId: null,
          produto: null,
          pesoKg: null,
          dataEntrada: null,
          proprietario: null,
          motivoBloqueio: null,
          distanciaDoca,
          distanciaRebeneficio,
        });
      }
    }
  });
  return posicoes;
}

function gerarLotes() {
  return PRODUTOS.map((p, i) => ({
    id: uid("LOTE", i + 1),
    produto: p.nome,
    qualidade: p.qualidade,
    proprietario: PROPRIETARIOS[i % PROPRIETARIOS.length],
    sacas: 200 + i * 37,
    status: i === 4 ? "aguardando_descarga" : "armazenado",
  }));
}

function gerarBigBagsEOcuparPosicoes(lotes, posicoes) {
  const bigBags = [];
  let bagCounter = 1;
  // Ocupa ~55% das posições com big bags dos 4 primeiros lotes (o 5º ainda está chegando)
  const posicoesArmazenaveis = posicoes.filter((p) => p.status === "livre");
  const totalParaOcupar = Math.floor(posicoesArmazenaveis.length * 0.55);

  for (let i = 0; i < totalParaOcupar; i++) {
    const pos = posicoesArmazenaveis[i];
    const lote = lotes[i % 4]; // primeiros 4 lotes já armazenados
    const bagId = uid("BAG", bagCounter++);
    const pesoKg = 1000 + Math.round(Math.random() * 500);
    const diasAtras = Math.floor(Math.random() * 20) + 1;

    const bag = {
      id: bagId,
      loteId: lote.id,
      pesoKg,
      posicaoId: pos.id,
      qrCode: `QR-${bagId}`,
      status: "armazenado",
    };
    bigBags.push(bag);

    pos.status = "ocupada";
    pos.loteId = lote.id;
    pos.bigBagId = bagId;
    pos.produto = lote.produto;
    pos.pesoKg = pesoKg;
    pos.dataEntrada = new Date(Date.now() - diasAtras * 86400000).toISOString();
    pos.proprietario = lote.proprietario;
  }

  // Garante 50+ big bags
  while (bigBags.length < 52) {
    const posLivre = posicoes.find((p) => p.status === "livre");
    if (!posLivre) break;
    const lote = lotes[bigBags.length % 4];
    const bagId = uid("BAG", bagCounter++);
    const pesoKg = 1000 + Math.round(Math.random() * 500);
    const bag = {
      id: bagId,
      loteId: lote.id,
      pesoKg,
      posicaoId: posLivre.id,
      qrCode: `QR-${bagId}`,
      status: "armazenado",
    };
    bigBags.push(bag);
    posLivre.status = "ocupada";
    posLivre.loteId = lote.id;
    posLivre.bigBagId = bagId;
    posLivre.produto = lote.produto;
    posLivre.pesoKg = pesoKg;
    posLivre.dataEntrada = new Date().toISOString();
    posLivre.proprietario = lote.proprietario;
  }

  return bigBags;
}

function bloquearPosicoes(posicoes) {
  const motivos = [
    "Aguardando laudo de qualidade (amostragem)",
    "Divergência de peso na conferência",
    "Reservado para auditoria da cooperativa",
    "Estrutura de prateleira em manutenção",
  ];
  const candidatas = posicoes.filter((p) => p.status === "ocupada").slice(0, 4);
  candidatas.forEach((p, i) => {
    p.status = "bloqueada";
    p.motivoBloqueio = motivos[i % motivos.length];
  });
  // 2 posições livres também bloqueadas (ex: estrutural)
  const livres = posicoes.filter((p) => p.status === "livre").slice(0, 2);
  livres.forEach((p) => {
    p.status = "bloqueada";
    p.motivoBloqueio = "Interditada — piso danificado";
  });
}

function gerarEmpilhadeiras(posicoes) {
  const base = posicoes.filter((p) => p.status !== "bloqueada");
  return [
    {
      id: "EMP-01",
      nome: "Empilhadeira 01 (Elétrica 2.5t)",
      operador: "Carlos Mendes",
      status: "disponivel",
      posicaoAtualId: base[2].id,
      capacidadeKg: 2500,
      distanciaPercorridaHojeM: 1840,
    },
    {
      id: "EMP-02",
      nome: "Empilhadeira 02 (GLP 3.0t)",
      operador: "Roberto Alves",
      status: "disponivel",
      posicaoAtualId: base[20].id,
      capacidadeKg: 3000,
      distanciaPercorridaHojeM: 2210,
    },
    {
      id: "EMP-03",
      nome: "Empilhadeira 03 (Elétrica 2.5t)",
      operador: "Juliana Costa",
      status: "disponivel",
      posicaoAtualId: base[60] ? base[60].id : base[0].id,
      capacidadeKg: 2500,
      distanciaPercorridaHojeM: 1520,
    },
  ];
}

function gerarCaminhoes(lotes) {
  return [
    {
      id: "CAM-01",
      placa: "PRA-4T01",
      transportadora: "Transp. Sul de Minas",
      horarioChegada: isoOffsetMinutes(20),
      tipoOperacao: "recebimento",
      loteId: lotes[4].id, // lote aguardando descarga
      status: "aguardando",
    },
    {
      id: "CAM-02",
      placa: "PRA-4T02",
      transportadora: "Log Café Express",
      horarioChegada: isoOffsetMinutes(90),
      tipoOperacao: "expedicao",
      loteId: lotes[0].id,
      status: "aguardando",
    },
    {
      id: "CAM-03",
      placa: "PRA-4T03",
      transportadora: "Transportes Cerrado",
      horarioChegada: isoOffsetMinutes(-10), // já atrasado / chegou
      tipoOperacao: "recebimento",
      loteId: null,
      status: "aguardando",
    },
  ];
}

function gerarTarefasIniciais(lotes, bigBags, posicoes, caminhoes) {
  const tarefas = [];
  let n = 1;

  // 1) Recebimento urgente — caminhão já chegou (CAM-03) sem lote definido ainda (triagem)
  tarefas.push({
    id: uid("TSK", n++),
    tipo: "recebimento",
    descricao: "Direcionar big bags do caminhão CAM-03 (já no pátio) para triagem e pesagem",
    bigBagId: null,
    loteId: null,
    origemId: "DOCA-RECEBIMENTO",
    destinoId: "AREA-TRIAGEM",
    prioridadeScore: 0,
    prioridadeExplicacao: "",
    empilhadeiraId: null,
    status: "pendente",
    criadoEm: new Date().toISOString(),
    prazoLimite: isoOffsetMinutes(15),
    urgente: true,
  });

  // 2) Recebimento programado — caminhão CAM-01 chega em 20 min, lote está com posição bloqueada
  tarefas.push({
    id: uid("TSK", n++),
    tipo: "recebimento",
    descricao: `Preparar recebimento do lote ${lotes[4].id} (${lotes[4].produto}) — caminhão CAM-01`,
    bigBagId: null,
    loteId: lotes[4].id,
    origemId: "DOCA-RECEBIMENTO",
    destinoId: null, // slotting engine decide
    prioridadeScore: 0,
    prioridadeExplicacao: "",
    empilhadeiraId: null,
    status: "pendente",
    criadoEm: new Date().toISOString(),
    prazoLimite: isoOffsetMinutes(20),
    urgente: true,
  });

  // 3) Expedição — separar big bags do lote 0 para o caminhão CAM-02 (90 min)
  const bagsLote0 = bigBags.filter((b) => b.loteId === lotes[0].id).slice(0, 6);
  bagsLote0.forEach((bag) => {
    const pos = posicoes.find((p) => p.id === bag.posicaoId);
    tarefas.push({
      id: uid("TSK", n++),
      tipo: "expedicao",
      descricao: `Separar ${bag.id} (${lotes[0].produto}) para expedição — CAM-02`,
      bigBagId: bag.id,
      loteId: lotes[0].id,
      origemId: pos.id,
      destinoId: "DOCA-EXPEDICAO",
      prioridadeScore: 0,
      prioridadeExplicacao: "",
      empilhadeiraId: null,
      status: "pendente",
      criadoEm: new Date().toISOString(),
      prazoLimite: isoOffsetMinutes(90),
      urgente: false,
    });
  });

  // 4) Formação de liga — combinar big bags de dois lotes distintos em uma posição do Galpão 2
  const bagsLiga = [
    bigBags.find((b) => b.loteId === lotes[1].id),
    bigBags.find((b) => b.loteId === lotes[2].id),
  ].filter(Boolean);
  bagsLiga.forEach((bag) => {
    const pos = posicoes.find((p) => p.id === bag.posicaoId);
    tarefas.push({
      id: uid("TSK", n++),
      tipo: "formacao_liga",
      descricao: `Mover ${bag.id} para área de formação de liga (Galpão 2)`,
      bigBagId: bag.id,
      loteId: bag.loteId,
      origemId: pos.id,
      destinoId: "AREA-LIGA-G2",
      prioridadeScore: 0,
      prioridadeExplicacao: "",
      empilhadeiraId: null,
      status: "pendente",
      criadoEm: new Date().toISOString(),
      prazoLimite: isoOffsetMinutes(180),
      urgente: false,
    });
  });

  // 5) Separação interna comum (reorganização)
  const bagsSeparacao = bigBags.filter((b) => b.loteId === lotes[3].id).slice(0, 3);
  bagsSeparacao.forEach((bag) => {
    const pos = posicoes.find((p) => p.id === bag.posicaoId);
    tarefas.push({
      id: uid("TSK", n++),
      tipo: "separacao",
      descricao: `Separar ${bag.id} (${lotes[3].produto}) para conferência de qualidade`,
      bigBagId: bag.id,
      loteId: bag.loteId,
      origemId: pos.id,
      destinoId: "AREA-QUALIDADE",
      prioridadeScore: 0,
      prioridadeExplicacao: "",
      empilhadeiraId: null,
      status: "pendente",
      criadoEm: new Date().toISOString(),
      prazoLimite: isoOffsetMinutes(240),
      urgente: false,
    });
  });

  return tarefas;
}

function criarBancoMock() {
  const galpoes = gerarGalpoes();
  const posicoes = gerarPosicoes(galpoes);
  const lotes = gerarLotes();
  const bigBags = gerarBigBagsEOcuparPosicoes(lotes, posicoes);
  bloquearPosicoes(posicoes);
  const empilhadeiras = gerarEmpilhadeiras(posicoes);
  const caminhoes = gerarCaminhoes(lotes);
  const tarefas = gerarTarefasIniciais(lotes, bigBags, posicoes, caminhoes);

  return {
    galpoes,
    posicoes,
    lotes,
    bigBags,
    empilhadeiras,
    caminhoes,
    tarefas,
    metricasTurno: {
      inicioTurno: new Date(Date.now() - 4 * 3600000).toISOString(),
      tarefasConcluidas: 27,
      distanciaTotalPercorridaM: 1840 + 2210 + 1520,
      tempoMedioPorMovimentacaoMin: 6.4,
      indiceMovimentacaoIndiretaPct: 12, // % de movimentações que não foram diretas (retrabalho)
    },
  };
}

module.exports = { criarBancoMock };
