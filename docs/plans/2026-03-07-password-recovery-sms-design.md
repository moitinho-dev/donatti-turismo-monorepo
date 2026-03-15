# Password Recovery via SMS + Password Strength Rules

**Date:** 2026-03-07
**Status:** Approved

---

## Overview

Replace the current email-based password recovery flow with SMS phone verification via Twilio Verify. Add strong password requirements (8+ chars, uppercase, number, special character) enforced on both registration and password recovery with a live visual checklist.

---

## 1. Shared Password Validation

**File:** `src/lib/validators/password.ts`

Single source of truth for password rules, used client-side and server-side:

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*...)

Exports:
- `PASSWORD_RULES` — array of `{ key, label, test: (pw) => boolean }` for the UI checklist
- `validatePassword(pw)` — returns `{ valid: boolean, errors: string[] }` for server-side
- `passwordSchema` — Zod schema for API route validation

---

## 2. PasswordStrengthIndicator Component

**File:** `src/components/ui/PasswordStrengthIndicator.tsx`

Client component that receives password string as prop and renders a live checklist:

- Each rule from `PASSWORD_RULES` shown as a line item
- Green check icon + green text when rule passes
- Gray circle icon + gray text when not yet met
- Smooth color/icon transitions as user types

Used in registration (cadastro step 0) and password recovery (step 3).

---

## 3. Password Recovery Page (Rewrite)

**File:** `src/app/(auth)/recuperar-senha/page.tsx`

Single-page, 3-step flow:

### Step 1 — Phone Input
- User enters phone number (formatted with `formatPhone` mask)
- Calls `POST /api/auth/recuperar-senha` with phone
- Looks up user by phone, sends SMS via Twilio Verify
- Error if no account found or OAuth-only account
- Rate limited: 3 requests per 15 minutes

### Step 2 — SMS Code Verification
- 6-digit code input (same UI as registration step 4)
- Resend button with 60s cooldown
- Calls `POST /api/auth/recuperar-senha/verificar` with phone + code
- Returns short-lived token (UUID, 10min expiry) stored in DB

### Step 3 — New Password
- New password + confirm password fields
- PasswordStrengthIndicator below password field
- Show/hide password toggle
- Submit disabled until all rules pass + passwords match
- Calls `POST /api/auth/recuperar-senha/resetar` with token + phone + new password

### Success State
- "Senha redefinida!" card with link to login

---

## 4. API Routes

### New Routes

| Route | Purpose |
|-------|---------|
| `POST /api/auth/recuperar-senha` | Receive phone, look up user, send SMS via Twilio Verify |
| `POST /api/auth/recuperar-senha/verificar` | Check SMS code, generate reset token (UUID, 10min) in DB |
| `POST /api/auth/recuperar-senha/resetar` | Validate token, enforce password rules, hash & save |

### Modified Routes

| Route | Change |
|-------|--------|
| `POST /api/auth/register` | Update password validation from `min(6)` to shared `passwordSchema` |

### Deleted Routes

| Route | Reason |
|-------|--------|
| `POST /api/auth/resetar-senha` | Replaced by new flow |

---

## 5. Registration Page Changes

**File:** `src/app/(auth)/cadastro/page.tsx`

- Add `PasswordStrengthIndicator` below password field in step 0
- Update `validateStep()` to use `validatePassword()` instead of `senha.length < 6`
- Update placeholder text to "Mínimo 8 caracteres"

---

## 6. Files Summary

| Action | File |
|--------|------|
| Create | `src/lib/validators/password.ts` |
| Create | `src/components/ui/PasswordStrengthIndicator.tsx` |
| Rewrite | `src/app/(auth)/recuperar-senha/page.tsx` |
| Rewrite | `src/app/api/auth/recuperar-senha/route.ts` |
| Create | `src/app/api/auth/recuperar-senha/verificar/route.ts` |
| Create | `src/app/api/auth/recuperar-senha/resetar/route.ts` |
| Modify | `src/app/(auth)/cadastro/page.tsx` |
| Modify | `src/app/api/auth/register/route.ts` |
| Delete | `src/app/api/auth/resetar-senha/route.ts` |
| Delete | `src/app/(auth)/resetar-senha/page.tsx` |

---

## Security Considerations

- Rate limiting on all endpoints (IP-based)
- Reset tokens are UUIDs with 10-minute expiry
- Tokens are single-use (cleared after password change)
- Phone lookup doesn't reveal if phone exists (for send-code step, shows error — accepted trade-off since phone is less discoverable than email)
- Password rules enforced server-side (Zod schema), not just client-side
- Bcrypt hashing with 12 salt rounds
