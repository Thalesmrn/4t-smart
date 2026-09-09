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

// Rotas conectadas ao Prisma / Supabase
app.use("/api/lotes", require("./src/routes/lots"));
app.use("/api/tarefas", require("./src/routes/tasks"));
app.use("/api/empilhadeiras", require("./src/routes/forklifts"));

// Rotas secundárias do frontend (ajuste a importação conforme o formato exportado pelos arquivos)
if (typeof require("./src/routes/dashboard") === 'function') {
  app.use("/api/dashboard", require("./src/routes/dashboard")({}));
  app.use("/api/armazem", require("./src/routes/warehouse")({}));
  app.use("/api/roteirizacao", require("./src/routes/routing")({}));
  app.use("/api/slotting", require("./src/routes/slotting")({}));
  app.use("/api/operador", require("./src/routes/operator")({}));
} else {
  app.use("/api/dashboard", require("./src/routes/dashboard"));
  app.use("/api/armazem", require("./src/routes/warehouse"));
  app.use("/api/roteirizacao", require("./src/routes/routing"));
  app.use("/api/slotting", require("./src/routes/slotting"));
  app.use("/api/operador", require("./src/routes/operator"));
}

// Rota padrão para caminhos não encontrados (404)
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚛 4T Smart Warehouse API rodando na porta ${PORT}`);
});
