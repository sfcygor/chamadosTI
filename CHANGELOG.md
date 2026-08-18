# Changelog

Histórico de todas as modificações importantes no código do sistema AtendeTI.

## [2026-08-17]
- **O que mudou**: Preparação completa para deploy em produção — NeonDB + Vercel + Railway:
  - Prisma schema migrado de `sqlite` para `postgresql` com suporte a `directUrl` (NeonDB)
  - CORS da API atualizado para leitura dinâmica via variável `CORS_ORIGINS` (segurança em produção)
  - Criado `railway.toml` para configuração de deploy do backend na Railway
  - Criado `vercel.json` para configuração de deploy do frontend na Vercel
  - Criados arquivos `.env.example` para `packages/database`, `apps/api` e `apps/web`
  - Removida barra de busca do Quadro de Chamados (Kanban) — filtros de prioridade e categoria mantidos
- **Arquivos impactados**:
  - `packages/database/prisma/schema.prisma`
  - `packages/database/.env.example` (**NOVO**)
  - `apps/api/src/main.ts`
  - `apps/api/railway.toml` (**NOVO**)
  - `apps/api/.env.example` (**NOVO**)
  - `apps/web/vercel.json` (**NOVO**)
  - `apps/web/.env.example` (**NOVO**)
  - `apps/web/src/app/dashboard/page.tsx`



## [2026-08-17]
- **O que mudou**: Criada página de preview de novo design (`/preview`) com visual dark premium, glassmorphism, cards Kanban ricos com micro-animações, cards de métricas (stats), alerta de críticos sem responsável e drag-and-drop funcional — usando dados fictícios para aprovação antes de substituir o design atual.
- **Arquivos impactados**:
  - `apps/web/src/app/preview/page.tsx` (**NOVO**)
  - `apps/web/src/components/Sidebar.tsx` (adicionado link "Novo Design ✨" abaixo de Relatórios para AGENTE e ADMIN)

## [2026-08-11]
- **O que mudou**: Criada regra de automatização do CHANGELOG. A IA foi configurada para registrar automaticamente todas as modificações neste arquivo.
- **Arquivos impactados**: 
  - `.agents/AGENTS.md`
  - `CHANGELOG.md`

## [2026-08-11]
- **O que mudou**: Bugfix no sistema de notificação sonora. O som de nova mensagem foi corrigido para tocar apenas para o agente responsável pelo chamado (ou todos caso não haja responsável).
- **Arquivos impactados**: 
  - `apps/web/src/components/AppLayout.tsx`
  - `apps/api/src/comments/comments.service.ts`

## [2026-08-11]
- **O que mudou**: Aumento da largura da tela de detalhes do chamado para `max-w-7xl` para dar mais visibilidade à área do chat.
- **Arquivos impactados**: 
  - `apps/web/src/app/tickets/[id]/page.tsx`

## [2026-08-11]
- **O que mudou**: Adicionado um indicador de sistema na linha do tempo do chamado mostrando quem assumiu e em que momento.
- **Arquivos impactados**: 
  - `apps/web/src/app/tickets/[id]/page.tsx`
