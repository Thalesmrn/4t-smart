const express = require('express');
const cors = require('cors'); // 1. Adicione esta linha

const app = express();

// 2. Adicione esta linha ANTES das rotas
app.use(cors());

app.use(express.json());

// ... restante do seu código e das rotas
const express = require("express");
const cors = require("cors");
const { criarBancoMock } = require("./src/data/seed");
const { recalcularPrioridades } = require("./src/services/priorityEngine");

const PORT = process.env.PORT || 3001;

// Origens permitidas em produção vêm de FRONTEND_URL (ex.: https://meu-projeto.vercel.app).
// Aceita múltiplas origens separadas por vírgula, caso precise liberar mais de um domínio
// (ex.: domínio de produção + preview deployments da Vercel).
const origensProducao = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Em desenvolvimento, sempre liberamos o Vite local (porta padrão 5173) mesmo sem
// FRONTEND_URL configurada, para não travar quem está rodando o projeto localmente.
const origensDev = ["http://localhost:5173", "http://127.0.0.1:5173"];

const origensPermitidas = [...origensProducao, ...origensDev];

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      // Requisições sem "origin" (ex.: curl, health checks, chamadas server-to-server)
      // são permitidas — não representam um navegador de terceiros.
      if (!origin || origensPermitidas.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
      }
    },
  })
);
app.use(express.json());

// "Banco de dados" em memória — recriado a cada boot do servidor.
// Para persistência real, ver README > "Evoluindo para banco real".
const db = criarBancoMock();
recalcularPrioridades(db);

function healthCheck(req, res) {
  res.json({ status: "ok", servico: "4T Smart Warehouse API", timestamp: new Date().toISOString() });
}

// Endpoint usado por serviços de monitoramento de plataformas como o Render.
app.get("/health", healthCheck);
// Mantido por compatibilidade com o restante da aplicação e uso manual/curl.
app.get("/api/health", healthCheck);

app.use("/api/dashboard", require("./src/routes/dashboard")(db));
app.use("/api/armazem", require("./src/routes/warehouse")(db));
app.use("/api/tarefas", require("./src/routes/tasks")(db));
app.use("/api/empilhadeiras", require("./src/routes/forklifts")(db));
app.use("/api/roteirizacao", require("./src/routes/routing")(db));
app.use("/api/slotting", require("./src/routes/slotting")(db));
app.use("/api/operador", require("./src/routes/operator")(db));
app.use("/api/lotes", require("./src/routes/lots")(db));

// Reset do cenário de demonstração (útil durante testes/apresentações)
app.post("/api/reset", (req, res) => {
  const novoDb = criarBancoMock();
  Object.keys(db).forEach((k) => delete db[k]);
  Object.assign(db, novoDb);
  recalcularPrioridades(db);
  res.json({ mensagem: "Cenário de demonstração reiniciado com sucesso." });
});

app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.listen(PORT, () => {
  console.log(`\n🚛  4T Smart Warehouse API rodando na porta ${PORT}`);
  console.log(`    Health check: /health e /api/health`);
  if (origensProducao.length > 0) {
    console.log(`    Origens de produção liberadas no CORS: ${origensProducao.join(", ")}`);
  } else {
    console.log(`    Nenhuma FRONTEND_URL configurada — apenas dev local (5173) liberado no CORS.`);
  }
  console.log("");
});
