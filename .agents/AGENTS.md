# CARTILHA DE SEGURANÇA DA INFORMAÇÃO — AtendeTI
## Diretrizes para um Sistema Inviolável

A IA deve seguir estritamente as diretrizes abaixo ao escrever, refatorar ou revisar o código do projeto AtendeTI.

---

## 1. AUTENTICAÇÃO E GESTÃO DE SESSÃO

### 1.1 Autenticação
- **JWT (JSON Web Tokens)** com RS256 (RSA 2048-bit) ou ES256 (ECDSA), nunca HS256 com chave simples.
- Token com expiração curta: **15 minutos para access token**, **7 dias para refresh token**.
- Refresh token armazenado APENAS em **HttpOnly, Secure, SameSite=Strict** cookies (nunca em localStorage).
- Access token pode ir em memória do app (se usar SPA) ou em cookie HttpOnly também.
- Implementar **rate limiting no endpoint de login**: máximo 5 tentativas por IP em 15 minutos, depois block temporário.

### 1.2 Gestão de Senha
- Hashing com **bcrypt** (mínimo salt rounds = 12) ou **argon2** (recomendado para 2024+).
- Requisitos mínimos de senha: 12+ caracteres, maiúscula, minúscula, número, caractere especial.
- Implementar **password reset seguro**: token único com expiração de 1 hora, enviado por e-mail, válido só uma vez.
- Nunca armazenar senhas em plain text ou MD5/SHA1.
- Implementar **2FA (Two-Factor Authentication)** opcional no mínimo para admin (TOTP via Google Authenticator/Authy).

### 1.3 Sessão
- Usar **session ID** aleatório (mínimo 32 bytes de entropia) se usar sessão server-side.
- Invalidar sessão após logout.
- Implementar **inatividade timeout**: logout automático após 30 minutos sem ação.
- Regenerar session ID após login (previne session fixation).

---

## 2. AUTORIZAÇÃO E CONTROLE DE ACESSO

### 2.1 RBAC (Role-Based Access Control)
- Implementar 3 roles claramente definidos: **Colaborador**, **Agente de TI**, **Admin**.
- Cada endpoint deve validar se o usuário logado tem permissão pra acessar (middleware de autorização).
- **Princípio do menor privilégio**: cada role acessa só o que precisa.

### 2.2 Validação por Recurso
- Um colaborador NÃO deve conseguir ver/editar chamados de outro colaborador (verificar `user_id` do criador antes de retornar dado).
- Um agente de TI não deve conseguir deletar usuários (apenas admin).
- Admin pode fazer tudo, mas ações de admin devem ser auditadas (logs detalhados).

### 2.3 CORS
- Configurar **CORS** restritivo:
  - Access-Control-Allow-Origin: `https://seu-dominio.com` (NUNCA "*")
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE (apenas necessários)
  - Access-Control-Allow-Headers: Content-Type, Authorization
  - Access-Control-Allow-Credentials: true (se usar cookies)
- Testar CORS em testes automatizados.

---

## 3. PROTEÇÃO CONTRA VULNERABILIDADES OWASP TOP 10

### 3.1 Injection (SQL, NoSQL, Command)
- **Sempre usar prepared statements / parameterized queries** no banco de dados (ex: uso do Prisma que já faz isso).
- Sanitizar inputs no backend SEMPRE, mesmo com ORM.

### 3.2 XSS (Cross-Site Scripting)
- **Output encoding**: escapar qualquer conteúdo do usuário. Em React, isso é nativo ao não usar `dangerouslySetInnerHTML`.
- **CSP (Content Security Policy)** header apropriado.
- Evitar `eval()` completamente.

### 3.3 CSRF (Cross-Site Request Forgery)
- Usar **SameSite cookies** (`Secure; SameSite=Strict`) — reduz muito o risco de CSRF.
- Implementar tokens CSRF se necessário.

### 3.4 a 3.10 Demais Proteções
- Desligar modo debug em produção e não expor stack traces.
- Criptografia em trânsito (HTTPS/TLS 1.2+) e em repouso.
- Atualizar dependências periodicamente (`npm audit`).
- Admin deve ter endpoints separados com validação rigorosa de role.

---

## 4. VALIDAÇÃO DE ENTRADA E ARQUIVOS
- **Nunca confiar em validação do frontend.** Validar no backend usando `class-validator` ou similar (tamanho, formato, range).
- **File Upload**: Validar tipo MIME, tamanho máximo (ex: 10MB), renomear arquivo para UUID e armazenar fora da raiz pública.

## 5. LOGGING E MONITORAMENTO
- Logar todas as ações críticas em formato JSON estruturado (sem expor senhas/tokens).
- Reter logs em ambiente segregado e alertar anomalias (ex: DDoS ou Brute Force).

## 6. HEADERS HTTP E INFRAESTRUTURA
- Headers como `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc., devem estar presentes.
- Segredos mantidos fora do código (variáveis de ambiente ou secret manager).

*A IA deve considerar essas regras imperativas para todas as futuras implementações do sistema AtendeTI.*

---

## REGRA DE REGISTRO DE ALTERAÇÕES (CHANGELOG)
- Sempre que você criar, modificar ou excluir qualquer código, é obrigatório registrar a alteração no arquivo `CHANGELOG.md` localizado na raiz do projeto.
- Se o arquivo `CHANGELOG.md` não existir, você deve criá-lo.
- Adicione as novas entradas preferencialmente no topo ou no formato padrão de changelog, detalhando:
  - **Data/Hora** (Ex: `## [YYYY-MM-DD]`)
  - **O que mudou**: Uma breve descrição do que foi adicionado, alterado ou corrigido.
  - **Arquivos impactados**.
