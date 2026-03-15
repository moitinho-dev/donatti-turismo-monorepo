# Design: Admin Panel Actions

**Date**: 2026-02-27
**Status**: Approved

## Overview

Comprehensive admin panel for CLINIPLUS with 6 features: impersonation, feature flags, maintenance mode, page disabling, audit logging, and mass notifications. All managed from `/admin/configuracoes`, `/admin/auditoria`, and `/admin/notificacoes`.

## 1. Database Schema

### Approach: Separate tables per feature (Option B)

Each feature gets its own Prisma model with proper typing and relations.

```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  nome        String   @unique   // "chat", "video", "pagamentos", "2fa"
  ativo       Boolean  @default(true)
  descricao   String?
  atualizadoPor String?
  atualizadoEm DateTime @updatedAt
  criadoEm    DateTime @default(now())
}

model ModoManutencao {
  id              String   @id @default(cuid())
  ativo           Boolean  @default(false)
  tipoBloqueio    String   // "total", "somente_leitura", "agendamento_bloqueado"
  rolesAfetadas   String[] // ["PACIENTE", "PROFISSIONAL"] — admin always exempt
  mensagem        String?
  previsaoRetorno DateTime?
  ativadoPor      String?
  ativadoEm       DateTime @default(now())
  desativadoEm    DateTime?
}

model PaginaDesativada {
  id              String   @id @default(cuid())
  rota            String   @unique  // e.g. "/checkout", "/consulta"
  motivo          String?
  rolesAfetadas   String[] // empty = all roles affected
  desativadaPor   String?
  desativadaEm    DateTime @default(now())
  reativadaEm     DateTime?
}

model AuditoriaAdmin {
  id         String   @id @default(cuid())
  adminId    String
  admin      Usuario  @relation(fields: [adminId], references: [id])
  acao       String   // "impersonar", "feature_flag", "manutencao", etc.
  detalhes   Json     // flexible payload per action type
  ipAddress  String?
  criadoEm   DateTime @default(now())
}

model NotificacaoMassa {
  id           String   @id @default(cuid())
  titulo       String
  mensagem     String
  canal        String   // "email", "sms", "ambos"
  rolesFiltro  String[] // ["PACIENTE"], ["PROFISSIONAL"], or both
  totalEnviado Int      @default(0)
  status       String   @default("pendente") // "pendente", "enviando", "concluido", "erro"
  enviadoPor   String?
  enviadoEm    DateTime?
  criadoEm     DateTime @default(now())
}
```

### JWT Impersonation Fields

No new table needed. Impersonation works via JWT token manipulation:

```typescript
// In next-auth callbacks:
token.impersonatedBy    // admin's userId (set when impersonating)
token.originalAdminId   // preserved admin ID for "exit impersonation"
```

When admin impersonates, the session looks like the target user but carries `impersonatedBy` for audit trail. Admin can exit impersonation at any time via a persistent banner.

## 2. API Routes

12 new endpoints under `/api/admin/`:

### Feature Flags
- `GET  /api/admin/feature-flags` — list all flags
- `PATCH /api/admin/feature-flags/[id]` — toggle flag on/off

### Maintenance Mode
- `GET  /api/admin/manutencao` — current maintenance state
- `POST /api/admin/manutencao` — activate (tipoBloqueio, rolesAfetadas, mensagem, previsaoRetorno)
- `DELETE /api/admin/manutencao` — deactivate

### Disabled Pages
- `GET  /api/admin/paginas-desativadas` — list disabled pages
- `POST /api/admin/paginas-desativadas` — disable a route
- `DELETE /api/admin/paginas-desativadas/[id]` — re-enable a route

### Impersonation
- `POST /api/admin/impersonar` — start impersonating (target userId)
- `DELETE /api/admin/impersonar` — stop impersonating

### Audit Log
- `GET /api/admin/auditoria` — paginated log with filters (acao, adminId, date range)

### Mass Notifications
- `POST /api/admin/notificacoes` — send notification (titulo, mensagem, canal, rolesFiltro)

All endpoints check `token.tipo === "ADMIN"` (or `token.originalAdminId` for impersonation). Every mutation writes to `AuditoriaAdmin`.

## 3. Middleware Integration

The middleware (`src/middleware.ts`) checks admin configs on every request. To avoid hitting the database on every request, use an in-memory cache with 30-second revalidation:

```typescript
// Cache structure (module-level in middleware helper)
let configCache = { featureFlags: [], manutencao: null, paginasDesativadas: [], lastFetch: 0 }
const CACHE_TTL = 30_000 // 30 seconds

// Middleware check order:
// 1. Is maintenance mode active? → check if user's role is in rolesAfetadas
//    - If yes: redirect to /manutencao (static page with message)
//    - Admin is ALWAYS exempt
// 2. Is this page disabled? → check if pathname matches any PaginaDesativada.rota
//    - If yes and user's role is in rolesAfetadas: redirect to /pagina-indisponivel
// 3. Feature flag checks → for specific route prefixes:
//    - /consulta/* checks "video" flag
//    - /checkout/* checks "pagamentos" flag
//    - Chat API routes check "chat" flag
```

**Important**: Since middleware runs in Edge Runtime, the cache fetch must use a lightweight API endpoint (`/api/admin/config-cache`) that returns all active configs in one call. The middleware fetches this endpoint every 30 seconds and caches the result in module-level variables.

## 4. Pages & UI

### Expand `/admin/configuracoes`

Currently the settings page. Add three new tab sections:

- **Feature Flags**: Toggle switches for each feature (Chat, Video, Pagamentos, 2FA) with descriptions and last-updated info
- **Maintenance Mode**: Activate/deactivate with form for tipoBloqueio (dropdown), rolesAfetadas (checkboxes), mensagem (textarea), previsaoRetorno (datetime picker)
- **Disabled Pages**: Table of routes with add/remove functionality. Each row shows route, motivo, rolesAfetadas, and desativadaEm

### New `/admin/auditoria`

Dedicated audit log page with:
- Table: timestamp, admin name, action type, details (expandable JSON), IP
- Filters: action type dropdown, admin selector, date range picker
- Pagination (20 per page)

### New `/admin/notificacoes`

Mass notification sender:
- Form: titulo, mensagem (textarea), canal (email/SMS/both radio), rolesFiltro (checkboxes)
- History table below showing past notifications with status

### Impersonation UI

- **Banner**: Fixed top banner (red/orange) visible on ALL pages when impersonation is active. Shows "Viewing as [user name] — Exit" button. Uses `session.impersonatedBy` to detect.
- **Button**: "Impersonar" button appears in the admin user list (`/admin/usuarios`) next to each user row. Only visible to ADMIN users.

### Static Pages

- `/manutencao` — maintenance mode landing page (reads message from query or API)
- `/pagina-indisponivel` — disabled page landing page

## 5. Security Considerations

- All admin endpoints validate `tipo === "ADMIN"` via JWT token
- Impersonation preserves `originalAdminId` for audit trail — admin can't "lose" their identity
- Every state mutation logs to `AuditoriaAdmin` automatically
- Maintenance mode and page disabling NEVER affect ADMIN users
- Mass notifications are rate-limited (one send per minute per admin)
- Feature flag changes take effect within 30 seconds (cache TTL)
