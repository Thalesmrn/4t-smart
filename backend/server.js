const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Importação das rotas
const lotesRoutes = require('./src/routes/lots');
const empilhadeirasRoutes = require('./src/routes/forklifts');
const slottingRoutes = require('./src/routes/slotting');

// Registo dos endpoints da API
app.use('/api/lotes', lotesRoutes);
app.use('/api/empilhadeiras', empilhadeirasRoutes);
app.use('/api/slotting', slottingRoutes);

// Rotas adicionais do projeto
try {
  app.use('/api/dashboard', require('./src/routes/dashboard'));
  app.use('/api/armazem', require('./src/routes/warehouse'));
  app.use('/api/tarefas', require('./src/routes/tasks'));
  app.use('/api/operador', require('./src/routes/operator'));
} catch (e) {
  console.log('Aviso ao carregar rotas adicionais:', e.message);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
