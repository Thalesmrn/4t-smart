const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Desativa o cache do navegador para evitar 304 Not Modified
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Rotas que já usam o Postgres/Prisma (empilhadeiras, lotes, tarefas de cadastro, operador)
app.use('/api/empilhadeiras', require('./src/routes/forklifts'));
app.use('/api/lotes', require('./src/routes/lots'));
app.use('/api/tarefas', require('./src/routes/tasks'));
app.use('/api/operador', require('./src/routes/operator'));

// Store de demonstração em memória (galpões, posições, big bags, tarefas do
// operador e métricas do turno — entidades que ainda não existem no banco)
const store = require('./src/data/store');
app.use('/api/dashboard', require('./src/routes/dashboard')(store));
app.use('/api/armazem', require('./src/routes/warehouse')(store));
app.use('/api/slotting', require('./src/routes/slotting')(store));
app.use('/api/roteirizacao', require('./src/routes/routing')(store));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
