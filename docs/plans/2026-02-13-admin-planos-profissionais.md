# Admin: Gestao de Planos + Cadastro de Profissionais

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Admin pode criar/editar/remover planos da plataforma e cadastrar medicos completos (conta + dados profissionais) do zero.

**Architecture:** Novo modelo `Plano` no Prisma com CRUD completo via API admin. Pagina publica `/planos` passa a ler do banco. Pagina `admin/profissionais` ganha modal de cadastro completo usando transacao Prisma (cria Usuario + Profissional atomicamente). Sidebar admin ganha links para Planos e Relatorios.

**Tech Stack:** Next.js 14 App Router, Prisma, Zod, Tailwind CSS, lucide-react

---

## Task 1: Modelo Plano no Prisma

**Files:**
- Modify: `prisma/schema.prisma` (add after line 272)

**Step 1: Add Plano model to schema**

Add at the end of `prisma/schema.prisma` (after DocumentoMedico model, line 272):

```prisma
model Plano {
  id           String   @id @default(uuid())
  nome         String
  preco        Decimal  @db.Decimal(10, 2)
  intervalo    String   @default("MENSAL")
  recursos     String[]
  ativo        Boolean  @default(true)
  destaque     Boolean  @default(false)
  ordem        Int      @default(0)
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  @@map("planos")
}
```

**Step 2: Generate Prisma client**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && bunx prisma generate`
Expected: "Generated Prisma Client"

**Step 3: Push schema to DB**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && bunx prisma db push`
Expected: "Your database is now in sync with your Prisma schema"

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Plano model to Prisma schema"
```

---

## Task 2: API CRUD Planos (Admin)

**Files:**
- Create: `src/app/api/admin/planos/route.ts`
- Create: `src/app/api/admin/planos/[id]/route.ts`

**Step 1: Create GET + POST `/api/admin/planos`**

Create `src/app/api/admin/planos/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"

const createPlanoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatorio"),
  preco: z.number().min(0, "Preco deve ser >= 0"),
  intervalo: z.enum(["MENSAL", "ANUAL"]).default("MENSAL"),
  recursos: z.array(z.string()).default([]),
  ativo: z.boolean().default(true),
  destaque: z.boolean().default(false),
  ordem: z.number().int().default(0),
})

export async function GET() {
  try {
    await requireAdmin()

    const planos = await prisma.plano.findMany({
      orderBy: { ordem: "asc" },
    })

    return NextResponse.json(planos)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = createPlanoSchema.parse(body)

    const plano = await prisma.plano.create({
      data: {
        nome: data.nome,
        preco: data.preco,
        intervalo: data.intervalo,
        recursos: data.recursos,
        ativo: data.ativo,
        destaque: data.destaque,
        ordem: data.ordem,
      },
    })

    return NextResponse.json(plano, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.errors },
        { status: 400 }
      )
    }
    return handleAuthError(error)
  }
}
```

**Step 2: Create PATCH + DELETE `/api/admin/planos/[id]`**

Create `src/app/api/admin/planos/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { requireAdmin, handleAuthError } from "@/lib/auth/guards"

const updatePlanoSchema = z.object({
  nome: z.string().min(1).optional(),
  preco: z.number().min(0).optional(),
  intervalo: z.enum(["MENSAL", "ANUAL"]).optional(),
  recursos: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
  destaque: z.boolean().optional(),
  ordem: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = updatePlanoSchema.parse(body)

    const plano = await prisma.plano.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(plano)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.errors },
        { status: 400 }
      )
    }
    return handleAuthError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    await prisma.plano.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Plano removido" })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/admin/planos/
git commit -m "feat: add admin API CRUD for planos"
```

---

## Task 3: API Planos Publica

**Files:**
- Create: `src/app/api/planos/route.ts`

**Step 1: Create GET `/api/planos` (public)**

Create `src/app/api/planos/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const planos = await prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
    })

    return NextResponse.json(planos)
  } catch (error) {
    console.error("Erro ao buscar planos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar planos" },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/planos/route.ts
git commit -m "feat: add public API endpoint for active planos"
```

---

## Task 4: Pagina Admin Planos

**Files:**
- Create: `src/app/(dashboard)/admin/planos/page.tsx`

**Step 1: Create admin planos page**

Create `src/app/(dashboard)/admin/planos/page.tsx` with full CRUD UI:

- State: `planos[]`, `loading`, `showModal`, `editingPlano`, `form` (nome, preco, intervalo, recursos, ativo, destaque, ordem)
- Fetch `GET /api/admin/planos` on mount
- Table showing: nome, preco formatted R$, intervalo, ativo toggle, destaque badge, ordem
- "Novo Plano" button opens modal
- Edit button on each row opens modal pre-filled
- Delete button with `confirm()` dialog
- Modal form with:
  - nome (text input)
  - preco (number input, step 0.01)
  - intervalo (select: MENSAL/ANUAL)
  - recursos (dynamic list: add/remove string items)
  - ativo (checkbox)
  - destaque (checkbox)
  - ordem (number input)
- Submit calls POST (new) or PATCH (edit), then refreshes list
- Use same Tailwind patterns as existing admin pages (bg-white border rounded-lg p-6, brand-600 buttons)
- Icons from lucide-react: `Package`, `Plus`, `Pencil`, `Trash2`, `Star`, `Loader2`

**Step 2: Commit**

```bash
git add src/app/(dashboard)/admin/planos/page.tsx
git commit -m "feat: add admin planos management page with CRUD"
```

---

## Task 5: Sidebar - Link Planos + Relatorios

**Files:**
- Modify: `src/components/dashboard/DashboardSidebar.tsx:50-57`

**Step 1: Add Planos and Relatorios links to admin nav**

In `src/components/dashboard/DashboardSidebar.tsx`, add `Package` and `BarChart3` to the lucide-react imports (line 6-18), then add two entries to `navItemsAdmin` array (lines 50-57):

Current `navItemsAdmin`:
```typescript
const navItemsAdmin: NavItem[] = [
  { name: "Inicio", href: "/admin", icon: Home },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Profissionais", href: "/admin/profissionais", icon: User },
  { name: "Agendamentos", href: "/admin/agendamentos", icon: Calendar },
  { name: "Pagamentos", href: "/admin/pagamentos", icon: CreditCard },
  { name: "Configuracoes", href: "/admin/configuracoes", icon: Settings },
]
```

New `navItemsAdmin`:
```typescript
const navItemsAdmin: NavItem[] = [
  { name: "Inicio", href: "/admin", icon: Home },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Profissionais", href: "/admin/profissionais", icon: User },
  { name: "Planos", href: "/admin/planos", icon: Package },
  { name: "Agendamentos", href: "/admin/agendamentos", icon: Calendar },
  { name: "Pagamentos", href: "/admin/pagamentos", icon: CreditCard },
  { name: "Relatorios", href: "/admin/relatorios", icon: BarChart3 },
  { name: "Configuracoes", href: "/admin/configuracoes", icon: Settings },
]
```

**Step 2: Commit**

```bash
git add src/components/dashboard/DashboardSidebar.tsx
git commit -m "feat: add Planos and Relatorios links to admin sidebar"
```

---

## Task 6: Pagina Publica /planos Dinamica

**Files:**
- Modify: `src/app/(site)/planos/page.tsx` (replace hardcoded data with API fetch)

**Step 1: Refactor planos page to fetch from API**

Replace the entire `src/app/(site)/planos/page.tsx`. The page should:

- Be a server component (no "use client")
- Fetch planos from the database directly via Prisma (server component can do this)
- Fallback to hardcoded plans if DB returns empty (graceful degradation)
- Keep the exact same visual layout (3-column grid, ring styling, scale-105 on destaque)
- Map `plano.destaque === true` to the highlighted card (currently `index === 1`)
- Map `plano.recursos` array to the feature list
- Display `plano.preco` with R$ formatting, handle "Sob consulta" case (preco = 0 means "Sob consulta")

```typescript
import Link from "next/link"
import { Check } from "lucide-react"
import { prisma } from "@/lib/db/prisma"

const fallbackPlans = [
  {
    id: "1",
    nome: "Essencial",
    preco: 199,
    intervalo: "MENSAL",
    recursos: [
      "Ate 30 teleconsultas/mes",
      "Agenda online integrada",
      "Prontuario eletronico basico",
      "Suporte por email",
    ],
    destaque: false,
  },
  {
    id: "2",
    nome: "Profissional",
    preco: 399,
    intervalo: "MENSAL",
    recursos: [
      "Tudo do Essencial",
      "Teleconsultas ilimitadas",
      "Prescricao digital e atestados",
      "Relatorios e metricas",
      "Suporte prioritario",
    ],
    destaque: true,
  },
  {
    id: "3",
    nome: "Clinica",
    preco: 0,
    intervalo: "MENSAL",
    recursos: [
      "Tudo do Profissional",
      "Multiplos profissionais",
      "Painel administrativo completo",
      "Integracao com sistemas externos",
      "Gerente de conta dedicado",
    ],
    destaque: false,
  },
]

export default async function PlanosPage() {
  let plans = fallbackPlans

  try {
    const dbPlans = await prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
    })
    if (dbPlans.length > 0) {
      plans = dbPlans.map((p) => ({
        id: p.id,
        nome: p.nome,
        preco: Number(p.preco),
        intervalo: p.intervalo,
        recursos: p.recursos,
        destaque: p.destaque,
      }))
    }
  } catch {
    // fallback to hardcoded
  }

  return (
    // Keep exact same JSX structure, but use `plans` array
    // and `plan.destaque` instead of `index === 1` for highlight
  )
}
```

**Step 2: Commit**

```bash
git add src/app/(site)/planos/page.tsx
git commit -m "feat: refactor planos page to fetch from database with fallback"
```

---

## Task 7: API Admin Criar Profissional

**Files:**
- Modify: `src/app/api/admin/profissionais/route.ts` (add POST handler)

**Step 1: Add POST handler to create profissional**

Add to `src/app/api/admin/profissionais/route.ts` after the existing PATCH handler (line 101):

- Import `hashPassword` from `@/lib/auth/next-auth` (same as used in `seja-profissional/route.ts`)
- New Zod schema for creation: nome, email, senha, telefone?, cpf?, crm, especialidade, valorConsulta, biografia?
- Check email uniqueness (prisma.usuario.findUnique)
- Check CRM uniqueness (prisma.profissional.findUnique)
- Hash password
- Prisma $transaction: create Usuario (tipo=PROFISSIONAL) + Profissional (ativo=true, already approved)
- Return created profissional data

```typescript
const createProfissionalSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email invalido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  crm: z.string().min(4, "CRM invalido"),
  especialidade: z.string().min(2, "Especialidade obrigatoria"),
  valorConsulta: z.number().positive("Valor deve ser positivo"),
  biografia: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = createProfissionalSchema.parse(body)

    // Check email uniqueness
    const emailExiste = await prisma.usuario.findUnique({
      where: { email: data.email },
    })
    if (emailExiste) {
      return NextResponse.json(
        { error: "Este email ja esta cadastrado" },
        { status: 409 }
      )
    }

    // Check CRM uniqueness
    const crmExiste = await prisma.profissional.findUnique({
      where: { crm: data.crm },
    })
    if (crmExiste) {
      return NextResponse.json(
        { error: "Este CRM ja esta cadastrado" },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(data.senha)

    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: data.nome,
          email: data.email,
          senha: hashedPassword,
          telefone: data.telefone || null,
          cpf: data.cpf || null,
          tipo: "PROFISSIONAL",
        },
      })

      const profissional = await tx.profissional.create({
        data: {
          usuarioId: usuario.id,
          crm: data.crm,
          especialidade: data.especialidade,
          valorConsulta: data.valorConsulta,
          biografia: data.biografia || null,
          ativo: true, // Admin-created = already approved
        },
      })

      return { usuario, profissional }
    })

    return NextResponse.json({
      id: resultado.profissional.id,
      nome: data.nome,
      email: data.email,
      crm: data.crm,
      especialidade: data.especialidade,
      valorConsulta: data.valorConsulta,
      ativo: true,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.errors },
        { status: 400 }
      )
    }
    return handleAuthError(error)
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/profissionais/route.ts
git commit -m "feat: add POST endpoint for admin to create profissional"
```

---

## Task 8: Expandir PATCH Profissional (CRM, biografia, telefone)

**Files:**
- Modify: `src/app/api/admin/profissionais/route.ts` (expand PATCH schema and handler)

**Step 1: Expand update schema and handler**

Update `updateProfissionalAdminSchema` (line 6-10) to include crm, biografia, telefone, nome:

```typescript
const updateProfissionalAdminSchema = z.object({
  id: z.string().uuid(),
  valorConsulta: z.number().positive().optional(),
  especialidade: z.string().min(1).optional(),
  crm: z.string().min(4).optional(),
  biografia: z.string().optional(),
  nome: z.string().min(3).optional(),
  telefone: z.string().optional(),
})
```

Update the PATCH handler (lines 64-101) to also update user fields (nome, telefone) via relation:

```typescript
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { id, nome, telefone, ...profData } = updateProfissionalAdminSchema.parse(body)

    // If CRM is being changed, check uniqueness
    if (profData.crm) {
      const crmExiste = await prisma.profissional.findFirst({
        where: { crm: profData.crm, NOT: { id } },
      })
      if (crmExiste) {
        return NextResponse.json(
          { error: "Este CRM ja esta em uso por outro profissional" },
          { status: 409 }
        )
      }
    }

    const profissional = await prisma.profissional.update({
      where: { id },
      data: {
        ...(profData.valorConsulta !== undefined && { valorConsulta: profData.valorConsulta }),
        ...(profData.especialidade && { especialidade: profData.especialidade }),
        ...(profData.crm && { crm: profData.crm }),
        ...(profData.biografia !== undefined && { biografia: profData.biografia }),
        ...(nome || telefone ? {
          usuario: {
            update: {
              ...(nome && { nome }),
              ...(telefone !== undefined && { telefone }),
            },
          },
        } : {}),
      },
      include: {
        usuario: {
          select: { nome: true, email: true, telefone: true },
        },
      },
    })

    return NextResponse.json({
      id: profissional.id,
      nome: profissional.usuario.nome,
      email: profissional.usuario.email,
      telefone: profissional.usuario.telefone,
      especialidade: profissional.especialidade,
      crm: profissional.crm,
      biografia: profissional.biografia,
      valorConsulta: profissional.valorConsulta,
      ativo: profissional.ativo,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invalidos", details: error.errors },
        { status: 400 }
      )
    }
    return handleAuthError(error)
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/admin/profissionais/route.ts
git commit -m "feat: expand PATCH profissional to support CRM, bio, nome, telefone"
```

---

## Task 9: UI Admin Profissionais - Modal Criar + Edicao Expandida

**Files:**
- Modify: `src/app/(dashboard)/admin/profissionais/page.tsx` (full rewrite)

**Step 1: Add create modal and expanded edit to profissionais page**

Update `src/app/(dashboard)/admin/profissionais/page.tsx`:

- Add state: `showCreateModal`, `showEditModal`, `editingProf`, `createForm`, `editForm`
- Add "Novo Profissional" button next to title (line 130-133)
- Create modal with fields: nome, email, senha, telefone, cpf, crm, especialidade (select with common options + custom), valorConsulta, biografia (textarea)
- Especialidade select options: "Cardiologia", "Dermatologia", "Endocrinologia", "Ginecologia", "Neurologia", "Oftalmologia", "Ortopedia", "Pediatria", "Psiquiatria", "Urologia", "Clinica Geral", "Outra"
- Submit calls `POST /api/admin/profissionais`, show success/error, refresh list
- Each profissional card gets an "Editar" button that opens edit modal pre-filled with all fields (nome, crm, especialidade, valor, biografia, telefone)
- Edit modal submit calls `PATCH /api/admin/profissionais`
- Replace inline valor edit with full edit modal
- Keep existing approve/reject buttons for pending professionals
- Use same modal pattern: fixed overlay + centered card + form
- Icons: add `Plus`, `Pencil` to imports

**Step 2: Commit**

```bash
git add src/app/(dashboard)/admin/profissionais/page.tsx
git commit -m "feat: add create and edit modals to admin profissionais page"
```

---

## Task 10: Build + Lint + Final Commit

**Step 1: Generate Prisma client**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && bunx prisma generate`

**Step 2: Run lint**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && ./node_modules/.bin/next lint`
Expected: Only warnings, no errors

**Step 3: Fix any lint errors**

Fix issues found in step 2.

**Step 4: Run build**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && ./node_modules/.bin/next build`
Expected: Build succeeds

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint and build issues"
```
