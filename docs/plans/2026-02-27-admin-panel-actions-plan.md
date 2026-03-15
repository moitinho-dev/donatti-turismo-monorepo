# Admin Panel Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 admin features to CLINIPLUS: impersonation, feature flags, maintenance mode, page disabling, audit logging, and mass notifications.

**Architecture:** Separate Prisma tables per feature. Middleware checks an in-memory cached config endpoint every 30s. Impersonation works via JWT token fields (no DB table). All mutations log to AuditoriaAdmin. UI lives in expanded `/admin/configuracoes` tabs plus new `/admin/auditoria` and `/admin/notificacoes` pages.

**Tech Stack:** Next.js 14 App Router, Prisma, NextAuth v5 JWT, Resend (email), Twilio (SMS), Tailwind CSS, Lucide icons, Zustand.

**Design Doc:** `docs/plans/2026-02-27-admin-panel-actions-design.md`

**Build Command:** `./node_modules/.bin/next build` (path has spaces, `bun run build` may fail)

---

### Task 1: Add Prisma Models

**Files:**
- Modify: `prisma/schema.prisma` (append after last model)

**Step 1: Add 5 new models to schema**

Append to the end of `prisma/schema.prisma`, before the closing of the file:

```prisma
model FeatureFlag {
  id            String   @id @default(cuid())
  nome          String   @unique
  ativo         Boolean  @default(true)
  descricao     String?
  atualizadoPor String?
  atualizadoEm  DateTime @updatedAt
  criadoEm      DateTime @default(now())
}

model ModoManutencao {
  id              String    @id @default(cuid())
  ativo           Boolean   @default(false)
  tipoBloqueio    String
  rolesAfetadas   String[]
  mensagem        String?
  previsaoRetorno DateTime?
  ativadoPor      String?
  ativadoEm       DateTime  @default(now())
  desativadoEm    DateTime?
}

model PaginaDesativada {
  id            String    @id @default(cuid())
  rota          String    @unique
  motivo        String?
  rolesAfetadas String[]
  desativadaPor String?
  desativadaEm  DateTime  @default(now())
  reativadaEm   DateTime?
}

model AuditoriaAdmin {
  id        String   @id @default(cuid())
  adminId   String
  admin     Usuario  @relation(fields: [adminId], references: [id])
  acao      String
  detalhes  Json
  ipAddress String?
  criadoEm  DateTime @default(now())
}

model NotificacaoMassa {
  id           String    @id @default(cuid())
  titulo       String
  mensagem     String
  canal        String
  rolesFiltro  String[]
  totalEnviado Int       @default(0)
  status       String    @default("pendente")
  enviadoPor   String?
  enviadoEm    DateTime?
  criadoEm     DateTime  @default(now())
}
```

Also add the reverse relation in the `Usuario` model. Find `model Usuario` and add inside it:

```prisma
  auditorias AuditoriaAdmin[]
```

**Step 2: Generate Prisma client**

Run: `bunx prisma generate`
Expected: "Generated Prisma Client"

**Step 3: Push schema to database**

Run: `bunx prisma db push`
Expected: "Your database is now in sync with your Prisma schema."

**Step 4: Seed default feature flags**

Create: `prisma/seed-feature-flags.ts`

```typescript
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const flags = [
    { nome: "chat", descricao: "Chat durante consulta", ativo: true },
    { nome: "video", descricao: "Videochamada na consulta", ativo: true },
    { nome: "pagamentos", descricao: "Processamento de pagamentos", ativo: true },
    { nome: "2fa", descricao: "Autenticação de dois fatores", ativo: true },
  ]

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { nome: flag.nome },
      update: {},
      create: flag,
    })
  }

  console.log("Feature flags seeded")
}

main().finally(() => prisma.$disconnect())
```

Run: `bun prisma/seed-feature-flags.ts`
Expected: "Feature flags seeded"

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed-feature-flags.ts
git commit -m "feat(admin): add prisma models for admin panel features"
```

---

### Task 2: Audit Logging Helper

**Files:**
- Create: `src/lib/admin/audit.ts`

**Step 1: Create audit helper**

```typescript
import { prisma } from "@/lib/db/prisma"

type AuditAction =
  | "impersonar_inicio"
  | "impersonar_fim"
  | "feature_flag_toggle"
  | "manutencao_ativar"
  | "manutencao_desativar"
  | "pagina_desativar"
  | "pagina_reativar"
  | "notificacao_massa"
  | "usuario_deletar"

export async function logAuditoria(
  adminId: string,
  acao: AuditAction,
  detalhes: Record<string, unknown>,
  ipAddress?: string | null
) {
  return prisma.auditoriaAdmin.create({
    data: {
      adminId,
      acao,
      detalhes,
      ipAddress: ipAddress ?? undefined,
    },
  })
}
```

**Step 2: Commit**

```bash
git add src/lib/admin/audit.ts
git commit -m "feat(admin): add audit logging helper"
```

---

### Task 3: Config Cache API Endpoint

This endpoint is called by middleware to get all active configs in one shot. It must be lightweight.

**Files:**
- Create: `src/app/api/admin/config-cache/route.ts`

**Step 1: Create the config cache endpoint**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// Public endpoint (no auth) — returns only active configs
// Middleware calls this every 30s to check feature flags, maintenance, disabled pages
export async function GET() {
  try {
    const [featureFlags, manutencao, paginasDesativadas] = await Promise.all([
      prisma.featureFlag.findMany({
        select: { nome: true, ativo: true },
      }),
      prisma.modoManutencao.findFirst({
        where: { ativo: true },
        select: {
          tipoBloqueio: true,
          rolesAfetadas: true,
          mensagem: true,
          previsaoRetorno: true,
        },
        orderBy: { ativadoEm: "desc" },
      }),
      prisma.paginaDesativada.findMany({
        where: { reativadaEm: null },
        select: { rota: true, rolesAfetadas: true, motivo: true },
      }),
    ])

    return NextResponse.json({
      featureFlags,
      manutencao,
      paginasDesativadas,
    })
  } catch {
    return NextResponse.json(
      { featureFlags: [], manutencao: null, paginasDesativadas: [] },
    )
  }
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/api/admin/config-cache/route.ts
git commit -m "feat(admin): add config cache API endpoint for middleware"
```

---

### Task 4: Feature Flags API

**Files:**
- Create: `src/app/api/admin/feature-flags/route.ts`
- Create: `src/app/api/admin/feature-flags/[id]/route.ts`

**Step 1: Create list endpoint**

`src/app/api/admin/feature-flags/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"

export async function GET() {
  try {
    await requireAdmin()
    const flags = await prisma.featureFlag.findMany({
      orderBy: { nome: "asc" },
    })
    return NextResponse.json(flags)
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 2: Create toggle endpoint**

`src/app/api/admin/feature-flags/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"
import { logAuditoria } from "@/lib/admin/audit"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()
    const { ativo } = await request.json()

    const flag = await prisma.featureFlag.update({
      where: { id: params.id },
      data: {
        ativo: Boolean(ativo),
        atualizadoPor: session.user.id,
      },
    })

    await logAuditoria(
      session.user.id,
      "feature_flag_toggle",
      { flagId: flag.id, nome: flag.nome, ativo: flag.ativo },
      request.headers.get("x-forwarded-for")
    )

    return NextResponse.json(flag)
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/admin/feature-flags/
git commit -m "feat(admin): add feature flags CRUD API"
```

---

### Task 5: Maintenance Mode API

**Files:**
- Create: `src/app/api/admin/manutencao/route.ts`

**Step 1: Create maintenance mode endpoints (GET, POST, DELETE in one file)**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"
import { logAuditoria } from "@/lib/admin/audit"

export async function GET() {
  try {
    await requireAdmin()
    const manutencao = await prisma.modoManutencao.findFirst({
      where: { ativo: true },
      orderBy: { ativadoEm: "desc" },
    })
    return NextResponse.json(manutencao)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    // Deactivate any existing active maintenance
    await prisma.modoManutencao.updateMany({
      where: { ativo: true },
      data: { ativo: false, desativadoEm: new Date() },
    })

    const manutencao = await prisma.modoManutencao.create({
      data: {
        ativo: true,
        tipoBloqueio: body.tipoBloqueio || "total",
        rolesAfetadas: body.rolesAfetadas || ["PACIENTE", "PROFISSIONAL"],
        mensagem: body.mensagem || null,
        previsaoRetorno: body.previsaoRetorno
          ? new Date(body.previsaoRetorno)
          : null,
        ativadoPor: session.user.id,
      },
    })

    await logAuditoria(
      session.user.id,
      "manutencao_ativar",
      {
        manutencaoId: manutencao.id,
        tipoBloqueio: manutencao.tipoBloqueio,
        rolesAfetadas: manutencao.rolesAfetadas,
      },
      request.headers.get("x-forwarded-for")
    )

    return NextResponse.json(manutencao, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin()

    const updated = await prisma.modoManutencao.updateMany({
      where: { ativo: true },
      data: { ativo: false, desativadoEm: new Date() },
    })

    await logAuditoria(
      session.user.id,
      "manutencao_desativar",
      { count: updated.count },
      request.headers.get("x-forwarded-for")
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/manutencao/route.ts
git commit -m "feat(admin): add maintenance mode API"
```

---

### Task 6: Disabled Pages API

**Files:**
- Create: `src/app/api/admin/paginas-desativadas/route.ts`
- Create: `src/app/api/admin/paginas-desativadas/[id]/route.ts`

**Step 1: Create list + create endpoint**

`src/app/api/admin/paginas-desativadas/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"
import { logAuditoria } from "@/lib/admin/audit"

export async function GET() {
  try {
    await requireAdmin()
    const paginas = await prisma.paginaDesativada.findMany({
      where: { reativadaEm: null },
      orderBy: { desativadaEm: "desc" },
    })
    return NextResponse.json(paginas)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const pagina = await prisma.paginaDesativada.create({
      data: {
        rota: body.rota,
        motivo: body.motivo || null,
        rolesAfetadas: body.rolesAfetadas || [],
        desativadaPor: session.user.id,
      },
    })

    await logAuditoria(
      session.user.id,
      "pagina_desativar",
      { paginaId: pagina.id, rota: pagina.rota },
      request.headers.get("x-forwarded-for")
    )

    return NextResponse.json(pagina, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 2: Create delete (reactivate) endpoint**

`src/app/api/admin/paginas-desativadas/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"
import { logAuditoria } from "@/lib/admin/audit"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()

    const pagina = await prisma.paginaDesativada.update({
      where: { id: params.id },
      data: { reativadaEm: new Date() },
    })

    await logAuditoria(
      session.user.id,
      "pagina_reativar",
      { paginaId: pagina.id, rota: pagina.rota },
      request.headers.get("x-forwarded-for")
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/admin/paginas-desativadas/
git commit -m "feat(admin): add disabled pages API"
```

---

### Task 7: Impersonation API + Auth Changes

**Files:**
- Create: `src/app/api/admin/impersonar/route.ts`
- Modify: `src/lib/auth/next-auth.ts` (JWT + session callbacks)

**Step 1: Create impersonation endpoint**

`src/app/api/admin/impersonar/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"
import { logAuditoria } from "@/lib/admin/audit"

// Start impersonating a user
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      )
    }

    const targetUser = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { paciente: true, profissional: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    await logAuditoria(
      session.user.id,
      "impersonar_inicio",
      {
        targetUserId: targetUser.id,
        targetNome: targetUser.nome,
        targetTipo: targetUser.tipo,
      },
      request.headers.get("x-forwarded-for")
    )

    // Return target user data — client will call update() on the session
    return NextResponse.json({
      success: true,
      targetUser: {
        id: targetUser.id,
        nome: targetUser.nome,
        email: targetUser.email,
        tipo: targetUser.tipo,
        avatarUrl: targetUser.avatarUrl,
        cpf: targetUser.cpf,
        telefone: targetUser.telefone,
        pacienteId: targetUser.paciente?.id || null,
        profissionalId: targetUser.profissional?.id || null,
        twoFactorEnabled: targetUser.twoFactorEnabled,
      },
      impersonatedBy: session.user.id,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

// Stop impersonating — restore admin session
export async function DELETE(request: NextRequest) {
  try {
    // We get admin ID from token.originalAdminId
    // The session.user is currently the impersonated user
    // But the JWT still has originalAdminId
    const session = await requireAdmin()

    await logAuditoria(
      session.user.id,
      "impersonar_fim",
      {},
      request.headers.get("x-forwarded-for")
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 2: Modify next-auth.ts JWT callback to support impersonation**

In `src/lib/auth/next-auth.ts`, the JWT callback (around line 90) currently handles `trigger === "update"`. We need to add impersonation support:

Find the JWT callback section and update the `trigger === "update"` block. After the existing twoFactorEnabled update logic, add impersonation handling:

```typescript
// Inside jwt callback, in the trigger === "update" block:
// Add after existing update logic:

// Handle impersonation start
if (session?.impersonatedBy) {
  token.originalAdminId = token.id as string
  token.originalAdminTipo = token.tipo as string
  token.impersonatedBy = session.impersonatedBy
  const t = session.targetUser
  token.id = t.id
  token.nome = t.nome
  token.email = t.email
  token.tipo = t.tipo
  token.avatarUrl = t.avatarUrl
  token.cpf = t.cpf
  token.telefone = t.telefone
  token.pacienteId = t.pacienteId
  token.profissionalId = t.profissionalId
  token.twoFactorEnabled = t.twoFactorEnabled
}

// Handle impersonation stop
if (session?.stopImpersonation && token.originalAdminId) {
  const adminUser = await prisma.usuario.findUnique({
    where: { id: token.originalAdminId as string },
    include: { paciente: true, profissional: true },
  })
  if (adminUser) {
    token.id = adminUser.id
    token.nome = adminUser.nome
    token.email = adminUser.email
    token.tipo = adminUser.tipo
    token.avatarUrl = adminUser.avatarUrl
    token.cpf = adminUser.cpf
    token.telefone = adminUser.telefone
    token.pacienteId = adminUser.paciente?.id || null
    token.profissionalId = adminUser.profissional?.id || null
    token.twoFactorEnabled = adminUser.twoFactorEnabled
  }
  delete token.originalAdminId
  delete token.originalAdminTipo
  delete token.impersonatedBy
}
```

Also add to the session callback, copy impersonation fields:

```typescript
// In session callback, add:
(session.user as any).impersonatedBy = token.impersonatedBy
(session.user as any).originalAdminId = token.originalAdminId
```

**Step 3: Update middleware to allow admin access during impersonation**

In `src/middleware.ts`, the RBAC check for ADMIN is around line 61. Update so that if `token.originalAdminId` exists, the user still has admin privileges for admin routes:

```typescript
// Before the existing userType check, add:
const isImpersonating = !!token.originalAdminId
const effectiveAdminCheck = userType === "ADMIN" || isImpersonating
```

Use `effectiveAdminCheck` in the admin route guard instead of `userType === "ADMIN"`.

**Step 4: Commit**

```bash
git add src/app/api/admin/impersonar/ src/lib/auth/next-auth.ts src/middleware.ts
git commit -m "feat(admin): add impersonation API and auth support"
```

---

### Task 8: Audit Log API

**Files:**
- Create: `src/app/api/admin/auditoria/route.ts`

**Step 1: Create paginated audit log endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const acao = searchParams.get("acao")
    const adminId = searchParams.get("adminId")
    const de = searchParams.get("de")
    const ate = searchParams.get("ate")

    const where: any = {}
    if (acao) where.acao = acao
    if (adminId) where.adminId = adminId
    if (de || ate) {
      where.criadoEm = {}
      if (de) where.criadoEm.gte = new Date(de)
      if (ate) where.criadoEm.lte = new Date(ate)
    }

    const [total, registros] = await Promise.all([
      prisma.auditoriaAdmin.count({ where }),
      prisma.auditoriaAdmin.findMany({
        where,
        include: { admin: { select: { nome: true, email: true } } },
        orderBy: { criadoEm: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      registros,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/auditoria/route.ts
git commit -m "feat(admin): add audit log API with filters and pagination"
```

---

### Task 9: Mass Notifications API

**Files:**
- Create: `src/app/api/admin/notificacoes/route.ts`

**Step 1: Create notifications endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"
import { logAuditoria } from "@/lib/admin/audit"

export async function GET() {
  try {
    await requireAdmin()
    const notificacoes = await prisma.notificacaoMassa.findMany({
      orderBy: { criadoEm: "desc" },
      take: 50,
    })
    return NextResponse.json(notificacoes)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const { titulo, mensagem, canal, rolesFiltro } = body

    if (!titulo || !mensagem || !canal) {
      return NextResponse.json(
        { error: "titulo, mensagem e canal são obrigatórios" },
        { status: 400 }
      )
    }

    // Create the notification record
    const notificacao = await prisma.notificacaoMassa.create({
      data: {
        titulo,
        mensagem,
        canal,
        rolesFiltro: rolesFiltro || [],
        enviadoPor: session.user.id,
        status: "enviando",
        enviadoEm: new Date(),
      },
    })

    // Get target users
    const whereUsers: any = {}
    if (rolesFiltro && rolesFiltro.length > 0) {
      whereUsers.tipo = { in: rolesFiltro }
    }

    const usuarios = await prisma.usuario.findMany({
      where: whereUsers,
      select: { email: true, telefone: true, nome: true },
    })

    let enviados = 0

    // Send emails
    if (canal === "email" || canal === "ambos") {
      try {
        const { resend } = await import("@/lib/resend/client")
        for (const u of usuarios) {
          if (u.email) {
            await resend.emails.send({
              from: "CLINIPLUS <noreply@clinimais.com>",
              to: u.email,
              subject: titulo,
              html: `<p>Olá ${u.nome || ""},</p><p>${mensagem}</p>`,
            })
            enviados++
          }
        }
      } catch (err) {
        console.error("Erro ao enviar emails em massa:", err)
      }
    }

    // Send SMS
    if (canal === "sms" || canal === "ambos") {
      try {
        const twilio = await import("twilio")
        const twilioClient = twilio.default(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        )
        for (const u of usuarios) {
          if (u.telefone) {
            await twilioClient.messages.create({
              body: `${titulo}: ${mensagem}`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: u.telefone,
            })
            enviados++
          }
        }
      } catch (err) {
        console.error("Erro ao enviar SMS em massa:", err)
      }
    }

    // Update notification record
    await prisma.notificacaoMassa.update({
      where: { id: notificacao.id },
      data: {
        totalEnviado: enviados,
        status: "concluido",
      },
    })

    await logAuditoria(
      session.user.id,
      "notificacao_massa",
      { notificacaoId: notificacao.id, canal, rolesFiltro, totalEnviado: enviados },
      request.headers.get("x-forwarded-for")
    )

    return NextResponse.json({ ...notificacao, totalEnviado: enviados, status: "concluido" }, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/notificacoes/route.ts
git commit -m "feat(admin): add mass notifications API with email and SMS"
```

---

### Task 10: Middleware Integration

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Add admin config cache and checks to middleware**

The middleware runs in Edge Runtime so it cannot import Prisma. Instead, it fetches the `/api/admin/config-cache` endpoint. Add this at the top of the file (module-level cache):

```typescript
// After existing imports, add:
let configCache: {
  featureFlags: { nome: string; ativo: boolean }[]
  manutencao: {
    tipoBloqueio: string
    rolesAfetadas: string[]
    mensagem: string | null
    previsaoRetorno: string | null
  } | null
  paginasDesativadas: { rota: string; rolesAfetadas: string[]; motivo: string | null }[]
  lastFetch: number
} = { featureFlags: [], manutencao: null, paginasDesativadas: [], lastFetch: 0 }

const CACHE_TTL = 30_000

async function getAdminConfig(baseUrl: string) {
  const now = Date.now()
  if (now - configCache.lastFetch < CACHE_TTL) return configCache
  try {
    const res = await fetch(`${baseUrl}/api/admin/config-cache`, {
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      configCache = { ...data, lastFetch: now }
    }
  } catch {}
  return configCache
}
```

Then in the middleware function, after the token/auth checks and before the RBAC routing section, add:

```typescript
// Get base URL for internal fetch
const baseUrl = request.nextUrl.origin

// Skip config checks for API routes, static assets, and auth pages
const skipConfigCheck = pathname.startsWith("/api/") ||
  pathname.startsWith("/_next/") ||
  pathname === "/manutencao" ||
  pathname === "/pagina-indisponivel" ||
  pathname === "/login"

if (!skipConfigCheck && userType !== "ADMIN") {
  const config = await getAdminConfig(baseUrl)

  // 1. Maintenance mode check
  if (config.manutencao) {
    const userRole = userType || ""
    if (
      config.manutencao.rolesAfetadas.length === 0 ||
      config.manutencao.rolesAfetadas.includes(userRole)
    ) {
      const manutencaoUrl = new URL("/manutencao", request.url)
      if (config.manutencao.mensagem) {
        manutencaoUrl.searchParams.set("msg", config.manutencao.mensagem)
      }
      return NextResponse.redirect(manutencaoUrl)
    }
  }

  // 2. Disabled page check
  const paginaDesativada = config.paginasDesativadas.find(
    (p) => pathname === p.rota || pathname.startsWith(p.rota + "/")
  )
  if (paginaDesativada) {
    const userRole = userType || ""
    if (
      paginaDesativada.rolesAfetadas.length === 0 ||
      paginaDesativada.rolesAfetadas.includes(userRole)
    ) {
      return NextResponse.redirect(new URL("/pagina-indisponivel", request.url))
    }
  }

  // 3. Feature flag checks
  const flagMap = Object.fromEntries(
    config.featureFlags.map((f) => [f.nome, f.ativo])
  )
  if (pathname.startsWith("/consulta") && flagMap.video === false) {
    return NextResponse.redirect(new URL("/pagina-indisponivel", request.url))
  }
  if (pathname.startsWith("/checkout") && flagMap.pagamentos === false) {
    return NextResponse.redirect(new URL("/pagina-indisponivel", request.url))
  }
}
```

**Step 2: Add `/manutencao` and `/pagina-indisponivel` to public routes array**

In the existing `publicRoutes` array, add:

```typescript
"/manutencao",
"/pagina-indisponivel",
```

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(admin): integrate config cache checks in middleware"
```

---

### Task 11: Static Pages (Maintenance + Unavailable)

**Files:**
- Create: `src/app/manutencao/page.tsx`
- Create: `src/app/pagina-indisponivel/page.tsx`

**Step 1: Create maintenance page**

`src/app/manutencao/page.tsx`:

```tsx
"use client"

import { useSearchParams } from "next/navigation"
import { Wrench } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function ManutencaoContent() {
  const searchParams = useSearchParams()
  const mensagem = searchParams.get("msg")

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Wrench className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Sistema em Manutenção
        </h1>
        <p className="text-slate-600 mb-6">
          {mensagem || "Estamos realizando melhorias na plataforma. Voltaremos em breve."}
        </p>
        <Link
          href="/"
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

export default function ManutencaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Carregando...</p>
      </div>
    }>
      <ManutencaoContent />
    </Suspense>
  )
}
```

**Step 2: Create unavailable page**

`src/app/pagina-indisponivel/page.tsx`:

```tsx
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function PaginaIndisponivelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Página Indisponível
        </h1>
        <p className="text-slate-600 mb-6">
          Esta página está temporariamente desativada. Tente novamente mais tarde.
        </p>
        <Link
          href="/"
          className="text-brand-600 hover:text-brand-700 font-medium"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/manutencao/ src/app/pagina-indisponivel/
git commit -m "feat(admin): add maintenance and unavailable static pages"
```

---

### Task 12: Admin Configuracoes Page — Feature Flags Tab

**Files:**
- Modify: `src/app/(dashboard)/admin/configuracoes/page.tsx`

**Step 1: Rewrite configuracoes page with tabs**

Replace the entire page with a tabbed layout. The page currently shows system info (lines 1-179). Restructure into tabs: "Sistema" (existing content), "Feature Flags", "Manutenção", "Páginas Desativadas".

The page is `"use client"` already. Add state for active tab and content for each tab.

Add these states at the top of the component:

```typescript
const [activeTab, setActiveTab] = useState<"sistema" | "flags" | "manutencao" | "paginas">("sistema")
const [flags, setFlags] = useState<any[]>([])
const [manutencao, setManutencao] = useState<any>(null)
const [paginasDesativadas, setPaginasDesativadas] = useState<any[]>([])
const [loading, setLoading] = useState(false)
```

Add useEffect to fetch data when tab changes:

```typescript
useEffect(() => {
  if (activeTab === "flags") {
    fetch("/api/admin/feature-flags").then(r => r.json()).then(setFlags).catch(() => {})
  } else if (activeTab === "manutencao") {
    fetch("/api/admin/manutencao").then(r => r.json()).then(setManutencao).catch(() => {})
  } else if (activeTab === "paginas") {
    fetch("/api/admin/paginas-desativadas").then(r => r.json()).then(setPaginasDesativadas).catch(() => {})
  }
}, [activeTab])
```

Add tab bar before the content sections:

```tsx
<div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
  {[
    { id: "sistema", label: "Sistema" },
    { id: "flags", label: "Feature Flags" },
    { id: "manutencao", label: "Manutenção" },
    { id: "paginas", label: "Páginas" },
  ].map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id as any)}
      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
        activeTab === tab.id
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

Feature Flags tab content — toggle switches with name and description:

```tsx
{activeTab === "flags" && (
  <div className="space-y-3">
    {flags.map((flag) => (
      <div key={flag.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <h3 className="font-medium text-slate-900 capitalize">{flag.nome}</h3>
          <p className="text-sm text-slate-500">{flag.descricao}</p>
        </div>
        <button
          onClick={async () => {
            await fetch(`/api/admin/feature-flags/${flag.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ativo: !flag.ativo }),
            })
            setFlags(flags.map(f => f.id === flag.id ? { ...f, ativo: !f.ativo } : f))
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            flag.ativo ? "bg-brand-600" : "bg-slate-300"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            flag.ativo ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>
    ))}
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/configuracoes/page.tsx
git commit -m "feat(admin): add feature flags tab to configuracoes page"
```

---

### Task 13: Admin Configuracoes — Maintenance Mode Tab

**Files:**
- Modify: `src/app/(dashboard)/admin/configuracoes/page.tsx` (continue from Task 12)

**Step 1: Add maintenance mode tab content**

Add form state:

```typescript
const [manutForm, setManutForm] = useState({
  tipoBloqueio: "total",
  rolesAfetadas: ["PACIENTE", "PROFISSIONAL"] as string[],
  mensagem: "",
  previsaoRetorno: "",
})
```

Tab content:

```tsx
{activeTab === "manutencao" && (
  <div className="space-y-6">
    {manutencao ? (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-amber-800">Manutenção Ativa</h3>
            <p className="text-sm text-amber-700 mt-1">
              Tipo: {manutencao.tipoBloqueio} | Roles: {manutencao.rolesAfetadas?.join(", ") || "Todas"}
            </p>
            {manutencao.mensagem && (
              <p className="text-sm text-amber-600 mt-1">Mensagem: {manutencao.mensagem}</p>
            )}
          </div>
          <button
            onClick={async () => {
              await fetch("/api/admin/manutencao", { method: "DELETE" })
              setManutencao(null)
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Desativar
          </button>
        </div>
      </div>
    ) : (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Ativar Modo Manutenção</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Bloqueio</label>
          <select
            value={manutForm.tipoBloqueio}
            onChange={(e) => setManutForm({ ...manutForm, tipoBloqueio: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="total">Total (bloqueia tudo)</option>
            <option value="somente_leitura">Somente Leitura</option>
            <option value="agendamento_bloqueado">Agendamentos Bloqueados</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Roles Afetadas</label>
          <div className="flex gap-3">
            {["PACIENTE", "PROFISSIONAL"].map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={manutForm.rolesAfetadas.includes(role)}
                  onChange={(e) => {
                    setManutForm({
                      ...manutForm,
                      rolesAfetadas: e.target.checked
                        ? [...manutForm.rolesAfetadas, role]
                        : manutForm.rolesAfetadas.filter((r) => r !== role),
                    })
                  }}
                  className="rounded border-slate-300"
                />
                {role}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem (opcional)</label>
          <textarea
            value={manutForm.mensagem}
            onChange={(e) => setManutForm({ ...manutForm, mensagem: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            rows={2}
            placeholder="Estamos realizando melhorias..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Previsão de Retorno (opcional)</label>
          <input
            type="datetime-local"
            value={manutForm.previsaoRetorno}
            onChange={(e) => setManutForm({ ...manutForm, previsaoRetorno: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={async () => {
            const res = await fetch("/api/admin/manutencao", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...manutForm,
                previsaoRetorno: manutForm.previsaoRetorno || null,
              }),
            })
            if (res.ok) {
              const data = await res.json()
              setManutencao(data)
            }
          }}
          className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700"
        >
          Ativar Manutenção
        </button>
      </div>
    )}
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/configuracoes/page.tsx
git commit -m "feat(admin): add maintenance mode tab to configuracoes page"
```

---

### Task 14: Admin Configuracoes — Disabled Pages Tab

**Files:**
- Modify: `src/app/(dashboard)/admin/configuracoes/page.tsx` (continue from Task 13)

**Step 1: Add disabled pages tab content**

Add form state:

```typescript
const [novaPagina, setNovaPagina] = useState({ rota: "", motivo: "", rolesAfetadas: [] as string[] })
```

Tab content:

```tsx
{activeTab === "paginas" && (
  <div className="space-y-6">
    {/* Add new disabled page form */}
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-medium text-slate-900">Desativar Página</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={novaPagina.rota}
          onChange={(e) => setNovaPagina({ ...novaPagina, rota: e.target.value })}
          placeholder="Rota (ex: /checkout)"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={novaPagina.motivo}
          onChange={(e) => setNovaPagina({ ...novaPagina, motivo: e.target.value })}
          placeholder="Motivo (opcional)"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={async () => {
            if (!novaPagina.rota) return
            const res = await fetch("/api/admin/paginas-desativadas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(novaPagina),
            })
            if (res.ok) {
              const data = await res.json()
              setPaginasDesativadas([data, ...paginasDesativadas])
              setNovaPagina({ rota: "", motivo: "", rolesAfetadas: [] })
            }
          }}
          className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700"
        >
          Desativar
        </button>
      </div>
    </div>

    {/* List of disabled pages */}
    {paginasDesativadas.length === 0 ? (
      <p className="text-slate-500 text-sm text-center py-8">Nenhuma página desativada.</p>
    ) : (
      <div className="space-y-2">
        {paginasDesativadas.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
            <div>
              <span className="font-mono text-sm font-medium text-slate-900">{p.rota}</span>
              {p.motivo && <span className="text-sm text-slate-500 ml-3">{p.motivo}</span>}
            </div>
            <button
              onClick={async () => {
                await fetch(`/api/admin/paginas-desativadas/${p.id}`, { method: "DELETE" })
                setPaginasDesativadas(paginasDesativadas.filter((x) => x.id !== p.id))
              }}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Reativar
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/configuracoes/page.tsx
git commit -m "feat(admin): add disabled pages tab to configuracoes page"
```

---

### Task 15: Admin Auditoria Page

**Files:**
- Create: `src/app/(dashboard)/admin/auditoria/page.tsx`

**Step 1: Create the audit log page**

```tsx
"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react"

const ACOES = [
  { value: "", label: "Todas as ações" },
  { value: "impersonar_inicio", label: "Impersonar (início)" },
  { value: "impersonar_fim", label: "Impersonar (fim)" },
  { value: "feature_flag_toggle", label: "Feature Flag" },
  { value: "manutencao_ativar", label: "Manutenção (ativar)" },
  { value: "manutencao_desativar", label: "Manutenção (desativar)" },
  { value: "pagina_desativar", label: "Página (desativar)" },
  { value: "pagina_reativar", label: "Página (reativar)" },
  { value: "notificacao_massa", label: "Notificação em massa" },
  { value: "usuario_deletar", label: "Deletar usuário" },
]

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filtroAcao, setFiltroAcao] = useState("")
  const [filtroDe, setFiltroDe] = useState("")
  const [filtroAte, setFiltroAte] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (filtroAcao) params.set("acao", filtroAcao)
    if (filtroDe) params.set("de", filtroDe)
    if (filtroAte) params.set("ate", filtroAte)

    try {
      const res = await fetch(`/api/admin/auditoria?${params}`)
      const data = await res.json()
      setRegistros(data.registros || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [page, filtroAcao, filtroDe, filtroAte])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Log de Auditoria</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroAcao}
          onChange={(e) => { setFiltroAcao(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          {ACOES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filtroDe}
          onChange={(e) => { setFiltroDe(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="De"
        />
        <input
          type="date"
          value={filtroAte}
          onChange={(e) => { setFiltroAte(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Até"
        />
        <span className="text-sm text-slate-500 self-center">{total} registros</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Data/Hora</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Admin</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Ação</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Detalhes</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {new Date(r.criadoEm).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-slate-900">{r.admin?.nome || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {r.acao}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                  {JSON.stringify(r.detalhes)}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.ipAddress || "—"}</td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {loading ? "Carregando..." : "Nenhum registro encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/auditoria/page.tsx
git commit -m "feat(admin): add audit log page with filters and pagination"
```

---

### Task 16: Admin Notificacoes Page

**Files:**
- Create: `src/app/(dashboard)/admin/notificacoes/page.tsx`

**Step 1: Create the mass notifications page**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"

export default function NotificacoesPage() {
  const [historico, setHistorico] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    canal: "email",
    rolesFiltro: [] as string[],
  })
  const [resultado, setResultado] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/notificacoes")
      .then((r) => r.json())
      .then(setHistorico)
      .catch(() => {})
  }, [])

  const handleEnviar = async () => {
    if (!form.titulo || !form.mensagem) return
    setSending(true)
    setResultado(null)
    try {
      const res = await fetch("/api/admin/notificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setResultado(`Enviado com sucesso para ${data.totalEnviado} destinatários.`)
        setHistorico([data, ...historico])
        setForm({ titulo: "", mensagem: "", canal: "email", rolesFiltro: [] })
      } else {
        setResultado(`Erro: ${data.error || "Falha ao enviar"}`)
      }
    } catch {
      setResultado("Erro de rede ao enviar notificação.")
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Notificações em Massa</h1>

      {/* Send Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Título da notificação"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
          <textarea
            value={form.mensagem}
            onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            rows={4}
            placeholder="Corpo da notificação..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
          <div className="flex gap-4">
            {[
              { value: "email", label: "Email" },
              { value: "sms", label: "SMS" },
              { value: "ambos", label: "Ambos" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="canal"
                  value={opt.value}
                  checked={form.canal === opt.value}
                  onChange={(e) => setForm({ ...form, canal: e.target.value })}
                  className="text-brand-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Destinatários</label>
          <div className="flex gap-3">
            {["PACIENTE", "PROFISSIONAL"].map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.rolesFiltro.includes(role)}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      rolesFiltro: e.target.checked
                        ? [...form.rolesFiltro, role]
                        : form.rolesFiltro.filter((r) => r !== role),
                    })
                  }}
                  className="rounded border-slate-300"
                />
                {role}
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Se nenhum selecionado, envia para todos.</p>
        </div>

        {resultado && (
          <div className={`p-3 rounded-lg text-sm ${resultado.startsWith("Erro") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {resultado}
          </div>
        )}

        <button
          onClick={handleEnviar}
          disabled={sending || !form.titulo || !form.mensagem}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Enviando..." : "Enviar Notificação"}
        </button>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Histórico</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Título</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Canal</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Enviados</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historico.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(n.criadoEm).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{n.titulo}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{n.canal}</td>
                  <td className="px-4 py-3 text-slate-600">{n.totalEnviado}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      n.status === "concluido" ? "bg-green-100 text-green-700" :
                      n.status === "enviando" ? "bg-blue-100 text-blue-700" :
                      n.status === "erro" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
              {historico.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma notificação enviada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/notificacoes/page.tsx
git commit -m "feat(admin): add mass notifications page with send form and history"
```

---

### Task 17: Impersonation UI — Banner + Button

**Files:**
- Create: `src/components/admin/ImpersonationBanner.tsx`
- Modify: `src/app/(dashboard)/layout.tsx` (add banner)
- Modify: `src/app/(dashboard)/admin/usuarios/page.tsx` (add impersonation button)

**Step 1: Create the impersonation banner**

```tsx
"use client"

import { useSession } from "next-auth/react"
import { AlertTriangle, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ImpersonationBanner() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const impersonatedBy = (session?.user as any)?.impersonatedBy
  if (!impersonatedBy) return null

  const handleExit = async () => {
    await fetch("/api/admin/impersonar", { method: "DELETE" })
    await update({ stopImpersonation: true })
    router.push("/admin")
    router.refresh()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>
            Visualizando como <strong>{session?.user?.name || session?.user?.email}</strong>
            {" "}({(session?.user as any)?.tipo})
          </span>
        </div>
        <button
          onClick={handleExit}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-sm font-medium transition-colors"
        >
          <X className="w-3 h-3" />
          Sair da Impersonação
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Add banner to dashboard layout**

In `src/app/(dashboard)/layout.tsx`, the layout is a server component. We need to add the banner as a client component. Import and render `ImpersonationBanner` at the top of the main wrapper:

Add import:
```typescript
import ImpersonationBanner from "@/components/admin/ImpersonationBanner"
```

Add `<ImpersonationBanner />` as the first child inside the outermost `<div>`, before the sidebar. The banner uses `useSession()` so it needs a SessionProvider wrapper. If `SessionProvider` isn't already in the layout, wrap the banner conditionally.

**Step 3: Add impersonation button to usuarios page**

In `src/app/(dashboard)/admin/usuarios/page.tsx`, add an "Impersonar" button next to each user's delete button. The button calls the impersonation API and updates the session:

```tsx
// Import useSession at top:
import { useSession } from "next-auth/react"

// Inside component, add:
const { update: updateSession } = useSession()

// Add the impersonar button in the actions column, before delete:
<button
  onClick={async () => {
    if (!confirm(`Impersonar ${usuario.nome}?`)) return
    const res = await fetch("/api/admin/impersonar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: usuario.id }),
    })
    if (res.ok) {
      const data = await res.json()
      await updateSession({
        impersonatedBy: data.impersonatedBy,
        targetUser: data.targetUser,
      })
      router.push("/")
      router.refresh()
    }
  }}
  className="text-amber-600 hover:text-amber-700 text-sm font-medium mr-3"
>
  Impersonar
</button>
```

**Step 4: Commit**

```bash
git add src/components/admin/ImpersonationBanner.tsx src/app/\(dashboard\)/layout.tsx src/app/\(dashboard\)/admin/usuarios/page.tsx
git commit -m "feat(admin): add impersonation UI — banner and user list button"
```

---

### Task 18: Update Sidebar Navigation

**Files:**
- Modify: `src/components/dashboard/DashboardSidebar.tsx`

**Step 1: Add new admin nav items**

In `src/components/dashboard/DashboardSidebar.tsx`, the admin nav items are at lines 53-62. Add the new pages:

```typescript
// Add imports at top:
import { Shield, Bell } from "lucide-react"

// Add to navItemsAdmin array, after "Configurações":
{ name: "Auditoria", href: "/admin/auditoria", icon: Shield },
{ name: "Notificações", href: "/admin/notificacoes", icon: Bell },
```

**Step 2: Commit**

```bash
git add src/components/dashboard/DashboardSidebar.tsx
git commit -m "feat(admin): add auditoria and notificacoes to sidebar nav"
```

---

### Task 19: Build Verification

**Step 1: Generate Prisma client**

Run: `bunx prisma generate`
Expected: "Generated Prisma Client"

**Step 2: Build the project**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds with no errors

**Step 3: Run lint**

Run: `./node_modules/.bin/next lint`
Expected: No errors (warnings OK)

**Step 4: Fix any build errors if present**

If there are TypeScript or import errors, fix them based on the error messages.

**Step 5: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix(admin): resolve build errors from admin panel features"
```

---

### Task 20: Push and Verify

**Step 1: Push to remote**

Run: `git push origin main`
Expected: Successfully pushed

**Step 2: Verify Vercel deployment**

Check Vercel deployment status at https://vercel.com/dashboard. Ensure the build passes and the site loads.
