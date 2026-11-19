# v10 build spec — "The layered book"

Supersedes the v9 reading-spread layout (MASTER.md tokens and type stay). Written with the
motionsites-web-builder spec process after comparing v9 against why.zero.university and
Shopify Editions (see the comparison board in the session).

## Brief, decided
- **Who:** visionaries carrying a real mission. **Job:** carry the exact copy to *Begin Your Adventure*.
- **Mood:** mythic, dense, cinematic.
- **Signature:** every screen is a *composed plate* of layers: our own cosmic/AI art behind,
  Zachary's real film stills blended into it, the brand's glowing sigils, editorial type on top.
  The cosmic and the real are always in the same frame; the story moves between them.
- **Scope of this build:** vertical slice, chapters I Origin and II Calling, plus the persistent UI.

## What the comparison showed (v9 → v10)
| Reference does | v9 did | v10 does |
|---|---|---|
| One line at a time, huge, inside a full-bleed world | an essay column at 18px | lockups at 10.5vw; passages at 2.6vw display serif |
| Image is the world, edge to edge | photos boxed in letterbox bars | full-bleed plates in 4–6 depth layers |
| Each zone is a colour world (mint, red room, money green) | the same dark ground everywhere | Origin: cosmos → earth → fire; Calling: the red room |
| Supporting lines live on objects (clippings, glass shards) | — | Calling's three claims on glass shards holding footage |
| Persistent UI (ruler, dock) | none | chapter ruler + dock with the primary CTA |

## The plate: layer stack (back → front)
| z | Layer | Source | Treatment |
|---|---|---|---|
| 0 | **cosmos** | our AI art (nebula, earthrise, red planet…) | full-bleed, `scale(1.12)`, drifts `--p × −3vh` |
| 1 | **film** | Zachary's still | full-bleed or 60–70% field, `mix-blend-mode: luminosity / screen / multiply`, soft radial `mask-image`, drifts `−8vh` |
| 2 | **ghost** | one word from the chapter | MM Display, 26vw, 1px gold outline at 14% alpha, slides `−10vw` |
| 3 | **sigil** | brand line-art icon | 22–34vmin, `mix-blend-mode: screen`, 35–55% opacity, slow rotate |
| 4 | **plates** | 1–2 small framed stills, captioned | 18–24vw, 1px vellum hairline, caption *Plate iv. …* 13px italic; far plate `blur(2px)`; drift `−22vh` |
| 5 | **copy** | exact copy | see Type; per-word melt (blur 10px → 0, rise .35em, 60ms stagger) |
| 6 | **air** | dust texture + SVG grain + vignette | dust `screen` 35%, grain 9%, vignette `radial-gradient(… rgba(0,0,0,.55))` |

## Type (stand-ins until the licensed Zero faces arrive)
- **Lockup** (Zero's mixed scale): big line MM Display `clamp(3.6rem, 10.5vw, 12rem)/.84`, tracking −.035em;
  companion line italic at .36× of big, tucked above-left / below-right. Swash capital (MM Swash, 1.45em,
  gold) only on a lockup's first letter. Text glow: `0 0 28px rgba(255,236,200,.28)`.
- **Passage**: MM Display `clamp(1.55rem, 2.6vw, 2.75rem)/1.13`, tracking −.01em, max 24ch, vellum on scrim.
- **Running head**: Futura 12px, +.08em, 60% vellum: *Metamyth* left, *Chapter I — Origin* centre-left, folio right.
- **Folio**: MM Display italic 15px tabular, `07 / 20`.
- **Captions**: MM Display italic 13–14px, 70% vellum.
- No tracked all-caps eyebrows. No arrows on buttons. Accent words only where the copy turns.

## Colour by zone
- Origin: `--night #0B1310`, cosmic teal light `#4FB7A6`, then ember as the world burns.
- Calling: red room `#2A0504 → #7A0F0A`, light shafts `rgba(255,120,90,.18)`, gold `#E0B25A`.
- Gold leaf `#C9A24A` for swash, folio, CTA. Vellum `#EFE3C8` for type.

## Motion
- One pinned stage per chapter, runway = `beats × 85vh + 100vh`. Lenis smoothing.
- Beat weight `a` = in over [i−.5, i−.12], out over [i+.55, i+.88]; local `p` ∈ [−1, 1] drives parallax.
- Plates crossfade + depth parallax. Words melt in and melt out (Zero). Nothing loops except dust drift (60s) and sigil rotation (120s).
- Reduced motion: no blur, no parallax, crossfades only. No JS: every beat renders as a static 100vh plate in reading order.

## Beats (copy verbatim from the FINAL COPY)
**I Origin** — 9 beats: hero lockup · "The old story is ending." · three passages · "losing faith" lockup ·
fake/real split · "carrying real solutions" passage · "hungry" lockup.
**II Calling** — 11 beats: opener lockup · three glass shards (Fascists / Billionaires / most powerful) ·
"It does…" passage · "don't have the truth" · "They have the story." · proved/summon · meanwhile/playing small ·
**Fuck that.** (black rupture) · "If an economy…" (red turns to gold) · "The more…" · "your story".

## UI
- Top: running head + a 20-tick ruler (one tick per beat, chapter numerals under the first tick of each chapter); clickable.
- Bottom dock (centred pill, 12px from bottom + safe area): mark disc · *Begin Your Adventure* (gold, 44px min) · *Read the Legend* (ghost).

## Review bar
motionsites review.md: average ≥ 8, nothing under 7, desktop 1440×900 and mobile 390×844, three rounds max.
