// Aplica as migrações do Prisma no build da Vercel.
// - Só no deploy de produção (preview nunca migra o banco de produção)
// - Aceita DATABASE_URL/DIRECT_URL ou POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING
// - Sem URL de banco, pula em vez de quebrar o build
import { spawnSync } from "node:child_process"

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

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env })
process.exit(result.status ?? 1)
