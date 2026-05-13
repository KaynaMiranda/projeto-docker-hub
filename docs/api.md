# Referência da API

Base URL: `http://localhost:3000`

Todas as respostas são JSON, exceto os endpoints de download e visualização (`/download`, `/view`) que retornam `text/plain`.

Erros retornam `{ "error": "mensagem descritiva" }` com o HTTP status apropriado.

---

## Health

### `GET /health`
Verifica se o backend está ativo.

**Resposta 200**
```json
{
  "status": "ok",
  "service": "backend",
  "timestamp": "2026-05-08T00:00:00.000Z"
}
```

---

## Arquivos

### `POST /files`
Faz upload de um arquivo `.txt`.

**Body**: `multipart/form-data`
- `file` (File) — arquivo `.txt` a ser enviado

**Resposta 201**
```json
{
  "file": {
    "id": "cuid",
    "originalName": "meu-arquivo.txt",
    "storedName": "uuid.txt",
    "mimeType": "text/plain",
    "size": 1024,
    "contentPreview": "Primeiros 180 caracteres...",
    "processingStatus": "IDLE",
    "createdAt": "2026-05-08T00:00:00.000Z",
    "updatedAt": "2026-05-08T00:00:00.000Z"
  }
}
```

**Erros**
- `400` — arquivo ausente ou não é `.txt`

---

### `GET /files`
Lista todos os arquivos cadastrados.

**Resposta 200**
```json
{
  "files": [
    { "id": "...", "originalName": "...", "size": 0, "processingStatus": "IDLE", ... }
  ]
}
```

---

### `GET /files/:id`
Retorna metadados de um arquivo pelo ID.

**Resposta 200**
```json
{ "file": { "id": "...", ... } }
```

**Erros**
- `404` — arquivo não encontrado

---

### `GET /files/:id/content`
Retorna metadados + conteúdo textual do arquivo como JSON.

**Resposta 200**
```json
{
  "file": { "id": "...", ... },
  "content": "Texto completo do arquivo..."
}
```

**Erros**
- `404` — arquivo não encontrado

---

### `GET /files/:id/view`
Serve o conteúdo do arquivo como `text/plain` com `Content-Disposition: inline`. Ideal para abrir em nova aba do browser.

**Headers de resposta**
```
Content-Type: text/plain; charset=utf-8
Content-Disposition: inline; filename="meu-arquivo.txt"
```

**Resposta 200**: conteúdo bruto do arquivo

**Erros**
- `404` — arquivo não encontrado

---

### `PUT /files/:id/content`
Atualiza o conteúdo textual de um arquivo.

**Body JSON**
```json
{ "content": "Novo conteúdo do arquivo." }
```

**Resposta 200**
```json
{
  "file": { "id": "...", "size": 42, "contentPreview": "...", ... },
  "content": "Novo conteúdo do arquivo."
}
```

**Erros**
- `400` — `content` ausente ou não é string
- `404` — arquivo não encontrado

---

### `GET /files/:id/download`
Retorna o arquivo para download com `Content-Disposition: attachment`.

**Headers de resposta**
```
Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="meu-arquivo.txt"
```

**Resposta 200**: conteúdo bruto do arquivo

**Erros**
- `404` — arquivo não encontrado

---

### `POST /files/:id/share`
Cria um link compartilhável para o arquivo.

**Body JSON** (todos opcionais)
```json
{
  "allowView": true,
  "allowDownload": true,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

**Resposta 201**
```json
{
  "share": {
    "id": "cuid",
    "fileId": "...",
    "token": "uuid-token",
    "allowView": true,
    "allowDownload": true,
    "expiresAt": null,
    "createdAt": "2026-05-08T00:00:00.000Z",
    "shareUrl": "http://localhost:3000/shares/uuid-token"
  }
}
```

**Erros**
- `404` — arquivo não encontrado

---

## Compartilhamento

### `GET /shares/:token`
Retorna o conteúdo de um arquivo via link compartilhado.

**Resposta 200**
```json
{
  "file": { "id": "...", "originalName": "...", ... },
  "content": "Conteúdo do arquivo..."
}
```

**Erros**
- `403` — link não permite visualização (`allowView: false`)
- `404` — token inválido ou link expirado

---

### `GET /shares/:token/download`
Baixa o arquivo via link compartilhado.

**Headers de resposta**
```
Content-Disposition: attachment; filename="meu-arquivo.txt"
```

**Resposta 200**: conteúdo bruto

**Erros**
- `403` — link não permite download (`allowDownload: false`)
- `404` — token inválido ou link expirado

---

## Processamento por IA

### `POST /files/:fileId/ai/summary`
Gera um resumo do conteúdo do arquivo.

**Resposta 201**
```json
{
  "aiResult": {
    "id": "cuid",
    "fileId": "...",
    "type": "SUMMARY",
    "status": "DONE",
    "promptVersion": "mock-v1",
    "resultText": "Primeiras frases que resumem o documento...",
    "metadataJson": {
      "provider": "mock",
      "generatedAt": "2026-05-08T00:00:00.000Z",
      "keywords": ["palavra1", "palavra2", "palavra3"],
      "wordCount": 120
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Erros**
- `400` — arquivo vazio ou sem conteúdo válido
- `404` — arquivo não encontrado

---

### `POST /files/:fileId/ai/tasks`
Gera um enunciado de tarefas com perguntas e respostas baseado no conteúdo.

**Resposta 201** — mesmo formato que `/summary`, com `type: "TASKS"`

---

### `POST /files/:fileId/ai/university-work`
Gera um enunciado de trabalho universitário baseado no conteúdo.

**Resposta 201** — mesmo formato que `/summary`, com `type: "UNIVERSITY_WORK"`

---

### `GET /files/:fileId/ai/results`
Lista todos os resultados de IA gerados para um arquivo.

**Resposta 200**
```json
{
  "aiResults": [
    { "id": "...", "type": "SUMMARY", "status": "DONE", ... },
    { "id": "...", "type": "TASKS", "status": "DONE", ... }
  ]
}
```

**Erros**
- `404` — arquivo não encontrado

---

### `GET /ai-results/:id`
Retorna um resultado de IA específico pelo ID.

**Resposta 200**
```json
{ "aiResult": { "id": "...", "type": "SUMMARY", "resultText": "...", ... } }
```

**Erros**
- `404` — resultado não encontrado

---

### `PUT /ai-results/:id`
Atualiza o texto de um resultado de IA (edição manual pelo usuário).

**Body JSON**
```json
{ "resultText": "Texto editado manualmente pelo usuário." }
```

**Resposta 200**
```json
{ "aiResult": { "id": "...", "resultText": "Texto editado...", ... } }
```

**Erros**
- `400` — `resultText` ausente ou não é string
- `404` — resultado não encontrado

---

## Observações sobre CORS

O backend aceita requisições do origin definido em `CORS_ORIGIN` (padrão: `http://localhost:5173`). Em Docker, o frontend roda em `localhost:5173`, então o CORS está configurado corretamente por padrão.
