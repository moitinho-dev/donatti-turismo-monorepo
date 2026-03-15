# Design: 8 Bug Fixes & Improvements

**Date**: 2026-02-27
**Status**: Approved

## 1. Especialidades dinamicas no filtro

**Problem**: `buscar/page.tsx` has 7 hardcoded specialty options. New specialties added via admin don't appear.
**Solution**: Replace hardcoded `<select>` options with dynamic fetch from `/api/admin/especialidades` (already exists, returns all active specialties). Add `useEffect` to load specialties on mount.
**Files**: `src/app/(dashboard)/paciente/buscar/page.tsx`

## 2. Admin page null reference error

**Problem**: Admin dashboard crashes when `Pagamento.agendamento` has missing nested relations (`paciente.usuario.nome`).
**Solution**: Add optional chaining on all nested property accesses in the payments table. Wrap `Promise.all` in individual try/catch for graceful degradation.
**Files**: `src/app/(dashboard)/admin/page.tsx`

## 3. Hide prontuario from patients

**Problem**: Patients should NOT see full prontuario. Only receitas and atestados via `/paciente/documentos`.
**Solution**: Remove "Meu Prontuario" from `navItemsPaciente` in sidebar. Keep the API guard (canViewMedicalRecord) but remove patient navigation to prontuario page.
**Files**: `src/components/dashboard/DashboardSidebar.tsx`

## 4. Fix 18h timezone bug in booking

**Problem**: Booking slots after 18h BRT fails because server (UTC) uses broken `toLocaleString() + new Date()` pattern for timezone conversion.
**Root cause**: `new Date(dataHora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))` parses the string as UTC, producing wrong hour/day.
**Solution**: Replace with `Intl.DateTimeFormat.formatToParts()` to correctly extract BRT hour/minute/day. No new dependencies needed.
**Files**: `src/app/api/agendamentos/route.ts` (lines ~207-209)

## 5. Consultation closes immediately for both sides

**Problem**: Patient waits 5s polling + 60s Twilio timeout after doctor ends consultation.
**Solution**:
- Reduce agendamento polling from 5s to 2s on consultation page
- When doctor clicks "Encerrar", API also disconnects Twilio room via Twilio REST API (force complete the room)
- Patient's VideoRoom component detects disconnect immediately (no 60s wait)
- Add explicit "consultation ended" detection in polling to show final screen instantly
**Files**: `src/app/api/consultas/route.ts`, `src/app/consulta/[id]/page.tsx`, `src/components/VideoRoom.tsx`

## 6. Mandatory 2FA for all users

**Problem**: 2FA is optional. Must be mandatory for all user types.
**Solution**:
- Add middleware check: if authenticated user has `twoFactorEnabled === false`, redirect to `/perfil/seguranca` (2FA setup page)
- Add banner on security page explaining 2FA is mandatory
- Allow whitelist of routes during setup (the 2FA setup route itself, logout, API routes)
- Requires TWILIO_PHONE_NUMBER env var to be configured
**Files**: `src/middleware.ts`, `src/app/(dashboard)/perfil/seguranca/page.tsx`

## 7. Memed prescription integration (code-ready)

**Problem**: MemedPrescription component exists but isn't rendered in the consultation UI.
**Solution**:
- Ensure MemedPrescription renders in ConsultaProfissional.tsx when `especialidade.memedHabilitado` is true
- Show graceful fallback when API key is missing
- Leave placeholder for user to add `NEXT_PUBLIC_MEMED_API_KEY` later
**Files**: `src/app/consulta/[id]/ConsultaProfissional.tsx`

## 8. Replace vercel.app URLs with clinimais.com

**Problem**: 6 files in `src/lib/resend/` have hardcoded fallback `"https://clini-plus.vercel.app"`.
**Solution**: Replace all fallback URLs with `"https://clinimais.com"`.
**Files**:
- `src/lib/resend/client.ts`
- `src/lib/resend/templates/layout.ts`
- `src/lib/resend/templates/bem-vindo-paciente.ts`
- `src/lib/resend/templates/bem-vindo-profissional.ts`
- `src/lib/resend/templates/profissional-aprovado.ts`
- `src/lib/resend/templates/profissional-rejeitado.ts`
