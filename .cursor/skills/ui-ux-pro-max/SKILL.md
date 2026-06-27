---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient."
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Searchable database with priority-based recommendations.

## Bea Guru project override (MANDATORY)

**Before any UI work**, read in order:

1. `design-system/MASTER.md` — colors, typography, gradient rules
2. `design-system/pages/<page>.md` if building portal, auth, or landing

**Never apply** raw output from `search.py --design-system` colors/typography without merging with MASTER. The script may suggest cyan, purple, or playful fonts — **ignore those for Bea Guru**.

### Design intent

- **Standard UI** — clean, structured, professional nonprofit/education portal
- **Colors:** only existing Bea Guru tokens (`bea-copper`, `bea-ivory`, `bea-ink`, `#3a1808` sidebar, etc.) — see MASTER table
- **Gradients:** allowed **sparingly**, subtle, **same warm tone only** (copper / ivory / brown family). Prefer solid fills; see MASTER gradient section
- **Polos:** no decorative clutter (no feature-card walls on auth, no heavy glass/blur stacks)
- Client brief: `docs/kebutuhan-ai-bea-guru.md` for copy/stats (125 / 596 / 165)

### Stack & files

- **React 19 + Vite + TypeScript** → `--stack react`
- Tokens: `fe/src/styles/app.css` (`@theme` bea.*), `fe/src/styles/portal-ui.css`, `fe/src/styles/landing.css`
- Reuse: `PortalShell`, `Button`, `Badge`, `ModalBackdrop`, portal CSS classes

### Skill usage split

| Skill | When |
|-------|------|
| This skill | UX checklists, a11y, forms, responsive, domain search |
| `frontend-design` | Only when user asks for distinctive visual exploration |
| `ponytail` | Keep implementation minimal |

### Quick search (UX only — not colors)

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "forms accessibility dashboard" --domain ux --stack react
```

## When to Apply

This Skill should be used when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**.

### Must Use

- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts, etc.)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)
- Improving perceived quality, clarity, or usability of interfaces

### Recommended

- UI looks "not professional enough" but the reason is unclear
- Receiving feedback on usability or experience
- Pre-launch UI quality optimization
- Aligning cross-platform design (Web / iOS / Android)
- Building design systems or reusable component libraries

### Skip

- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work
- Non-visual scripts or automation tasks

**Decision criteria**: If the task will change how a feature **looks, feels, moves, or is interacted with**, this Skill should be used.

## Rule Categories by Priority

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | `ux` | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | `ux` | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | `ux` | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | `style`, `product` | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | `ux` | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | `typography`, `color` | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | `ux` | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | `ux` | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | `ux` | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | `chart` | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

For full Quick Reference sections (Accessibility, Touch, Performance, Style, Layout, Typography, Animation, Forms, Navigation, Charts), see the checklist tables in the upstream skill or run domain searches below.

## Prerequisites

```bash
python3 --version || python --version
```

## How to Use This Skill

### Step 1: Analyze User Requirements

Extract: product type, target audience, style keywords, stack (`react` for Bea Guru).

### Step 2: Generate Design System (optional)

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

Persist for hierarchical retrieval:

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Bea Guru"
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Bea Guru" --page "landing"
```

Creates `design-system/MASTER.md` and optional `design-system/pages/<page>.md`. Page overrides win over Master.

### Step 3: Domain searches

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Need | Domain | Example |
|------|--------|---------|
| Product patterns | `product` | `--domain product "nonprofit charity education"` |
| Style options | `style` | `--domain style "warm trustworthy minimal"` |
| Color palettes | `color` | `--domain color "nonprofit social"` |
| Font pairings | `typography` | `--domain typography "warm readable"` |
| Charts (recharts) | `chart` | `--domain chart "donation progress dashboard"` |
| UX / a11y | `ux` | `--domain ux "animation accessibility forms"` |
| Landing structure | `landing` | `--domain landing "hero social-proof stats"` |

### Step 4: Stack guidelines

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react
```

### Output formats

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "nonprofit education" --design-system -f markdown
```

## Pre-Delivery Checklist (web)

Before shipping UI changes:

- [ ] Quick Reference priorities 1–3 (a11y, touch, performance)
- [ ] Test at 375px width and landscape
- [ ] `prefers-reduced-motion` respected
- [ ] Touch targets ≥44px; Lucide SVG icons (project already uses `lucide-react`)
- [ ] Form labels visible; errors near fields
- [ ] Charts: legend, tooltips, not color-only meaning (recharts dashboards)

## Relationship to other skills

| Skill | Role |
|-------|------|
| `frontend-design` | Distinctive visual identity, anti-template aesthetics |
| `frontend-ui-engineering` | React component architecture |
| `web-quality-audit` | Lighthouse / CWV audit |
| `ponytail` | Minimal implementation |

Use `frontend-design` + brief for *what it should look like*; use this skill for *UX quality gates* and searchable recommendations; use `ponytail` when writing code.
