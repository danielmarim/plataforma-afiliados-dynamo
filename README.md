# Plataforma de Afiliados Dynamo

Plataforma completa de gestão de afiliados e parceiros, integrada à Shopify. Projeto privado e comercial — todos os direitos reservados.

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | TailwindCSS 4 + Shadcn/ui |
| ORM | Prisma |
| Banco de dados | PostgreSQL (Supabase) |
| Autenticação | NextAuth (Auth.js v5) — credenciais com bcrypt |
| Validação | Zod + React Hook Form |
| E-mail | Resend |
| Upload de arquivos | UploadThing |
| Tabelas | TanStack Table |
| Gráficos | Recharts |
| Ícones | Lucide Icons |

## Estrutura do Projeto

```
├── app/                  # App Router (rotas e layouts)
│   ├── (auth)/           # Grupo de rotas públicas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/      # Grupo de rotas protegidas
│   │   └── dashboard/
│   └── api/
│       ├── auth/[...nextauth]/   # Handlers do NextAuth
│       └── uploadthing/          # Handler do UploadThing
├── components/
│   ├── ui/               # Componentes Shadcn/ui
│   ├── auth/             # Formulários de autenticação
│   ├── dashboard/        # Sidebar, user-nav etc.
│   ├── shared/           # Componentes compartilhados
│   └── providers/        # Providers (sessão etc.)
├── lib/                  # Clientes e configurações (prisma, auth, supabase, resend, uploadthing)
│   └── validations/      # Schemas Zod
├── services/             # Camada de acesso a dados e integrações (user, shopify, email)
├── actions/              # Server Actions (auth)
├── prisma/               # schema.prisma
├── types/                # Tipos globais e extensões do NextAuth
├── utils/                # Formatadores e constantes
├── hooks/                # Hooks customizados (useCurrentUser, useUploadThing)
└── middleware.ts         # Proteção de rotas
```

## Modelos de Dados (Prisma)

O schema cobre todo o domínio da plataforma, sem regras de negócio implementadas ainda:

| Modelo | Descrição |
|---|---|
| `User`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken` | Autenticação (NextAuth + credenciais) |
| `Affiliate` | Perfil do afiliado (status, contato, PIX, taxa de comissão) |
| `Coupon` | Cupons vinculados a afiliados e à Shopify (price rule / discount) |
| `Sale` | Pedidos Shopify atribuídos a afiliados |
| `Commission` | Comissões por venda (taxa aplicada, status, pagamento) |
| `Payout` | Solicitações de saque (PIX / transferência) |
| `Notification` | Notificações por e-mail, WhatsApp e in-app |
| `Setting` | Configurações da plataforma (chave/valor) |
| `WebhookEvent` | Log de webhooks recebidos da Shopify |

## Como Rodar Localmente

1. Instale as dependências:

```bash
pnpm install
```

2. Copie as variáveis de ambiente e preencha os valores (Supabase, NextAuth, Shopify, Resend, UploadThing):

```bash
cp .env.example .env
```

3. Gere o Prisma Client e aplique o schema no banco:

```bash
pnpm prisma generate
pnpm prisma db push   # ou: pnpm prisma migrate dev
```

4. Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Autenticação

O fluxo de autenticação está completo e funcional:

- **Registro** (`/register`): cria `User` + perfil `Affiliate` (status `PENDING`), com senha criptografada via bcrypt;
- **Login** (`/login`): credenciais validadas com Zod e verificadas no banco; sessão JWT com `id` e `role`;
- **Recuperação de senha** (`/forgot-password`): estrutura pronta (envio de e-mail via Resend será conectado com as regras de negócio);
- **Middleware**: protege todas as rotas não públicas e redireciona usuários logados para o dashboard;
- **Papéis**: `ADMIN` e `AFFILIATE` (enum `UserRole`), disponíveis na sessão para controle de acesso.

## Próximas Etapas

A estrutura está pronta para receber as regras de negócio: geração de cupons na Shopify, atribuição de vendas via webhooks, cálculo de comissões com progressão (10% padrão; 15% ao atingir 10 vendas no mês, aplicado no fechamento), painel administrativo, notificações por e-mail/WhatsApp e relatórios.

---

*Projeto privado e comercial. Todos os direitos reservados.*
