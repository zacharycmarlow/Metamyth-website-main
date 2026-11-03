# Investor-room visual refinements

Scope: this folder only. No changes to the main site, backend, workflows or canvas.

## Archive photography

The five locally served WebP images are optimized copies from the reviewed v3
pool at `artifacts/mockup-sandbox/public/images`. The live room does not reference
that serving path.

- `mountain-bg.webp`: hero; a real landscape replaces the nebula.
- `mundo.webp`: investment case; people and place replace the video-call image.
- `journey-moto.webp`: capital chapter; the path beyond the familiar.
- `stories-workers.webp`: transition from financial scenarios to real-world risk.
- `estuary2.webp`: closing; a different landscape, not the hero repeated.

These are editorial images from the Metamyth archive, not evidence of cohort
attendance, funded ventures or portfolio performance.

## Icon repairs

Inspected `assets/icons-sheet.png`, the original small icon files and the larger
`offer-deck/assets/icons` exports. The original small compass file, for example,
includes pixels from the neighboring object. CSS containment cannot repair that.

Selected larger, complete illustrations, trimmed and resized each to fit a
144-pixel interior on a transparent 168-pixel square. The scroll export also
contained stray bottom-row pixels: its content was cropped to the complete
scroll before trimming. The fountain export has an already-clipped top, so it
was deliberately rejected rather than disguised with padding.

All eleven decorative uses across the landing page and investor sheet have
different illustrations. Brand butterfly logos remain unchanged.

## Charts and source data

Native HTML and SVG, with no external scripts or chart runtime:

- Allocation: proportional stacked band and selectable, labeled key, derived
  directly from each existing source table. Base totals $300,000; incremental
  totals $200,000, including $20,000 for capital architecture and fundraising.
  Keyboard arrow/Home/End navigation on the base/incremental tabs is retained.
- Scenario revenue: independent, zero-baseline columns for $712,000,
  $1,180,000 and $1,690,000. Selecting a column synchronizes the original case
  controls and full detail panel. No uncertainty intervals are invented.
- Draft schedule: elapsed-year spacing for (3, 1.4), (5, 1.7), (7, 2.0),
  (10, 2.5), plus native keyboard/touch range control and anchor buttons.
  Intermediate values use explicitly disclosed continuous linear interpolation
  for exploration, not a new return forecast or a claim about the final legal
  interpolation formula. No earlier-year values are inferred.

Full allocation tables, all three scenario rows and a draft-schedule table are
available without JavaScript. With JavaScript, source tables remain in native
disclosures. Existing supporting-document text and links are retained.

Read the chart-authoring skill and applicable non-Cartesian, stacked-Cartesian
and confidence-band guidance for form selection, proportional scales, labels
and forecast caveats. This is an embedded website, not a standalone chart card
or report artifact.

## Checks performed

- `node --check fund.js`.
- Headless Chromium runtime: allocations, keyboard tabs, category shares,
  synchronized chart/case controls, schedule anchor and interpolation,
  document search, empty state and reset.
- 1440-pixel desktop and 390-pixel mobile: no document overflow.
- All three supporting documents: no mobile overflow or broken images.
- JavaScript disabled: both budgets, all scenario rows and schedule table remain.
- Local HTML links/assets resolve; no duplicate IDs; eleven unique decorative icons.
- No runtime exceptions. Screenshot review is delegated to the parent agent.
