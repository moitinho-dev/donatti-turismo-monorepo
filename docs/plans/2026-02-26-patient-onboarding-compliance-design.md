# Patient Onboarding — CFM/LGPD Compliance Redesign

## Context

The current patient registration (`/cadastro`) collects only name, email, and password. This does not comply with:

- **Resolução CFM 2.314/2022** (Art. 13) — requires patient identification including address/location
- **LGPD (Lei 13.709/2018)** (Art. 11) — health data is sensitive; requires explicit consent for processing
- **Lei 14.510/2022** — telemedicine platforms must collect patient consent for remote care

## Approach

Redesign the `/cadastro` page as a **3-step stepper form**, matching the visual style of the professional onboarding page (`/seja-profissional`).

## Steps

### Step 1 — Dados Pessoais
- Nome completo (required, minLength: 3)
- Email (required, type: email)
- Senha (required, minLength: 6)
- Confirmar senha (must match)

### Step 2 — Identificação
- CPF (required, 11 digits, mask: 000.000.000-00)
- Data de nascimento (required, type: date, must be 18+)
- Telefone (required, mask: (00) 00000-0000)
- Cidade (required, text input)
- UF (required, select with 27 Brazilian states)

### Step 3 — Termos e Consentimento
- Checkbox 1: "Li e aceito os Termos de Uso e a Política de Privacidade" (links to /termos and /privacidade)
- Checkbox 2: "Autorizo o atendimento por telemedicina e o tratamento dos meus dados pessoais de saúde conforme a LGPD (Lei 13.709/2018)"
- Both required before submit

## Visual Design

- Progress bar with 3 numbered circles connected by line
- Active circle: `bg-brand-600 text-white`, completed: `bg-green-500`, pending: `bg-slate-200`
- Card: `rounded-2xl border border-slate-100 bg-white p-8 shadow-sm`
- Inputs: `rounded-xl border-slate-200 bg-slate-50 px-4 py-3`
- Footer: "Voltar" / "Próximo" buttons, final step shows "Criar conta"
- Success screen: CheckCircle icon, "Conta criada com sucesso!", auto-login, redirect to /paciente

## Post-Registration

- Auto-login via signIn("credentials")
- Immediate access to patient dashboard (no admin approval)
- All compliance data collected at registration time

## Schema Changes

Add `cidade` and `uf` fields to Paciente model:

```prisma
model Paciente {
  // ... existing fields
  cidade  String?
  uf      String?
}
```

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add cidade, uf to Paciente |
| `src/app/(auth)/cadastro/page.tsx` | Rewrite | 3-step stepper form |
| `src/app/api/auth/register/route.ts` | Modify | Accept new fields, save to Paciente |
| `src/app/(auth)/layout.tsx` | Modify | Adjust max-w for stepper width |

## Legal References

- Resolução CFM 2.314/2022, Art. 13, Art. 15
- LGPD Lei 13.709/2018, Art. 5 II, Art. 11
- Lei 14.510/2022
