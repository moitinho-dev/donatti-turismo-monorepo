# Clini+ Site Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply Healio design system to all Clini+ public site pages while preserving existing text content and functional logic (forms, API calls, search).

**Architecture:** In-place rewrite of 7 existing page files + 2 layout components (Header/Footer). Add global CSS utilities for grid backgrounds, watermark text, and view transitions. Create one new data file and one new dynamic route. No new dependencies — pure CSS/Tailwind changes.

**Tech Stack:** Next.js 14.2.5, Tailwind CSS 3.x, TypeScript, Lucide icons

**Design doc:** `docs/plans/2026-02-20-site-redesign-design.md`

**Build command:** `./node_modules/.bin/next build` (use full path — project path has spaces)

**Lint command:** `./node_modules/.bin/next lint`

---

## Task 1: Tailwind Config + Global CSS

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/app/globals.css`

**Step 1: Update tailwind.config.js**

Add cyan accent colors and background-image utilities:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        }
      }
    }
  },
  plugins: []
};
```

**Step 2: Add CSS utilities to globals.css**

Append after the existing `@tailwind` directives (before `:root`):

```css
/* Healio design system utilities */
@layer utilities {
  .bg-grid {
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .text-watermark {
    font-size: clamp(8rem, 20vw, 24rem);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 0.8;
    color: rgba(241, 245, 249, 0.5);
    user-select: none;
    pointer-events: none;
  }
}

/* View transitions */
@view-transition {
  navigation: auto;
}

::view-transition-old(root) {
  animation: 0.25s ease-out both fade-out;
}

::view-transition-new(root) {
  animation: 0.25s ease-in 0.1s both fade-in;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Exclude header/footer from view transitions */
header, footer {
  view-transition-name: none;
}
```

**Step 3: Verify build**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && ./node_modules/.bin/next build`
Expected: Build succeeds. The new CSS classes exist but aren't used yet.

**Step 4: Commit**

```bash
git add tailwind.config.js src/app/globals.css
git commit -m "feat: add Healio design system CSS utilities (grid bg, watermark, view transitions)"
```

---

## Task 2: Header Component Redesign

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Step 1: Rewrite Header.tsx**

Replace full file content. Keep the same component structure (client component, useState for mobile). Update navigation items and styling to match Healio nav pattern:

- Nav items: Sobre Nós, Especialidades, Nossos Especialistas, Seja um Profissional
- Desktop: logo left, nav center-ish, CTA right ("Entrar" + "Agendar Consulta" pill button in brand-600 bg)
- Mobile: hamburger → dropdown with same items
- Keep the CLINI+ logo SVG (cross icon + text)

Key visual changes:
- CTA button: change from `bg-slate-900` to `bg-brand-600 shadow-lg shadow-brand-600/20 rounded-full`
- Nav links: keep `text-slate-600 hover:text-brand-600` but add `rounded-lg hover:bg-slate-50`
- Remove "Home" from nav (logo click = home)
- Add "FAQ" and "Contato" links

**Step 2: Verify dev server renders correctly**

Run: `./node_modules/.bin/next build`
Expected: Builds with no errors.

**Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: redesign Header with Healio nav pattern"
```

---

## Task 3: Footer Component Redesign

**Files:**
- Modify: `src/components/layout/Footer.tsx`

**Step 1: Rewrite Footer.tsx**

Transform from light bg (`bg-slate-50`) to dark footer (`bg-brand-900 text-white`) with grid pattern overlay. Structure:

1. Top section: Logo + description + social icons
2. 4-column link grid: Produto (Agendamento, Especialidades, Especialistas), Empresa (Sobre Nós, Seja um Profissional, Contato), Suporte (FAQ, Termos de Uso, Privacidade), Contato (email, phone)
3. Bottom bar: copyright + compliance badges (CFM, LGPD, SSL)

Keep all existing link destinations. Social icons: Instagram, Facebook, LinkedIn (same SVGs, but lighter colors).

Key visual changes:
- bg-brand-900 with `bg-grid` overlay
- Link colors: `text-brand-200 hover:text-white`
- Headings: `text-sm font-semibold text-white uppercase tracking-wider`
- Social icons: `bg-brand-800 hover:bg-brand-700` circles
- Copyright bar: `border-t border-brand-800`

**Step 2: Build check**

Run: `./node_modules/.bin/next build`
Expected: Builds with no errors.

**Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: redesign Footer with dark Healio pattern"
```

---

## Task 4: Home Page Redesign

**Files:**
- Modify: `src/app/(site)/page.tsx`

**Step 1: Rewrite page.tsx**

Keep ALL existing data arrays (`beneficios`, `especialidades`, `diferenciais`, `etapas`, `depoimentos`, `faqs`) — same text, same icons. Rewrite the JSX to match Healio landing page design:

**Hero section:**
- Dark gradient bg: `bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900`
- Add `bg-grid` class for grid overlay
- Add watermark "CLINI+" text behind content: `<div className="absolute inset-0 flex items-center justify-center overflow-hidden"><span className="text-watermark opacity-[0.03]">CLINI+</span></div>`
- Rating badge: `<div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur ... rounded-full">` with star icon + "Avaliação 4.9 | Mais de 3.000 consultas realizadas"
- H1 in white with cyan accent span: `<span className="text-cyan-400">`
- Dual CTAs: primary pill button (bg-white text-brand-700) + secondary link
- Trust indicators below (avatar circles + "3M+ pacientes atendidos")

**Benefits section:**
- White bg
- Cards: `bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`
- Icon container: `rounded-xl bg-brand-50`

**How It Works section:**
- Light bg `bg-slate-50`
- Step number badges + connecting arrows between steps
- Same 3-step layout

**Specialties section:**
- White bg
- Cards with group hover effect (icon bg changes to brand-600 on hover)
- "Ver médicos" link at bottom of each card linking to `/especialidades/[slug]`

**Differentials section:**
- `bg-slate-50`
- 3-column grid, icon+text horizontal layout

**Testimonials section:**
- White bg
- Cards with 5-star rating, quote, avatar + name + info
- Same 3 testimonials

**FAQ section:**
- `bg-slate-50`
- `<details>` accordion with ChevronDown rotation

**CTA Final:**
- `bg-gradient-to-r from-brand-600 to-brand-700` with grid overlay
- White pill CTA button

**Step 2: Build check**

Run: `./node_modules/.bin/next build`
Expected: Builds with no errors.

**Step 3: Commit**

```bash
git add src/app/(site)/page.tsx
git commit -m "feat: redesign Home page with Healio visual language"
```

---

## Task 5: Sobre Page Redesign

**Files:**
- Modify: `src/app/(site)/sobre/page.tsx`

**Step 1: Rewrite sobre/page.tsx**

Keep ALL existing data arrays (`estatisticas`, `valores`) and all text content. Rewrite JSX:

**Hero section:**
- Dark gradient bg with `bg-grid`
- Watermark "CLINI+" behind
- "Nossa Essência" as uppercase label
- "Sobre a Clini+" as H1 in white, brand accent
- Description text in brand-100

**Stats section:**
- `bg-white`
- 4 metric cards in a row: `rounded-2xl border border-slate-100 p-6 text-center`
- Large number (text-3xl font-extrabold), small label
- Keep existing numbers: 3.000+, 50+, 98%, 24h

**Mission section:**
- `bg-slate-50`
- Two-column: text left, "Nosso Propósito" card right
- Keep Dr. Richard founding narrative (same 3 paragraphs)
- Keep checklist items

**Values section:**
- `bg-white`
- 4 cards grid: icon, title, description
- Keep existing values: Acessibilidade, Qualidade, Segurança, Humanização

**Leadership section:**
- `bg-slate-50`
- Dr. Richard Ramos profile card (same text)

**Certifications section (NEW):**
- `bg-white`
- 4 badge cards: LGPD Compliance, Médicos com RQE, Criptografia Ponta a Ponta, Normas do CFM
- Each: icon + title + short description

**CTA:**
- Dark gradient with grid overlay
- Dual buttons: "Criar Conta Gratuita" + "Ver Especialistas"

**Step 2: Build check**

Run: `./node_modules/.bin/next build`
Expected: Builds with no errors.

**Step 3: Commit**

```bash
git add src/app/(site)/sobre/page.tsx
git commit -m "feat: redesign Sobre page with Healio visual language"
```

---

## Task 6: Especialidades Data File

**Files:**
- Create: `src/data/especialidades.ts`

**Step 1: Create the specialty data file**

This file exports a typed array of specialty objects used by both `/especialidades` (grid) and `/especialidades/[slug]` (detail page). Each specialty has:

```ts
import {
  Heart,
  Stethoscope,
  Bone,
  Scale,
  Sparkles,
  Activity,
  Dumbbell,
  Brain,
  type LucideIcon,
} from "lucide-react"

export interface Especialidade {
  slug: string
  nome: string
  icon: LucideIcon
  descricao: string
  descricaoLonga: string
  condicoes: string[]
  servicos: { titulo: string; descricao: string }[]
  depoimentos: { quote: string; nome: string; info: string }[]
}

export const especialidades: Especialidade[] = [
  {
    slug: "cardiologia",
    nome: "Cardiologia",
    icon: Heart,
    descricao: "Cuidados especializados para o seu coração, com diagnóstico e tratamento de doenças cardiovasculares.",
    descricaoLonga: "Prevenção, diagnóstico e manejo de doenças do coração e sistema cardiovascular. Acompanhamento contínuo com cardiologistas certificados.",
    condicoes: [
      "Hipertensão arterial",
      "Arritmias cardíacas",
      "Insuficiência cardíaca",
      "Check-up cardiológico",
    ],
    servicos: [
      { titulo: "Monitoramento Remoto", descricao: "Acompanhamento de pressão e sinais vitais à distância." },
      { titulo: "Análise de Exames", descricao: "Laudos de ECG, ecocardiograma e exames laboratoriais." },
      { titulo: "Cuidado Preventivo", descricao: "Planos personalizados de saúde cardiovascular." },
    ],
    depoimentos: [
      { quote: "O acompanhamento contínuo com o mesmo cardiologista fez toda a diferença no controle da minha hipertensão.", nome: "Maria S.", info: "58 anos, São Paulo" },
      { quote: "Consegui ajustar minha medicação sem precisar ir ao consultório. Praticidade e segurança.", nome: "Carlos R.", info: "62 anos, Rio de Janeiro" },
      { quote: "O check-up cardiológico online foi completo e profissional. Recebi todas as orientações que precisava.", nome: "Ana L.", info: "45 anos, Belo Horizonte" },
    ],
  },
  {
    slug: "clinica-geral",
    nome: "Clínica Geral",
    icon: Stethoscope,
    descricao: "Atendimento médico abrangente para todas as idades, focado na prevenção e tratamento de diversas condições.",
    descricaoLonga: "Avaliação inicial, investigação de sintomas e orientação sobre cuidados com a saúde. Atendimento completo para todas as faixas etárias.",
    condicoes: [
      "Consultas de rotina",
      "Infecções comuns",
      "Acompanhamento de doenças crônicas",
      "Exames preventivos",
    ],
    servicos: [
      { titulo: "Consulta de Rotina", descricao: "Avaliação geral de saúde e orientação preventiva." },
      { titulo: "Investigação de Sintomas", descricao: "Diagnóstico e encaminhamento quando necessário." },
      { titulo: "Acompanhamento Crônico", descricao: "Monitoramento contínuo de condições de saúde." },
    ],
    depoimentos: [
      { quote: "Resolvi minha gripe em 20 minutos, sem sair de casa. O médico foi atencioso e passou tudo certinho.", nome: "Pedro M.", info: "35 anos, Curitiba" },
      { quote: "Faço meu acompanhamento de rotina pela Clini+ e estou muito satisfeita com o atendimento.", nome: "Lucia F.", info: "50 anos, Salvador" },
      { quote: "Rápido, prático e profissional. Recebi a receita digital na hora.", nome: "João P.", info: "28 anos, Campinas" },
    ],
  },
  {
    slug: "reumatologia",
    nome: "Reumatologia",
    icon: Bone,
    descricao: "Diagnóstico e tratamento de doenças que afetam articulações, músculos, ossos e tecidos conjuntivos.",
    descricaoLonga: "Tratamento especializado de doenças reumáticas com acompanhamento contínuo e planos terapêuticos personalizados.",
    condicoes: [
      "Artrite reumatoide",
      "Lúpus eritematoso",
      "Fibromialgia",
      "Osteoporose",
    ],
    servicos: [
      { titulo: "Diagnóstico Especializado", descricao: "Avaliação completa de doenças reumáticas." },
      { titulo: "Plano Terapêutico", descricao: "Tratamento personalizado e acompanhamento de evolução." },
      { titulo: "Análise de Exames", descricao: "Interpretação de exames laboratoriais e de imagem." },
    ],
    depoimentos: [
      { quote: "Minha artrite está muito mais controlada com o acompanhamento online. O médico ajusta a medicação sempre que preciso.", nome: "Teresa G.", info: "55 anos, Porto Alegre" },
      { quote: "Finalmente encontrei um reumatologista que me ouve e explica tudo com calma.", nome: "Roberto S.", info: "48 anos, Recife" },
      { quote: "O retorno gratuito é um diferencial enorme. Consigo tirar dúvidas sem custo.", nome: "Marta L.", info: "60 anos, Brasília" },
    ],
  },
  {
    slug: "emagrecimento",
    nome: "Emagrecimento",
    icon: Scale,
    descricao: "Programa personalizado de emagrecimento com acompanhamento médico especializado e seguro.",
    descricaoLonga: "Acompanhamento médico focado no tratamento da obesidade e hábitos saudáveis, com planos individualizados.",
    condicoes: [
      "Sobrepeso e obesidade",
      "Reeducação alimentar",
      "Acompanhamento nutricional",
      "Síndrome metabólica",
    ],
    servicos: [
      { titulo: "Avaliação Completa", descricao: "Análise de histórico, exames e perfil metabólico." },
      { titulo: "Plano Alimentar", descricao: "Orientação nutricional personalizada pelo médico." },
      { titulo: "Acompanhamento Mensal", descricao: "Monitoramento de progresso e ajustes no tratamento." },
    ],
    depoimentos: [
      { quote: "Perdi 15kg em 6 meses com acompanhamento seguro. O médico me ajudou muito com a reeducação alimentar.", nome: "Fernanda C.", info: "38 anos, São Paulo" },
      { quote: "O programa é sério e baseado em evidências. Nada de milagres, só resultado real.", nome: "Marcos A.", info: "42 anos, Belo Horizonte" },
      { quote: "Consegui controlar minha síndrome metabólica e melhorar minha qualidade de vida.", nome: "Sandra P.", info: "50 anos, Florianópolis" },
    ],
  },
  {
    slug: "dermatologia",
    nome: "Dermatologia",
    icon: Sparkles,
    descricao: "Cuidados com a saúde da pele, cabelos e unhas, tratando desde condições clínicas até estéticas.",
    descricaoLonga: "Diagnóstico e tratamento de doenças dermatológicas com orientação especializada por teleconsulta.",
    condicoes: [
      "Acne e rosácea",
      "Dermatite e eczema",
      "Psoríase",
      "Avaliação de lesões de pele",
    ],
    servicos: [
      { titulo: "Avaliação Dermatológica", descricao: "Análise de condições de pele por videoconsulta." },
      { titulo: "Tratamento de Acne", descricao: "Protocolos personalizados para diferentes tipos de acne." },
      { titulo: "Monitoramento", descricao: "Acompanhamento de tratamentos dermatológicos em curso." },
    ],
    depoimentos: [
      { quote: "Minha acne melhorou muito com o tratamento prescrito na teleconsulta.", nome: "Juliana R.", info: "25 anos, Rio de Janeiro" },
      { quote: "Prático e eficiente. O dermatologista avaliou minhas fotos e prescreveu o tratamento.", nome: "Lucas M.", info: "30 anos, São Paulo" },
      { quote: "Finalmente consegui tratar minha dermatite com um especialista de verdade.", nome: "Camila O.", info: "33 anos, Curitiba" },
    ],
  },
  {
    slug: "endocrinologia",
    nome: "Endocrinologia",
    icon: Activity,
    descricao: "Tratamento de distúrbios hormonais e metabólicos, com abordagem personalizada para cada paciente.",
    descricaoLonga: "Diagnóstico e manejo de doenças endócrinas com acompanhamento contínuo e análise de exames laboratoriais.",
    condicoes: [
      "Diabetes mellitus",
      "Doenças da tireoide",
      "Distúrbios hormonais",
      "Colesterol elevado",
    ],
    servicos: [
      { titulo: "Controle de Diabetes", descricao: "Acompanhamento glicêmico e ajuste de medicação." },
      { titulo: "Avaliação Tireoidiana", descricao: "Diagnóstico e tratamento de doenças da tireoide." },
      { titulo: "Perfil Hormonal", descricao: "Análise completa de exames hormonais." },
    ],
    depoimentos: [
      { quote: "Meu diabetes está muito mais controlado com o acompanhamento online. Praticidade total.", nome: "José F.", info: "55 anos, Manaus" },
      { quote: "Descobri meu problema de tireoide e comecei o tratamento rapidamente.", nome: "Rita S.", info: "40 anos, Goiânia" },
      { quote: "O endocrinologista é muito atencioso e explica tudo detalhadamente.", nome: "André M.", info: "47 anos, Vitória" },
    ],
  },
  {
    slug: "ortopedia",
    nome: "Ortopedia",
    icon: Dumbbell,
    descricao: "Diagnóstico e tratamento de doenças e lesões do sistema musculoesquelético.",
    descricaoLonga: "Avaliação especializada de dores e lesões ortopédicas com orientação para tratamento e reabilitação.",
    condicoes: [
      "Dores articulares",
      "Lesões esportivas",
      "Tendinites e bursites",
      "Problemas na coluna",
    ],
    servicos: [
      { titulo: "Avaliação de Dor", descricao: "Diagnóstico de dores articulares e musculares." },
      { titulo: "Orientação Pós-Lesão", descricao: "Plano de recuperação para lesões esportivas." },
      { titulo: "Análise de Imagem", descricao: "Interpretação de radiografias e ressonâncias." },
    ],
    depoimentos: [
      { quote: "Recebi o diagnóstico da minha tendinite e o plano de tratamento sem esperar semanas.", nome: "Rafael B.", info: "34 anos, São Paulo" },
      { quote: "O ortopedista analisou minha ressonância por videochamada e explicou tudo.", nome: "Patrícia N.", info: "45 anos, Recife" },
      { quote: "Recuperação da minha lesão no joelho com acompanhamento contínuo online.", nome: "Diego L.", info: "28 anos, Porto Alegre" },
    ],
  },
  {
    slug: "psiquiatria",
    nome: "Psiquiatria",
    icon: Brain,
    descricao: "Acompanhamento especializado em saúde mental, com abordagem acolhedora e baseada em evidências.",
    descricaoLonga: "Atendimento psiquiátrico humanizado por teleconsulta, com foco em diagnóstico, tratamento e acompanhamento contínuo.",
    condicoes: [
      "Ansiedade e depressão",
      "Transtorno bipolar",
      "TDAH",
      "Insônia e distúrbios do sono",
    ],
    servicos: [
      { titulo: "Avaliação Psiquiátrica", descricao: "Consulta inicial completa e diagnóstico." },
      { titulo: "Acompanhamento Medicamentoso", descricao: "Ajuste e monitoramento de medicação." },
      { titulo: "Suporte Contínuo", descricao: "Retornos regulares para acompanhamento do tratamento." },
    ],
    depoimentos: [
      { quote: "A teleconsulta em psiquiatria me deu mais conforto e privacidade. Recomendo muito.", nome: "Beatriz A.", info: "29 anos, São Paulo" },
      { quote: "Consegui ajustar minha medicação para ansiedade sem enfrentar a fila do consultório.", nome: "Thiago V.", info: "36 anos, Belo Horizonte" },
      { quote: "O psiquiatra é muito acolhedor. Me sinto segura nas consultas online.", nome: "Isabela C.", info: "31 anos, Brasília" },
    ],
  },
]

export function getEspecialidadeBySlug(slug: string): Especialidade | undefined {
  return especialidades.find((e) => e.slug === slug)
}

export function getAllSlugs(): string[] {
  return especialidades.map((e) => e.slug)
}
```

**Step 2: Build check**

Run: `./node_modules/.bin/next build`
Expected: Builds fine (file is only data, no rendering).

**Step 3: Commit**

```bash
git add src/data/especialidades.ts
git commit -m "feat: add specialty data file for redesigned pages"
```

---

## Task 7: Especialidades Page Redesign

**Files:**
- Modify: `src/app/(site)/especialidades/page.tsx`

**Step 1: Rewrite especialidades/page.tsx**

Import specialty data from `@/data/especialidades`. Remove the hardcoded `especialidades` array. Rewrite JSX:

**Hero section:**
- Dark gradient with `bg-grid`
- Watermark "ESPECIALIDADES"
- "Especialidades Médicas" as H1
- Description text about finding the right specialist

**Grid section:**
- `bg-white` or `bg-slate-50`
- 4-column grid (`lg:grid-cols-4`)
- Each card: icon, nome, descricao, specialist count badge, conditions list (first 3), "Ver médicos →" link to `/especialidades/${esp.slug}`
- Card hover: `hover:shadow-lg hover:-translate-y-1 transition-all duration-300`

**CTA section:**
- Dark gradient with grid overlay
- "Pronto para cuidar da sua saúde?" + dual buttons

**Step 2: Build check**

Run: `./node_modules/.bin/next build`
Expected: Builds with no errors.

**Step 3: Commit**

```bash
git add src/app/(site)/especialidades/page.tsx
git commit -m "feat: redesign Especialidades page with Healio visual language"
```

---

## Task 8: Specialty Detail Page (Dynamic Route)

**Files:**
- Create: `src/app/(site)/especialidades/[slug]/page.tsx`

**Step 1: Create the dynamic route page**

This page uses the Cardiology design as a template. It's a server component that reads the slug param and looks up data from `@/data/especialidades`.

```tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CheckCircle, Star, ArrowUpRight } from "lucide-react"
import { getEspecialidadeBySlug, getAllSlugs } from "@/data/especialidades"

// Generate static params for all specialties
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const esp = getEspecialidadeBySlug(params.slug)
  if (!esp) return { title: "Especialidade não encontrada" }
  return {
    title: `${esp.nome} - Clini+`,
    description: esp.descricao,
  }
}

export default function EspecialidadeDetailPage({ params }: { params: { slug: string } }) {
  const esp = getEspecialidadeBySlug(params.slug)
  if (!esp) notFound()

  const Icon = esp.icon

  return (
    <div className="flex flex-col">
      {/* Hero */}
      {/* Dark gradient + bg-grid + watermark esp.nome */}
      {/* H1: esp.nome, description: esp.descricaoLonga */}
      {/* CTAs: "Agendar Consulta" + "Ver Especialistas" */}

      {/* Services */}
      {/* 3-card grid from esp.servicos */}
      {/* Rating badge: 4.9 estrelas */}

      {/* Conditions */}
      {/* "Cuidado Completo" section with esp.condicoes */}

      {/* Testimonials */}
      {/* 3 cards from esp.depoimentos */}

      {/* CTA Final */}
      {/* "Sua saúde não pode esperar" */}
    </div>
  )
}
```

The full implementation follows the Cardiology design pattern with:
- Hero: dark gradient, bg-grid, watermark text of specialty name, Icon display, CTA buttons
- 3 feature/service cards in a grid
- Conditions grid (4 items)
- 3 testimonial cards with star ratings
- Final CTA section

**Step 2: Build check**

Run: `./node_modules/.bin/next build`
Expected: Builds with static pages generated for each specialty slug.

**Step 3: Commit**

```bash
git add src/app/(site)/especialidades/[slug]/page.tsx
git commit -m "feat: add dynamic specialty detail pages using Cardiology design template"
```

---

## Task 9: Home Page Redesign

**Files:**
- Modify: `src/app/(site)/page.tsx`

This is the largest single task. Full rewrite of the Home page JSX while keeping all data arrays unchanged.

**Step 1: Rewrite page.tsx**

Keep ALL data arrays (`beneficios`, `especialidades`, `diferenciais`, `etapas`, `depoimentos`, `faqs`) exactly as they are. Rewrite only the JSX returned by `HomePage()`.

**Hero:** Dark gradient `from-brand-900 via-brand-800 to-brand-900` with `bg-grid`. Watermark "CLINI+" text. Rating badge with star icon. H1 in white with cyan-400 accent. Description in brand-100. Two CTAs (pill buttons). Trust indicators (avatar circles).

**Benefits:** White bg, 4-column card grid with icon containers, hover lift effect.

**How It Works:** `bg-slate-50`, 3-step horizontal layout with step numbers, connecting arrows.

**Specialties:** White bg, 4-column cards with group hover (icon color change), condition checklist, "Agendar Consulta" link pointing to `/especialidades/${slug}` (map Cardiologia→cardiologia, etc.).

**Differentials:** `bg-slate-50`, 3-column grid with horizontal icon+text layout.

**Testimonials:** White bg, 3-column cards with star ratings, quotes, avatar+name.

**FAQ:** `bg-slate-50`, accordion with `<details>` elements.

**CTA Final:** Gradient `from-brand-600 to-brand-700` with `bg-grid`, white pill button.

**Step 2: Build check**

Run: `./node_modules/.bin/next build`
Expected: Builds with no errors.

**Step 3: Commit**

```bash
git add src/app/(site)/page.tsx
git commit -m "feat: redesign Home page with Healio visual language"
```

---

## Task 10: Sobre Page Redesign

**Files:**
- Modify: `src/app/(site)/sobre/page.tsx`

**Step 1: Rewrite sobre/page.tsx**

Keep ALL data arrays and text. Rewrite JSX with Healio patterns.

Sections: Hero (dark + grid + watermark), Stats (4 metric cards), Mission (2-col with narrative), Values (4 cards), Leadership (Dr. Richard card), Certifications (4 badge cards — NEW section), CTA (dark gradient).

**Step 2: Build check + Commit**

```bash
git add src/app/(site)/sobre/page.tsx
git commit -m "feat: redesign Sobre page with Healio visual language"
```

---

## Task 11: Seja Profissional Page Redesign

**Files:**
- Modify: `src/app/(site)/seja-profissional/page.tsx`

**Step 1: Rewrite seja-profissional/page.tsx**

CRITICAL: This is a `"use client"` component with form state management. Keep ALL:
- `useState` hooks (loading, sucesso, erro, formData, especialidades)
- `useEffect` for fetching especialidades
- `updateField()` function
- `handleSubmit()` function
- `TIPOS_REGISTRO` array
- `requisitos` array
- Form JSX (inputs, selects, validation) — update styling only

Rewrite surrounding sections with Healio patterns:
- Hero: dark gradient + bg-grid + watermark
- Benefits: 4 feature cards
- How It Works: 3-step process
- Requirements: checklist in card
- Form: update card styling (rounded-2xl, border, shadow)
- CTA: dark gradient

**Step 2: Build check + Commit**

```bash
git add src/app/(site)/seja-profissional/page.tsx
git commit -m "feat: redesign Seja Profissional page with Healio visual language"
```

---

## Task 12: Especialistas Page Redesign

**Files:**
- Modify: `src/app/(site)/especialistas/page.tsx`

**Step 1: Rewrite especialistas/page.tsx**

CRITICAL: This is a `"use client"` component with API data fetching. Keep ALL:
- `useState` hooks (profissionais, loading, erro, busca)
- `useEffect` for fetching profissionais
- `useMemo` for filtering
- `getInitials()` function
- `Profissional` interface
- Loading/error/empty states
- Search input logic

Rewrite visual presentation:
- Hero: dark gradient + bg-grid + watermark "ESPECIALISTAS"
- Search: styled input with icon
- Doctor grid: updated card styling matching Healio profile cards (avatar with ring, specialty badge, CTA button)
- CTA: "Seja um profissional Clini+"

**Step 2: Build check + Commit**

```bash
git add src/app/(site)/especialistas/page.tsx
git commit -m "feat: redesign Especialistas page with Healio visual language"
```

---

## Task 13: Contato + FAQ Page Touch-ups

**Files:**
- Modify: `src/app/(site)/contato/page.tsx`
- Modify: `src/app/(site)/faq/page.tsx`

**Step 1: Update Contato page hero**

Replace the light hero (white bg + decorative circles) with the dark gradient + bg-grid + watermark pattern. Keep all form logic and info cards.

**Step 2: Update FAQ page hero**

Same treatment: dark gradient + bg-grid + watermark for hero. Keep all category data, accordion logic.

**Step 3: Build check + Commit**

```bash
git add src/app/(site)/contato/page.tsx src/app/(site)/faq/page.tsx
git commit -m "feat: update Contato and FAQ pages with Healio hero pattern"
```

---

## Task 14: Final Build + Lint Verification

**Step 1: Run prisma generate**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && bunx prisma generate`

**Step 2: Run full build**

Run: `./node_modules/.bin/next build`
Expected: Build succeeds with no errors.

**Step 3: Run lint**

Run: `./node_modules/.bin/next lint`
Expected: No errors (warnings are OK).

**Step 4: Visual smoke test**

Run: `./node_modules/.bin/next dev`
Manually verify each page loads correctly:
- `/` — Hero with grid bg, watermark, all sections
- `/sobre` — Dark hero, stats, mission, values
- `/especialidades` — Dark hero, card grid with links
- `/especialidades/cardiologia` — Dynamic page renders
- `/seja-profissional` — Form works, validation works
- `/especialistas` — Search works, cards display
- `/contato` — Form works
- `/faq` — Accordion works

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: post-redesign build and lint fixes"
```
