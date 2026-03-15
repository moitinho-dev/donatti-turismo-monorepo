# Password Recovery via SMS + Password Strength Rules — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace email-based password recovery with SMS phone verification via Twilio Verify, and enforce strong password requirements (8+ chars, uppercase, number, special char) on registration and recovery.

**Architecture:** Shared password validator (`src/lib/validators/password.ts`) consumed by a reusable UI component and server-side API routes. Recovery flow is a single-page 3-step form (phone → SMS code → new password). Existing Twilio Verify integration (`src/lib/twilio/verify.ts`) is reused as-is.

**Tech Stack:** Next.js 14 App Router, TypeScript, Zod, Twilio Verify, bcryptjs, Tailwind CSS, Lucide icons

---

## Task 1: Create shared password validator

**Files:**
- Create: `src/lib/validators/password.ts`

**Step 1: Create the validator module**

```typescript
// src/lib/validators/password.ts
import { z } from "zod"

export const PASSWORD_RULES = [
  {
    key: "minLength",
    label: "Mínimo de 8 caracteres",
    test: (pw: string) => pw.length >= 8,
  },
  {
    key: "uppercase",
    label: "Pelo menos uma letra maiúscula",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    key: "number",
    label: "Pelo menos um número",
    test: (pw: string) => /[0-9]/.test(pw),
  },
  {
    key: "special",
    label: "Pelo menos um caractere especial (!@#$%...)",
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
] as const

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      errors.push(rule.label)
    }
  }
  return { valid: errors.length === 0, errors }
}

export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial")
```

**Step 2: Verify file was created correctly**

Run: `cat "src/lib/validators/password.ts" | head -5`
Expected: Shows the import and PASSWORD_RULES start

**Step 3: Commit**

```bash
git add src/lib/validators/password.ts
git commit -m "feat: add shared password validation rules and Zod schema"
```

---

## Task 2: Create PasswordStrengthIndicator component

**Files:**
- Create: `src/components/ui/PasswordStrengthIndicator.tsx`

**Step 1: Create the component**

```tsx
// src/components/ui/PasswordStrengthIndicator.tsx
"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { PASSWORD_RULES } from "@/lib/validators/password"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  return (
    <ul className="mt-2 space-y-1.5" role="list" aria-label="Requisitos da senha">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password)
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              passed ? "text-green-600" : "text-slate-400"
            }`}
          >
            {passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/PasswordStrengthIndicator.tsx
git commit -m "feat: add PasswordStrengthIndicator component with live checklist"
```

---

## Task 3: Update registration page with password strength

**Files:**
- Modify: `src/app/(auth)/cadastro/page.tsx`

**Step 1: Add imports**

At the top of the file, add these imports (after existing imports around line 17):

```typescript
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator"
import { validatePassword } from "@/lib/validators/password"
```

**Step 2: Update password validation in `validateStep()`**

Replace lines 69-72 (the `senha.length < 6` check in step 0 validation):

```typescript
// OLD:
if (formData.senha.length < 6) {
  setError("A senha deve ter pelo menos 6 caracteres")
  return false
}

// NEW:
const { valid, errors } = validatePassword(formData.senha)
if (!valid) {
  setError(errors[0])
  return false
}
```

**Step 3: Add PasswordStrengthIndicator below the password field**

After the password `<input>` closing tag (around line 417 inside the senha `<div>`), add:

```tsx
<PasswordStrengthIndicator password={formData.senha} />
```

The structure should be:
```tsx
<div>
  <label htmlFor="senha" ...>Senha</label>
  <input
    type="password"
    id="senha"
    ...
    placeholder="Mínimo 8 caracteres"
    minLength={8}
    ...
  />
  <PasswordStrengthIndicator password={formData.senha} />
</div>
```

**Step 4: Update placeholder and minLength**

Change the password input's `placeholder` from `"Mínimo 6 caracteres"` to `"Mínimo 8 caracteres"` and `minLength` from `6` to `8`. Also update the confirm password `minLength` from `6` to `8`.

**Step 5: Commit**

```bash
git add src/app/(auth)/cadastro/page.tsx
git commit -m "feat: add password strength indicator and enforce strong passwords on registration"
```

---

## Task 4: Update registration API with strong password validation

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

**Step 1: Replace password schema**

Add import at the top:

```typescript
import { passwordSchema } from "@/lib/validators/password"
```

In `registerSchema` (around line 12), replace:

```typescript
// OLD:
password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),

// NEW:
password: passwordSchema,
```

**Step 2: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: enforce strong password rules on registration API"
```

---

## Task 5: Rewrite password recovery API — send SMS

**Files:**
- Rewrite: `src/app/api/auth/recuperar-senha/route.ts`

**Step 1: Rewrite the route**

Replace the entire file content:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { sendVerificationCode } from "@/lib/twilio/verify"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const schema = z.object({
  telefone: z.string().min(10).max(11),
})

/**
 * POST /api/auth/recuperar-senha
 * Look up user by phone number and send SMS verification code.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(
    `recuperar:${getClientIp(request)}`,
    3,
    15 * 60 * 1000
  )
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { telefone } = schema.parse(body)

    const usuario = await prisma.usuario.findFirst({
      where: { telefone },
      select: { id: true, senha: true, telefone: true },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Nenhuma conta encontrada com este telefone" },
        { status: 404 }
      )
    }

    if (!usuario.senha) {
      return NextResponse.json(
        { error: "Esta conta usa login social. Faça login com Google ou Facebook." },
        { status: 400 }
      )
    }

    await sendVerificationCode(telefone)

    const masked = telefone.replace(/(\d{2})(\d+)(\d{4})/, "($1) ****-$3")

    return NextResponse.json({
      message: "Código enviado via SMS",
      telefone: masked,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Telefone inválido" },
        { status: 400 }
      )
    }
    console.error("Erro ao enviar código de recuperação:", error)
    return NextResponse.json(
      { error: "Erro ao enviar código de verificação" },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/recuperar-senha/route.ts
git commit -m "feat: rewrite password recovery API to use phone SMS via Twilio Verify"
```

---

## Task 6: Create SMS code verification API

**Files:**
- Create: `src/app/api/auth/recuperar-senha/verificar/route.ts`

**Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/db/prisma"
import { checkVerificationCode } from "@/lib/twilio/verify"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const schema = z.object({
  telefone: z.string().min(10).max(11),
  code: z.string().length(6),
})

/**
 * POST /api/auth/recuperar-senha/verificar
 * Verify SMS code and generate a short-lived reset token.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(
    `recuperar-verificar:${getClientIp(request)}`,
    5,
    5 * 60 * 1000
  )
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { telefone, code } = schema.parse(body)

    const verification = await checkVerificationCode(telefone, code)
    if (!verification.valid) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.findFirst({
      where: { telefone },
      select: { id: true },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const token = randomUUID()
    const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    })

    return NextResponse.json({
      message: "Código verificado com sucesso",
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }
    console.error("Erro ao verificar código:", error)
    return NextResponse.json(
      { error: "Erro ao verificar código" },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/recuperar-senha/verificar/route.ts
git commit -m "feat: add SMS code verification endpoint for password recovery"
```

---

## Task 7: Create password reset API

**Files:**
- Create: `src/app/api/auth/recuperar-senha/resetar/route.ts`

**Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { hashPassword } from "@/lib/auth/next-auth"
import { passwordSchema } from "@/lib/validators/password"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const schema = z.object({
  token: z.string().uuid(),
  telefone: z.string().min(10).max(11),
  senha: passwordSchema,
})

/**
 * POST /api/auth/recuperar-senha/resetar
 * Validate reset token and set new password.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(
    `recuperar-resetar:${getClientIp(request)}`,
    5,
    15 * 60 * 1000
  )
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { token, telefone, senha } = schema.parse(body)

    const usuario = await prisma.usuario.findFirst({
      where: { telefone },
      select: {
        id: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    })

    if (!usuario || !usuario.resetToken || !usuario.resetTokenExpiry) {
      return NextResponse.json(
        { error: "Solicitação inválida ou expirada" },
        { status: 400 }
      )
    }

    if (usuario.resetToken !== token) {
      return NextResponse.json(
        { error: "Token de recuperação inválido" },
        { status: 400 }
      )
    }

    if (new Date() > usuario.resetTokenExpiry) {
      return NextResponse.json(
        { error: "Token expirado. Inicie o processo novamente." },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(senha)

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({
      message: "Senha redefinida com sucesso",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Erro ao resetar senha:", error)
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/recuperar-senha/resetar/route.ts
git commit -m "feat: add password reset endpoint with strong password validation"
```

---

## Task 8: Rewrite password recovery page (3-step form)

**Files:**
- Rewrite: `src/app/(auth)/recuperar-senha/page.tsx`

**Step 1: Rewrite the page**

Replace the entire file:

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
  KeyRound,
} from "lucide-react"
import { formatPhone } from "@/lib/masks"
import { validatePassword } from "@/lib/validators/password"
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator"

const STEPS = [
  { number: "01", title: "Telefone", icon: Phone },
  { number: "02", title: "Verificação", icon: ShieldCheck },
  { number: "03", title: "Nova senha", icon: KeyRound },
] as const

export default function RecuperarSenhaPage() {
  const [step, setStep] = useState(0)
  const [telefone, setTelefone] = useState("")
  const [maskedPhone, setMaskedPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [resetToken, setResetToken] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const inputClass =
    "block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"

  async function handleSendCode() {
    setLoading(true)
    setErro("")

    try {
      const phoneDigits = telefone.replace(/\D/g, "")
      if (phoneDigits.length < 10) {
        setErro("Telefone deve ter pelo menos 10 dígitos")
        return
      }

      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: phoneDigits }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || "Erro ao enviar código")
        return
      }

      setMaskedPhone(data.telefone)
      setStep(1)
      startCooldown()
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResendCode() {
    setLoading(true)
    setErro("")
    setVerificationCode(["", "", "", "", "", ""])

    try {
      const phoneDigits = telefone.replace(/\D/g, "")
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: phoneDigits }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErro(data.error || "Erro ao reenviar código")
        return
      }

      startCooldown()
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function startCooldown() {
    setCooldown(60)
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleVerifyCode() {
    const code = verificationCode.join("")
    if (code.length !== 6) {
      setErro("Digite o código de 6 dígitos")
      return
    }

    setLoading(true)
    setErro("")

    try {
      const phoneDigits = telefone.replace(/\D/g, "")
      const res = await fetch("/api/auth/recuperar-senha/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: phoneDigits, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || "Código inválido")
        return
      }

      setResetToken(data.token)
      setStep(2)
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setErro("")

    const { valid, errors } = validatePassword(senha)
    if (!valid) {
      setErro(errors[0])
      return
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem")
      return
    }

    setLoading(true)

    try {
      const phoneDigits = telefone.replace(/\D/g, "")
      const res = await fetch("/api/auth/recuperar-senha/resetar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          telefone: phoneDigits,
          senha,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || "Erro ao redefinir senha")
        return
      }

      setSucesso(true)
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Senha redefinida!</h2>
          <p className="text-sm text-slate-600">
            Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Recuperar senha
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Verifique seu telefone para redefinir sua senha
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = i === step
          const isComplete = i < step
          return (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-brand-600 text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium ${
                    isActive ? "text-brand-600" : isComplete ? "text-green-600" : "text-slate-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-0.5 w-12 rounded-full transition-colors ${
                    i < step ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {erro && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {erro}
          </div>
        )}

        {/* Step 1 — Phone */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="telefone" className="mb-1.5 block text-sm font-medium text-slate-700">
                Telefone cadastrado
              </label>
              <input
                type="tel"
                id="telefone"
                value={telefone}
                onChange={(e) => {
                  setTelefone(formatPhone(e.target.value))
                  setErro("")
                }}
                className={inputClass}
                placeholder="(00) 00000-0000"
                required
                inputMode="tel"
                autoComplete="tel"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Digite o telefone vinculado à sua conta
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Enviar código SMS
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2 — SMS Code */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 mb-4">
                <Smartphone className="h-7 w-7 text-brand-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Verifique seu telefone
              </h3>
              <p className="text-sm text-slate-500">
                Enviamos um código de 6 dígitos para{" "}
                <span className="font-semibold text-slate-700">{maskedPhone}</span>
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 1)
                    const newCode = [...verificationCode]
                    newCode[i] = val
                    setVerificationCode(newCode)
                    setErro("")
                    if (val && i < 5) {
                      const next = e.target.parentElement?.children[i + 1] as HTMLInputElement
                      next?.focus()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !verificationCode[i] && i > 0) {
                      const prev = (e.target as HTMLElement).parentElement?.children[i - 1] as HTMLInputElement
                      prev?.focus()
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault()
                    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
                    if (pasted.length > 0) {
                      const newCode = [...verificationCode]
                      for (let j = 0; j < 6; j++) {
                        newCode[j] = pasted[j] || ""
                      }
                      setVerificationCode(newCode)
                      const focusIndex = Math.min(pasted.length, 5)
                      const target = (e.target as HTMLElement).parentElement?.children[focusIndex] as HTMLInputElement
                      target?.focus()
                    }
                  }}
                  className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              ))}
            </div>

            <div className="text-center">
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResendCode}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-1 justify-center">
                    <Loader2 className="h-3 w-3 animate-spin" /> Enviando...
                  </span>
                ) : cooldown > 0 ? (
                  `Reenviar código em ${cooldown}s`
                ) : (
                  "Reenviar código"
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(0)
                  setErro("")
                  setVerificationCode(["", "", "", "", "", ""])
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.join("").length !== 6}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Verificar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — New Password */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-slate-700">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    setErro("")
                  }}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className={`${inputClass} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={senha} />
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirmar nova senha
              </label>
              <input
                id="confirmarSenha"
                type={mostrarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value)
                  setErro("")
                }}
                placeholder="Repita a senha"
                required
                className={inputClass}
                autoComplete="new-password"
              />
            </div>

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading || !validatePassword(senha).valid || senha !== confirmarSenha}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Redefinir senha
                  <CheckCircle className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/(auth)/recuperar-senha/page.tsx
git commit -m "feat: rewrite password recovery page with 3-step SMS flow"
```

---

## Task 9: Delete old email-based reset files

**Files:**
- Delete: `src/app/api/auth/resetar-senha/route.ts`
- Delete: `src/app/(auth)/resetar-senha/page.tsx`

**Step 1: Delete the files**

```bash
rm src/app/api/auth/resetar-senha/route.ts
rm src/app/(auth)/resetar-senha/page.tsx
```

Check if the directories are now empty and can be removed:

```bash
rmdir src/app/api/auth/resetar-senha/ 2>/dev/null
rmdir src/app/(auth)/resetar-senha/ 2>/dev/null
```

**Step 2: Commit**

```bash
git add -u src/app/api/auth/resetar-senha/ src/app/(auth)/resetar-senha/
git commit -m "chore: remove old email-based password reset flow"
```

---

## Task 10: Build verification

**Step 1: Generate Prisma client**

```bash
bunx prisma generate
```

**Step 2: Run lint**

```bash
./node_modules/.bin/next lint
```

Fix any errors (warnings are OK).

**Step 3: Run build**

```bash
./node_modules/.bin/next build
```

Ensure it completes without errors.

**Step 4: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "fix: resolve lint issues from password recovery implementation"
```

---

## Task Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Shared password validator | Create `src/lib/validators/password.ts` |
| 2 | Password strength UI component | Create `src/components/ui/PasswordStrengthIndicator.tsx` |
| 3 | Update registration page | Modify `src/app/(auth)/cadastro/page.tsx` |
| 4 | Update registration API | Modify `src/app/api/auth/register/route.ts` |
| 5 | Rewrite recovery API (send SMS) | Rewrite `src/app/api/auth/recuperar-senha/route.ts` |
| 6 | SMS code verification API | Create `src/app/api/auth/recuperar-senha/verificar/route.ts` |
| 7 | Password reset API | Create `src/app/api/auth/recuperar-senha/resetar/route.ts` |
| 8 | Rewrite recovery page (3-step) | Rewrite `src/app/(auth)/recuperar-senha/page.tsx` |
| 9 | Delete old email reset files | Delete `resetar-senha/` route + page |
| 10 | Build verification | Lint + build check |
