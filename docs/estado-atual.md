# Estado Atual do Projeto

> Última atualização: 2026-05-08

## O que está funcionando

O stack completo sobe com `docker compose up --build`. Os três containers ficam healthy e se comunicam corretamente.

### Backend (35 testes passando)
- Todos os endpoints documentados em `api.md` estão implementados e testados
- Repositório Prisma e repositório em memória intercambiáveis
- Migrations aplicadas automaticamente no startup
- Health check corrigido: usa `127.0.0.1` em vez de `localhost` (Alpine Linux resolve `localhost` para IPv6)

### Frontend (16 testes passando)
- Upload de múltiplos arquivos `.txt`
- Listagem com filtro por nome em tempo real
- Editor de conteúdo com salvar/desfazer
- Botão "Visualizar" abre o documento em nova aba (`text/plain` via `/view`)
- Botão "Download" usa `fetch` + `createObjectURL` para download direto (sem navegação)
- Geração de link de compartilhamento com token UUID
- Geração de resumo, tarefas e trabalho universitário via IA (mock)
- Botão "Abrir e editar" nos cards de resultado de IA carrega o resultado no editor principal

### Banco de dados
- 3 tabelas: `File`, `Share`, `AIResult`
- Migration `20260506130500_init_phase2` aplicada
- Volume persistente `postgres_data`

## Problemas conhecidos / limitações

| Item | Detalhe |
|---|---|
| IA é mock | Não usa modelo de linguagem real. Resultados são gerados por lógica de extração de frases e palavras-chave. |
| Sem autenticação | Todos os arquivos são visíveis para qualquer pessoa com acesso. |
| Sem exclusão | Não existe endpoint ou botão para apagar arquivos ou resultados de IA. |
| `expiresAt` no banco | O campo existe na tabela `Share`, mas a interface não permite configurar expiração, e o frontend não exibe links expirados de forma diferente. |
| README desatualizado | O `README.md` na raiz ainda menciona "Próximas fases" que já foram implementadas. Pode ser atualizado. |
| Provider de IA não configurável no docker-compose | `AI_PROVIDER=mock` está hard-coded no docker-compose. Para trocar, editar o arquivo manualmente. |

## Próximos passos sugeridos

Em ordem de impacto/viabilidade:

1. **Integração com IA real** — criar `anthropic-ai-provider.js` usando o SDK da Anthropic. O ponto de extensão já existe em `infra/ai-provider/`. Ver seção "Adicionar novo provider" em `desenvolvimento.md`.

2. **Exclusão de arquivos** — adicionar `DELETE /files/:id` no backend (incluir cascade delete nas relações via Prisma) e botão na interface.

3. **Expiração de links** — o campo `expiresAt` já está no banco e o backend já valida. Falta apenas um input de data no frontend ao gerar o link.

4. **Atualização do README** — refletir o estado real do projeto com todas as funcionalidades implementadas.

5. **Paginação** — endpoint `GET /files` retorna todos os arquivos sem paginação. Com muitos arquivos isso pode ser lento.

6. **Autenticação** — adicionar JWT ou sessão simples para isolar arquivos por usuário.

## Histórico de fases

| Fase | O que foi feito |
|---|---|
| Fase 1 | Estrutura inicial do monorepo, docker-compose, Dockerfiles, repositórios em memória, upload básico, listagem |
| Fase 2 | Schema do banco (Prisma), migrations, repositórios Prisma, módulo de compartilhamento, módulo de IA com mock provider, todos os endpoints da API, UI completa em React |
| Fase 3 (atual) | Upload múltiplo, visualização em nova aba, download por fetch+blob, pesquisa de arquivos, edição de resultados de IA (`PUT /ai-results/:id`), correção do health check Docker (IPv6 vs IPv4), cleanup automático nos testes do frontend |
