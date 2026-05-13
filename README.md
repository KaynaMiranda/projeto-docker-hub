# File Hub Distribuido

Projeto full stack para upload, visualizacao, edicao, download, compartilhamento e processamento de arquivos `.txt`, com arquitetura baseada em containers Docker.

## Fase 1

Esta fase entrega:

- estrutura inicial do monorepo
- `frontend` em React + Vite
- `backend` em Node.js + Express
- `database` em PostgreSQL
- volume local para armazenamento de uploads
- `docker-compose.yml` para orquestracao dos servicos

## Servicos

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5434`

## Como subir

Requisito: Docker Desktop (Engine) em execucao.

```bash
docker compose up --build
```

Se quiser subir em background:

```bash
docker compose up -d --build
```

O container do `backend` aguarda o Postgres ficar pronto e executa `prisma migrate deploy` automaticamente antes de iniciar o servidor.

### Troubleshooting (Windows)

- Erro `The system cannot find the file specified` com `dockerDesktopLinuxEngine`: o Docker Engine nao esta rodando. Abra o Docker Desktop e aguarde ele ficar `Running`, depois tente novamente.
- Aviso `Access is denied` ao ler `C:\Users\<user>\.docker\config.json`: normalmente e permissao do arquivo/pasta `.docker`. Ajuste as permissoes para seu usuario (ou execute o Docker Desktop com o usuario correto) e reabra o terminal.

## Como testar a API sem Docker

Se o Docker nao estiver ativo, o backend pode rodar em modo local com repositorio em memoria para validar upload, listagem, visualizacao e download.

1. Instale as dependencias do backend:

```bash
cd backend
npm install
```

2. Crie o arquivo `.env` com base no exemplo e ajuste:

```env
PORT=3000
STORAGE_DIR=../uploads
CORS_ORIGIN=http://localhost:5173
FILES_REPOSITORY_MODE=memory
```

Para testar localmente com PostgreSQL real:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/filehub?schema=public
STORAGE_DIR=../uploads
CORS_ORIGIN=http://localhost:5173
FILES_REPOSITORY_MODE=prisma
```

3. Suba o backend:

```bash
npm run dev
```

4. Teste a API com um cliente HTTP ou PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/health -Method Get
```

```powershell
Invoke-RestMethod -Uri http://localhost:3000/files -Method Get
```

Para upload via PowerShell, a forma mais simples e usar Postman, Insomnia ou o frontend quando ele estiver pronto.

Para editar o conteudo de um arquivo `.txt`:

```powershell
$body = @{ content = "Novo conteudo do arquivo" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/files/SEU_ID/content -Method Put -ContentType "application/json" -Body $body
```

Para criar um link compartilhado:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/files/SEU_ID/share -Method Post -ContentType "application/json" -Body "{}"
```

Para abrir um arquivo compartilhado:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/shares/SEU_TOKEN -Method Get
```

Para baixar via link compartilhado:

```powershell
curl.exe -s http://localhost:3000/shares/SEU_TOKEN/download
```

Para gerar um resumo com o provider local de IA:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/files/SEU_ID/ai/summary -Method Post
```

Para gerar tarefas:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/files/SEU_ID/ai/tasks -Method Post
```

Para gerar um enunciado de trabalho universitario:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/files/SEU_ID/ai/university-work -Method Post
```

Para listar resultados de IA de um arquivo:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/files/SEU_ID/ai/results -Method Get
```

Para consultar um resultado especifico:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/ai-results/SEU_RESULTADO_ID -Method Get
```

## Proximas fases

- modelagem final e migracoes do banco
- endpoints de arquivos
- compartilhamento por token
- integracao de IA isolada no backend
