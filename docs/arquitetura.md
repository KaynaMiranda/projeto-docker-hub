# Arquitetura do Sistema

## Visão geral dos containers

```
┌─────────────────────────────────────────────────────────┐
│                   rede Docker: filehub-net               │
│                                                          │
│  ┌──────────────┐   HTTP :3000   ┌──────────────────┐   │
│  │   frontend   │ ─────────────► │     backend      │   │
│  │  React+Vite  │                │  Node.js+Express │   │
│  │   :5173      │                │    :3000         │   │
│  └──────────────┘                └────────┬─────────┘   │
│                                           │ Prisma       │
│                                           │ :5432        │
│                                  ┌────────▼─────────┐   │
│                                  │       db         │   │
│                                  │   PostgreSQL 16  │   │
│                                  │    :5432         │   │
│                                  └──────────────────┘   │
└─────────────────────────────────────────────────────────┘

Volume bind:   ./uploads  →  /app/uploads  (no container backend)
Volume named:  postgres_data               (dados do banco)
```

## Sequência de inicialização (docker-compose)

1. `filehub-db` inicia e o healthcheck (`pg_isready`) confirma que o PostgreSQL está aceitando conexões
2. `filehub-backend` inicia **somente após o banco estar healthy** (`depends_on: db: condition: service_healthy`)
3. O `docker-entrypoint.sh` do backend executa:
   - `node src/scripts/wait-for-db.js` — verifica conexão TCP com `db:5432`
   - `prisma migrate deploy` — aplica migrações pendentes
   - `npm run dev` — inicia o servidor com nodemon
4. `filehub-frontend` inicia **somente após o backend estar healthy** (`depends_on: backend: condition: service_healthy`)
   - O healthcheck do backend usa `wget -qO- http://127.0.0.1:3000/health` (usa `127.0.0.1`, não `localhost`, pois em Alpine Linux `localhost` resolve para IPv6)

## Estrutura interna do backend

O backend segue uma arquitetura modular em camadas:

```
src/
├── server.js              — ponto de entrada, bind do Express na porta
├── app.js                 — factory do app (injeta dependências, monta rotas)
├── config/env.js          — centraliza variáveis de ambiente com defaults
│
├── modules/               — responsabilidades de negócio
│   ├── files/             — upload, listagem, visualização, edição, download, compartilhamento
│   │   ├── files.routes.js
│   │   ├── files.controller.js
│   │   ├── files.service.js
│   │   ├── files.repository.js   (implementação Prisma)
│   │   └── files.utils.js        (validação .txt, preview)
│   ├── shares/            — geração e validação de links compartilhados
│   │   ├── shares.routes.js
│   │   ├── shares.controller.js
│   │   ├── shares.service.js
│   │   └── shares.repository.js
│   └── ai/                — geração e edição de resultados por IA
│       ├── file-ai.routes.js     (rotas de geração: /files/:id/ai/*)
│       ├── ai-results.routes.js  (rotas de consulta/edição: /ai-results/*)
│       ├── ai.controller.js
│       ├── ai-results.controller.js
│       ├── ai.service.js
│       └── ai.repository.js      (implementação Prisma)
│
├── infra/                 — implementações de infraestrutura
│   ├── ai-provider/
│   │   ├── create-ai-provider.js  — factory que escolhe o provider por env
│   │   └── mock-ai-provider.js    — provider local sem dependências externas
│   ├── database/prisma.js         — singleton do PrismaClient
│   ├── storage/local-file-storage.js — leitura/escrita de arquivos no volume
│   └── repositories/              — seleção dinâmica de repositório
│       ├── runtime-files-repository.js
│       ├── runtime-shares-repository.js
│       └── runtime-ai-results-repository.js
│
├── shared/
│   ├── errors/app-error.js        — classe AppError com statusCode
│   └── middleware/
│       ├── error-handler.js       — middleware de erro centralizado
│       └── async-handler.js       — wrapper para evitar try/catch em controllers
│
└── scripts/
    └── wait-for-db.js             — verifica conexão TCP com o banco antes de migrar
```

## Padrão de injeção de dependências

O `createApp(dependencies = {})` em `app.js` aceita todas as dependências como parâmetro opcional. Isso permite:
- **Em produção/Docker**: as dependências reais (Prisma, LocalFileStorage) são criadas automaticamente
- **Em testes**: implementações em memória são injetadas, sem banco real

```js
// testes usam:
createApp({
  filesRepository: createInMemoryFileRepository(),
  fileStorage: createInMemoryFileStorage(),
  aiProvider: createMockAIProvider(),
})

// docker usa (defaults do createApp):
createRuntimeFilesRepository()  // → Prisma ou memória por FILES_REPOSITORY_MODE
createLocalFileStorage(env.storageDir)
createAIProvider(env.aiProvider)  // → mock ou futuro provider real
```

## Provider de IA — ponto de extensão

Para integrar uma IA real, basta criar um novo arquivo em `infra/ai-provider/` que exporte um objeto com:

```js
{
  promptVersion: "v1",
  async generate({ type, content, file }) {
    // type: "SUMMARY" | "TASKS" | "UNIVERSITY_WORK"
    // retorna: { promptVersion, resultText, metadataJson }
  }
}
```

E registrar o novo provider em `create-ai-provider.js` com a chave correspondente em `AI_PROVIDER`.

## Storage de arquivos

Arquivos são salvos no volume `./uploads` como `UUID.txt`. O nome original é preservado apenas no banco de dados (`originalName`). O campo `path` na tabela `File` armazena o caminho completo dentro do container (`/app/uploads/UUID.txt`).

A leitura e escrita são feitas por `LocalFileStorage` que usa `fs/promises` do Node. Em testes usa-se `InMemoryFileStorage` com um `Map` em memória.
