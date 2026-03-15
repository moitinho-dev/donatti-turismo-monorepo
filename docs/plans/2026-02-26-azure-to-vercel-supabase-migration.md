# Azure → Vercel + Supabase Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate CLINIPLUS from Azure (App Service, PostgreSQL, Blob Storage) to Vercel + Supabase for free/cheaper hosting.

**Architecture:** Replace Azure PostgreSQL with Supabase PostgreSQL (same Prisma connection), Azure Blob Storage with Supabase Storage (rewrite avatar API route), and Azure App Service with Vercel (auto-deploys from GitHub). Drop unused Azure SignalR and AD B2C.

**Tech Stack:** Next.js 14, Prisma, Supabase (PostgreSQL + Storage), Vercel, @supabase/supabase-js

---

### Task 1: Install Supabase SDK and remove Azure dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install @supabase/supabase-js**

Run: `bun add @supabase/supabase-js`

**Step 2: Remove Azure dependencies**

Run: `bun remove @azure/storage-blob @microsoft/signalr`

**Step 3: Verify install succeeded**

Run: `bun install`
Expected: No errors

**Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: replace Azure SDKs with Supabase JS client"
```

---

### Task 2: Create Supabase client helper

**Files:**
- Create: `src/lib/supabase/client.ts`

**Step 1: Create the Supabase server client**

```typescript
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

**Step 2: Verify the file compiles**

Run: `./node_modules/.bin/tsc --noEmit src/lib/supabase/client.ts 2>&1 || echo "TypeScript check done"`

Note: May show errors about missing env vars at type level — that's fine since they're runtime values.

**Step 3: Commit**

```bash
git add src/lib/supabase/client.ts
git commit -m "feat: add Supabase client helper"
```

---

### Task 3: Rewrite avatar upload route (Azure Blob → Supabase Storage)

**Files:**
- Modify: `src/app/api/user/avatar/route.ts`

**Step 1: Rewrite the POST handler**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAuth, handleAuthError } from "@/lib/auth/guards"
import { supabase } from "@/lib/supabase/client"

/**
 * POST /api/user/avatar
 * Upload de foto de perfil para Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não fornecido" },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP" },
        { status: 400 }
      )
    }

    // Validar tamanho (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5MB" },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const ext = file.name.split(".").pop()
    const fileName = `${session.user.id}-${Date.now()}.${ext}`

    // Upload para Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Erro no upload:", uploadError)
      return NextResponse.json(
        { error: "Erro ao fazer upload do arquivo" },
        { status: 500 }
      )
    }

    // URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    const avatarUrl = urlData.publicUrl

    // Atualizar URL do avatar no banco
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    })

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error("Erro no upload de avatar:", error)
    return handleAuthError(error)
  }
}

/**
 * DELETE /api/user/avatar
 * Remover foto de perfil
 */
export async function DELETE() {
  try {
    const session = await requireAuth()

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })

    if (!usuario?.avatarUrl) {
      return NextResponse.json(
        { error: "Usuário não possui avatar" },
        { status: 404 }
      )
    }

    // Extrair nome do arquivo da URL do Supabase
    try {
      const url = new URL(usuario.avatarUrl)
      const pathParts = url.pathname.split("/")
      // URL format: /storage/v1/object/public/avatars/{fileName}
      const fileName = pathParts[pathParts.length - 1]

      if (fileName) {
        await supabase.storage.from("avatars").remove([fileName])
      }
    } catch (error) {
      console.error("Erro ao deletar arquivo:", error)
    }

    // Remover URL do banco
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
```

**Step 2: Verify file has no syntax errors**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -20 || echo "Check done"`

**Step 3: Commit**

```bash
git add src/app/api/user/avatar/route.ts
git commit -m "feat: migrate avatar upload from Azure Blob to Supabase Storage"
```

---

### Task 4: Remove SignalR import from useChat hook

**Files:**
- Modify: `src/hooks/useChat.ts`

**Step 1: Remove the signalR import**

On line 4, remove:
```typescript
import * as signalR from "@microsoft/signalr"
```

And on line 32, change the type of `connectionRef` from:
```typescript
const connectionRef = useRef<signalR.HubConnection | null>(null)
```
to:
```typescript
const connectionRef = useRef<ReturnType<typeof setInterval> | null>(null)
```

Also fix line 85 — remove the `as any` cast:
```typescript
connectionRef.current = intervalId
```

And fix line 155 — remove the `as any` cast:
```typescript
clearInterval(connectionRef.current)
```

**Step 2: Verify the hook still compiles**

Run: `./node_modules/.bin/tsc --noEmit 2>&1 | head -20 || echo "Check done"`

**Step 3: Commit**

```bash
git add src/hooks/useChat.ts
git commit -m "refactor: remove unused SignalR import from useChat hook"
```

---

### Task 5: Remove Azure lib directory

**Files:**
- Delete: `src/lib/azure/blob-storage.ts`
- Delete: `src/lib/azure/signalr.ts`
- Delete: `src/lib/azure/` (directory)

**Step 1: Verify no other files import from azure lib**

Run: `grep -r "from.*@/lib/azure" src/ --include="*.ts" --include="*.tsx" || echo "No imports found"`

Expected: No imports found (avatar route was already updated in Task 3)

**Step 2: Delete the directory**

Run: `rm -rf src/lib/azure`

**Step 3: Commit**

```bash
git add -A src/lib/azure/
git commit -m "chore: remove Azure lib directory (blob-storage, signalr)"
```

---

### Task 6: Remove Prisma Azure binary target

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Remove debian-openssl binary target**

Change line 3 from:
```prisma
binaryTargets = ["native", "debian-openssl-3.0.x"]
```
to:
```prisma
binaryTargets = ["native"]
```

Note: `debian-openssl-3.0.x` was for Azure App Service Linux containers. Vercel uses its own runtime and doesn't need it.

**Step 2: Regenerate Prisma client**

Run: `bunx prisma generate`
Expected: Success

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "chore: remove Azure-specific Prisma binary target"
```

---

### Task 7: Remove next.config.js standalone output

**Files:**
- Modify: `next.config.js`

**Step 1: Remove `output: "standalone"` from next.config.js**

The `output: "standalone"` was for Docker deployments. Vercel doesn't need it and it can interfere with Vercel's optimized build. Remove line 13:

```javascript
output: "standalone",
```

**Step 2: Verify config is valid**

Run: `node -e "require('./next.config.js')" && echo "Config OK"`
Expected: Config OK

**Step 3: Commit**

```bash
git add next.config.js
git commit -m "chore: remove standalone output (not needed for Vercel)"
```

---

### Task 8: Delete Azure deployment files

**Files:**
- Delete: `Dockerfile`
- Delete: `deploy-acr.sh`
- Delete: `deploy-azure-direct.sh`
- Delete: `deploy-azure-fixed.sh`
- Delete: `deploy-azure-prisma-fix.sh`
- Delete: `deploy-azure-final.sh`
- Delete: `deploy-temp/` (entire directory)

**Step 1: Delete all Azure deploy files**

```bash
rm -f Dockerfile deploy-acr.sh deploy-azure-direct.sh deploy-azure-fixed.sh deploy-azure-prisma-fix.sh deploy-azure-final.sh
rm -rf deploy-temp/
```

**Step 2: Verify they're gone**

Run: `ls deploy-* Dockerfile 2>&1`
Expected: No such file or directory

**Step 3: Commit**

```bash
git add -A Dockerfile deploy-acr.sh deploy-azure-direct.sh deploy-azure-fixed.sh deploy-azure-prisma-fix.sh deploy-azure-final.sh deploy-temp/
git commit -m "chore: remove Azure deployment files (Dockerfile, deploy scripts)"
```

---

### Task 9: Replace CI/CD workflow for Vercel

**Files:**
- Modify: `.github/workflows/ci-cd.yml`

**Step 1: Replace the Azure CI/CD with a lint-only workflow**

Vercel handles builds and deploys automatically. Keep GitHub Actions only for lint and security checks on PRs.

Replace `.github/workflows/ci-cd.yml` entirely with:

```yaml
name: CI - Lint & Security

on:
  pull_request:
    branches:
      - main

permissions:
  contents: read

env:
  NODE_VERSION: '20.x'

jobs:
  lint:
    name: Code Quality Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Generate Prisma Client
        run: bunx prisma generate

      - name: Run ESLint
        run: bun run lint

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Check for hardcoded secrets
        run: |
          echo "Checking for potential secrets in code..."
          ! grep -r -i "api[_-]key\s*=\s*['\"][^'\"]*['\"]" --exclude-dir=node_modules --exclude-dir=.git . || {
            echo "Potential hardcoded API keys found"
            exit 1
          }
          echo "No hardcoded secrets detected"
```

**Step 2: Commit**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "chore: simplify CI/CD to lint-only (Vercel handles deploys)"
```

---

### Task 10: Update .env.example for Supabase

**Files:**
- Modify: `.env.example`

**Step 1: Replace Azure env vars with Supabase ones**

Replace the entire file with:

```env
# Supabase (PostgreSQL + Storage)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# Twilio Video
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_API_KEY_SID=your_twilio_api_key_sid
TWILIO_API_KEY_SECRET=your_twilio_api_key_secret

# Pagar.me
PAGARME_API_KEY=ak_test_xxxxxxxxxxxxxxxx
PAGARME_ENCRYPTION_KEY=ek_test_xxxxxxxxxxxxxxxx
PAGARME_WEBHOOK_SECRET=whsec_xxxxxxxx

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=CLINIPLUS <noreply@cliniplus.com.br>

# Bird ID (Soluti) - Assinatura Digital
BIRD_ID_CLIENT_ID=
BIRD_ID_CLIENT_SECRET=
BIRD_ID_REDIRECT_URI=http://localhost:3000/api/bird-id/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update .env.example for Supabase (replacing Azure vars)"
```

---

### Task 11: Build verification

**Step 1: Generate Prisma client**

Run: `bunx prisma generate`
Expected: Success

**Step 2: Run lint**

Run: `./node_modules/.bin/next lint`
Expected: No errors (warnings OK)

**Step 3: Run build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds

Note: Build may show warnings about missing env vars (NEXT_PUBLIC_SUPABASE_URL, etc.) — that's expected since we haven't set up Supabase yet. The build should still complete.

**Step 4: Commit any fixes if needed**

---

### Task 12: Supabase project setup (manual steps)

These are manual steps the developer must do in the Supabase dashboard:

**Step 1: Create Supabase project**
- Go to https://supabase.com/dashboard
- Click "New Project"
- Name: `cliniplus`
- Region: Choose closest to your users (e.g., South America East)
- Generate a strong database password
- Click "Create new project"

**Step 2: Get connection details**
- Go to Project Settings → Database
- Copy the connection string (URI format)
- Replace `[YOUR-PASSWORD]` with your database password
- This is your `DATABASE_URL`

**Step 3: Get API keys**
- Go to Project Settings → API
- Copy the `URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
- Copy the `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY`

**Step 4: Create avatars storage bucket**
- Go to Storage in the sidebar
- Click "New bucket"
- Name: `avatars`
- Toggle "Public bucket" ON
- Click "Create bucket"

**Step 5: Push database schema**

Run: `bunx prisma db push`
Expected: All tables created successfully

**Step 6: Update local .env**

Set the three new env vars:
```
DATABASE_URL=<from step 2>
NEXT_PUBLIC_SUPABASE_URL=<from step 3>
SUPABASE_SERVICE_ROLE_KEY=<from step 3>
```

Remove old Azure vars:
```
# Delete these:
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=...
AZURE_SIGNALR_CONNECTION_STRING=...
```

---

### Task 13: Vercel deployment setup (manual steps)

**Step 1: Connect to Vercel**
- Go to https://vercel.com/new
- Import your GitHub repository
- Framework: Next.js (auto-detected)
- Build command: `bunx prisma generate && bun run build`
- Output directory: leave default

**Step 2: Set environment variables**

In Vercel dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=<supabase connection string>
NEXT_PUBLIC_SUPABASE_URL=<supabase url>
SUPABASE_SERVICE_ROLE_KEY=<supabase service key>
NEXTAUTH_URL=<your vercel domain, e.g. https://cliniplus.vercel.app>
NEXTAUTH_SECRET=<keep existing value>
RESEND_API_KEY=<keep existing>
TWILIO_ACCOUNT_SID=<keep existing>
TWILIO_API_KEY_SID=<keep existing>
TWILIO_API_KEY_SECRET=<keep existing>
PAGARME_API_KEY=<keep existing>
PAGARME_ENCRYPTION_KEY=<keep existing>
PAGARME_WEBHOOK_SECRET=<keep existing>
EMAIL_FROM=<keep existing>
NEXT_PUBLIC_APP_URL=<your vercel domain>
```

**Step 3: Deploy**
- Click "Deploy"
- Vercel will build and deploy automatically
- You'll get a URL like `cliniplus-xxx.vercel.app`

**Step 4: Verify**
- Open the deployed URL
- Check homepage loads
- Check login page loads
- Test avatar upload if possible

---

### Task 14: Final cleanup commit

**Step 1: Verify everything is clean**

Run: `git status`
Expected: Clean working tree (or only .env changes which should be gitignored)

**Step 2: Tag the migration**

```bash
git tag -a v1.0-vercel-migration -m "Migration from Azure to Vercel + Supabase"
```
