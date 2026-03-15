# Homepage Redesign — Design Document

**Date:** 2026-03-02
**Scope:** Fix inconsistent sections on homepage (keep Hero + Pilares, redesign 6 other sections)

---

## Decisions

- **Quality standard:** Hero + Pilares are the reference (images, layout, animations)
- **Animations:** Scroll-triggered (Framer Motion) + micro-interactions (hover, counters, transitions)
- **Images:** Mix of better icons (duotone/outlined via Icons8) + real images where impactful
- **Colors:** Alternate backgrounds (white ↔ brand-50) between sections; brand-900/600 for highlights
- **Font:** Replace Inter → Outfit (geometric, modern personality)

---

## Global Changes

### Font: Inter → Outfit
- Update `src/app/layout.tsx`: import Outfit from `next/font/google`
- Update `tailwind.config.js`: `fontFamily.sans` to use Outfit variable
- Outfit weights: 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### ScrollReveal Component
- Create `src/components/ui/ScrollReveal.tsx`
- Uses Framer Motion `useInView` + `motion.div`
- Props: `direction` (up/left/right/fade), `delay`, `stagger`, `children`
- Variants: fade-up (translateY 40px → 0), fade-in (opacity 0→1), scale-in (0.95→1)

### Spacing Standardization
- Normal sections: `py-20 lg:py-28`
- Highlight sections (Pricing, CTA): `py-24 lg:py-32`
- Remove all `lg:pt-0` overrides

---

## Section Redesigns

### 1. FLUXO (Flow / Steps)

**Current issues:** Same white bg as Pilares, generic Lucide icons, no animation, no visual differentiation.

**Changes:**
- Background: `bg-white` → `bg-brand-50`
- Cards: Add `bg-white rounded-2xl ring-1 ring-brand-100 p-6` wrapper
- Icons: Replace generic Lucide with Icons8 duotone icons (UserPlus, Stethoscope, Calendar, Video)
- Connector: Replace dashed line with solid animated line (Framer Motion draw)
- Animation: ScrollReveal wrapper, cards stagger 150ms each
- Micro-interaction: Card hover `translateY(-4px)` + shadow-md

### 2. ESPECIALIDADES (Specialists)

**Current issues:** `lg:pt-0` inconsistent spacing, no entrance animation, placeholder trust logos.

**Changes:**
- Spacing: `py-24 lg:pb-24 lg:pt-0` → `py-20 lg:py-28`
- Photo grid (desktop): Stagger animation — each photo fade-in + scale(0.9→1), 100ms delay
- Specialty cards: ScrollReveal stagger, smoother hover transition (300ms → 500ms ease-out)
- Trust logos: Remove gray placeholders or replace with real badges (CFM, LGPD, SSL)

### 3. PRICING (Price)

**Current issues:** Static card, no animation, no visual impact on scroll.

**Changes:**
- Keep `bg-brand-900` background
- Card entrance: ScrollReveal scale-in (0.95→1) + fade-up
- Animated counter: Price R$0 → R$149,90 on viewport enter (Framer Motion useMotionValue)
- Badge: Add slide animation (existing CSS)
- CTA button: Hover scale(1.02) + glow shadow (brand-400/30)
- Features list: Stagger 100ms on checkmark items

### 4. TESTIMONIALS (Reviews)

**Current issues:** `lg:pt-0` spacing, static cards, non-functional navigation, static progress bar.

**Changes:**
- Background: `bg-white` → `bg-brand-50`
- Spacing: Standardize `py-20 lg:py-28`
- Cards: `bg-slate-100` → `bg-white` (contrast against brand-50 bg), add shadow-sm
- Carousel: Implement with Framer Motion AnimatePresence — swipe animation, auto-play 5s
- Progress bar: Animate fill based on active card (1/3 → 2/3 → 3/3)
- QuoteMark SVG: Add as decorative element in each card
- Stars: Sequential scale-in micro-animation

### 5. FAQ (Frequently Asked Questions)

**Current issues:** Native `<details>` without smooth expand/collapse, no entrance animation.

**Changes:**
- Keep white background (natural after brand-50 testimonials)
- Accordion: Replace `<details>` with Framer Motion AnimatePresence for smooth height animation (300ms ease-out)
- Layout: Keep 3 columns, add ScrollReveal stagger on items
- Micro-interaction: ChevronDown spring rotation instead of abrupt transition
- Visual: Add `hover:ring-brand-200` for clearer feedback

### 6. CTA FINAL (Final Call-to-Action)

**Current issues:** Static, no entrance animation, grid pattern too opaque.

**Changes:**
- Keep `bg-brand-600` background
- Animation: ScrollReveal — heading fade-up, buttons fade-in with 200ms delay
- Grid pattern: Reduce opacity 0.08 → 0.05, add subtle parallax (light translateY on scroll)
- Button micro-interactions: Hover scale(1.02) + shadow glow

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/layout.tsx` | Edit | Replace Inter with Outfit font |
| `tailwind.config.js` | Edit | Update font-sans to Outfit variable |
| `src/components/ui/ScrollReveal.tsx` | Create | Reusable scroll-triggered animation wrapper |
| `src/components/ui/AnimatedCounter.tsx` | Create | Animated number counter for pricing |
| `src/components/ui/Accordion.tsx` | Create | Framer Motion accordion component |
| `src/components/ui/TestimonialCarousel.tsx` | Create | Functional carousel with auto-play |
| `src/app/(site)/page.tsx` | Edit | Apply all section redesigns |
| `src/app/globals.css` | Edit | Minor tweaks (grid opacity, new utility classes if needed) |

---

## Non-Goals
- No changes to Hero or Pilares sections
- No changes to Header or Footer
- No structural changes to Sanity CMS schema
- No changes to other pages
