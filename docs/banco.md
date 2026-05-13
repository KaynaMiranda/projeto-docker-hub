# Banco de Dados

## Configuração

- **SGBD**: PostgreSQL 16 (Alpine)
- **ORM**: Prisma 6
- **Schema**: `public`
- **Migrations**: em `backend/prisma/migrations/`
- **Migration atual**: `20260506130500_init_phase2`

A migração é aplicada automaticamente no startup do container backend via `prisma migrate deploy`.

## Variável de conexão

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/filehub?schema=public
```

Em desenvolvimento local (fora do Docker):
```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/filehub?schema=public
```

(A porta 5434 é o mapeamento externo do Docker Compose: `5434:5432`)

---

## Modelos

### `File`

Armazena metadados de cada arquivo enviado.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (CUID) | PK gerado automaticamente |
| `originalName` | String | Nome original do arquivo (ex: `relatorio.txt`) |
| `storedName` | String | Nome com que foi salvo no disco (ex: `uuid.txt`) |
| `path` | String | Caminho completo no volume (`/app/uploads/uuid.txt`) |
| `mimeType` | String? | MIME type detectado (geralmente `text/plain`) |
| `size` | Int | Tamanho em bytes |
| `contentPreview` | String? | Primeiros 180 caracteres do conteúdo |
| `processingStatus` | Enum | `IDLE` \| `PROCESSING` \| `DONE` \| `ERROR` |
| `createdAt` | DateTime | Criação automática |
| `updatedAt` | DateTime | Atualização automática |

Relações: `shares[]` (1:N), `aiResults[]` (1:N)

---

### `Share`

Representa um link de compartilhamento gerado para um arquivo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (CUID) | PK |
| `fileId` | String | FK → `File.id` (cascade delete) |
| `token` | String (UNIQUE) | UUID usado na URL pública |
| `allowDownload` | Boolean | Se o link permite download (default `true`) |
| `allowView` | Boolean | Se o link permite visualização (default `true`) |
| `expiresAt` | DateTime? | Data de expiração (null = sem expiração) |
| `createdAt` | DateTime | Criação automática |

> **Nota**: o campo `expiresAt` já existe no banco mas a validação de expiração no frontend ainda não foi implementada. O backend valida a expiração no serviço de shares.

---

### `AIResult`

Armazena resultados gerados pela IA para cada arquivo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (CUID) | PK |
| `fileId` | String | FK → `File.id` (cascade delete) |
| `type` | Enum | `SUMMARY` \| `TASKS` \| `UNIVERSITY_WORK` |
| `status` | Enum | `PENDING` \| `DONE` \| `ERROR` |
| `promptVersion` | String? | Versão do prompt/provider usado (ex: `mock-v1`) |
| `resultText` | String? | Texto gerado (pode ser editado pelo usuário via `PUT /ai-results/:id`) |
| `metadataJson` | Json? | Metadados extras: keywords, wordCount, provider, etc. |
| `createdAt` | DateTime | Criação automática |
| `updatedAt` | DateTime | Atualização automática |

> Cada arquivo pode ter **no máximo um resultado por type**. Se gerado novamente, o resultado existente é atualizado (não duplicado).

---

## Enums

```prisma
enum ProcessingStatus { IDLE, PROCESSING, DONE, ERROR }
enum AIResultType     { SUMMARY, TASKS, UNIVERSITY_WORK }
enum AIResultStatus   { PENDING, DONE, ERROR }
```

---

## Como criar uma nova migration

```bash
cd backend
npm run prisma:migrate  # prisma migrate dev --name nome_da_migration
```

Para aplicar em produção/Docker:
```bash
npm run prisma:migrate:deploy  # prisma migrate deploy
```

---

## Índices relevantes

- `Share.token` — índice único (criado automaticamente por `@unique`)
- `AIResult`: buscas por `(fileId, type)` são frequentes — considerar adicionar índice composto se o volume de dados crescer

---

## Modo memória vs Prisma

O backend suporta repositórios intercambiáveis controlados por `FILES_REPOSITORY_MODE`:

| Valor | Comportamento |
|---|---|
| `memory` | Arrays em memória, sem banco. Dados perdidos ao reiniciar. Útil para desenvolvimento rápido. |
| `prisma` | PostgreSQL real. Dados persistem. Usado em Docker (default do código quando a var não está definida). |

Os repositórios em memória ficam em `backend/tests/helpers/` e são idênticos em interface aos Prisma repositories.
