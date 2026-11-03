# Metamyth investor room

The existing static site's `/fund/` route. No dependencies, backend, authentication, or build step.

- `index.html`: investment case, searchable four-document library, source capital allocation explorer, draft note mechanics, three-case explorer, risks and open terms.
- `investor-sheet.html`, `plot.html`, `terms.html`: complete, responsive source documents using the site's actual Pherome/Futura files and existing illustrated assets.
- `fund.css`: isolated room and reader styles, responsive layouts, focus states, reduced motion and print rules.
- `fund.js`: progressive enhancement only. Packet search, keyboard-operated allocation tabs, source scenario selection, chapter navigation, reading progress and native print.
- `media/`: optimized WebP derivatives of the existing site's butterfly nebula and horizon artwork; no new or external imagery.
- `import-packet.py`: reproducible importer for the three complete supporting documents. Run only when intentionally re-importing the original packet; not required for serving.

## Financial editorial notes

Confirmed target: **$300K**. Confirmed maximum: **$500K**. The source overview and business plan's old $700K ceiling are corrected, with an editorial note in the full business plan.

Base allocations sum to $300K. The user approved reducing capital architecture and fundraising to $20K. Incremental allocations now sum to $200K, bringing the combined budget to the $500K maximum.

The approximate annual returns, timing and forecast revenue are source estimates, not independently validated projections. The scenario display uses the exact draft terms figures for a $300K round; it does not calculate an investment outcome. All terms remain draft. The commons is still being designed and is not part of this offer. No subscriptions, contact details, authentication, investment transactions or download services are invented.

All original external links in the supporting documents are preserved. The working forecast is the original Google Sheets URL. External links open a new tab with `noopener noreferrer`.

## Serving

Serve the existing `Metamyth Offer Deck` static root as before. Open `/fund/`. Assets and font references point to the existing parent site. This folder does not change any other page, server configuration or workflow.

Without JavaScript all source content, both allocation tables, the complete scenario comparison, supporting documents and original links remain accessible. The print action uses the browser's native printing.
