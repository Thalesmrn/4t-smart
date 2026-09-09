const express = require('express');
const cors = require('cors');

const app = express();

// Libera CORS de forma global sem travar com erro 500
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

// Rotas integradas ao PostgreSQL / Supabase via Prisma
app.use("/api/lotes", require("./src/routes/lots"));
app.use("/api/tarefas", require("./src/routes/tasks"));
app.use("/api/empilhadeiras", require("./src/routes/forklifts"));

// Rota padrão para caminhos não encontrados (404)
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚛 4T Smart Warehouse API rodando na porta ${PORT}`);
  console.log(` Health check: /health e /api/health`);
  console.log(` CORS habilitado para requisições externas.`);
  console.log("");
});
