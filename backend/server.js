const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Importação das Rotas do Sistema
const dashboardRoutes = require('./src/routes/dashboard');
const warehouseRoutes = require('./src/routes/warehouse');
const tasksRoutes = require('./src/routes/tasks');
const lotesRoutes = require('./src/routes/lots');
const empilhadeirasRoutes = require('./src/routes/forklifts');
const slottingRoutes = require('./src/routes/slotting');
const operatorRoutes = require('./src/routes/operator');

// Registro Oficial de Endpoints
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/armazem', warehouseRoutes);
app.use('/api/tarefas', tasksRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/empilhadeiras', empilhadeirasRoutes);
app.use('/api/slotting', slottingRoutes);
app.use('/api/operador', operatorRoutes);

app.post('/api/reset', async (req, res) => {
  return res.json({ mensagem: 'Sistema reiniciado com sucesso.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Smart Warehouse rodando na porta ${PORT}`);
});
