# File Hub Distribuído

Sistema full stack para upload, visualização, edição, download, compartilhamento e processamento de arquivos por inteligência artificial. Tudo rodando em containers Docker.

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Upload | Envie arquivos `.txt`, `.csv`, `.json`, `.md`, `.pdf`, `.docx`, `.xlsx` e mais |
| Listagem | Visualize todos os arquivos com filtro por nome em tempo real |
| Visualização | Abra o arquivo em uma nova aba ou veja o conteúdo no próprio sistema |
| Edição | Edite o conteúdo do arquivo diretamente na interface com suporte a desfazer |
| Download | Baixe o arquivo original com um clique |
| Compartilhamento | Gere links compartilháveis com token UUID |
| IA (mock) | Gere resumo, tarefas e trabalhos universitários a partir do conteúdo |
| Multi-formato | Suporte a PDF, DOCX, XLSX, TXT, CSV, JSON, MD, XML, LOG, YAML |

## Quick start (recomendado)

Requisito: **Docker** instalado e rodando.

### Opção 1 — Usar as imagens sem baixar o projeto

Crie um arquivo `docker-compose.yml` em qualquer pasta com este conteúdo:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: filehub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d filehub"]
      interval: 3s
      timeout: 3s
      retries: 20

  backend:
    image: kaynamiranda/filehub-backend:latest
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/filehub?schema=public
      CORS_ORIGIN: http://localhost
    volumes:
      - uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s

  frontend:
    image: kaynamiranda/filehub-frontend:latest
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_started
    restart: always

volumes:
  postgres_data:
  uploads:
```

Depois execute na mesma pasta:

```bash
docker compose up
# Abra http://localhost
```

### Opção 2 — Clonar o repositório

```bash
git clone https://github.com/KaynaMiranda/projeto-docker-hub.git
cd projeto-docker-hub
docker compose -f docker-compose.hub.yml up
```

O sistema sobe com 3 containers:

| Serviço | Acesso | Descrição |
|---|---|---|
| Frontend | http://localhost | Interface web React |
| Backend | http://localhost:3000 | API REST Node.js/Express |
| Banco | localhost:5434 | PostgreSQL 16 |

Para subir em segundo plano:

```bash
docker compose -f docker-compose.hub.yml up -d
```

Para parar:

```bash
docker compose -f docker-compose.hub.yml down
```

Para parar e apagar os dados do banco:

```bash
docker compose -f docker-compose.hub.yml down -v
```

## Como usar

### Upload de arquivos

1. Na tela inicial, clique em **"Selecionar arquivos"**
2. Escolha um ou mais arquivos
3. Clique em **"Fazer upload"**
4. O arquivo aparece na lista lateral

### Visualizar e editar

1. Clique em um arquivo na lista lateral
2. O conteúdo aparece no editor principal
3. Edite o texto e clique em **"Salvar alterações"**
4. Use **"Visualizar"** para abrir em nova aba
5. Use **"Download"** para baixar o arquivo

### Compartilhar

1. Selecione um arquivo
2. Na seção de compartilhamento, clique em **"Gerar link"**
3. Copie o link gerado e envie para quem quiser
4. O link pode permitir visualização e/ou download

### Inteligência Artificial

1. Selecione um arquivo com conteúdo textual
2. Clique em **"Gerar resumo"**, **"Gerar tarefas"** ou **"Gerar trabalho"**
3. O resultado aparece na seção de IA
4. Clique em **"Abrir e editar"** para modificar o resultado

> O provider de IA atual é **mock** — processa o texto localmente sem chamar APIs externas. Para integração com IA real (ex: Anthropic Claude), veja o guia em `docs/desenvolvimento.md`.

## Imagens no Docker Hub

As imagens pré-buildadas estão disponíveis no Docker Hub:

- [kaynamiranda/filehub-backend](https://hub.docker.com/r/kaynamiranda/filehub-backend)
- [kaynamiranda/filehub-frontend](https://hub.docker.com/r/kaynamiranda/filehub-frontend)

## Para desenvolvedores

### Build local

```bash
# Subir com build das imagens (modo desenvolvimento)
docker compose up --build

# Frontend em: http://localhost:5173
# Backend em: http://localhost:3000
```

O modo desenvolvimento usa hot-reload — alterações no código são refletidas automaticamente.

### Testes

```bash
# Backend (35 testes)
cd backend
npm install
npm test

# Frontend (16 testes)
cd frontend
npm install
npm test
```

### Sem Docker (apenas backend)

```bash
cd backend
npm install

# Modo memória (sem banco de dados)
cp .env.example .env
npm run dev
```

### Estrutura do projeto

```
projeto-docker-hub/
├── backend/          # API Node.js + Express + Prisma
├── frontend/         # Interface React + Vite
├── docs/             # Documentação detalhada
├── uploads/          # Arquivos enviados
├── docker-compose.yml        # Dev (build local)
├── docker-compose.hub.yml    # Produção (Docker Hub)
└── README.md
```

Documentação técnica completa em `docs/`:

| Arquivo | Conteúdo |
|---|---|
| `docs/arquitetura.md` | Arquitetura, fluxo de inicialização, estrutura de pastas |
| `docs/api.md` | Referência completa da API REST |
| `docs/banco.md` | Modelos do banco, migrations, enums |
| `docs/desenvolvimento.md` | Setup local, testes, convenções de código, como adicionar provider de IA |
| `docs/contexto.md` | Contexto acadêmico e decisões de design |

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                   rede Docker: filehub-net               │
│                                                          │
│  ┌──────────────┐   proxy nginx    ┌──────────────────┐  │
│  │   frontend   │ ───────────────► │     backend      │  │
│  │   nginx      │   /files, etc.   │  Node.js+Express │  │
│  │   :80        │                  │    :3000         │  │
│  └──────────────┘                  └────────┬─────────┘  │
│                                             │ Prisma      │
│                                             │ :5432       │
│                                    ┌────────▼─────────┐  │
│                                    │       db         │  │
│                                    │   PostgreSQL 16  │  │
│                                    │    :5432         │  │
│                                    └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

3 volumes: `postgres_data` (banco), `uploads` (arquivos enviados).
1 rede interna: `filehub-net` (bridge).

## Troubleshooting

### Docker Engine não está rodando

Erro: `The system cannot find the file specified` ou `Cannot connect to the Docker daemon`.

Abra o Docker Desktop e aguarde o status ficar `Running`.

### Porta 80 já está em uso

Edite o `docker-compose.hub.yml` e altere a porta do frontend:

```yaml
frontend:
  ports:
    - "8080:80"  # muda de 80 para 8080
```

Depois acesse http://localhost:8080.

### Erro de permissão no Windows

Se aparecer `Access is denied` ao ler `.docker/config.json`, execute o Docker Desktop como administrador ou ajuste as permissões da pasta `.docker`.
