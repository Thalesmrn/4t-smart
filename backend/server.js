const express = require('express');
const cors = require('cors');

const { criarBancoMock } = require("./src/data/seed");
const { recalcularPrioridades } = require("./src/services/priorityEngine");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const db = criarBancoMock();
recalcularPrioridades(db);

function healthCheck(req, res) {
  res.json({ status: "ok", servico: "4T Smart Warehouse API", timestamp: new Date().toISOString() });
}

app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

app.use("/api/dashboard", require("./src/routes/dashboard")(db));
app.use("/api/armazem", require("./src/routes/warehouse")(db));
app.use("/api/tarefas", require("./src/routes/tasks")(db));
app.use("/api/empilhadeiras", require("./src/routes/forklifts")(db));
app.use("/api/roteirizacao", require("./src/routes/routing")(db));
app.use("/api/slotting", require("./src/routes/slotting")(db));
app.use("/api/operador", require("./src/routes/operator")(db));
app.use("/api/lotes", require("./src/routes/lots")(db));

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
  console.log(`    CORS habilitado para requisições externas.`);
  console.log("");
});
