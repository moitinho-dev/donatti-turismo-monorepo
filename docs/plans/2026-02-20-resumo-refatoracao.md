# Resumo da Refatoracao — Controle de Integracoes e Registro Profissional

**Data:** 20/02/2026
**Status:** Implementado (pendente revisao antes de ir pra producao)

---

## O que foi feito

### 1. Registro profissional flexivel

Antes, o sistema so aceitava **CRM** (medicos). Agora aceita **8 tipos de registro**:

- CRM (Medicina)
- CRN (Nutricao)
- CRP (Psicologia)
- CREFITO (Fisioterapia)
- CRO (Odontologia)
- COREN (Enfermagem)
- CRFa (Fonoaudiologia)
- COFFITO (Terapia Ocupacional)

Isso aparece em todos os lugares: cadastro de profissional, painel admin, perfil, listagem publica, PDFs de receita e atestado.

### 2. Controle de integracoes por especialidade

O admin agora pode ligar/desligar duas integracoes **por especialidade**:

- **Memed** (prescricao digital) — so aparece pra quem tem CRM E a especialidade tem Memed ligado
- **Bird ID** (assinatura digital) — so aparece pra quem tem CRM, a especialidade tem Bird ID ligado, E o profissional ativou individualmente

Exemplo pratico: se o admin criar uma especialidade "Nutricao", ele pode deixar Memed e Bird ID desligados. Um nutricionista (CRN) nunca vai ver a aba de receituario nem o botao de assinar digitalmente.

### 3. Sala de consulta — novo layout

A tela da consulta foi reorganizada:

- **Video ocupa 30%** da tela (lado esquerdo)
- **Painel lateral ocupa 70%** (prontuario, chat, receitas, documentos)
- No celular, o video fica em cima e o painel embaixo (empilhado)

### 4. Aba de receituario condicional

A aba "Receituario" dentro da consulta **so aparece** se o profissional puder prescrever (CRM + especialidade com Memed habilitado). Profissionais que nao tem essa permissao simplesmente nao veem a aba.

### 5. Botao "Entrar na Consulta" com horario

O paciente so consegue entrar na consulta dentro de uma janela de tempo:

- **15 minutos antes** do horario marcado: mostra "Consulta em X minutos"
- **Durante a janela**: botao verde "Entrar na Consulta" fica ativo
- **30 minutos depois**: mostra "Horario expirado"

Isso vale tanto na pagina de agendamentos quanto na pagina de consultas do paciente.

### 6. Informacoes financeiras removidas do profissional

O painel do profissional **nao mostra mais** faturamento, valores de consulta nem status de pagamento. Essas informacoes ficam apenas no painel admin.

### 7. PDFs e documentos atualizados

Receitas, atestados e outros documentos agora mostram o tipo de registro correto (ex: "CRP 12345" em vez de sempre "CRM 12345").

---

## O que falta antes de ir pra producao

### Obrigatorio

| Item | O que fazer | Por que |
|------|-------------|---------|
| **Arquivo de seed** | Atualizar `prisma/seed.ts` — trocar `crm:` por `registroProfissional:` e adicionar `tipoRegistro:` | Se rodar o seed em ambiente novo, vai dar erro porque o campo `crm` nao existe mais no banco |
| **Variavel do Memed** | Adicionar `NEXT_PUBLIC_MEMED_API_KEY=` no `.env.example` | Quem configurar o projeto pela primeira vez nao vai saber que precisa dessa chave |
| **Testar fluxo completo** | Testar cadastro de profissional com cada tipo de registro, login, e consulta | Garantir que tudo funciona junto |
| **Push pro repositorio** | Os 20 commits estao locais, falta `git push` | Nada foi pra nuvem ainda |

### Recomendado (pode ir depois do deploy)

| Item | O que fazer | Por que |
|------|-------------|---------|
| **Bird ID em producao** | Preencher `BIRD_ID_CLIENT_ID` e `BIRD_ID_CLIENT_SECRET` com valores reais | Assinatura digital so funciona com credenciais validas do Bird ID |
| **Memed em producao** | Confirmar que a chave `NEXT_PUBLIC_MEMED_API_KEY` do ambiente de producao esta correta | Prescricao digital depende da API do Memed |
| **Testes automatizados** | Criar testes para as funcoes de permissao e horario | Hoje nao tem nenhum teste automatizado no projeto |

---

## Arquivos criados nesta refatoracao

| Arquivo | Funcao |
|---------|--------|
| `src/lib/permissions.ts` | Logica central de permissoes (quem pode prescrever, quem pode assinar) |
| `src/lib/consultation-time.ts` | Logica de janela de horario pra entrar na consulta |

## Arquivos principais modificados

| Arquivo | O que mudou |
|---------|-------------|
| `prisma/schema.prisma` | Campo `crm` virou `registroProfissional` + novo campo `tipoRegistro`. Especialidade ganhou flags de integracao |
| `src/app/api/admin/profissionais/route.ts` | API do admin agora usa os novos campos |
| `src/app/api/admin/especialidades/[id]/route.ts` | API aceita ligar/desligar integracoes |
| `src/app/api/seja-profissional/route.ts` | Cadastro publico aceita tipo de registro |
| `src/app/api/agendamentos/[id]/route.ts` | Retorna dados de integracao pra sala de consulta |
| `src/app/(dashboard)/admin/especialidades/page.tsx` | Tela admin com toggles de integracao |
| `src/app/(dashboard)/admin/profissionais/page.tsx` | Tela admin com dropdown de tipo de registro |
| `src/app/(dashboard)/profissional/page.tsx` | Dashboard sem info financeira |
| `src/app/(dashboard)/profissional/perfil/page.tsx` | Perfil com tipo de registro dinamico |
| `src/app/(site)/seja-profissional/page.tsx` | Formulario publico com selecao de tipo |
| `src/app/consulta/[id]/page.tsx` | Layout 30/70 |
| `src/app/consulta/[id]/ConsultaProfissional.tsx` | Aba receituario condicional |
| `src/components/memed/MemedPrescription.tsx` | Componente recebe flag de integracao |
| `src/app/(dashboard)/paciente/agendamentos/page.tsx` | Botao com controle de horario |
| `src/app/(dashboard)/paciente/consultas/page.tsx` | Botao com controle de horario |
| `src/lib/pdf.ts` | PDFs com tipo de registro correto |
| + 8 outros arquivos de API | Todas as referencias a `.crm` foram trocadas |

---

## Resumo dos commits (20 no total)

```
4b74db4 schema: renomear crm para registroProfissional, adicionar tipoRegistro e flags de integracao
7d97f29 feat: utilitario central de permissoes
5ecc45d feat: utilitario de controle de horario de consulta
0b8cc9d feat: aceitar flags de integracao no PATCH de especialidade
a866508 feat: migrar crm para registroProfissional na API admin profissionais
689a4d3 feat: migrar crm para registroProfissional no cadastro publico
1d1095a feat: incluir flags de integracao na API do profissional
e028614 feat: toggles de integracao na tela admin de especialidades
cfef67a feat: migrar CRM para registroProfissional na tela admin de profissionais
ce94b4e feat: remover info financeira do dashboard profissional
ea8918a feat: perfil com registroProfissional e Bird ID condicional
a64ea9e feat: cadastro profissional flexivel com tipoRegistro
1e3a093 feat: layout 30/70 na sala de consulta
4966df5 feat: aba receituario condicional baseada em permissoes
23263c4 feat: verificacao de permissao no componente MemedPrescription
dc3b788 feat: botao Entrar na Consulta com controle de horario
4fa055a fix: substituir referencias restantes de crm em todo o codigo
12e19be fix: adicionar dependencia faltante no useCallback
```

---

## Build e Lint

- **Build:** Passou com sucesso (117/117 paginas geradas)
- **Lint:** Passou (apenas warnings pre-existentes, nenhum erro novo)
- **Prisma:** Schema sincronizado com o banco
