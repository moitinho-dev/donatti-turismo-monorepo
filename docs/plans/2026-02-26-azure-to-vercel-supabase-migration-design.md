# Azure → Vercel + Supabase Migration Design

**Date:** 2026-02-26
**Status:** Approved
**Goal:** Migrate from Azure to free/cheaper alternatives while maintaining scalability and speed

---

## Context

CLINIPLUS is hosted on Azure (App Service, PostgreSQL, Blob Storage, ACR). The immediate need is a free hosting environment for ~2 days (demo + development), after which the client will cover production costs. Long-term scale is small (< 100 users).

## Decision: Vercel + Supabase + Supabase Storage

### Service Mapping

| Azure Service | Replacement | Free Tier |
|---|---|---|
| App Service + ACR | **Vercel** | Unlimited deploys, serverless, auto-HTTPS |
| Azure PostgreSQL | **Supabase PostgreSQL** | 500MB DB, 2 projects |
| Azure Blob Storage | **Supabase Storage** | 1GB free |
| Azure SignalR | **Drop** (unused, chat uses polling) | — |
| Azure AD B2C | **Drop** (unused, using local credentials) | — |
| CI/CD (GitHub Actions + ACR) | **Vercel auto-deploy** | Built-in |

### Services Unchanged

- **Twilio Video** — video call tokens
- **Resend** — transactional emails
- **Pagar.me** — payment processing
- **NextAuth v5** — credentials auth

### Cost Comparison

| | Azure (current) | Vercel + Supabase (new) |
|---|---|---|
| Demo (2 days) | ~$5-10 | **$0** |
| Production (small) | ~$80-150/mo | **~$45/mo** |

---

## Migration Details

### 1. Database (Azure PostgreSQL → Supabase)

- Create Supabase project, get `DATABASE_URL`
- Update `.env` with new connection string
- Run `bunx prisma db push` to create tables
- Start fresh (no data migration)
- **Zero code changes** — Prisma connects to standard PostgreSQL

### 2. File Storage (Azure Blob Storage → Supabase Storage)

- Create `avatars` bucket in Supabase Storage
- Rewrite `src/app/api/user/avatar/route.ts` to use Supabase Storage SDK
- Replace `src/lib/azure/blob-storage.ts` with `src/lib/supabase/storage.ts`
- Remove `@azure/storage-blob` dependency
- Add `@supabase/supabase-js` dependency

URL format change:
- Before: `https://cliniplusstorageacct.blob.core.windows.net/avatars/{file}`
- After: `https://{project}.supabase.co/storage/v1/object/public/avatars/{file}`

### 3. App Hosting (Azure App Service + ACR → Vercel)

- Connect GitHub repo to Vercel
- Build command: `bunx prisma generate && bun run build`
- Set all env vars in Vercel dashboard
- Free `project.vercel.app` domain for demo
- Later: point `cliniplus.m2z.com.br` DNS to Vercel

### 4. Cleanup

**Remove files:**
- `Dockerfile`
- `deploy-acr.sh`
- `deploy-azure-direct.sh`
- `deploy-temp/` directory
- `.github/workflows/ci-cd.yml` (or simplify to lint/test only)
- `src/lib/azure/` directory

**Remove dependencies:**
- `@azure/storage-blob`
- `@microsoft/signalr`

**Clean up code:**
- Remove unused SignalR import in `src/hooks/useChat.ts`
- Remove `debian-openssl-3.0.x` binary target from `prisma/schema.prisma`

### 5. Environment Variables (Vercel Dashboard)

```
DATABASE_URL=<supabase postgres url>
NEXT_PUBLIC_SUPABASE_URL=<supabase url>
SUPABASE_SERVICE_ROLE_KEY=<supabase key>
NEXTAUTH_URL=<vercel domain>
NEXTAUTH_SECRET=<keep existing>
RESEND_API_KEY=<keep existing>
TWILIO_ACCOUNT_SID=<keep existing>
TWILIO_AUTH_TOKEN=<keep existing>
TWILIO_API_KEY=<keep existing>
TWILIO_API_SECRET=<keep existing>
```

---

## Architecture After Migration

```
GitHub (push to main)
    ↓
Vercel (auto-build + deploy)
    ↓
├─ Next.js 14 App (Vercel Serverless)
├─ PostgreSQL (Supabase)
├─ File Storage (Supabase Storage)
├─ Auth (NextAuth v5 — local credentials)
├─ Video (Twilio)
├─ Payments (Pagar.me)
├─ Email (Resend)
```

---

## Effort Estimate

| Task | Effort |
|------|--------|
| Supabase DB setup | 10 min |
| Supabase Storage + avatar route rewrite | 30 min |
| Vercel deploy setup | 10 min |
| Cleanup Azure files/deps | 15 min |
| Test everything works | 30 min |
| **Total** | **~1.5 hours** |
