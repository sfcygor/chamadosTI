# Snapshot Projeto AtendeTI - 001

## 1. RESUMO EXECUTIVO
- **Nome do projeto:** AtendeTI
- **Objetivo:** Sistema de gestão de chamados para TI (substitui o WhatsApp, trazendo organização, fila e métricas).
- **Status geral:** MVP Funcional, robusto e em fase de aprimoramento contínuo.
- **Data do snapshot:** 22 de Julho de 2026.

## 2. ESCOPO E FEATURES IMPLEMENTADAS
- **Sistema de Autenticação:** Login protegido para Colaborador, Agente de TI e Admin.
- **Abertura de Chamado:** Portal simplificado para colaboradores criarem chamados rapidamente (menos de 30s).
- **Fila de Chamados Kanban (Agente de TI):** Quatro colunas claras (Novos, Em Andamento, Aguardando Usuário) com suporte visual excelente.
- **Assunção de Chamado:** Botão prático para agentes "Assumirem" tickets na fila.
- **Timeline e Comentários:** Chat e histórico de interações bidirecionais documentados no ticket.
- **Notas Internas:** Comentários visíveis **apenas** para equipe de TI.
- **Priorização Manual:** Agente de TI define a criticidade do chamado de forma isolada, gerando log de auditoria.
- **Upload de Anexos:** Suporte a arquivos integrados aos chamados.
- **Histórico de Chamados (TI):** Aba unificada no dashboard principal que mostra todos os chamados "Resolvidos/Fechados" sem recarregar a página, com tabela paginada e filtros dinâmicos.
- **Auto-atualização via WebSockets (Socket.io):** A Fila de TI e o Dashboard do Colaborador são atualizados instantaneamente via eventos em tempo real, sem necessidade de polling.
- **Relatórios Executivos (Admin/Agente):** Exportação de dados brutos e KPIs filtrados por período, em formatos CSV (com delimitador brasileiro) e PDF (via jsPDF).
- **Ordenação Automática:** Dashboard de colaboradores exibe os chamados baseando-se em `última atualização`, garantindo que interações recentes fiquem no topo.
- **Responsividade:** Layout 100% responsivo para Mobile, Tablet e Desktop.
- **PWA (Progressive Web App):** Manifesto e Service Worker configurados. Instalável como aplicativo de celular, com suporte visual offline.

## 3. STACK TÉCNICO
- **Arquitetura:** Monorepo via Turborepo (`apps/web`, `apps/api`, `packages/db`).
- **Frontend:** React / Next.js 14 (App Router) + TailwindCSS + Lucide Icons + date-fns.
- **Backend:** NestJS (Node.js REST API).
- **Banco de Dados:** PostgreSQL + Prisma ORM.
- **Autenticação:** JWT rigoroso com rotação de `access_token` e `refresh_token` armazenados **apenas em HttpOnly Cookies** (imune a XSS). Controle de Acesso por Funções (RBAC).
- **Notificações e Tempo Real:** WebSockets (`socket.io` e `@nestjs/websockets`).
- **PWA:** `next-pwa` para caching e runtime-caching workers.

## 4. PALETA DE CORES
- **Verde Principal:** `#10b981` (emerald-500) a `#059669` (emerald-600)
- **Verde Escuro:** `#047857` (emerald-700)
- **Verde Claro:** `#d1fae5` (emerald-100)
- **Branco:** `#ffffff`
- **Cinza Neutro/Backgrounds:** `#f8fafc` (slate-50), `#f1f5f9` (slate-100), `#94a3b8` (slate-400), `#64748b` (slate-500)

## 5. ESPECIFICAÇÕES E DIRETRIZES IMPLEMENTADAS

### Segurança (Baseado na Cartilha AtendeTI)
- Acesso à API altamente segmentado: Colaboradores não têm acesso aos chamados de outros colaboradores;
- Proteção total de rotas (`/admin` isolado);
- Sanitização via DTOs usando `class-validator` e `class-transformer` no backend;
- Criptografia de senhas usando `bcrypt`;
- API construída impedindo exclusões acidentais em cascata por agentes comuns.

### Responsividade
- **Breakpoints:** Base mobile-first. Telas maiores (768px e 1024px+) realocam a sidebar estaticamente e formam grids complexos.
- **Mobile:** Menu sanduíche com off-canvas sidebar. Botões de ação em tamanho ideal (touch-friendly).
- Kanban otimizado para possuir largura horizontal infinita com navegação fluida em telas estreitas, sem quebrar os cards.

### PWA
- `manifest.json` com cores, descrições e ícones multi-resolução da marca.
- Service worker habilitado no ambiente de produção e desenvolvimento.
- Tolerância parcial offline e alerta interativo flutuante exibido ("Você está offline. Visualizando dados em cache.").

## 6. ALTERAÇÕES E CORREÇÕES FEITAS
- Removida avaliação de satisfação (para focar na estabilidade inicial).
- Removido ranking de agentes por complexidade desnecessária.
- Layout do Kanban refeito do zero, removendo poluição visual e centralizando em um visual *Clean/Asana/Linear*.
- Colunas do Kanban receberam largura majorada (`min-w-[350px]`) e espaçamento padronizado para impedir layout achatado.
- Adicionado sistema de abas via estado React no `/dashboard` da TI para alternar entre "Fila" e "Histórico" sem refresh ou navegação entre páginas.
- Corrigida a cor do texto do "Histórico" (texto agora verde sempre visível contra background claro).
- Resolvidos conflitos críticos de ambiente que causavam quedas constantes da aplicação na etapa de transpilação (conflito cache Next.js x Prod Build).
- (22/07) **Refatoração Auth JWT:** Implementados cookies seguros (`HttpOnly`, `Secure`, `SameSite=Strict`) para access_token (15m) e refresh_token (7 dias), com fluxo de "Silent Refresh" automático no Axios/Fetch.
- (22/07) **WebSockets:** Substituição do `setInterval` pelo Socket.io, permitindo que alterações de tickets (movimentação no Kanban, novos chamados) reflitam em tempo real nas telas de todos os envolvidos.
- (22/07) **Relatórios (Fase 4):** Desenvolvida e acoplada página nativa de relatórios. Opções de baixar a tabela de todos os chamados do período selecionado em CSV e PDF limpo. A Fase 3 (E-mails) foi oficialmente desconsiderada por decisão estratégica de projeto.

## 7. BUGS CONHECIDOS / A CORRIGIR
- Nenhum bug de código no momento. O sistema se provou resistente.
- **Alerta de Infra:** Ao usar comandos `npm run build` enquanto o ambiente de `npm run dev` está rodando paralelamente, o cache `.next` sofre corrupção silenciosa, gerando Loop de Loading. Caso ocorra: `rm -rf .next` seguido de reinicialização resolve de imediato.

## 8. TESTES REALIZADOS
- **Teste de Responsividade (Mobile, Tablet, Desktop):** [OK] - Componentes reorganizam corretamente sem sobreposição.
- **Teste de Funcionalidades (Login, Fila, Kanban):** [OK] - Rotinas validadas.
- **Teste de PWA (Service Worker):** [OK] - Caching atuante no background.
- **Teste de Build (Next.js Types/Lints):** [OK] - 100% livre de erros no último log.

## 9. PRÓXIMOS PASSOS / TO-DO
- O escopo principal idealizado para o MVP foi atingido com sucesso!
- Fica em aberto para análise futura: Implementação de SLA escalonado, integrações com WhatsApp Business ou AD/SSO para login.

## 10. PROMPTS ENTREGUES
1. Prompt principal do AtendeTI (escopo, stack, features).
2. Prompt de priorização de chamados.
3. Prompt de responsividade completa e PWA.
4. Cartilha de segurança da informação (armazenada em `AGENTS.md`).
5. Prompt de Kanban Layout (Reconstrução Asana/Linear style).
6. Prompt de histórico de chamados interno (TI).
7. Prompt de auto-atualização silenciosa (10s e 30s) e ordenação por recência.
8. [Debugging crítico: Falha de Frontend por Conflito de Build Next.js].

## 11. INSTRUÇÕES PARA RETOMAR
Quando abrir o workspace novamente, comece por:
1. **Ler atenciosamente este arquivo (`snapshot001.md`).**
2. Se o site não estiver rodando, abra dois terminais:
   - Terminal 1: `cd apps/api && npm run start:dev`
   - Terminal 2: `cd apps/web && rm -rf .next && npm run dev`
3. Verificar a próxima Task listada na **Seção 9** ou pedir novas diretrizes para mim.
4. Priorizar a cartilha de segurança para qualquer nova implementação (Nunca usar cookies soltos sem `HttpOnly` se exigido para Refresh Token).

## 12. CONTATO / REFERÊNCIAS
- **Desenvolvedor Idealizador:** Ygor
- **Localização:** Boa Vista, Roraima, Brasil
- **Princípio Inegociável:** "Interface minimalista e limpa. Zero firulas. Colaborador deve gastar menos de 30 segundos abrindo um chamado".
