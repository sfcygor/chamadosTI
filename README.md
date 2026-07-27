# AtendeTI — Sistema de Chamados de TI

Sistema de gestão de chamados de TI desenvolvido em monorepo com Next.js, NestJS e Prisma.

## 🚀 Como rodar (primeira vez)

### Pré-requisitos
- Node.js 18+
- npm 9+

### 1. Instalar dependências

```bash
# Na raiz do projeto:
npm install
```

### 2. Configurar e popular o banco de dados

```bash
cd packages/database
npm install
npx prisma db push
npx ts-node prisma/seed.ts
cd ../..
```

### 3. Instalar dependências do backend e frontend

```bash
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### 4. Rodar o projeto

**Terminal 1 - API (backend):**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Web (frontend):**
```bash
cd apps/web
npm run dev
```

Ou usando Turborepo (ambos simultaneamente):
```bash
# Na raiz:
npx turbo run dev
```

### 5. Acessar

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api

## 🔐 Credenciais de demonstração

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | admin@atendeti.com | Admin@123 |
| Agente TI | carlos.ti@atendeti.com | Admin@123 |
| Agente TI | ana.ti@atendeti.com | Admin@123 |
| Colaborador | joao.silva@atendeti.com | Admin@123 |
| Colaborador | maria.santos@atendeti.com | Admin@123 |
| Colaborador | pedro.rh@atendeti.com | Admin@123 |

## 📁 Estrutura do projeto

```
ChamadosTI/
├── apps/
│   ├── api/           # Backend NestJS
│   │   └── src/
│   │       ├── auth/      # Autenticação JWT
│   │       ├── tickets/   # Chamados
│   │       ├── comments/  # Comentários e notas internas
│   │       ├── categories/ # Categorias e SLAs
│   │       ├── users/     # Gestão de usuários
│   │       ├── reports/   # Relatórios
│   │       └── uploads/   # Upload de arquivos
│   └── web/           # Frontend Next.js
│       └── src/
│           ├── app/       # Páginas (App Router)
│           ├── components/ # Componentes
│           ├── contexts/  # Auth + Toast
│           └── lib/       # API client + Types
└── packages/
    └── database/      # Prisma schema + seed
        └── prisma/
            ├── schema.prisma
            └── seed.ts
```

## 🎯 Funcionalidades MVP

- ✅ Login com JWT (3 papéis: Colaborador, Agente, Admin)
- ✅ Dashboard do Colaborador com lista de chamados
- ✅ Abertura de chamado com prioridade automática por categoria
- ✅ Detalhe do chamado — timeline/chat
- ✅ Notas internas (visíveis só para TI)
- ✅ Dashboard da TI com fila filtrada e ordenada por prioridade
- ✅ Alertas de chamados críticos sem responsável
- ✅ Indicador de SLA por chamado
- ✅ Log de alterações de prioridade (auditoria)
- ✅ Avaliação de satisfação (1-5 estrelas)
- ✅ Admin: Gestão de usuários
- ✅ Admin: Configuração de categorias e SLAs
- ✅ Admin: Relatórios com KPIs

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 + TailwindCSS |
| Backend | NestJS (Node.js) |
| Banco de dados | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |
| Autenticação | JWT |
| Monorepo | npm workspaces + Turborepo |

## 🔄 Para produção (PostgreSQL)

1. Edite `packages/database/.env`:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/atendeti"
   ```

2. Edite `apps/api/.env` com o mesmo `DATABASE_URL`

3. No schema.prisma, mude `provider = "sqlite"` para `provider = "postgresql"`

4. Rode `npx prisma migrate dev` no diretório `packages/database`
