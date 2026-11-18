# Metamyth homepage — design system (MASTER)

Source of truth for the homepage rebuild. Produced with the installed skills:
**frontend-design** (process + anti-generic review), **ui-ux-pro-max** (verified
database matches noted inline), **metamyth-art-director** (brand rules, real photos
first). References: why.zero.university (typography, white pages, red room),
Shopify Editions Winter '26 (one stage behind chapters, torn transitions).

## Subject, audience, job

- **Subject:** a mythic storytelling practice. Its world is manuscripts, gold leaf,
  stained-glass icons, the north star, and Zachary's own film footage (shot 2.39:1).
- **Audience:** founders, visionaries and changemakers carrying a real mission;
  reading on a phone or laptop, with time and attention to give if the page earns it.
- **Primary job:** carry the copy (seven chapters, two thresholds) cleanly and
  immersively to *Begin Your Adventure*; secondary *Read the Metamyth Legend*.

## Concept: a film bound as a book

Each chapter **opens like a film** (a letterboxed still from the journey with a title
card, the way silent films set intertitles) and **reads like a manuscript** (a margin
for the chapter numeral and notes, a reading column, a drop cap). The two thresholds
are the only spectacle: the book (opened and turned by the reader) and the white page.

Verified matches (ui-ux-pro-max):
- `landing / scroll-triggered-storytelling` — chapters with distinct colour and
  building intensity; progress indicator; mini-CTA at the end of chapters + final
  climax CTA; **the narrative must read completely without scroll effects**.
- `style / editorial-grid-magazine` — asymmetric grid, drop caps, pull quotes, large
  imagery, serif body.
- `typography / Minimalist Monochrome Editorial` — high-contrast display serif over
  **Source Serif 4 for body legibility**.

## Tokens

| Token | Hex | Role |
|---|---|---|
| `--night` | `#0B1310` | the ground of the dark chapters (green-black, from the forest) |
| `--vellum` | `#EFE3C8` | text on dark; the page colour of the book |
| `--leaf` | `#C9A24A` | gold leaf: numerals, swash capitals, rules, primary action |
| `--glass` | `#4FB7A6` | stained-glass teal: links, the constellation, focus ring |
| `--ember` | `#8E2A17` | Calling only: the red room |
| `--paper` | `#FFFFFF` | the white page (the question) and the Adventure |

Chapter grounds build in intensity: Origin night → Calling ember → Threshold candle
→ Question paper → Quest/Vision earth (photographs carry the colour) → Mission paper
→ Request/Legacy night with the star.

## Type

| Role | Face | Notes |
|---|---|---|
| Display / title cards | STK Bureau Serif (stand-in: Instrument Serif) | large, tight, the type is the image |
| Swash capitals | Bethany Elingston (stand-in: Great Vibes) | **title cards only**, never on running headings |
| Reading | **Source Serif 4** 400/600 + italic | 20–21px, line-height 1.6, measure ≤ 68ch |
| Interface | Futura (brand) | sentence case, 13–14px, no tracked-out all-caps eyebrows |

Scale (Elements of Typographic Style, ~1.333): 14 · 16 · 21 · 28 · 37 · 50 · 67 · 89 · 118 · 158.

## Layout

Left-aligned reading everywhere; centred only for title cards and the question.

```
TITLE CARD (chapter opener)              READING SPREAD
┌──────────────────────────────┐         ┌────┬──────────────────────┐
│████████ letterbox bar ███████│         │ II │ Drop-cap paragraph … │
│  film still, 2.39:1          │         │    │ running text, 64ch   │
│        The ones destroying   │         │note│ ┌──────────────────┐ │
│        the world know …      │         │    │ │ letterboxed still│ │
│████████ letterbox bar ███████│         │    │ └──────────────────┘ │
└──────────────────────────────┘         └────┴──────────────────────┘
margin = chapter numeral (I–VII is a real sequence) + a pull line from the copy
```

## Principles

1. **The story reads with every effect turned off.** Text is static and visible.
2. **Spend boldness in two places:** the book and the white page. Everything else is
   quiet, disciplined, generous.
3. **One recurring device, not scattered effects:** the letterbox. Film stills are
   framed as film; title cards sit on them.
4. **Motion answers the reader:** one load sequence on the title; the book opens and
   turns when asked; the constellation responds to touch. No fade-up on every section.
5. **Real photographs, real people.** No generated imagery after the book.

## Review against generic defaults (frontend-design)

| Generic tell | v8 had it | Decision |
|---|---|---|
| Tracked ALL-CAPS eyebrow above every heading | yes (`.kicker`) | removed; chapter identity lives in the margin numeral |
| Meta strings with middle dots | yes (chapter labels, MSS list) | removed; lists are lists |
| `→` appended to buttons | yes | removed; buttons say what happens |
| Fade-and-slide-up on every section | yes (`.rv`) | removed; one load sequence only |
| Identical rounded cards with soft shadow | yes (worlds, foundations, voices) | worlds become a chapter list; foundations a three-column spread; voices pull quotes |
| One accented word per headline | yes (gold spans) | removed except where the copy itself pivots |
| Tinted near-black with one bright accent | partly | ground is the forest `#0B1310`; gold and teal both come from the brand's painted icons |
| Cream + serif + terracotta | no | — |

## Pre-delivery (ui-ux-pro-max)

Contrast ≥ 4.5:1 for text; visible focus; keyboard path through the book and the
constellation; reduced motion renders final states; no horizontal scroll at 375/768/
1024/1440; images WebP with reserved aspect ratios; touch targets ≥ 44px.
