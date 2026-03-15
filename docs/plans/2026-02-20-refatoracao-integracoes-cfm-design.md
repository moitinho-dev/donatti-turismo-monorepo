# Refatoracao: Integracoes por Especialidade, Registro Profissional e UX

**Data:** 2026-02-20
**Status:** Aprovado
**Abordagem:** Incremental por camada (schema -> APIs -> UI)

---

## Decisoes

| Decisao | Escolha |
|---------|---------|
| Storage de integracoes | Campos `memedHabilitado`/`birdIdHabilitado` na tabela Especialidade |
| Registro profissional | Renomear `crm` para `registroProfissional` + novo campo `tipoRegistro` |
| Financeiro do profissional | Remover tudo (card faturamento, status pagamento, valores R$) |
| Horario do botao "Entrar" | 15 min antes ate 30 min depois do horario agendado |

---

## Secao 1: Schema Prisma

### Modelo Especialidade — novos campos

```prisma
model Especialidade {
  // campos existentes mantidos
  memedHabilitado  Boolean @default(false)
  birdIdHabilitado Boolean @default(false)
}
```

### Modelo Profissional — migracao do CRM

```prisma
model Profissional {
  // REMOVE: crm String @unique
  // ADICIONA:
  registroProfissional String  @unique
  tipoRegistro         String  // "CRM", "CRN", "CRP", "CREFITO", "CRO", "COREN"
  // demais campos inalterados
}
```

### Logica de negocio derivada

- `temCRM` = `tipoRegistro === "CRM"`
- `podePrescrever` = `temCRM && especialidade.memedHabilitado`
- `podeAssinar` = `temCRM && especialidade.birdIdHabilitado && profissional.birdIdHabilitado`

Logica centralizada em `src/lib/permissions.ts`.

---

## Secao 2: APIs

### Endpoints modificados

- `PATCH /api/admin/especialidades/[id]` — aceitar `memedHabilitado`, `birdIdHabilitado`
- `POST /api/admin/profissionais` e `PATCH` — substituir `crm` por `registroProfissional` + `tipoRegistro`
- `POST /api/seja-profissional` — schema Zod atualizado com `registroProfissional` + `tipoRegistro`
- `GET /api/user/profissional` — retornar flags da especialidade no include
- `GET /api/admin/profissionais` — incluir `especialidade { memedHabilitado, birdIdHabilitado }`

### Novo util `src/lib/permissions.ts`

```typescript
export function temCRM(profissional: { tipoRegistro: string }): boolean
export function podePrescrever(profissional, especialidade): boolean
export function podeAssinarBirdId(profissional, especialidade): boolean
```

### Endpoints nao alterados

- `/api/agendamentos`, `/api/pagamentos`, `/api/consultas`
- `/api/bird-id/*`, `/api/receituario`

---

## Secao 3: Admin UI

### Especialidades (`admin/especialidades/page.tsx`)

- Modal criar/editar: dois toggles "Prescricao Digital (Memed)" e "Assinatura Digital (Bird ID)"
- Tabela: coluna "Integracoes" com badges indicando quais estao ativas

### Profissionais (`admin/profissionais/page.tsx`)

- Modal: campo "CRM" vira "Registro Profissional" + dropdown "Tipo" (CRM, CRN, CRP...)
- Toggle Bird ID individual: so aparece se especialidade.birdIdHabilitado && tipoRegistro === "CRM"
- Tabela: coluna "CRM" vira "Registro" mostrando tipo + numero

---

## Secao 4: Profissional UI

### Cadastro (`seja-profissional/page.tsx`)

- Dropdown Especialidade determina tipo de registro esperado
- Label e placeholder do campo mudam dinamicamente (CRM, CRN, CRP...)
- Grava como `registroProfissional` + `tipoRegistro`

### Dashboard (`profissional/page.tsx`)

- Remover card "Faturamento"
- Remover status de pagamento nos agendamentos
- Remover qualquer mencao a valores R$
- Resultado: 3 cards (Consultas Hoje, Proxima Semana, Total Agendamentos)

### Perfil (`profissional/perfil/page.tsx`)

- Campo "CRM" vira "Registro Profissional" com label do tipo
- Secao Bird ID: so aparece se `podeAssinarBirdId()` retornar true
- Se tipoRegistro !== "CRM", mostrar info sobre indisponibilidade de integracoes

### Consultas (`profissional/consultas/page.tsx`)

- Remover valores financeiros da listagem

---

## Secao 5: Sala de Atendimento

### Layout 30/70 (`consulta/[id]/page.tsx`)

Desktop (>=1024px):
- Video: `lg:w-[30%]`
- Ferramentas: `lg:w-[70%]`

Mobile (<1024px):
- Empilhamento vertical (flex-col)
- Video: `max-h-[40vh]` no topo
- Ferramentas: abaixo, sempre visivel (sem overlay)

### Tab Receituario — verificacao condicional

- `podePrescrever()` true: editor + botao "Emitir Receituario" + Memed
- `podePrescrever()` false: tab some ou mostra mensagem de indisponibilidade

### MemedPrescription — verificacao no useEffect

1. Verifica `podePrescrever()`
2. Verifica `NEXT_PUBLIC_MEMED_API_KEY`
3. Ambos OK: carrega SDK e mostra botao

### Bird ID no Receituario

Botao "Assinar Bird ID" so aparece se `podeAssinarBirdId()` retornar true.

---

## Secao 6: Paciente UI + Conformidade

### Botao "Entrar na Consulta" — regra de horario

```
status === "CONFIRMADO":
  15 min antes <= agora <= 30 min depois → botao ativo
  agora < 15 min antes → "Consulta em DD/MM as HH:MM"
  agora > 30 min depois → "Horario expirado"
```

Util: `src/lib/consultation-time.ts` com `dentroDoHorario(dataHora): 'antes' | 'dentro' | 'depois'`

### Status badges — padronizacao

| Status | Label | Cor |
|--------|-------|-----|
| PENDENTE | Aguardando Pagamento | Amarelo |
| CONFIRMADO | Confirmado | Verde |
| REALIZADO | Concluido | Azul |
| CANCELADO | Cancelado | Vermelho |

"Em andamento" derivado na UI: `CONFIRMADO && consulta?.inicio && !consulta?.fim`

### Conformidade LGPD/CFM

- Preservar componentes de privacidade e termos existentes
- `podePrescrever()` e `podeAssinarBirdId()` garantem conformidade CFM
- Profissionais sem CRM nunca acessam prescricao/atestado
