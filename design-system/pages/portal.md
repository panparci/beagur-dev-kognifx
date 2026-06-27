# Portal pages override

Extends `design-system/MASTER.md`.

## Layout

- Sidebar: solid `#3a1808` (optional subtle vertical gradient same family only)
- Main: ivory canvas, compact padding (`portal-main-inner`)
- Use `PortalShell` for all role dashboards

## Navigation

- Active item: copper left border + copper icon background
- No glassmorphism on sidebar

## Cards & tables

- White/`portal-card` on ivory canvas
- Borders: `bea-line` / `--portal-line`
- KPI chips: tone variants (`copper`, `green`, `amber`) from existing `StatCard`

## Modals

- `ModalBackdrop` + `Card` — flat overlay `bg-black/60`, no gradient backdrop
