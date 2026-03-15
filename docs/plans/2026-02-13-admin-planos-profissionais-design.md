# Design: Gestao de Planos + Cadastro de Profissionais pelo Admin

**Data:** 2026-02-13
**Status:** Aprovado

## Contexto

O admin precisa de CRUD completo de planos (criar, editar, remover) e poder cadastrar medicos do zero (criar conta + dados profissionais). Atualmente os planos sao hardcoded no frontend e profissionais so se cadastram via formulario publico.

## 1. Modelo Plano (Prisma - novo)

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
}
```

Sem relacao com Usuario por enquanto (assinatura e fase 2).

## 2. API CRUD Planos

- `GET /api/admin/planos` - listar todos (admin)
- `POST /api/admin/planos` - criar plano
- `PATCH /api/admin/planos/[id]` - editar plano
- `DELETE /api/admin/planos/[id]` - excluir plano
- `GET /api/planos` - listar planos ativos (publico, para pagina /planos)

## 3. Pagina Admin Planos

Rota: `src/app/(dashboard)/admin/planos/page.tsx`

- Tabela: nome, preco, intervalo, ativo, destaque, ordem
- Botao "Novo Plano" abre modal com formulario
- Editar via modal: nome, preco, recursos (lista dinamica), ativo, destaque, ordem
- Excluir com confirmacao
- Link no sidebar do admin

## 4. Pagina Publica /planos (refatorar)

Passa a buscar dados do banco via `GET /api/planos` ao inves de hardcoded.

## 5. Admin Cadastro Completo de Profissional

Botao "Novo Profissional" na pagina existente `admin/profissionais`.

Formulario:
- Dados Usuario: nome, email, senha, telefone, CPF
- Dados Profissionais: CRM, especialidade, valor consulta, biografia
- Cria Usuario (tipo=PROFISSIONAL) + Profissional (ativo=true) em transacao Prisma

API: `POST /api/admin/profissionais` (novo - cria user + profissional)

## 6. Edicao Expandida de Profissional

A pagina `admin/profissionais` ganha edicao de: CRM, biografia, telefone (alem de valor e especialidade que ja existem).

## Arquivos Envolvidos

| Entrega | Arquivo |
|---------|---------|
| Modelo Plano | `prisma/schema.prisma` |
| API CRUD planos (admin) | `src/app/api/admin/planos/route.ts` |
| API plano individual | `src/app/api/admin/planos/[id]/route.ts` |
| API planos publico | `src/app/api/planos/route.ts` |
| Pagina admin planos | `src/app/(dashboard)/admin/planos/page.tsx` |
| Pagina publica planos | `src/app/(site)/planos/page.tsx` (refatorar) |
| API criar profissional | `src/app/api/admin/profissionais/route.ts` (adicionar POST) |
| Pagina admin profissionais | `src/app/(dashboard)/admin/profissionais/page.tsx` (modal criar + edicao expandida) |
| Sidebar admin | `src/components/dashboard/DashboardSidebar.tsx` (link planos) |
