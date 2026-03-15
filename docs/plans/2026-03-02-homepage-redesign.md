# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix inconsistent homepage sections — standardize font (Outfit), alternate backgrounds, add scroll-triggered animations with Framer Motion, replace generic Lucide icons with Icons8 duotone icons, and add micro-interactions.

**Architecture:** The homepage is a single Server Component (`src/app/(site)/page.tsx`) with all 8 sections inline. We'll extract animated client components into `src/components/home/` and shared animation utilities into `src/components/ui/`. The page.tsx remains a Server Component that passes data to client children.

**Tech Stack:** Next.js 14, Framer Motion (already installed), Tailwind CSS 3, Icons8 PNGs (already in `/public/`), Outfit font (Google Fonts).

---

## Task 1: Switch font from Inter to Outfit

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.js`
- Modify: `src/app/globals.css:118`

**Step 1: Update layout.tsx**

Replace the Inter import and config with Outfit:

```tsx
// src/app/layout.tsx
import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    default: "Clini+ - Consultas online com especialistas",
    template: "%s | Clini+"
  },
  description: "Plataforma de telemedicina completa para pacientes e profissionais de saúde.",
  metadataBase: new URL("https://clinimais.com"),
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Step 2: Update tailwind.config.js**

Change font-sans variable:

```js
fontFamily: {
  sans: ["var(--font-outfit)", "system-ui", "sans-serif"]
},
```

**Step 3: Update globals.css**

Change line 118 from `var(--font-inter)` to `var(--font-outfit)`:

```css
body {
  font-family: var(--font-outfit), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

Also update `.doc-editor` (line 186):

```css
.doc-editor {
  font-family: var(--font-outfit), system-ui, -apple-system, sans-serif;
}
```

**Step 4: Verify build**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && ./node_modules/.bin/next build`
Expected: Build succeeds, font renders as Outfit.

**Step 5: Commit**

```bash
git add src/app/layout.tsx tailwind.config.js src/app/globals.css
git commit -m "feat: switch font from Inter to Outfit"
```

---

## Task 2: Create ScrollReveal component

**Files:**
- Create: `src/components/ui/ScrollReveal.tsx`

**Step 1: Create the component**

```tsx
// src/components/ui/ScrollReveal.tsx
"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

type Direction = "up" | "down" | "left" | "right" | "fade" | "scale"

interface ScrollRevealProps {
  children: React.ReactNode
  direction?: Direction
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

const variants: Record<Direction, { hidden: object; visible: object }> = {
  up: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants[direction]}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
  once?: boolean
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
  once = true,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  direction = "up",
  className,
}: {
  children: React.ReactNode
  direction?: Direction
  className?: string
}) {
  return (
    <motion.div
      variants={variants[direction]}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/ui/ScrollReveal.tsx
git commit -m "feat: add ScrollReveal, StaggerContainer, and StaggerItem components"
```

---

## Task 3: Create AnimatedCounter component

**Files:**
- Create: `src/components/ui/AnimatedCounter.tsx`

**Step 1: Create the component**

```tsx
// src/components/ui/AnimatedCounter.tsx
"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring, motion } from "framer-motion"

interface AnimatedCounterProps {
  target: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.5,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  })

  useEffect(() => {
    if (isInView) {
      motionValue.set(target)
    }
  }, [isInView, motionValue, target])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        const formatted = Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest)
        ref.current.textContent = `${prefix}${formatted}${suffix}`
      }
    })
    return unsubscribe
  }, [springValue, prefix, suffix, decimals])

  return (
    <motion.span ref={ref} className={className}>
      {prefix}0{suffix}
    </motion.span>
  )
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`

**Step 3: Commit**

```bash
git add src/components/ui/AnimatedCounter.tsx
git commit -m "feat: add AnimatedCounter component with spring animation"
```

---

## Task 4: Create Accordion component (replace native details)

**Files:**
- Create: `src/components/ui/Accordion.tsx`

**Step 1: Create the component**

```tsx
// src/components/ui/Accordion.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface AccordionItemProps {
  question: string
  answer: string
}

export function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-900/5 overflow-hidden transition-colors hover:ring-brand-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between p-5 text-left font-medium text-slate-900 hover:bg-slate-100 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold pr-4">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <p className="text-sm text-slate-500 leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`

**Step 3: Commit**

```bash
git add src/components/ui/Accordion.tsx
git commit -m "feat: add animated Accordion component with Framer Motion"
```

---

## Task 5: Create TestimonialCarousel component

**Files:**
- Create: `src/components/home/TestimonialCarousel.tsx`

**Step 1: Create the component**

```tsx
// src/components/home/TestimonialCarousel.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Star } from "lucide-react"

interface Testimonial {
  _key: string
  quote: string
  name: string
  info?: string
}

interface TestimonialCarouselProps {
  items: Testimonial[]
}

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" width="48" height="36" className={className}>
      <path
        d="M11.5 35.5c-2.2 0-4.2-.55-5.9-1.65C3.87 32.68 2.5 31.07 1.47 29.01.45 26.95 0 24.6 0 21.97c0-2.41.41-4.75 1.24-7.02.9-2.27 2.17-4.37 3.82-6.3A27 27 0 0 1 10.75 3.5C12.97 1.79 15.38.69 18 0l5.06 6.3c-2.96 1.17-5.34 2.72-7.13 4.65-1.72 1.93-2.58 3.58-2.58 4.96 0 .62.17 1.31.52 2.07.41.69 1.2 1.41 2.38 2.17 1.72 1.1 2.89 2.27 3.51 3.51.69 1.17 1.03 2.51 1.03 4.03 0 2.34-.9 4.2-2.69 5.58-1.72 1.31-3.75 2.07-6.1 2.07Zm31.14 0c-2.2 0-4.17-.55-5.9-1.65-1.72-1.17-3.1-2.79-4.13-4.84-1.03-2.07-1.47-4.41-1.47-7.04 0-2.41.41-4.75 1.24-7.02.9-2.27 2.17-4.37 3.82-6.3a27 27 0 0 1 5.69-5.16C44.1 1.79 46.52.69 49.14 0l5.06 6.3c-2.96 1.17-5.34 2.72-7.13 4.65-1.72 1.93-2.58 3.58-2.58 4.96 0 .62.17 1.31.52 2.07.41.69 1.2 1.41 2.38 2.17 1.72 1.1 2.89 2.27 3.51 3.51.69 1.17 1.03 2.51 1.03 4.03 0 2.34-.9 4.2-2.69 5.58-1.72 1.31-3.75 2.07-6.1 2.07Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function TestimonialCarousel({ items }: TestimonialCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const pageSize = 3
  const totalPages = Math.ceil(items.length / pageSize)

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalPages)
  }, [totalPages])

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }, [totalPages])

  // Auto-play every 5 seconds
  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const currentItems = items.slice(
    activeIndex * pageSize,
    activeIndex * pageSize + pageSize
  )

  return (
    <div className="flex flex-col gap-16">
      {/* Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-6 md:grid-cols-3"
        >
          {currentItems.map((dep) => (
            <figure
              key={dep._key}
              className="flex flex-col justify-between rounded-2xl bg-white p-8 min-h-[320px] shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div>
                <QuoteMark className="text-brand-100 mb-4" />
                <blockquote>
                  <p className="text-slate-600 text-lg font-medium leading-7">
                    &ldquo;{dep.quote}&rdquo;
                  </p>
                </blockquote>
              </div>
              <figcaption className="flex items-center justify-between mt-auto pt-8">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-600 text-brand-600" />
                  ))}
                </div>
                <span className="text-slate-900 text-sm font-bold">
                  {dep.name}{dep.info ? ` – ${dep.info}` : ""}
                </span>
              </figcaption>
            </figure>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar + navigation */}
      <div className="flex items-center gap-8">
        <div className="flex-1 h-1 bg-slate-200 rounded-full relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-1 bg-brand-600 rounded-full"
            animate={{ width: `${((activeIndex + 1) / totalPages) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={prev}
            aria-label="Anterior"
            className="p-2.5 bg-slate-900 rounded-full text-white rotate-180 hover:bg-brand-600 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo"
            className="p-2.5 bg-slate-900 rounded-full text-white hover:bg-brand-600 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`

**Step 3: Commit**

```bash
git add src/components/home/TestimonialCarousel.tsx
git commit -m "feat: add TestimonialCarousel with auto-play and animated transitions"
```

---

## Task 6: Create FlowSection client component

**Files:**
- Create: `src/components/home/FlowSection.tsx`

This extracts the Flow section into a client component with scroll animations, Icons8 icons, and micro-interactions.

**Step 1: Create the component**

```tsx
// src/components/home/FlowSection.tsx
"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Icons8Icon } from "@/components/ui/Icons8Icon"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal"

interface FlowStep {
  _key: string
  icon: string
  numero: number
  title: string
  description: string
}

interface FlowSectionProps {
  badge?: string
  heading?: string
  subtitle?: string
  steps?: FlowStep[]
  ctaText?: string
}

// Map Sanity icon names to Icons8 PNG paths in /public/
const icons8Map: Record<string, string> = {
  UserPlus: "/icons8-profile-100.png",
  Stethoscope: "/icons8-treatment-100.png",
  Calendar: "/icons8-calendar-100.png",
  Video: "/icons8-laptop-webcam-100.png",
}

function getIcons8Src(iconName: string): string {
  return icons8Map[iconName] || "/icons8-treatment-100.png"
}

export function FlowSection({ badge, heading, subtitle, steps, ctaText }: FlowSectionProps) {
  return (
    <section className="bg-brand-50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center mb-16">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-100 shadow-sm">
            {badge || "Fluxo de Atendimento"}
          </span>
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 mt-4 md:text-4xl">
            {heading || "Menos de 3 minutos para agendar"}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-slate-500 leading-8 tracking-tight">
              {subtitle}
            </p>
          )}
        </ScrollReveal>

        <StaggerContainer staggerDelay={0.15} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {steps?.map((etapa, index) => (
            <StaggerItem key={etapa._key} direction="up">
              <div className="text-center relative group">
                {/* Connector line */}
                {index < (steps?.length || 0) - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-brand-200" />
                )}
                {/* Icon */}
                <div className="relative mb-5 mx-auto w-16 h-16 rounded-2xl bg-white flex items-center justify-center ring-1 ring-brand-100 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                  <Icons8Icon src={getIcons8Src(etapa.icon)} size={28} />
                </div>
                <span className="inline-block mb-3 text-xs font-bold text-brand-600 bg-white px-3 py-1 rounded-full ring-1 ring-brand-100">
                  Passo {etapa.numero}
                </span>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{etapa.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{etapa.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal direction="up" delay={0.4} className="mt-16 text-center">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg hover:scale-[1.02]"
          >
            {ctaText || "Criar Conta e Agendar"} <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`

**Step 3: Commit**

```bash
git add src/components/home/FlowSection.tsx
git commit -m "feat: add FlowSection with Icons8 icons and scroll animations"
```

---

## Task 7: Create PricingSection client component

**Files:**
- Create: `src/components/home/PricingSection.tsx`

**Step 1: Create the component**

```tsx
// src/components/home/PricingSection.tsx
"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className || "h-6 w-6 shrink-0 fill-current stroke-current"}>
      <path
        d="M9.307 12.248a.75.75 0 1 0-1.114 1.004l1.114-1.004ZM11 15.25l-.557.502a.75.75 0 0 0 1.15-.043L11 15.25Zm4.844-5.041a.75.75 0 0 0-1.188-.918l1.188.918Zm-7.651 3.043 2.25 2.5 1.114-1.004-2.25-2.5-1.114 1.004Zm3.4 2.457 4.25-5.5-1.187-.918-4.25 5.5 1.188.918Z"
        strokeWidth="0"
      />
      <circle cx="12" cy="12" r="8.25" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface Badge {
  _key: string
  icon: string
  label: string
}

interface PricingSectionProps {
  badge?: string
  heading?: string
  subtitle?: string
  priceLabel?: string
  price?: string
  priceSuffix?: string
  badges?: Badge[]
  ctaText?: string
}

export function PricingSection({
  badge, heading, subtitle, priceLabel, price, priceSuffix, badges, ctaText,
}: PricingSectionProps) {
  return (
    <section className="bg-brand-900 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center mb-16">
          <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-cyan-400 ring-1 ring-white/20 backdrop-blur-sm">
            {badge || "Precificação Transparente"}
          </span>
          <h2 className="text-3xl font-medium tracking-tight text-white mt-4 md:text-4xl lg:text-[48px] lg:leading-tight">
            {heading || "Consultas com especialistas por um valor justo"}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-brand-200 leading-8 tracking-tight">
              {subtitle}
            </p>
          )}
        </ScrollReveal>

        <ScrollReveal direction="scale" className="mx-auto max-w-md">
          <div className="bg-brand-600 rounded-3xl p-10 text-center ring-1 ring-white/20 shadow-2xl">
            <p className="text-white/80 text-sm font-medium mb-1">{priceLabel || "por consulta"}</p>
            <p className="text-5xl font-light tracking-tight text-white md:text-6xl">
              <AnimatedCounter
                target={149}
                prefix="R$ "
                className="text-5xl font-light tracking-tight text-white md:text-6xl"
              />
              <span className="text-3xl md:text-4xl">{priceSuffix || ",90"}</span>
            </p>

            {badges && (
              <StaggerContainer staggerDelay={0.1} className="mt-8 flex flex-col gap-3 text-left">
                {badges.map((b: Badge) => (
                  <StaggerItem key={b._key} direction="up">
                    <li className="flex items-center gap-3 text-white text-sm list-none">
                      <CheckIcon className="h-6 w-6 shrink-0 text-white" />
                      <span>{b.label}</span>
                    </li>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            <Link
              href="/cadastro"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl hover:scale-[1.02]"
            >
              {ctaText || "Criar Conta e Agendar"} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`

**Step 3: Commit**

```bash
git add src/components/home/PricingSection.tsx
git commit -m "feat: add PricingSection with animated counter and scroll reveal"
```

---

## Task 8: Create FAQSection client component

**Files:**
- Create: `src/components/home/FAQSection.tsx`

**Step 1: Create the component**

```tsx
// src/components/home/FAQSection.tsx
"use client"

import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal"
import { AccordionItem } from "@/components/ui/Accordion"

interface FAQItem {
  _key: string
  question: string
  answer: string
}

interface FAQSectionProps {
  badge?: string
  heading?: string
  subtitle?: string
  items?: FAQItem[]
}

export function FAQSection({ badge, heading, subtitle, items }: FAQSectionProps) {
  return (
    <section className="bg-white relative overflow-hidden py-20 lg:py-28">
      <div className="mx-auto max-w-7xl relative px-4 lg:px-8">
        <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center lg:text-left lg:mx-0 mb-16">
          <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-100">
            {badge || "Dúvidas Frequentes"}
          </span>
          <h2 className="text-3xl font-medium tracking-tight text-slate-900 mt-4 md:text-4xl">
            {heading || "Tire suas dúvidas"}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-slate-500 leading-8 tracking-tight">
              {subtitle}
            </p>
          )}
        </ScrollReveal>

        <StaggerContainer staggerDelay={0.08} className="grid gap-x-8 gap-y-4 lg:grid-cols-3">
          {items?.map((item) => (
            <StaggerItem key={item._key} direction="up">
              <AccordionItem question={item.question} answer={item.answer} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
```

**Step 2: Verify build**

Run: `./node_modules/.bin/next build`

**Step 3: Commit**

```bash
git add src/components/home/FAQSection.tsx
git commit -m "feat: add FAQSection with animated accordion and stagger reveal"
```

---

## Task 9: Create SpecialtiesSection client wrapper and CTASection client component

**Files:**
- Create: `src/components/home/SpecialtiesGrid.tsx`
- Create: `src/components/home/CTASection.tsx`

**Step 1: Create SpecialtiesGrid (animated wrapper for the specialty cards)**

```tsx
// src/components/home/SpecialtiesGrid.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal"

interface Especialidade {
  id: string
  nome: string
  descricao: string | null
}

interface SpecialtiesGridProps {
  especialidades: Especialidade[]
}

const specialtyPhotos: Record<string, string> = {
  "Cardiologia": "photo-1628348068343-eb9c7bd51d6d",
  "Clínica Geral": "photo-1666214280557-091c627863ec",
  "Reumatologia": "photo-1579684385127-1ef15d508118",
  "Emagrecimento": "photo-1571019613454-1cb2f99b2d8b",
}

const fallbackPhotos = [
  "photo-1631217868264-e5b90bb7e133",
  "photo-1516549655169-df83a0774514",
  "photo-1530497610245-94d3c16cda28",
  "photo-1581595220892-b0739db3ba8c",
]

export function SpecialtiesGrid({ especialidades }: SpecialtiesGridProps) {
  return (
    <StaggerContainer staggerDelay={0.12} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {especialidades.map((esp, index) => {
        const photoId = specialtyPhotos[esp.nome] || fallbackPhotos[index % fallbackPhotos.length]
        return (
          <StaggerItem key={esp.id} direction="up">
            <Link
              href="/cadastro"
              className="group relative rounded-2xl overflow-hidden min-h-[280px] flex flex-col justify-end transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
            >
              <Image
                src={`https://images.unsplash.com/${photoId}?w=400&h=500&fit=crop&q=80`}
                alt={esp.nome}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent group-hover:from-brand-900/90 group-hover:via-brand-900/40 transition-all duration-500" />
              <div className="relative z-10 p-6 flex flex-col gap-2">
                <h3 className="text-lg font-bold text-white">{esp.nome}</h3>
                <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                  {esp.descricao || "Consulta com especialista por telemedicina."}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white mt-2 group-hover:gap-3 transition-all duration-300">
                  Agendar <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </StaggerItem>
        )
      })}
    </StaggerContainer>
  )
}
```

**Step 2: Create CTASection**

```tsx
// src/components/home/CTASection.tsx
"use client"

import Link from "next/link"
import { ArrowUpRight, ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

interface CTASectionProps {
  heading?: string
  subtitle?: string
  ctaPrimary?: string
  ctaSecondary?: string
}

export function CTASection({ heading, subtitle, ctaPrimary, ctaSecondary }: CTASectionProps) {
  return (
    <section className="bg-brand-600 relative overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />
      <div className="relative mx-auto max-w-xl px-4 text-center">
        <ScrollReveal direction="up">
          <h2 className="text-3xl font-medium tracking-tight text-white md:text-4xl lg:text-[40px]">
            {heading || "Inicie seu acompanhamento clínico"}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-white/80 leading-8 tracking-tight">
              {subtitle}
            </p>
          )}
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl hover:scale-[1.02]"
            >
              {ctaPrimary || "Criar Conta e Agendar"} <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/seja-profissional"
              className="inline-flex items-center gap-2 rounded-full ring-1 ring-white/30 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:scale-[1.02]"
            >
              {ctaSecondary || "Para Profissionais"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
```

**Step 3: Verify build**

Run: `./node_modules/.bin/next build`

**Step 4: Commit**

```bash
git add src/components/home/SpecialtiesGrid.tsx src/components/home/CTASection.tsx
git commit -m "feat: add SpecialtiesGrid and CTASection with animations"
```

---

## Task 10: Update page.tsx — integrate all new components

**Files:**
- Modify: `src/app/(site)/page.tsx`

This is the main integration task. Replace the inline sections with the new client components while keeping Hero + Pilares untouched.

**Step 1: Update imports at the top of page.tsx**

Replace lines 1-15 with:

```tsx
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  ArrowUpRight,
  Play,
} from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { sanityClient } from "../../../sanity/lib/client"
import { homePageQuery } from "../../../sanity/lib/queries"
import { FlowSection } from "@/components/home/FlowSection"
import { PricingSection } from "@/components/home/PricingSection"
import { TestimonialCarousel } from "@/components/home/TestimonialCarousel"
import { FAQSection } from "@/components/home/FAQSection"
import { SpecialtiesGrid } from "@/components/home/SpecialtiesGrid"
import { CTASection } from "@/components/home/CTASection"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
```

**Step 2: Remove QuoteMark and CheckIcon functions (lines 18-37)**

These are now inside their respective components.

**Step 3: Remove unused imports**

Remove `Star`, `ChevronDown`, `Check` from lucide-react imports (no longer needed in page.tsx).
Remove `getIconForEspecialidade` and `getIcon` imports (no longer needed in page.tsx).

**Step 4: Replace FLUXO section (lines 233-277)**

Replace the entire section with:

```tsx
      {/* ════════════════════════════════════════════════════════════════════
          FLUXO  —  Steps with Icons8 icons and scroll animations
      ════════════════════════════════════════════════════════════════════ */}
      <FlowSection
        badge={flow?.badge}
        heading={flow?.heading}
        subtitle={flow?.subtitle}
        steps={flow?.steps}
        ctaText={flow?.ctaText}
      />
```

**Step 5: Update ESPECIALIDADES section (lines 282-426)**

Change the section wrapper from `py-24 lg:pb-24 lg:pt-0` to `py-20 lg:py-28`.

Replace the specialty cards grid (lines 379-423) with:

```tsx
            {/* Specialty cards grid — animated */}
            <SpecialtiesGrid especialidades={especialidades} />
```

Remove the trust logo placeholders (lines 323-327) and replace with real badges:

```tsx
                {/* Trust badges */}
                <div className="flex items-center gap-6">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">CFM 2.314/2022</span>
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">LGPD</span>
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">SSL Seguro</span>
                </div>
```

Wrap the staggered photo grid in a ScrollReveal with `direction="fade"`.

**Step 6: Replace PRICING section (lines 431-475)**

Replace the entire section with:

```tsx
      {/* ════════════════════════════════════════════════════════════════════
          PREÇO  —  Animated pricing card with counter
      ════════════════════════════════════════════════════════════════════ */}
      <PricingSection
        badge={pricing?.badge}
        heading={pricing?.heading}
        subtitle={pricing?.subtitle}
        priceLabel={pricing?.priceLabel}
        price={pricing?.price}
        priceSuffix={pricing?.priceSuffix}
        badges={pricing?.badges}
        ctaText={pricing?.ctaText}
      />
```

**Step 7: Replace TESTIMONIALS section (lines 480-542)**

Replace the entire section with:

```tsx
      {/* ════════════════════════════════════════════════════════════════════
          DEPOIMENTOS  —  Carousel with auto-play and animations
      ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-brand-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-20">
          <div className="flex flex-col gap-16">
            <ScrollReveal direction="up">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.4] tracking-tight max-w-4xl">
                <span className="text-slate-900">
                  {testimonials?.heading?.split(" ").slice(0, 6).join(" ") || "Quem usa a Clini+ recomenda"}
                </span>
                <br />
                <span className="text-brand-900">
                  {testimonials?.heading?.split(" ").slice(6).join(" ") || "para um atendimento rápido, discreto e profissional"}
                </span>
              </h2>
            </ScrollReveal>

            {testimonials?.items && (
              <TestimonialCarousel items={testimonials.items} />
            )}
          </div>
        </div>
      </section>
```

**Step 8: Replace FAQ section (lines 547-581)**

Replace with:

```tsx
      {/* ════════════════════════════════════════════════════════════════════
          FAQ  —  Animated accordion with stagger
      ════════════════════════════════════════════════════════════════════ */}
      <FAQSection
        badge={faq?.badge}
        heading={faq?.heading}
        subtitle={faq?.subtitle}
        items={faq?.items}
      />
```

**Step 9: Replace CTA FINAL section (lines 586-610)**

Replace with:

```tsx
      {/* ════════════════════════════════════════════════════════════════════
          CTA FINAL  —  Animated final call-to-action
      ════════════════════════════════════════════════════════════════════ */}
      <CTASection
        heading={cta?.heading}
        subtitle={cta?.subtitle}
        ctaPrimary={cta?.ctaPrimary}
        ctaSecondary={cta?.ctaSecondary}
      />
```

**Step 10: Verify build**

Run: `./node_modules/.bin/next build`
Expected: Clean build with no errors.

**Step 11: Commit**

```bash
git add src/app/(site)/page.tsx
git commit -m "feat: integrate animated homepage components — flow, pricing, testimonials, FAQ, CTA"
```

---

## Task 11: Visual QA and final adjustments

**Files:**
- Potentially modify: Any of the files above

**Step 1: Start dev server and check each section**

Run: `cd "/Users/eumoitinho/Work/Ninetwo Perfomance /Clientes/clini-plus" && ./node_modules/.bin/next dev`

Open `http://localhost:3000` in browser.

**Step 2: Verify checklist**

- [ ] Font is Outfit everywhere (headings, body, buttons)
- [ ] Hero + Pilares are unchanged
- [ ] Flow section has brand-50 background, Icons8 icons, scroll animation, card hover
- [ ] Especialidades section has correct spacing (py-20 lg:py-28), animated grid, trust badges text
- [ ] Pricing has animated counter, scale-in entrance, button hover glow
- [ ] Testimonials has brand-50 background, white cards, working carousel, animated progress bar
- [ ] FAQ has smooth expand/collapse animation, stagger entrance, hover ring
- [ ] CTA has fade-up entrance, button hover scale, reduced grid opacity
- [ ] No spacing inconsistencies between sections
- [ ] Mobile responsive — all sections look good on small screens

**Step 3: Fix any issues found**

Apply corrections as needed.

**Step 4: Full build verification**

Run: `bunx prisma generate && ./node_modules/.bin/next build && ./node_modules/.bin/next lint`

**Step 5: Final commit**

```bash
git add -A
git commit -m "fix: visual QA adjustments for homepage redesign"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Switch Inter → Outfit font | layout.tsx, tailwind.config.js, globals.css |
| 2 | Create ScrollReveal component | ScrollReveal.tsx (new) |
| 3 | Create AnimatedCounter component | AnimatedCounter.tsx (new) |
| 4 | Create Accordion component | Accordion.tsx (new) |
| 5 | Create TestimonialCarousel component | TestimonialCarousel.tsx (new) |
| 6 | Create FlowSection component | FlowSection.tsx (new) |
| 7 | Create PricingSection component | PricingSection.tsx (new) |
| 8 | Create FAQSection component | FAQSection.tsx (new) |
| 9 | Create SpecialtiesGrid + CTASection | SpecialtiesGrid.tsx, CTASection.tsx (new) |
| 10 | Integrate everything in page.tsx | page.tsx (modify) |
| 11 | Visual QA and adjustments | Any files |
