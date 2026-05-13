# Contexto do Projeto — File Hub Distribuido

## O que é

Sistema full stack para upload, visualização, edição, download, compartilhamento e processamento de arquivos `.txt` por inteligência artificial. Desenvolvido como trabalho acadêmico de Sistemas Distribuídos, com ênfase em arquitetura baseada em containers Docker.

## Objetivo acadêmico

Demonstrar os conceitos de sistemas distribuídos com:
- separação real de responsabilidades em serviços independentes
- comunicação entre serviços via rede interna Docker
- orquestração com docker-compose
- persistência em banco de dados relacional
- processamento assíncrono isolado do servidor HTTP

## Decisões de design já tomadas

### Sem worker separado
O processamento de IA foi mantido no próprio backend, executado sob demanda. O worker foi descartado para simplificar a operação, mas o módulo de IA foi criado como camada isolada dentro do backend (sem acesso direto a HTTP ou banco).

### Repositório em memória para desenvolvimento local
O backend suporta dois modos de repositório controlados pela variável `FILES_REPOSITORY_MODE`:
- `memory` — usa arrays em memória, sem banco. Ideal para desenvolvimento sem Docker.
- `prisma` — usa PostgreSQL via Prisma ORM. Modo padrão no Docker (não é setado explicitamente no docker-compose, cai no default do código).

### Provider de IA mockado
A integração com IA real ainda não foi feita. O `mock-ai-provider.js` processa o texto localmente com lógica própria (extração de frases, palavras-chave por frequência, stopwords em português). Está pronto para ser substituído por um provider real (ex: Anthropic Claude) sem alterar os módulos de rota/serviço.

### Sem autenticação
Não há usuários, login ou controle de acesso. Qualquer pessoa com acesso ao sistema pode ver todos os arquivos. Isso é intencional para o escopo atual do trabalho.

## Funcionalidades implementadas

| Funcionalidade | Status |
|---|---|
| Upload de arquivos `.txt` (múltiplos) | Implementado |
| Listagem de arquivos | Implementado |
| Visualização do conteúdo em nova aba | Implementado |
| Edição do conteúdo | Implementado |
| Download direto via fetch+blob | Implementado |
| Compartilhamento por link com token UUID | Implementado |
| Permissões de compartilhamento (view/download) | Implementado |
| Geração de resumo via IA (mock) | Implementado |
| Geração de tarefas via IA (mock) | Implementado |
| Geração de trabalho universitário via IA (mock) | Implementado |
| Visualização e edição de resultados de IA | Implementado |
| Pesquisa/filtro de arquivos por nome | Implementado |
| Persistência no PostgreSQL via Prisma | Implementado |
| Migração automática na inicialização do container | Implementado |

## Funcionalidades ainda pendentes / ideias futuras

- Integração com IA real (ex: Anthropic Claude via SDK — já existe o ponto de extensão `infra/ai-provider/create-ai-provider.js`)
- Autenticação de usuários
- Exclusão de arquivos
- Suporte a outros formatos além de `.txt`
- Expiração de links de compartilhamento (campo `expiresAt` já existe no banco, mas não é validado no frontend)
- Histórico de versões de arquivo
- Rate limiting
- Paginação na listagem de arquivos

## Stack de tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| ORM | Prisma |
| Banco de dados | PostgreSQL 16 |
| Upload | multer (memory storage) |
| Testes | vitest + supertest + @testing-library/react |
| Containers | Docker + docker-compose |

## Portas expostas (desenvolvimento local)

| Serviço | Porta |
|---|---|
| Frontend (Vite) | 5173 |
| Backend (Express) | 3000 |
| PostgreSQL | 5434 (mapeado de 5432 interno) |
