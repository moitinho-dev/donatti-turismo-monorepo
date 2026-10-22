// Cria (ou redefine a senha de) um usuário admin, já com a senha em hash.
// Uso: node scripts/create-admin.mjs email@dominio.com "Nome" "senha-forte"
// Precisa de POSTGRES_PRISMA_URL no ambiente.
import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"

const [email, name, password] = process.argv.slice(2)
if (!email || !name || !password || password.length < 8) {
  console.error('Uso: node scripts/create-admin.mjs email "Nome" "senha com 8+ caracteres"')
  process.exit(1)
}

const prisma = new PrismaClient()
const hash = await bcrypt.hash(password, 12)
const user = await prisma.user.upsert({
  where: { email },
  update: { name, password: hash, role: "admin" },
  create: { email, name, password: hash, role: "admin" },
})
console.log(`Admin pronto: ${user.email}`)
await prisma.$disconnect()
