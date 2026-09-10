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

// Registro de todas as rotas da API
app.use('/api/empilhadeiras', require('./src/routes/forklifts'));
app.use('/api/lotes', require('./src/routes/lots'));
app.use('/api/tarefas', require('./src/routes/tasks'));
app.use('/api/operador', require('./src/routes/operator'));

// Rotas utilitárias (se slotting, routing e warehouse exportarem funções, mantêm o db)
const db = require('./src/data/db');
app.use('/api/armazem', require('./src/routes/warehouse')(db));
app.use('/api/slotting', require('./src/routes/slotting')(db));
app.use('/api/roteirizacao', require('./src/routes/routing')(db));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
