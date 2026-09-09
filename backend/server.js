const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function healthCheck(req, res) {
  res.json({ 
    status: "ok", 
    servico: "4T Smart Warehouse API", 
    timestamp: new Date().toISOString() 
  });
}

// Endpoints de Health Check
app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

// Estrutura mínima funcional para destravar as telas Mapa e Monitor do Operador
const dbMockVazio = {
  galpoes: [
    {
      id: "G1",
      nome: "Galpão Principal",
      larguraM: 50,
      comprimentoM: 100,
      ruas: [],
      posicoes: []
    }
  ],
  posicoes: [],
  lotes: [],
  bigBags: [],
  empilhadeiras: [],
  caminhoes: [],
  tarefas: [],
  operadores: [
    { id: "op1", nome: "Operador Padrão", empilhadeiraId: null }
  ],
  metricasTurno: {
    inicioTurno: new Date().toISOString(),
    tarefasConcluidas: 0,
    distanciaTotalPercorridaM: 0,
    tempoMedioPorMovimentacaoMin: 0,
    indiceMovimentacaoIndiretaPct: 0
  }
};
// Rotas integradas ao Prisma / Supabase
app.use("/api/lotes", require("./src/routes/lots"));
app.use("/api/tarefas", require("./src/routes/tasks"));
app.use("/api/empilhadeiras", require("./src/routes/forklifts"));

// Rotas secundárias do frontend com injeção segura
const carregarRota = (caminho) => {
  const modulo = require(caminho);
  return typeof modulo === 'function' ? modulo(dbMockVazio) : modulo;
};

app.use("/api/dashboard", carregarRota("./src/routes/dashboard"));
app.use("/api/armazem", carregarRota("./src/routes/warehouse"));
app.use("/api/roteirizacao", carregarRota("./src/routes/routing"));
app.use("/api/slotting", carregarRota("./src/routes/slotting"));
app.use("/api/operador", carregarRota("./src/routes/operator"));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚛 4T Smart Warehouse API rodando na porta ${PORT}`);
});
