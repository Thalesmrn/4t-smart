# 🚛 4T Smart Warehouse

Sistema inteligente de logística interna para armazéns de café — o **"Waze do Armazém"** — integrado conceitualmente ao ERP 4T-Grãos.

Responde à pergunta: *"Considerando todas as demandas do armazém, qual é a melhor sequência de movimentações para executar o trabalho com segurança, rastreabilidade e eficiência?"*

---

## 📁 Estrutura do projeto

```
4t-smart-warehouse/
├── backend/               API em Node.js + Express (dados mock em memória)
│   ├── server.js
│   └── src/
│       ├── data/seed.js          → gera o cenário de demonstração
│       ├── models/entities.js    → documentação das entidades (JSDoc)
│       ├── services/             → regras de negócio
│       │   ├── priorityEngine.js   (priorização dinâmica + explicabilidade)
│       │   ├── routingEngine.js    (roteirização / sequenciamento)
│       │   ├── slottingEngine.js   (slotting inteligente)
│       │   └── taskService.js
│       └── routes/               → endpoints REST
│           ├── dashboard.js
│           ├── warehouse.js
│           ├── tasks.js
│           ├── forklifts.js
│           ├── routing.js
│           ├── slotting.js
│           ├── operator.js
│           └── lots.js
└── frontend/              Dashboard em React + Vite + Tailwind CSS
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx       → Central Operacional
        │   ├── WarehouseMap.jsx    → Mapa Digital do Armazém
        │   ├── TaskManager.jsx     → Tarefas & Orquestração de Empilhadeiras
        │   ├── Slotting.jsx        → Roteirização Interna & Slotting
        │   ├── OperatorView.jsx    → Monitor do Operador (mobile)
        │   └── Cadastros.jsx       → Nova empilhadeira / novo lote
        ├── components/
        └── lib/api.js
```

---

## ▶️ Como rodar localmente

Pré-requisitos: **Node.js 18+** e **npm** instalados, com acesso à internet (para baixar as dependências).

### 1. Backend (API)

```bash
cd backend
npm install
npm run start
```

A API sobe em **http://localhost:3001**. Teste com:
```bash
curl http://localhost:3001/api/health
```

O banco de dados é 100% mock/em memória, recriado a cada reinício do servidor, já populado com:
- 2 galpões, 104 posições de armazenamento
- 3 empilhadeiras (com operadores)
- 52+ big bags distribuídos em 5 lotes de café
- 3 caminhões (recebimento/expedição), incluindo um já parado no pátio
- Posições bloqueadas (laudo pendente, divergência de peso, etc.)
- Tarefas urgentes pré-carregadas com prioridade calculada

Você pode reiniciar o cenário a qualquer momento com:
```bash
curl -X POST http://localhost:3001/api/reset
```

### 2. Frontend (Dashboard)

Em um **segundo terminal**:

```bash
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**. O Vite já está configurado com proxy (`vite.config.js`) para redirecionar chamadas `/api/*` ao backend em `localhost:3001` — não é necessário configurar CORS adicional para desenvolvimento, e não é necessário criar nenhum arquivo `.env` para rodar localmente.

---

## 🚀 Publicando na internet (Frontend → Vercel, Backend → Render)

O projeto está pronto para publicação gratuita, sem mudar nenhuma funcionalidade — só a forma como frontend e backend descobrem a URL um do outro. Os dados continuam mock/em memória (recriados a cada reinício do servidor no Render), como já funcionava localmente.

### Variáveis de ambiente necessárias

| Onde | Variável | Valor |
|---|---|---|
| Render (backend) | `FRONTEND_URL` | URL pública do frontend na Vercel, ex.: `https://meu-projeto.vercel.app` |
| Render (backend) | `PORT` | Não precisa configurar — o Render injeta automaticamente |
| Vercel (frontend) | `VITE_API_URL` | URL pública do backend no Render, ex.: `https://meu-backend.onrender.com` (sem barra no final) |

Os arquivos `backend/.env.example` e `frontend/.env.example` documentam essas variáveis — **não** contêm nenhum valor real/segredo.

### Passo a passo completo

**1. GitHub**
1. Crie um repositório novo no GitHub.
2. Envie o projeto inteiro (pasta raiz com `backend/` e `frontend/`) — o `.gitignore` já impede o envio de `node_modules/`, `.env` e `dist/`.

**2. Render (backend)**
1. Crie uma conta em [render.com](https://render.com) e conecte seu GitHub.
2. Clique em **New > Web Service** e selecione o repositório.
3. Configure o diretório raiz (**Root Directory**) como `backend`.
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Em **Environment**, adicione a variável `FRONTEND_URL` (você pode preencher depois de ter a URL da Vercel — dá para editar e o Render reinicia sozinho).
7. Clique em **Create Web Service** e aguarde o deploy.
8. Copie a URL gerada (ex.: `https://4t-smart-warehouse-backend.onrender.com`).

**3. Configurar Backend**
- Volte nas variáveis de ambiente do serviço no Render e confirme/atualize `FRONTEND_URL` assim que tiver a URL da Vercel (passo 5).
- Teste o health check: `https://SEU-BACKEND.onrender.com/health` deve responder `{"status":"ok"}`.

**4. Vercel (frontend)**
1. Crie uma conta em [vercel.com](https://vercel.com) e conecte seu GitHub.
2. Clique em **Add New > Project** e selecione o mesmo repositório.
3. Em **Root Directory**, selecione `frontend`.
4. O framework é detectado automaticamente como **Vite** (Build Command: `npm run build` / Output Directory: `dist`) — não precisa alterar nada manualmente.
5. Em **Environment Variables**, adicione `VITE_API_URL` com a URL do backend copiada no passo 2.8 (ex.: `https://4t-smart-warehouse-backend.onrender.com`, sem barra no final).
6. Clique em **Deploy**.
7. Copie a URL gerada pela Vercel (ex.: `https://4t-smart-warehouse.vercel.app`).

**5. Configurar Frontend / CORS**
- Volte no Render e atualize `FRONTEND_URL` com a URL exata da Vercel obtida no passo anterior.
- O Render reinicia o serviço automaticamente ao salvar a variável.

**6. Testar**
- Acesse a URL da Vercel no navegador.
- Confirme que a Central Operacional carrega os dados (isso já prova que o frontend está conversando com o backend).
- Navegue entre as telas (`/mapa`, `/tarefas`, `/slotting`, `/operador`) recarregando a página em cada uma — o `vercel.json` incluído garante que essas rotas do React Router funcionem mesmo em acesso direto pela URL.

### Checklist final

```text
[ ] Projeto enviado para GitHub
[ ] Backend publicado no Render
[ ] URL do backend obtida
[ ] FRONTEND_URL configurada no Render
[ ] Frontend publicado na Vercel
[ ] VITE_API_URL configurada na Vercel
[ ] CORS funcionando (sem erro no console do navegador)
[ ] APIs respondendo (/health retorna status ok)
[ ] Dashboard carregando os dados mock
[ ] Aplicação acessível pela internet, em qualquer rota
```

---

## 🧠 Como funcionam os algoritmos

### Priorização dinâmica (`priorityEngine.js`)
Cada tarefa recebe um **score de 0 a 100**, somando pesos por:
- tipo de operação (recebimento e expedição pesam mais que reorganizações internas),
- se está marcada como urgente,
- proximidade do prazo/SLA (caminhão esperando, por exemplo),
- se a posição de origem está bloqueada,
- se há um caminhão relacionado já parado no pátio.

Cada score vem acompanhado de uma **explicação textual** (`prioridadeExplicacao`), exibida no frontend através do botão "por que essa prioridade?".

### Roteirização interna (`routingEngine.js`)
Usa a heurística do **vizinho mais próximo** a partir da posição atual da empilhadeira, minimizando a soma de deslocamento vazio (sem carga) + deslocamento carregado entre tarefas. O resultado é comparado com a rota "não otimizada" (ordem de chegada/FIFO), mostrando a economia estimada em metros e percentual.

### Slotting inteligente (`slottingEngine.js`)
Pontua todas as posições livres considerando:
- distância até a doca de expedição (penaliza mais se o lote tem giro rápido),
- distância até a máquina de rebeneficiamento (se o lote ainda será processado),
- bônus por consolidação (proximidade a outros big bags do mesmo lote),
- penalidade para corredores congestionados.

Retorna o **top 3** de posições recomendadas, cada uma com a explicação do score.

### Fluxo completo de recebimento de um novo lote
1. **Cadastros → Novo Lote**: registra o lote como `aguardando_descarga` (sem big bags ainda).
2. **Cadastros → "Registrar recebimento"**: cria uma tarefa do tipo `recebimento` para esse lote, sem destino definido ainda.
3. **Tarefas & Empilhadeiras**: a tarefa aparece na fila com prioridade calculada; você atribui a uma empilhadeira (manual ou automaticamente).
4. **Ao concluir a tarefa**: o `slottingEngine` escolhe a melhor posição livre disponível, um big bag é criado automaticamente nela, e o lote passa para `armazenado`. A partir daí ele aparece normalmente no Mapa do Armazém e pode ser usado em novas tarefas de expedição/separação.

---

## 🔌 Principais endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/dashboard` | Métricas da Central Operacional |
| GET | `/api/armazem/galpoes` | Lista os galpões |
| GET | `/api/armazem/posicoes?galpaoId=G1` | Lista posições (filtros: galpaoId, status) |
| GET | `/api/armazem/posicoes/:id` | Detalhe de uma posição (com lote/big bag) |
| GET | `/api/tarefas` | Lista tarefas ordenadas por prioridade |
| POST | `/api/tarefas/atribuir-automatico` | Atribui automaticamente tarefas pendentes às empilhadeiras mais próximas |
| POST | `/api/tarefas/:id/atribuir` | Atribuição manual `{ empilhadeiraId }` |
| POST | `/api/tarefas/:id/concluir` | Marca tarefa como concluída (atualiza posições/empilhadeira) |
| GET | `/api/empilhadeiras` | Lista empilhadeiras e tarefa atual |
| POST | `/api/empilhadeiras` | Cadastra nova empilhadeira `{ nome, operador, capacidadeKg }` |
| GET | `/api/lotes` | Lista todos os lotes de café |
| POST | `/api/lotes` | Cadastra novo lote `{ produto, qualidade, proprietario, sacas }` (entra como "aguardando descarga") |
| POST | `/api/lotes/:id/registrar-recebimento` | Gera a tarefa de recebimento para um lote aguardando descarga |
| GET | `/api/roteirizacao/sequencia/:empilhadeiraId` | Sequência otimizada x não-otimizada |
| POST | `/api/slotting/recomendar` | Recomenda posições `{ loteId, priorizarExpedicaoRapida, precisaRebeneficio }` |
| GET | `/api/operador/:empilhadeiraId/proxima-tarefa` | Próxima tarefa do operador |
| POST | `/api/operador/:empilhadeiraId/ler-codigo` | Simula leitura RFID/QR `{ codigoLido, tarefaId }` |
| POST | `/api/operador/:empilhadeiraId/confirmar-conclusao/:tarefaId` | Confirma conclusão via monitor do operador |
| POST | `/api/reset` | Reinicia o cenário de demonstração |

---

## 🗄️ Evoluindo para banco real

O objeto `db` em `backend/server.js` concentra todo o estado em memória (arrays de `galpoes`, `posicoes`, `lotes`, `bigBags`, `empilhadeiras`, `caminhoes`, `tarefas`). Para migrar para PostgreSQL/SQLite:

1. Crie tabelas espelhando os `@typedef` documentados em `src/models/entities.js`.
2. Substitua o `criarBancoMock()` por uma camada de repositório (ex.: Prisma ou Knex) que carregue os mesmos formatos de objeto.
3. As rotas (`src/routes/*.js`) e os motores de negócio (`src/services/*.js`) foram escritos para operar sobre esses formatos de objeto — a lógica de priorização, roteirização e slotting não precisa mudar, só a fonte dos dados.

---

## 🔗 Integração conceitual com o ERP 4T-Grãos

Este sistema foi desenhado para operar como um módulo complementar ao ERP: os `Lote`, `BigBag` e `Caminhao` representam entidades que, em produção, viriam de integrações (webhook/API) com o módulo de recebimento e expedição do ERP 4T-Grãos, mantendo o 4T Smart Warehouse focado exclusivamente na inteligência de movimentação interna.
