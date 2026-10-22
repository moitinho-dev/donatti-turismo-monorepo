import bcrypt from "bcrypt"
import { timingSafeEqual } from "crypto"

const ROUNDS = 12

export const isPasswordHash = (value: string | null | undefined) => !!value && /^\$2[aby]\$\d{2}\$/.test(value)

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS)

/**
 * Confere a senha. Aceita hash bcrypt e, para contas antigas, a senha salva em texto puro;
 * nesse caso `needsRehash` avisa que o login deve regravar a senha já com hash.
 */
export async function verifyPassword(plain: string, stored: string | null | undefined) {
  if (!stored) return { valid: false, needsRehash: false }
  if (isPasswordHash(stored)) return { valid: await bcrypt.compare(plain, stored), needsRehash: false }

  const a = Buffer.from(plain)
  const b = Buffer.from(stored)
  const valid = a.length === b.length && timingSafeEqual(a, b)
  return { valid, needsRehash: valid }
}
