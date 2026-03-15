---
# Donatti Turismo

**Vision:** Website e sistema interno para a agência Donatti Turismo (Campo Grande, MS) — marketing, gestão de promoções, captura de leads e integração com canais de vendas.

**Stack:** Next.js 14 + React 18 + TypeScript + Tailwind CSS + Prisma (PostgreSQL via Supabase) + NextAuth

**Status:** Active development — core features built, iterating on improvements

---

## Performance & Quality Directives

All from PERFORMANCE-DIRECTIVES.md — React/TypeScript-specific:
- PD-REACT-001 through PD-REACT-003
- PD-TS-001 through PD-TS-003
- PD-A11Y-001 through PD-A11Y-004
- PD-SEC-001, PD-SEC-002
- PD-ERROR-001 through PD-ERROR-003

---

## Architecture Overview

### Frontend (Public)
- **Homepage:** Hero + countdown timer, feature sections, testimonials, search cards, footer
- **Destinations (`/destinos`):** Browse destinations with dynamic `[slug]` pages
- **Packages (`/pacotes`):** Browse travel packages with dynamic `[slug]` pages
- **Components:** Modular sections (hero, second, third, fourth, fifth), modals (popup, terms, WhatsApp)

### Frontend (Internal)
- **Admin (`/admin`):** Dashboard, user management (CRUD), stats
- **Agent (`/agent`):** Agent-specific dashboard and stats
- **Promos (`/promos`):** Promo management dashboard, image generator (single + bulk), CSV export, templates, stats, leads management

### API Routes (`/api/`)
- **Auth:** NextAuth with credentials provider (`/api/auth/[...nextauth]`)
- **Promos:** CRUD, stats, CSV export, public listing (`/api/promos/*`)
- **Leads:** Lead capture and management (`/api/leads`)
- **Layouts:** Template management with image upload (`/api/layouts/*`)
- **Google Business:** OAuth flow, sync, post to GMB (`/api/google-business/*`)
- **Instagram:** Integration (`/api/instagram`)
- **Image Search:** Search images for promo creation (`/api/image-search`)
- **Users:** User management and stats (`/api/users/*`)

### Database (Prisma + Supabase)
- **User/Account/Session:** NextAuth models with role-based access (admin/agent)
- **Promo:** Travel promotions with pricing, amenities, site publishing, Google Business post tracking
- **Lead:** Customer capture with source tracking and status pipeline (new → contacted → converted → lost)
- **Layout:** Image templates for promo generation with configurable elements and colors
- **GoogleBusinessConnection:** OAuth tokens and location settings

### Integrations
- Google Tag Manager + Analytics (dataLayer events, analytics delegator)
- Google Business Profile (posts, sync)
- Instagram feed
- RD Station Marketing
- Intercom (currently commented out)
- WhatsApp (click-to-chat)
- Structured Data (TravelAgency schema.org)

---

## Current Focus

**Feature:** Awaiting direction
**Status:** Ready for next task

---

## Project Learnings

- Recently migrated from Redis to Prisma + Supabase (commit 413bdd1)
- Intercom initialization is commented out (commit ef63e79)
- GTM config was streamlined to remove server URL dependency (commit 9ef6a33)

---

## State

**Last Completed:** Project initialization (ctxforge framework)
**Next Task:** Awaiting user direction

---
