# Documentação Completa do AtendeTI

## 1. Visão Geral do Sistema
O **AtendeTI** é um sistema de gestão de chamados (helpdesk) focado na equipe de Tecnologia da Informação. O objetivo principal é substituir ferramentas informais (como WhatsApp) por uma plataforma organizada, com filas, controle de SLA, priorização e métricas claras.

**Stack Tecnológico:**
- **Arquitetura:** Monorepo (Turborepo) com `apps/web`, `apps/api` e `packages/database`.
- **Frontend:** React, Next.js 14 (App Router), TailwindCSS, Lucide Icons, date-fns, PWA via `next-pwa`.
- **Backend:** Node.js, NestJS, WebSockets (Socket.io).
- **Banco de Dados:** PostgreSQL (via Prisma ORM, localmente SQLite como fallback em dev).
- **Segurança:** Autenticação via JWT com RS256/ES256, Refresh Tokens protegidos por cookies `HttpOnly`, `SameSite=Strict` e controle de papéis (RBAC).

## 2. Atores e Papéis (RBAC)
O sistema possui 3 níveis de permissões:
- **Colaborador:** Usuário padrão. Pode abrir chamados de forma simplificada e visualizar o status dos chamados que ele próprio abriu.
- **Agente de TI:** Membro da equipe técnica. Pode assumir chamados, gerenciar a fila (Kanban), adicionar notas internas (invisíveis aos colaboradores) e alterar a criticidade/prioridade dos chamados.
- **Admin:** Possui acesso total. Pode visualizar dashboards analíticos, extrair relatórios (CSV/PDF) e gerenciar configurações do sistema.

## 3. Estrutura de Banco de Dados (Modelos Principais)
A modelagem principal do banco de dados (Prisma Schema):

- **Users (Usuários):** 
  - Armazena dados de autenticação (email, senha). A senha sempre salva como um hash seguro (`bcrypt`).
  - Define o papel (`COLABORADOR`, `AGENTE`, `ADMIN`) e o setor.
- **Categories (Categorias):**
  - Tipos de problemas pré-definidos (ex: Hardware, Software).
  - Incluem um `slaHoras` padrão para a resolução daquele tipo de chamado.
- **Tickets (Chamados):**
  - Coração do sistema. Contém título, descrição, `prioridade` (BAIXA, MEDIA, ALTA, CRITICA) e `status` (NOVO, EM_ANDAMENTO, AGUARDANDO_USUARIO, RESOLVIDO, FECHADO).
  - Registra temporalidade: criação, assunção, resolução e fechamento.
  - Relacionamentos: quem criou (`criadoPor`) e qual agente assumiu (`atribuidoA`).
- **PriorityLogs:**
  - Trilhas de auditoria geradas automaticamente sempre que a prioridade de um chamado é alterada por um agente (exige um motivo).
- **Comments (Comentários):**
  - Interações no chamado (chat bidirecional).
  - Suporta a flag `isNotaInterna`: quando ativa, o comentário é visível apenas para Agentes/Admins.
- **Attachments (Anexos):**
  - Suporte a envio de arquivos, que ficam atrelados ao ticket específico.
- **RefreshTokens:**
  - Armazena sessões de longo prazo, permitindo a rotação segura e constante de tokens JWT.

## 4. Funcionalidades e Interfaces Web (Frontend)

### Principais Rotas e Páginas
- **`/login`:** Página de autenticação protegida contra ataques de força bruta (rate limiting imposto pela API).
- **`/dashboard`:**
  - Para **Colaboradores:** Uma listagem limpa dos seus próprios chamados, ordenada por "última atualização", dando destaque ao que tem movimentação recente.
  - Para **Agentes de TI:** Painel Kanban visual e dinâmico, dividido por colunas como "Novos", "Em Andamento" e "Aguardando Usuário". Possui um sistema de abas sem recarregamento para acessar o "Histórico" (chamados finalizados).
- **`/admin`:** Painel restrito para administração global.
- **`/reports`:** Interface desenvolvida para exportar relatórios, dados brutos e KPIs filtrados por período, via arquivos CSV e PDF.
- **`/tickets/[id]`:** Visualização detalhada do chamado (timeline completa de status, chat bidirecional e caixa de anexos).

### Features Técnicas e de UX de Destaque
1. **Eventos em Tempo Real (WebSockets):** Todo o painel Kanban dos agentes e o dashboard dos usuários são reativos. Atualizações, movimentação de cards e novos comentários refletem na tela de quem estiver olhando imediatamente, graças à integração sólida com `Socket.io`.
2. **PWA (Progressive Web App):** A aplicação web possui um manifest instalado e um Service Worker. Ela pode ser adicionada à tela inicial de celulares como um app nativo, fornecendo cache inteligente e suporte para exibir alertas amigáveis caso o usuário perca a conexão.
3. **Renovação de Sessão Silenciosa (Silent Refresh):** Pela rígida política de segurança, o token principal de acesso expira a cada 15 minutos. No entanto, o front-end utiliza o refreshToken (armazenado com segurança) para renovar a sessão do usuário em segundo plano de forma invisível.
4. **Responsividade Baseada em "Mobile-First":** Todo o layout utiliza o sistema de grids e breakpoints do Tailwind. Em celulares, menus complexos viram menus laterais retráteis (off-canvas) e a fila Kanban se adapta para scroll horizontal infinito e ergonômico.
5. **Design Visual "Premium":** Cores baseadas na paleta Esmeralda (`#10b981`), interface ultra minimalista inspirada em ferramentas como Linear e Asana. Menos elementos na tela, focando em fazer o usuário abrir chamados rapidamente.

## 5. Diretrizes Rigorosas de Segurança (Cartilha AtendeTI)
O código segue um padrão inegociável de InfoSec:
- **Ausência de senhas ou tokens expostos:** O `access_token` e o `refresh_token` não vivem no LocalStorage, mas residem exclusivamente na memória volátil da aplicação e/ou em cookies de protocolo `HttpOnly` com `SameSite=Strict`.
- **CORS Estrito e Validação de Inputs (DTOs):** Nenhuma informação enviada pelo front-end é confiável. A API NestJS (Backend) utiliza validações pesadas em todos os DTOs (`class-validator`) com recusa imediata de requisições malformadas.
- **Data Isolation (RBAC e Validação por Recurso):** O backend nunca apenas confia que um colaborador quer ver seu próprio chamado. Cada endpoint checa ativamente o ID de quem está pedindo versus o ID de quem é o dono daquele recurso, impedindo falhas de IDOR.

## 6. Operação e Manutenção
- **Como Iniciar:**
  - Em um terminal: `cd apps/api && npm run dev`
  - Em outro terminal: `cd apps/web && npm run dev`
- **Troubleshooting de Cache Next.js:** Se o servidor Frontend ficar congelado em um Loop infinito, basta desligá-lo, apagar a pasta `.next` (`rm -rf .next` no Mac/Linux, ou via explorador no Windows) e reiniciá-lo, como apontado nos registros do snapshot.

## 7. Prompt para Replicação (Engenharia de Prompt)
Abaixo está um prompt completo e estruturado que você pode enviar para outra Inteligência Artificial (ChatGPT, Claude, Gemini, etc.) caso queira que ela recrie ou entenda perfeitamente todo o escopo do AtendeTI a partir do zero:

---

**Prompt:**

```text
Atue como um Arquiteto de Software e Desenvolvedor Full-Stack Sênior. Quero que você construa (ou me ajude a replicar) um sistema de gestão de chamados de TI chamado "AtendeTI". O objetivo do sistema é ser minimalista, rápido e substituir o WhatsApp, focando em clareza, filas visuais e métricas.

Abaixo estão todas as especificações técnicas, arquiteturais e de negócio. Siga-as rigorosamente:

1. STACK TECNOLÓGICA:
- Arquitetura: Monorepo (usando Turborepo).
- Frontend: React com Next.js 14 (App Router), TailwindCSS, Lucide Icons, date-fns e next-pwa (Progressive Web App com suporte offline básico).
- Backend: API RESTful com NestJS (Node.js).
- Banco de Dados: PostgreSQL utilizando Prisma ORM.
- Tempo Real: WebSockets (Socket.io) para atualizações instantâneas de chamados e filas.

2. SEGURANÇA E AUTENTICAÇÃO (MUITO IMPORTANTE):
- Sistema de JWT rigoroso (RS256 ou ES256).
- Rotação de Tokens: O access_token deve durar apenas 15 minutos (armazenado em memória ou HttpOnly cookie).
- Refresh Tokens: Devem durar 7 dias e ser armazenados *exclusivamente* em cookies HttpOnly com SameSite=Strict. NUNCA use localStorage para tokens.
- O front-end deve implementar "Silent Refresh" no background usando o refresh token via chamadas Axios/Fetch interceptors.
- Senhas hasheadas com bcrypt (mínimo 12 rounds).
- Implementar Rate Limiting na rota de login.
- O backend deve validar e sanitizar rigorosamente todos os inputs usando class-validator/class-transformer, e proteger rotas garantindo que um usuário não acesse chamados que não lhe pertencem (verificação de ownership).

3. ATORES E PAPÉIS (RBAC):
- COLABORADOR: Pode apenas abrir chamados rapidamente (menos de 30s) e interagir com os próprios chamados.
- AGENTE DE TI: Pode assumir chamados, ver o painel Kanban geral, priorizar chamados e adicionar notas internas.
- ADMIN: Acesso total, incluindo painel de relatórios (exportação para CSV e PDF) e gestão de usuários/categorias.

4. MODELAGEM DE BANCO DE DADOS (Entidades):
- User: id, nome, email, senhaHash, papel, setor, ativo.
- Category: id, nome, slaHoras, ativo.
- Ticket: id, titulo, descricao, prioridade (BAIXA, MEDIA, ALTA, CRITICA), status (NOVO, EM_ANDAMENTO, AGUARDANDO_USUARIO, RESOLVIDO, FECHADO), criadoPorId, atribuidoAId, categoriaId.
- Comment: texto, isNotaInterna (booleano), autorId, ticketId.
- Attachment: url, nomeArquivo, ticketId.
- PriorityLog: para auditar trocas de prioridade nos tickets.
- RefreshToken: token, userId, expiresAt, revoked.

5. INTERFACE (UI/UX) E RESPONSIVIDADE:
- Paleta de Cores: Inspirada no Verde Esmeralda (Tailwind: emerald-500 a emerald-700) sobre fundos neutros e limpos (slate-50 a slate-100).
- Design Clean: Estilo Asana/Linear. Sem poluição visual.
- Painel do Agente (Dashboard): Um Kanban horizontal e reativo (via WebSockets), com colunas largas (min-w-[350px]). Deve suportar alternar para uma aba de "Histórico" (tabela paginada) sem recarregar a página.
- Painel do Colaborador: Lista simples ordenada pela data de última atualização (mais recentes primeiro).
- Mobile-First: O Kanban precisa permitir scroll horizontal infinito sem quebrar layout em telas de celular. Menus laterais devem se transformar em gavetas off-canvas.

Por favor, confirme que entendeu todas as especificações e me pergunte por onde devemos começar (ex: configuração do monorepo, modelagem do banco ou setup de infraestrutura).
```
