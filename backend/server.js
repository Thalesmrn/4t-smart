const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Importação de todas as rotas do sistema
const lotesRoutes = require('./src/routes/lots');
const empilhadeirasRoutes = require('./src/routes/forklifts');
const slottingRoutes = require('./src/routes/slotting');
const warehouseRoutes = require('./src/routes/warehouse');
const tasksRoutes = require('./src/routes/tasks');
const dashboardRoutes = require('./src/routes/dashboard');
const operatorRoutes = require('./src/routes/operator');

// Registo de Endpoints da API
app.use('/api/lotes', lotesRoutes);
app.use('/api/empilhadeiras', empilhadeirasRoutes);
app.use('/api/slotting', slottingRoutes);
app.use('/api/armazem', warehouseRoutes);
app.use('/api/tarefas', tasksRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/operador', operatorRoutes);

// Rota de Reset Geral (se usada pelo botão Reset da aplicação)
app.post('/api/reset', async (req, res) => {
  return res.json({ mensagem: 'Sistema reiniciado com sucesso.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Smart Warehouse rodando na porta ${PORT}`);
});
