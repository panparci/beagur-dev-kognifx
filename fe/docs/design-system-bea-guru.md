# Design System — Bea Guru

Sumber warna: logo resmi klien (`public/brand/bea-guru-logo.png`).  
Prinsip UI: flat, tanpa gradien; hangat dan mudah dibaca orang awam.

## Token warna

| Token | Hex | Pemakaian |
|-------|-----|-----------|
| `bea-copper` | `#B75A22` | Judul, CTA primer, aksen |
| `bea-copper-dark` | `#8E3F16` | Hover CTA, teks tegas |
| `bea-copper-soft` | `#D9A174` | Teks sekunder di blok gelap |
| `bea-ivory` | `#F7EFE7` | Background halaman |
| `bea-ivory-light` | `#FFF9F3` | Background section alternatif |
| `bea-sage` | `#4F5A4E` | Body copy, label |
| `bea-sage-muted` | `#758072` | Caption, footer |
| `bea-ink` | `#2F302C` | Teks utama |
| `bea-line` | `#E6D4C4` | Border, divider |

Token didefinisikan di `index.html` → `tailwind.config` (CDN).

## Tipografi

| Peran | Font | Catatan |
|-------|------|---------|
| Display / judul | Lora (serif) | Selaras logo "BEA GURU" |
| Body / UI | Inter (sans) | Mudah dibaca di mobile |

Skala judul homepage: ~2.35rem mobile → 3.25rem desktop, `font-semibold` (bukan extrabold).

## Komponen pola

- **CTA primer:** `bg-bea-copper`, hover `bea-copper-dark`, tanpa shadow berlebihan
- **CTA sekunder:** teks link, bukan tombol outline tebal
- **Stats:** grid + divider, bukan kartu ber-ikon
- **List poin:** border-left 2px copper, tanpa nomor bulat
- **Gambar hero:** border `bea-line`, caption di bawah — tidak ada floating card

## Aset

| File | Path |
|------|------|
| Logo | `/brand/bea-guru-logo.png` |
| Hero homepage | Kitabisa CDN (lihat `LandingPage.tsx`) |

## Yang sengaja dihindari

- Gradien background / glow
- Uppercase tracking lebar (terasa kaku)
- Kartu stat identik dengan ikon
- Duplikasi logo besar di hero (logo cukup di header)
- Warna teal lama (sudah diganti palet logo)

## Halaman lain

Dashboard & portal internal tetap memakai token `bea-*` saat direvisi. Bisnis flow (role, status guru, donasi) tidak diubah di fase homepage.
