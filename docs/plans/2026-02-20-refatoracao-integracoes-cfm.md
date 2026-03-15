# Refatoracao Integracoes CFM — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor Clini+ to support per-specialty integration controls (Memed/Bird ID), flexible professional registration (CRM/CRN/CRP), 30/70 consultation room layout, remove financial info from professional view, and time-gate the "Enter Consultation" button.

**Architecture:** Incremental by layer — Prisma schema first, then API endpoints, then admin UI, then professional UI, then consultation room, then patient UI. Each layer builds on the previous. Central permission logic in `src/lib/permissions.ts` and time logic in `src/lib/consultation-time.ts`.

**Tech Stack:** Next.js 14, Prisma (PostgreSQL), TypeScript, Tailwind CSS, Zod validation

**Design Doc:** `docs/plans/2026-02-20-refatoracao-integracoes-cfm-design.md`

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma:99-117` (Profissional model)
- Modify: `prisma/schema.prisma:304-316` (Especialidade model)

**Step 1: Update Profissional model**

In `prisma/schema.prisma`, replace lines 102 (`crm String @unique`) with:

```prisma
  registroProfissional String   @unique
  tipoRegistro         String
```

All other fields stay the same.

**Step 2: Update Especialidade model**

In `prisma/schema.prisma`, add two fields before the `criadoEm` line (310):

```prisma
  memedHabilitado  Boolean  @default(false)
  birdIdHabilitado Boolean  @default(false)
```

**Step 3: Push schema to database**

Run:
```bash
cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus"
bunx prisma db push
```

This will prompt about data loss for renaming `crm` -> `registroProfissional`. Accept it (dev environment). For production, write a proper migration with `ALTER TABLE ... RENAME COLUMN`.

**Step 4: Regenerate Prisma client**

Run:
```bash
bunx prisma generate
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "schema: rename crm to registroProfissional, add tipoRegistro and integration flags on Especialidade"
```

---

## Task 2: Permission Utils

**Files:**
- Create: `src/lib/permissions.ts`

**Step 1: Create permissions.ts**

```typescript
// src/lib/permissions.ts
// Central permission logic for integration access control (CFM compliance)

type ProfissionalPermissions = {
  tipoRegistro: string
}

type ProfissionalBirdId = ProfissionalPermissions & {
  birdIdHabilitado: boolean
}

type EspecialidadeIntegracoes = {
  memedHabilitado: boolean
  birdIdHabilitado: boolean
}

export function temCRM(profissional: ProfissionalPermissions): boolean {
  return profissional.tipoRegistro === "CRM"
}

export function podePrescrever(
  profissional: ProfissionalPermissions,
  especialidade: EspecialidadeIntegracoes
): boolean {
  return temCRM(profissional) && especialidade.memedHabilitado
}

export function podeAssinarBirdId(
  profissional: ProfissionalBirdId,
  especialidade: EspecialidadeIntegracoes
): boolean {
  return (
    temCRM(profissional) &&
    especialidade.birdIdHabilitado &&
    profissional.birdIdHabilitado
  )
}
```

**Step 2: Commit**

```bash
git add src/lib/permissions.ts
git commit -m "feat: add central permission utils for integration access control"
```

---

## Task 3: Consultation Time Util

**Files:**
- Create: `src/lib/consultation-time.ts`

**Step 1: Create consultation-time.ts**

```typescript
// src/lib/consultation-time.ts
// Time-gating logic for "Entrar na Consulta" button

export type HorarioStatus = "antes" | "dentro" | "depois"

const MINUTOS_ANTES = 15
const MINUTOS_DEPOIS = 30

export function dentroDoHorario(dataHora: Date): HorarioStatus {
  const agora = new Date()
  const inicio = new Date(dataHora.getTime() - MINUTOS_ANTES * 60 * 1000)
  const fim = new Date(dataHora.getTime() + MINUTOS_DEPOIS * 60 * 1000)

  if (agora < inicio) return "antes"
  if (agora > fim) return "depois"
  return "dentro"
}

export function formatarHorarioConsulta(dataHora: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dataHora)
}
```

**Step 2: Commit**

```bash
git add src/lib/consultation-time.ts
git commit -m "feat: add consultation time-gating util"
```

---

## Task 4: API — Admin Especialidades

**Files:**
- Modify: `src/app/api/admin/especialidades/[id]/route.ts:6-11` (PATCH schema)

**Step 1: Add integration fields to Zod schema**

In the `updateEspecialidadeSchema` (lines 6-11), add after the `ativo` field:

```typescript
  memedHabilitado: z.boolean().optional(),
  birdIdHabilitado: z.boolean().optional(),
```

No other changes needed — the PATCH handler already spreads validated data into `prisma.especialidade.update()`.

**Step 2: Commit**

```bash
git add src/app/api/admin/especialidades/
git commit -m "feat: accept memedHabilitado and birdIdHabilitado in especialidade PATCH"
```

---

## Task 5: API — Admin Profissionais

**Files:**
- Modify: `src/app/api/admin/profissionais/route.ts:7-26` (schemas)
- Modify: `src/app/api/admin/profissionais/route.ts:85-168` (POST handler)
- Modify: `src/app/api/admin/profissionais/route.ts:28-83` (GET handler)

**Step 1: Update createProfissionalSchema (lines 17-26)**

Replace the `crm` field:
```typescript
  // OLD: crm: z.string().min(4, "CRM deve ter pelo menos 4 caracteres"),
  registroProfissional: z.string().min(4, "Registro profissional deve ter pelo menos 4 caracteres"),
  tipoRegistro: z.string().min(2, "Tipo de registro obrigatório"),
```

**Step 2: Update updateProfissionalAdminSchema (lines 7-15)**

Replace the `crm` field:
```typescript
  // OLD: crm: z.string().min(4).optional(),
  registroProfissional: z.string().min(4).optional(),
  tipoRegistro: z.string().min(2).optional(),
```

**Step 3: Update POST handler**

In the POST handler (lines 85-168), find all references to `crm` and replace with `registroProfissional`. Key spots:
- Uniqueness check: change `prisma.profissional.findUnique({ where: { crm } })` to `prisma.profissional.findUnique({ where: { registroProfissional } })`
- Create call: change `crm` to `registroProfissional` and add `tipoRegistro` in the profissional create data

**Step 4: Update PATCH handler**

In the PATCH handler (lines 170-251), find CRM uniqueness check and replace `crm` with `registroProfissional`. Also add `tipoRegistro` to the update data spread.

**Step 5: Update GET handler**

In the GET handler (lines 28-83), add `especialidade` to the Prisma include so it returns integration flags:
```typescript
include: {
  usuario: { select: { nome: true, email: true, telefone: true, cpf: true } },
  especialidade: { select: { id: true, nome: true, valorConsulta: true, memedHabilitado: true, birdIdHabilitado: true } },
}
```

**Step 6: Commit**

```bash
git add src/app/api/admin/profissionais/
git commit -m "feat: migrate crm to registroProfissional in admin profissionais API"
```

---

## Task 6: API — Seja Profissional (Public Signup)

**Files:**
- Modify: `src/app/api/seja-profissional/route.ts:6-13` (schema)
- Modify: `src/app/api/seja-profissional/route.ts:19-123` (POST handler)

**Step 1: Update Zod schema (lines 6-13)**

Replace `crm` field:
```typescript
  // OLD: crm: z.string().min(4, "CRM inválido"),
  registroProfissional: z.string().min(4, "Registro profissional inválido"),
  tipoRegistro: z.string().min(2, "Tipo de registro obrigatório"),
```

**Step 2: Update POST handler**

Find all `crm` references in the handler and replace:
- Uniqueness check: `prisma.profissional.findUnique({ where: { registroProfissional } })`
- Create data: `registroProfissional` and `tipoRegistro` instead of `crm`

**Step 3: Commit**

```bash
git add src/app/api/seja-profissional/
git commit -m "feat: migrate crm to registroProfissional in public signup API"
```

---

## Task 7: API — User Profissional (Self-service)

**Files:**
- Modify: `src/app/api/user/profissional/route.ts:28-49` (GET Prisma include)

**Step 1: Update GET handler Prisma include**

Ensure the `especialidade` include returns integration flags. In the select for especialidade (around line 40), add:
```typescript
especialidade: {
  select: {
    id: true,
    nome: true,
    valorConsulta: true,
    memedHabilitado: true,
    birdIdHabilitado: true,
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/user/profissional/
git commit -m "feat: include integration flags in profissional self-service API"
```

---

## Task 8: Admin UI — Especialidades

**Files:**
- Modify: `src/app/(dashboard)/admin/especialidades/page.tsx:29-35` (state)
- Modify: `src/app/(dashboard)/admin/especialidades/page.tsx:180-243` (table)
- Modify: `src/app/(dashboard)/admin/especialidades/page.tsx:245-343` (modal form)

**Step 1: Update form state (around line 30)**

Add to the form state object:
```typescript
memedHabilitado: false,
birdIdHabilitado: false,
```

Also update the `setForm` call when editing an existing especialidade (the edit handler) to include these fields.

**Step 2: Add toggles to modal form (after Ativo checkbox, around line 321)**

After the "Ativo" checkbox div, add:
```tsx
{/* Integration toggles */}
<div className="border-t border-slate-200 pt-4 mt-4">
  <p className="text-sm font-medium text-slate-700 mb-3">Integracoes</p>
  <label className="flex items-center gap-3 mb-2 cursor-pointer">
    <input
      type="checkbox"
      checked={form.memedHabilitado}
      onChange={(e) => setForm({ ...form, memedHabilitado: e.target.checked })}
      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
    />
    <span className="text-sm text-slate-700">Prescricao Digital (Memed)</span>
  </label>
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={form.birdIdHabilitado}
      onChange={(e) => setForm({ ...form, birdIdHabilitado: e.target.checked })}
      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
    />
    <span className="text-sm text-slate-700">Assinatura Digital (Bird ID)</span>
  </label>
</div>
```

**Step 3: Add integration badges to table/card display (around line 200)**

After the valor display in each card, add:
```tsx
<div className="flex gap-1 mt-1">
  {esp.memedHabilitado && (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Memed</span>
  )}
  {esp.birdIdHabilitado && (
    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Bird ID</span>
  )}
  {!esp.memedHabilitado && !esp.birdIdHabilitado && (
    <span className="text-xs text-slate-400">Sem integracoes</span>
  )}
</div>
```

**Step 4: Commit**

```bash
git add src/app/(dashboard)/admin/especialidades/
git commit -m "feat: add integration toggles to admin especialidades UI"
```

---

## Task 9: Admin UI — Profissionais

**Files:**
- Modify: `src/app/(dashboard)/admin/profissionais/page.tsx:498-627` (create modal)
- Modify: `src/app/(dashboard)/admin/profissionais/page.tsx:629-717` (edit modal)
- Modify: `src/app/(dashboard)/admin/profissionais/page.tsx:419` (table CRM column)
- Modify: `src/app/(dashboard)/admin/profissionais/page.tsx:456-469` (Bird ID toggle)

**Step 1: Define registro types constant (top of file)**

Add near the top imports:
```typescript
const TIPOS_REGISTRO = [
  { value: "CRM", label: "CRM (Medicina)" },
  { value: "CRN", label: "CRN (Nutricao)" },
  { value: "CRP", label: "CRP (Psicologia)" },
  { value: "CREFITO", label: "CREFITO (Fisioterapia)" },
  { value: "CRO", label: "CRO (Odontologia)" },
  { value: "COREN", label: "COREN (Enfermagem)" },
  { value: "CRFa", label: "CRFa (Fonoaudiologia)" },
  { value: "COFFITO", label: "COFFITO (Terapia Ocupacional)" },
] as const
```

**Step 2: Update create modal (lines 577-587)**

Replace the CRM input field with:
```tsx
{/* Tipo de Registro */}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Registro</label>
  <select
    value={createForm.tipoRegistro}
    onChange={(e) => setCreateForm({ ...createForm, tipoRegistro: e.target.value })}
    className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
    required
  >
    <option value="">Selecione...</option>
    {TIPOS_REGISTRO.map((t) => (
      <option key={t.value} value={t.value}>{t.label}</option>
    ))}
  </select>
</div>

{/* Registro Profissional */}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">Registro Profissional</label>
  <input
    type="text"
    value={createForm.registroProfissional}
    onChange={(e) => setCreateForm({ ...createForm, registroProfissional: e.target.value })}
    placeholder="Ex: 123456/SP"
    className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
    required
  />
</div>
```

Update the `createForm` state to replace `crm` with `registroProfissional` and `tipoRegistro`.

**Step 3: Update edit modal (lines 670-678)**

Same pattern — replace CRM field with tipoRegistro dropdown + registroProfissional input. Update `editForm` state.

**Step 4: Update table display (line 419)**

Replace `CRM {prof.crm}` with:
```tsx
{prof.tipoRegistro} {prof.registroProfissional}
```

**Step 5: Update Bird ID toggle visibility (lines 456-469)**

Add condition: only show Bird ID toggle if `prof.tipoRegistro === "CRM"` AND `prof.especialidade?.birdIdHabilitado`:
```tsx
{prof.ativo && prof.tipoRegistro === "CRM" && prof.especialidade?.birdIdHabilitado && (
  <button ... >
    Bird ID {prof.birdIdHabilitado ? "Ativo" : "Inativo"}
  </button>
)}
```

**Step 6: Commit**

```bash
git add src/app/(dashboard)/admin/profissionais/
git commit -m "feat: migrate CRM to registroProfissional in admin profissionais UI"
```

---

## Task 10: Profissional UI — Dashboard (Remove Financial Info)

**Files:**
- Modify: `src/app/(dashboard)/profissional/page.tsx:221-233` (faturamento card)
- Modify: `src/app/(dashboard)/profissional/page.tsx:342-354` (payment status)
- Modify: `src/app/(dashboard)/profissional/page.tsx:68-70` (faturamento calculation)

**Step 1: Remove faturamento calculation (lines 68-70)**

Delete or comment out:
```typescript
const faturamento = agendamentos
  .filter((a) => a.pagamento?.status === "PAGO")
  .reduce((sum, a) => sum + Number(a.pagamento?.valor || 0), 0)
```

Remove `faturamento` from the stats object too.

**Step 2: Remove faturamento card (lines 221-233)**

Delete the entire card div that shows "Faturamento" and "R$ {stats.faturamento.toFixed(2)}".

**Step 3: Remove payment status from agendamento cards (lines 342-354)**

Delete the payment status div that shows "Pagamento:" and "Pago"/"Pendente".

**Step 4: Adjust stats grid**

The grid likely uses `grid-cols-2 lg:grid-cols-4`. With 3 cards, change to `grid-cols-3` or keep `grid-cols-2 lg:grid-cols-3`.

**Step 5: Commit**

```bash
git add src/app/(dashboard)/profissional/page.tsx
git commit -m "feat: remove all financial info from professional dashboard"
```

---

## Task 11: Profissional UI — Perfil

**Files:**
- Modify: `src/app/(dashboard)/profissional/perfil/page.tsx:330-340` (CRM display)
- Modify: `src/app/(dashboard)/profissional/perfil/page.tsx:402-446` (Bird ID section)

**Step 1: Update CRM display (lines 330-340)**

Replace "CRM" label with dynamic label:
```tsx
<label className="block text-sm font-medium text-slate-700 mb-2">
  {data.tipoRegistro || "CRM"}
</label>
<input
  type="text"
  value={data.registroProfissional}
  className="w-full rounded-xl border border-slate-200 py-2.5 px-4 bg-slate-50 text-slate-500 text-sm"
  disabled
/>
```

**Step 2: Update Bird ID section condition (line 402)**

Import permissions:
```typescript
import { podeAssinarBirdId } from "@/lib/permissions"
```

Change condition from `data.birdIdHabilitado` to:
```tsx
{podeAssinarBirdId(
  { tipoRegistro: data.tipoRegistro, birdIdHabilitado: data.birdIdHabilitado },
  data.especialidade
) ? (
  // ... existing Bird ID section ...
) : data.tipoRegistro !== "CRM" ? (
  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
    <p className="text-sm text-slate-500">
      Integracoes de prescricao e assinatura digital estao disponiveis apenas para profissionais com CRM.
    </p>
  </div>
) : null}
```

**Step 3: Remove valorConsulta display if present**

Check if the profile page shows consultation value and remove it (profissional should not see financial values).

**Step 4: Commit**

```bash
git add src/app/(dashboard)/profissional/perfil/
git commit -m "feat: update profile with registroProfissional and conditional Bird ID"
```

---

## Task 12: Profissional UI — Cadastro (Seja Profissional)

**Files:**
- Modify: `src/app/(site)/seja-profissional/page.tsx:83-91` (form state)
- Modify: `src/app/(site)/seja-profissional/page.tsx:97-139` (submit handler)
- Modify: `src/app/(site)/seja-profissional/page.tsx:406-424` (CRM field)
- Modify: `src/app/(site)/seja-profissional/page.tsx:425-444` (especialidade field)

**Step 1: Update form state (lines 83-91)**

Replace `crm` with `registroProfissional` and add `tipoRegistro`:
```typescript
const [formData, setFormData] = useState({
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  registroProfissional: "",
  tipoRegistro: "",
  especialidadeId: "",
  telefone: "",
})
```

**Step 2: Add especialidade-to-tipoRegistro mapping**

Add a mapping near the TIPOS_REGISTRO constant or derive from specialty selection. When user selects a specialty, auto-set `tipoRegistro` based on the specialty name or a config. Simpler approach: let the user pick tipoRegistro from a dropdown (same as admin).

Add the `TIPOS_REGISTRO` constant (same as Task 9).

**Step 3: Reorder form fields**

Move Especialidade dropdown BEFORE the registration field so that tipoRegistro can be set when specialty is selected. Flow:
1. Nome
2. Email
3. Senha / Confirmar Senha
4. Especialidade (dropdown from API)
5. Tipo de Registro (dropdown — auto-selected based on specialty if possible)
6. Registro Profissional (input with dynamic placeholder)
7. Telefone

**Step 4: Replace CRM field (lines 406-424)**

Replace with tipoRegistro dropdown + registroProfissional input. The label changes dynamically based on `formData.tipoRegistro`:
```tsx
<div>
  <label className="...">Tipo de Registro *</label>
  <select
    value={formData.tipoRegistro}
    onChange={(e) => setFormData({ ...formData, tipoRegistro: e.target.value })}
    className="..."
    required
  >
    <option value="">Selecione...</option>
    {TIPOS_REGISTRO.map((t) => (
      <option key={t.value} value={t.value}>{t.label}</option>
    ))}
  </select>
</div>
<div>
  <label className="...">
    {formData.tipoRegistro || "Registro Profissional"} *
  </label>
  <input
    type="text"
    value={formData.registroProfissional}
    onChange={(e) => setFormData({ ...formData, registroProfissional: e.target.value })}
    placeholder={`Ex: 123456/${formData.tipoRegistro === "CRM" ? "SP" : "Regiao"}`}
    className="..."
    required
  />
</div>
```

**Step 5: Update submit handler (lines 97-139)**

Replace `crm` with `registroProfissional` and `tipoRegistro` in the fetch body.

**Step 6: Commit**

```bash
git add src/app/(site)/seja-profissional/
git commit -m "feat: flexible professional registration with tipoRegistro"
```

---

## Task 13: Consultation Room — Layout 30/70

**Files:**
- Modify: `src/app/consulta/[id]/page.tsx:540` (sidebar width)
- Modify: `src/app/consulta/[id]/page.tsx:482-515` (video area)

**Step 1: Change sidebar width (line 540)**

Replace `lg:w-1/2` with `lg:w-[70%]`:
```tsx
// OLD: lg:relative lg:z-auto lg:w-1/2 flex flex-col
// NEW: lg:relative lg:z-auto lg:w-[70%] flex flex-col
```

**Step 2: Constrain video area width**

The video area is `flex-1`. With sidebar at 70%, video gets 30% automatically. No change needed if using flex layout. But if the sidebar is position:fixed on desktop, we need to add `lg:w-[30%]` to the video container and `lg:pr-[70%]` or switch to a proper flex row.

Check the layout structure — if the desktop layout uses `flex flex-row`:
- Video div: add `lg:w-[30%]`
- Sidebar div: change to `lg:w-[70%]`

**Step 3: Mobile layout — stack vertically**

For mobile, change the sidebar from fixed overlay to stacked below video:
```tsx
// Mobile: remove fixed positioning, use flex-col
// Video: max-h-[40vh] on mobile
// Sidebar: flex-1 (takes remaining space)
```

On mobile (<lg), the container should be `flex flex-col`. Video gets `max-h-[40vh]`. Sidebar is always visible below (no overlay toggle needed).

**Step 4: Commit**

```bash
git add src/app/consulta/[id]/page.tsx
git commit -m "feat: consultation room 30/70 layout with responsive stacking"
```

---

## Task 14: Consultation Room — Conditional Receituario

**Files:**
- Modify: `src/app/consulta/[id]/ConsultaProfissional.tsx:49-52` (tabs definition)
- Modify: `src/app/consulta/[id]/ConsultaProfissional.tsx:374-460` (receituario content)
- Modify: `src/app/consulta/[id]/ConsultaProfissional.tsx:441-454` (Bird ID button)
- Modify: `src/app/consulta/[id]/page.tsx` (pass profissional data to component)

**Step 1: Pass profissional and especialidade data to ConsultaProfissional**

The parent page.tsx must pass `profissional` (with `tipoRegistro`, `birdIdHabilitado`) and `especialidade` (with `memedHabilitado`, `birdIdHabilitado`) as props. The agendamento fetch should include these via the API.

**Step 2: Import and use permissions**

In ConsultaProfissional.tsx:
```typescript
import { podePrescrever, podeAssinarBirdId } from "@/lib/permissions"
```

**Step 3: Conditionally show Receituario tab**

Change tabs array to be dynamic:
```typescript
const tabs = [
  { id: "prontuario" as const, label: "Prontuario", icon: ClipboardList },
  ...(canPrescribe ? [{ id: "receituario" as const, label: "Receituario", icon: FileText }] : []),
]
```

Where `canPrescribe = podePrescrever(profissional, especialidade)`.

**Step 4: Conditionally show Bird ID sign button (lines 441-454)**

Wrap the Bird ID button with:
```tsx
{canSignBirdId && r.assinaturaStatus === "PENDENTE" && (
  // ... existing Bird ID button ...
)}
```

Where `canSignBirdId = podeAssinarBirdId(profissional, especialidade)`.

**Step 5: Add info message for professionals without prescription access**

If `!canPrescribe`, and the tab is somehow visible or the user navigates there, show:
```tsx
<div className="p-6 text-center text-slate-500">
  <p>Prescricao digital indisponivel para sua categoria profissional.</p>
</div>
```

**Step 6: Commit**

```bash
git add src/app/consulta/[id]/ConsultaProfissional.tsx src/app/consulta/[id]/page.tsx
git commit -m "feat: conditional receituario tab based on professional permissions"
```

---

## Task 15: MemedPrescription — Permission Check

**Files:**
- Modify: `src/components/memed/MemedPrescription.tsx` (lines 1-77)

**Step 1: Add permission props**

```typescript
interface MemedPrescriptionProps {
  doctor: { externalId: string; crm: string; nome: string; uf?: string }
  onPrescriptionSaved?: (prescription: any) => void
  // NEW:
  integrationEnabled: boolean  // from podePrescrever()
}
```

**Step 2: Check integrationEnabled in useEffect**

Before loading the SDK, check:
```typescript
if (!integrationEnabled) {
  setStatus("unavailable")
  return
}
```

**Step 3: Update unavailable message**

When `status === "unavailable"` and `!integrationEnabled`:
```tsx
<p>Prescricao digital indisponivel — integre pelo painel de administracao.</p>
```

**Step 4: Commit**

```bash
git add src/components/memed/
git commit -m "feat: add permission check to MemedPrescription component"
```

---

## Task 16: Paciente UI — Time-Gated Button

**Files:**
- Modify: `src/app/(dashboard)/paciente/agendamentos/page.tsx:276-282` (button)
- Modify: `src/app/(dashboard)/paciente/consultas/page.tsx:57` (button)

**Step 1: Import time util in agendamentos/page.tsx**

```typescript
import { dentroDoHorario, formatarHorarioConsulta } from "@/lib/consultation-time"
```

**Step 2: Replace button logic (lines 276-282)**

```tsx
{agendamento.status === "CONFIRMADO" && (() => {
  const horario = dentroDoHorario(new Date(agendamento.dataHora))
  if (horario === "dentro") {
    return (
      <a
        href={`/consulta/${agendamento.id}`}
        className="rounded-xl bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
      >
        Entrar na Consulta
      </a>
    )
  }
  if (horario === "antes") {
    return (
      <span className="text-sm text-slate-500">
        Consulta em {formatarHorarioConsulta(new Date(agendamento.dataHora))}
      </span>
    )
  }
  return <span className="text-sm text-red-500">Horario expirado</span>
})()}
```

**Step 3: Apply same logic in consultas/page.tsx (line 57)**

Import the same util and wrap the "Entrar" button with the time check.

**Step 4: Commit**

```bash
git add src/app/(dashboard)/paciente/agendamentos/ src/app/(dashboard)/paciente/consultas/
git commit -m "feat: time-gate Entrar na Consulta button (15min before to 30min after)"
```

---

## Task 17: Build Verification

**Step 1: Generate Prisma client**

```bash
bunx prisma generate
```

**Step 2: Run build**

```bash
./node_modules/.bin/next build
```

Fix any TypeScript errors. Common issues:
- References to `crm` that weren't updated (search for `.crm` across the codebase)
- Missing props on components

**Step 3: Run lint**

```bash
./node_modules/.bin/next lint
```

Fix any lint errors (warnings OK).

**Step 4: Search for any remaining `crm` references**

Search the entire `src/` directory for remaining references to `.crm` or `crm:` that need updating. Key files to check:
- `src/app/api/bird-id/sign/route.ts` (may reference `profissional.crm`)
- `src/app/api/bird-id/callback/route.ts`
- `src/lib/pdf.ts` (PDF generation may reference CRM)
- Any other API routes

**Step 5: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve remaining crm references and build errors"
```

---

## Task 18: Final Commit and Verification

**Step 1: Full rebuild**

```bash
bunx prisma generate && ./node_modules/.bin/next build
```

**Step 2: Verify with next lint**

```bash
./node_modules/.bin/next lint
```

**Step 3: Final commit if needed**

Only if there are remaining fixes.

---

## Execution Order Summary

| Task | Layer | What |
|------|-------|------|
| 1 | Schema | Prisma migration (registroProfissional + integration flags) |
| 2 | Util | permissions.ts |
| 3 | Util | consultation-time.ts |
| 4 | API | Admin especialidades PATCH |
| 5 | API | Admin profissionais GET/POST/PATCH |
| 6 | API | Seja-profissional POST |
| 7 | API | User profissional GET |
| 8 | Admin UI | Especialidades page (toggles + badges) |
| 9 | Admin UI | Profissionais page (registro + Bird ID condition) |
| 10 | Prof UI | Dashboard (remove financial) |
| 11 | Prof UI | Perfil (registro label + Bird ID condition) |
| 12 | Prof UI | Cadastro (flexible registration) |
| 13 | Consult | Room layout 30/70 |
| 14 | Consult | Conditional receituario tab |
| 15 | Consult | MemedPrescription permission check |
| 16 | Patient | Time-gated button |
| 17 | Build | Build verification + remaining crm refs |
| 18 | Build | Final verification |
