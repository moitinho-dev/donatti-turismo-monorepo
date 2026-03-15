# Clini+ Site Redesign — Healio Visual Language

**Date**: 2026-02-20
**Status**: Approved
**Scope**: All public (site) pages + Header/Footer + new dynamic specialty route

## Summary

Apply the Healio design system to all Clini+ public-facing pages. Keep all existing text content (Brazilian Portuguese) and functional logic (forms, API calls, search). Replace the visual presentation with Healio's modern patterns: grid backgrounds, watermark text, view transitions, cyan accents, and polished card layouts.

## Design System

### Colors

Keep existing `brand` palette (already matches Healio primary blues). Add cyan accent:

```
cyan-400: #22d3ee
cyan-500: #06b6d4
```

### Typography

Keep Outfit font (already configured). Apply Healio sizing patterns:
- Watermark text: `clamp(8rem, 20vw, 24rem)`, weight 800, letter-spacing -0.05em, line-height 0.8, color #f1f5f9, user-select none
- Section headings: text-4xl to text-6xl, font-bold/extrabold
- Body: text-base to text-lg, text-slate-500/600

### Visual Patterns

1. **Grid background**: `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)` at 40px intervals — applied on dark hero sections
2. **Watermark text**: Large faded text behind hero sections, non-selectable
3. **View transitions**: `@view-transition { navigation: auto }` with 0.25s fade animations
4. **Card hover**: `hover:shadow-md hover:-translate-y-1 transition-all`
5. **CTA buttons**: `rounded-full` pill shape, `shadow-lg shadow-brand-600/20`

## Pages

### Header Component

- Sticky, white bg, border-b
- Nav items: Home, Sobre Nós, Especialidades, Nossos Especialistas, Seja um Profissional
- Desktop: logo left, nav center, CTA right (Entrar + Agendar Consulta pill button)
- Mobile: hamburger menu with same items
- Keep CLINI+ logo SVG

### Footer Component

- Dark blue bg (brand-900) with grid pattern overlay
- 4-column link grid: Produto, Serviços, Empresa, Legal
- Social icons row (Instagram, Facebook, LinkedIn)
- Copyright bar at bottom
- Keep existing link destinations, update styling

### Home Page (`/`)

Sections (in order):
1. **Hero**: Grid bg on brand-600/700/900 gradient, watermark "CLINI+" text, rating badge (4.9 stars), headline + description, dual CTA buttons, trust indicators
2. **Benefits**: 4 cards (Rápido e Conveniente, Médicos Certificados, Seguro e Privado, Preços Acessíveis) — keep existing text
3. **How It Works**: 3-step process (Crie sua conta, Escolha o especialista, Consulte online) — keep existing text
4. **Specialties**: 4 specialty cards (Cardiologia, Clínica Geral, Reumatologia, Emagrecimento) — keep existing text, add "Ver médicos" links
5. **Differentials**: 6 items (Acompanhamento contínuo, etc.) — keep existing text
6. **Testimonials**: 3 cards (Maria S., João P., Ana L.) — keep existing text
7. **FAQ**: Accordion (6 items) — keep existing text
8. **CTA Final**: Brand-600 bg, "Pronto para cuidar da sua saúde?"

### Sobre Page (`/sobre`)

Sections:
1. **Hero**: "Nossa Essência" / "Sobre a Clini+" with watermark
2. **Stats**: 4 metric cards (3.000+ consultas, 50+ profissionais, 98% satisfação, 24h agendamento) — keep existing numbers
3. **Mission**: "Saúde de qualidade ao alcance de todos" with Dr. Richard founding narrative — keep existing text
4. **Values**: 4 cards (Acessibilidade, Qualidade, Segurança, Humanização) — keep existing text
5. **Leadership**: Dr. Richard Ramos profile — keep existing text
6. **Certifications**: LGPD, RQE, Criptografia badges (new visual element)
7. **CTA**: Dual buttons

### Especialidades Page (`/especialidades`)

Sections:
1. **Hero**: "Especialidades Médicas" with watermark, grid bg
2. **Grid**: 8 specialty cards (keep existing 8: Cardiologia, Clínica Geral, Reumatologia, Emagrecimento, Dermatologia, Endocrinologia, Ortopedia, Psiquiatria) — each with icon, description, conditions list, specialist count, "Ver médicos" CTA link to `/especialidades/[slug]`
3. **CTA**: "Pronto para cuidar da sua saúde?"

### Seja Profissional Page (`/seja-profissional`)

Sections:
1. **Hero**: "Faça parte da Clini+" with grid bg, watermark
2. **Benefits**: 4 cards (Flexibilidade, Renda Extra, Tecnologia, Suporte) — keep existing text
3. **How It Works**: 3-step process (Cadastro, Aprovação, Atendimento) — keep existing text
4. **Requirements**: Checklist — keep existing items
5. **Registration Form**: Keep ALL existing form logic (useState, fetch, validation, success/error states, especialidades API call). Update visual styling only.
6. **CTA**: "Pronto para começar?"

### Especialistas Page (`/especialistas`)

Sections:
1. **Hero**: "Nossos Especialistas" with grid bg, watermark
2. **Search**: Keep existing search input + filter logic
3. **Doctor Grid**: Keep existing API-driven grid. Update card styling to match Healio doctor profiles (avatar, name, specialty, registration, bio, CTA)
4. **CTA**: "Seja um profissional Clini+"

### NEW: Specialty Detail Page (`/especialidades/[slug]`)

Dynamic route using Cardiology design as template:
1. **Hero**: Specialty name + description, grid bg, watermark
2. **Feature Cards**: 3 service highlights specific to each specialty
3. **Conditions**: 4 condition types treated
4. **Specialists**: Filtered doctor profiles for this specialty (API call)
5. **Testimonials**: Specialty-specific patient quotes
6. **CTA**: "Agende sua consulta"

Data source: Static data object mapping slugs to specialty content (using existing text from especialidades array + new feature/condition descriptions).

## Files Changed

### Modified
- `tailwind.config.js` — add cyan accent colors, view-transition CSS
- `src/app/globals.css` — add grid-bg utility class, view-transition styles, watermark styles
- `src/components/layout/Header.tsx` — redesign with Healio nav pattern
- `src/components/layout/Footer.tsx` — redesign with dark footer pattern
- `src/app/(site)/page.tsx` — full visual redesign
- `src/app/(site)/sobre/page.tsx` — full visual redesign
- `src/app/(site)/especialidades/page.tsx` — full visual redesign
- `src/app/(site)/seja-profissional/page.tsx` — visual redesign (keep form logic)
- `src/app/(site)/especialistas/page.tsx` — visual redesign (keep API logic)

### Created
- `src/app/(site)/especialidades/[slug]/page.tsx` — new dynamic specialty page
- `src/data/especialidades.ts` — specialty data (slugs, descriptions, features, conditions)

## Constraints

- Next.js 14.2.5 (no App Router features beyond what's available)
- Tailwind 3.x (no v4 features)
- No new dependencies — all visual changes are CSS/Tailwind
- Preserve all existing API integrations and form logic
- Keep Outfit font (don't switch to Inter)
