# Bea Guru — Design System (Master)

> **Source of truth** for all UI work in this repo.  
> Overrides any palette/font from `ui-ux-pro-max` search script output.

## Product

- **Name:** Bea Guru Indonesia — yayasan bantuan guru honorer
- **Tone:** Warm, trustworthy, human, modest — **not** flashy SaaS, **not** kids/playful, **not** fintech/crypto
- **UI goal:** Standard, clean, readable — **polos** with structure; decoration minimal

## Stack

| Layer | Path |
|-------|------|
| React 19 + Vite + TS | `fe/` |
| Tailwind v4 theme | `fe/src/styles/app.css` → `bea.*` colors |
| Portal design system | `fe/src/styles/portal-ui.css` |
| Landing extras | `fe/src/styles/landing.css` |
| Tailwind theme | `fe/src/styles/app.css` (`@import "tailwindcss"` + `@theme`) |
| Components | `fe/src/core/ui/*`, `Button`, `Badge`, `Card`, `PortalShell` |

Search stack flag: `--stack react`

## Color tokens (DO NOT invent new primaries)

Use CSS variables or Tailwind `bea-*` classes only.

| Role | Hex | Tailwind / CSS var |
|------|-----|-------------------|
| Primary / CTA | `#B75A22` | `bea-copper`, `--portal-copper` |
| Primary hover | `#8E3F16` | `bea-copper-dark`, `--portal-copper-dark` |
| Primary soft | `#D9A174` | `bea-copper-soft`, `--portal-copper-soft` |
| Background | `#F7EFE7` | `bea-ivory`, `--portal-ivory` |
| Surface | `#FFF9F3` | `bea-ivory-light` |
| Text | `#2F302C` | `bea-ink`, `--portal-ink` |
| Muted text | `#758072` | `bea-sage-muted`, `--portal-muted` |
| Secondary text | `#4F5A4E` | `bea-sage` |
| Border | `#E6D4C4` | `bea-line`, `--portal-line` |
| Sidebar / dark panel | `#3A1808` | `--portal-sidebar-bg` |
| Sidebar text | `#FFF9F3` | `--portal-sidebar-text` |
| Success | `#047857` | badge `success` |
| Warning | `#B45309` | badge `warning` |
| Danger | `#BE123C` | badge `danger` |

**Forbidden:** cyan/teal primaries, purple/pink AI gradients, neon, cold gray-on-gray corporate blue, new accent colors outside table above.

## Typography

| Use | Font | Class |
|-----|------|-------|
| Headings | Lora (serif) | `font-serif` |
| Body / UI | Inter (sans) | `font-sans` (default) |

Do **not** swap to script-suggested fonts (Baloo, Comic Neue, etc.).

- Body: 14–16px (`text-sm` / `text-base`)
- Line-height: 1.45–1.6 for body
- Headings: `font-semibold`, tight tracking `-0.02em`

## Gradients (subtle only — same warm family)

Gradiasi **boleh** dipakai tipis asal tetap dalam tone copper / ivory / cokelat. Jangan rainbow, aurora, atau mesh berwarna asing.

```css
/* ✅ Allowed examples */
background: linear-gradient(180deg, #452010 0%, #3a1808 100%);           /* sidebar depth, very subtle */
background: linear-gradient(145deg, #fff 0%, #fff9f3 100%);              /* card surface */
background: linear-gradient(90deg, rgb(247 239 231 / 0.97) 0%, transparent 100%); /* map/text overlay */
background: linear-gradient(135deg, rgb(183 90 34 / 0.12) 0%, rgb(183 90 34 / 0.06) 100%); /* copper tint */

/* ❌ Avoid */
purple/pink AI gradients, blue-cyan hero, multi-hue mesh, heavy glass blur stacks
```

Default preference: **solid fills** first; add gradient only when it adds depth without changing hue family.

## Layout patterns

| Area | Pattern |
|------|---------|
| Portal | `PortalShell` — dark sidebar + ivory canvas |
| Auth | Split 50/50 — dark brand left, ivory form right |
| Landing | Keep hero minimal; full-width map section |
| Density | Compact — avoid excessive whitespace in portal |

## Components (reuse, don't reinvent)

- `Button`, `Badge`, `Card`, `DraftStatusBanner`, `BusinessFlowBar`
- `PortalShell`, `ModalBackdrop`, `portal-ui.css` classes (`portal-card`, `ui-btn`, `portal-nav-link`)
- `applicationStatus.ts` for status badges
- Icons: **Lucide only** (`lucide-react`)

## Interaction

- Transitions: 150–300ms
- Touch targets: min 44×44px
- Focus: visible ring using copper (`focus:ring-bea-copper/30`)
- `prefers-reduced-motion`: respect
- Hover: border/background shift, not scale circus

## Anti-patterns (Bea Guru)

- Emoji as icons
- New color palette from `--design-system` script without merging this file
- Heavy shadows + gradients + blur together
- Feature-card clutter on auth/login
- `stone-*` legacy classes in new portal code (use `bea-*` / portal tokens)
- Horizontal scroll on mobile

## Pre-delivery checklist

- [ ] Colors from token table only
- [ ] Lora + Inter only
- [ ] Gradients (if any) stay warm copper/ivory/brown
- [ ] Reused portal primitives where applicable
- [ ] 375px + 1024px checked
- [ ] Form labels visible; errors near fields
- [ ] Lucide icons, not emoji

## References

- Client brief: `docs/kebutuhan-ai-bea-guru.md`
- Page overrides: `design-system/pages/*.md`
