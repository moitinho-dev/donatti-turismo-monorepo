// Aplica as migrações do Prisma no build da Vercel.
// - Só no deploy de produção (preview nunca migra o banco de produção)
// - Aceita DATABASE_URL/DIRECT_URL ou POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING
// - Sem URL de banco, pula em vez de quebrar o build
// - Banco criado sem histórico de migrações (P3005): faz o baseline uma vez
import { spawnSync } from "node:child_process"
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const env = { ...process.env }
env.POSTGRES_PRISMA_URL ||= env.DATABASE_URL
env.POSTGRES_URL_NON_POOLING ||= env.DIRECT_URL || env.DATABASE_URL

if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") {
  console.log(`[migrate] VERCEL_ENV=${env.VERCEL_ENV}: migrações só rodam no deploy de produção`)
  process.exit(0)
}
if (!env.POSTGRES_PRISMA_URL) {
  console.log("[migrate] Sem DATABASE_URL/POSTGRES_PRISMA_URL: migrações puladas")
  process.exit(0)
}

const prisma = (args, capture = false) => {
  const result = spawnSync("npx", ["prisma", ...args], {
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
    env,
    encoding: "utf8",
  })
  if (capture) {
    process.stdout.write(result.stdout || "")
    process.stderr.write(result.stderr || "")
  }
  return { status: result.status ?? 1, output: `${result.stdout || ""}${result.stderr || ""}` }
}

const deploy = prisma(["migrate", "deploy"], true)
if (deploy.status === 0) process.exit(0)
if (!/P3005/.test(deploy.output)) process.exit(deploy.status)

// P3005: o banco de produção foi criado com "db push", sem a tabela _prisma_migrations.
// Baseline: sincroniza o banco com o schema atual (sem apagar dados: o db push recusa
// qualquer mudança com perda de dados e o build falha) e marca as migrações como aplicadas.
console.log("[migrate] Banco sem histórico de migrações (P3005): fazendo o baseline")
const push = prisma(["db", "push", "--skip-generate"])
if (push.status !== 0) process.exit(push.status)

const migrationsDir = join(process.cwd(), "prisma", "migrations")
const migrations = readdirSync(migrationsDir)
  .filter((name) => statSync(join(migrationsDir, name)).isDirectory())
  .sort()
for (const name of migrations) {
  const resolved = prisma(["migrate", "resolve", "--applied", name])
  if (resolved.status !== 0) process.exit(resolved.status)
}
console.log(`[migrate] Baseline feito: ${migrations.length} migrações marcadas como aplicadas`)
