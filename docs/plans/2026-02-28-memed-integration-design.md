# Memed Full Integration Design

**Date:** 2026-02-28

## Overview

Complete the Memed digital prescription integration. Currently only the SDK shell exists with hardcoded data. This design covers server-side doctor registration, token management, patient context, and prescription persistence.

## Architecture

```
Backend (Secret Key - server only)
├─ POST /api/memed/registrar    → Register doctor at Memed API
├─ GET  /api/memed/token        → Get fresh doctor JWT token
└─ POST /api/memed/prescricao   → Save prescription callback data

Frontend (Doctor JWT token)
├─ Fetch doctor token from backend
├─ Load SDK with doctor token (not platform API key)
├─ Set patient context (nome + CPF)
├─ Open prescription iframe
└─ On prescricaoImpressa → POST to /api/memed/prescricao
```

## Database Changes

### Profissional - new field
- `memedExternalId String?` — UUID set on first Memed registration

### New table: PrescricaoMemed
- `id` String @id @default(uuid())
- `consultaId` String (FK → Consulta)
- `memedPrescricaoId` String (Memed's prescription UUID)
- `pacienteNome` String
- `pacienteCpf` String?
- `medicamentos` Json (array from Memed callback)
- `documentos` Json (documents/PDFs array)
- `criadoEm` DateTime @default(now())

## API Routes

### POST /api/memed/registrar
- Auth: profissional only
- Calls: `POST https://integrations.api.memed.com.br/v1/sinapse-prescricao/usuarios?api-key=...&secret-key=...`
- Body to Memed: external_id (profissional.id), nome, sobrenome, cpf, board_code, board_number, board_state, data_nascimento
- On success: saves memedExternalId on Profissional record
- On duplicate: fetches existing user instead (idempotent)

### GET /api/memed/token
- Auth: profissional only
- Calls: `GET https://integrations.api.memed.com.br/v1/sinapse-prescricao/usuarios/{cpfOrExternalId}?api-key=...&secret-key=...`
- Returns: `{ token: "JWT..." }`
- Token is not static — must be fetched each session

### POST /api/memed/prescricao
- Auth: profissional only
- Receives: consultaId + prescricaoImpressa callback payload
- Saves to PrescricaoMemed table
- Fields extracted: prescriptionUuid, paciente info, medicamentos array, documentos array

## Frontend Changes

### src/lib/memed/loader.ts
- New function: `loadMemedSDKWithToken(token)` — loads script with doctor JWT
- New function: `setMemedPatient({ nome, cpf })` — calls `plataforma.prescricao.setPaciente`
- Change event from `prescricaoSalva` to `prescricaoImpressa` (correct Memed event name)

### src/components/memed/MemedPrescription.tsx
- Accept patient prop (nome, cpf)
- On mount: call GET /api/memed/token, if 404 call POST /api/memed/registrar first
- Load SDK with doctor token
- Set patient before opening prescription
- On prescricaoImpressa: POST to /api/memed/prescricao

### src/app/consulta/[id]/ConsultaProfissional.tsx
- Pass real doctor data: profissional.id, registroProfissional, nome
- Pass real patient data: paciente.nome, paciente.cpf

### src/app/api/agendamentos/[id]/route.ts
- Include paciente.cpf in response (needed for Memed patient context)

## Memed API Reference

- Base URL: `https://integrations.api.memed.com.br/v1`
- Auth: query params `?api-key={API_KEY}&secret-key={SECRET_KEY}`
- Headers: `Accept: application/vnd.api+json`, `Content-Type: application/json`
- Doctor token returned in: `data.attributes.token`
- Prescription event: `prescricaoImpressa` (fires when doctor prints/emits)
