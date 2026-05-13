# Guia de Desenvolvimento

## Pré-requisitos

- Docker Desktop (Engine) rodando
- Node.js 20+ (para rodar backend/frontend fora do Docker)
- npm 10+

---

## Subir o stack completo com Docker

```bash
# primeira vez (faz build das imagens)
docker compose up --build

# execuções seguintes (sem rebuild)
docker compose up

# em background
docker compose up -d

# parar e remover volumes (limpa banco de dados)
docker compose down -v
```

URLs após subir:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- PostgreSQL: localhost:5434

> **Troubleshooting no Windows**: se ocorrer erro de permissão ou "system cannot find the file", verifique se o Docker Desktop está em estado `Running`. Aguarde ele inicializar completamente antes de rodar o compose.

---

## Rodar o backend localmente (sem Docker)

Útil para desenvolvimento rápido sem precisar subir containers.

```bash
cd backend
npm install
```

Criar/editar `.env`:
```env
PORT=3000
STORAGE_DIR=../uploads
CORS_ORIGIN=http://localhost:5173
FILES_REPOSITORY_MODE=memory
AI_PROVIDER=mock
```

```bash
npm run dev
```

O backend sobe em modo memória — sem banco, sem persistência entre reinicializações.

Para usar PostgreSQL real local (ex: com banco rodando via Docker separado):
```env
FILES_REPOSITORY_MODE=prisma
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/filehub?schema=public
```

---

## Rodar o frontend localmente (sem Docker)

```bash
cd frontend
npm install
npm run dev
```

O frontend se conecta ao backend em `http://localhost:3000` por padrão (configurado em `src/api.js` via `VITE_API_URL`).

---

## Testes

### Backend

```bash
cd backend
npm test           # roda todos os testes uma vez
npm run test:watch # modo watch
```

Os testes usam repositórios e storage em memória (sem banco). Não requerem Docker.

Arquivos de teste: `backend/tests/`
- `files.service.test.js` — testes unitários do serviço de arquivos
- `files.routes.int.test.js` — testes de integração das rotas de arquivos
- `shares.service.test.js` — testes do serviço de compartilhamento
- `shares.routes.int.test.js` — testes de integração das rotas de shares
- `ai.service.test.js` — testes do serviço de IA
- `ai.routes.int.test.js` — testes de integração das rotas de IA

Helpers de teste: `backend/tests/helpers/`
- `in-memory-file-repository.js`
- `in-memory-share-repository.js`
- `in-memory-ai-results-repository.js`
- `in-memory-file-storage.js`

### Frontend

```bash
cd frontend
npm test
```

Arquivos de teste: `frontend/src/`
- `utils.test.js` — testes unitários dos utilitários
- `api.test.js` — testes das funções de API (fetch mockado)
- `App.test.jsx` — testes de componente (renderização, pesquisa, múltiplo upload)
- `App.integration.test.jsx` — teste de integração completo (mock backend simulando todos os endpoints)

---

## Convenções de código

### Backend

**Padrão de módulo**: cada módulo em `src/modules/` segue a sequência:
```
routes → controller → service → repository
```

- **routes**: define os endpoints e chama `asyncHandler(controller.método)`
- **controller**: extrai dados da request, chama service, formata response
- **service**: contém a lógica de negócio, lança `AppError` quando necessário
- **repository**: acessa o banco (Prisma) ou memória

**Factory pattern**: todos os módulos são funções que recebem dependências e retornam objetos. Nunca classes, nunca singletons com estado implícito.

**Sem try/catch nos controllers**: usar `asyncHandler` garante que erros assíncronos são capturados e passados ao `errorHandler` middleware.

**AppError**: para erros esperados (validação, não encontrado), lançar `new AppError("mensagem", statusCode)`. O `errorHandler` trata AppError com o statusCode definido; outros erros retornam 500.

### Frontend

**Sem biblioteca de roteamento**: a UI é um SPA de uma única página. Mudanças de "tela" são controladas por estado React (`editingAIResult`, `selectedFileId`).

**api.js**: todas as chamadas HTTP saem daqui. Nunca usar `fetch` diretamente nos componentes.

**utils.js**: funções puras de formatação e label. Sem efeitos colaterais.

**styles.css**: CSS puro sem framework. Dark theme com variáveis de cor em `:root`.

---

## Variáveis de ambiente

### Backend

| Variável | Default (no código) | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor Express |
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/filehub?schema=public` | String de conexão Prisma |
| `STORAGE_DIR` | `/app/uploads` | Diretório onde os arquivos são salvos |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin permitida pelo CORS |
| `FILES_REPOSITORY_MODE` | `prisma` | `memory` ou `prisma` |
| `AI_PROVIDER` | `mock` | Provider de IA (`mock` ou futuro `anthropic`, etc.) |

> No Docker, `FILES_REPOSITORY_MODE` não é definida no `docker-compose.yml`, então cai no default `prisma` do código. O arquivo `.env` do backend (usado localmente) define `memory` para desenvolvimento sem banco.

### Frontend

| Variável | Default | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | URL base do backend |

---

## Adicionar um novo provider de IA real

1. Criar `backend/src/infra/ai-provider/meu-provider.js`:
```js
function createMeuProvider() {
  return {
    promptVersion: "meu-provider-v1",
    async generate({ type, content, file }) {
      // chamar API externa aqui
      return {
        promptVersion: "meu-provider-v1",
        resultText: "...",
        metadataJson: { provider: "meu-provider", ... },
      };
    },
  };
}
export { createMeuProvider };
```

2. Registrar em `backend/src/infra/ai-provider/create-ai-provider.js`:
```js
import { createMeuProvider } from "./meu-provider.js";

function createAIProvider(name) {
  if (name === "meu-provider") return createMeuProvider();
  return createMockAIProvider(); // fallback
}
```

3. Setar `AI_PROVIDER=meu-provider` no `.env` ou no `docker-compose.yml`.

---

## Estrutura de pastas completa

```
projeto-docker-hub/
├── docs/                    ← documentação do projeto
├── uploads/                 ← arquivos .txt enviados (bind mount do Docker)
├── docker-compose.yml
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── package.json
│   ├── .env                 ← config local (FILES_REPOSITORY_MODE=memory)
│   ├── .env.example
│   ├── vitest.config.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/env.js
│   │   ├── routes/index.js  ← / e /health
│   │   ├── modules/files/
│   │   ├── modules/shares/
│   │   ├── modules/ai/
│   │   ├── infra/
│   │   └── shared/
│   └── tests/
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── utils.js
        ├── styles.css
        └── setupTests.js
```
