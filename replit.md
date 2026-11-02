# Running this project on Replit

The app is a static HTML/CSS/JavaScript site. No package installation, build step, or environment secrets are required.

The Replit workflow serves the `Metamyth Offer Deck` directory on port 5000 with Python's built-in HTTP server. The default page is `Metamyth Offer Deck/index.html`, copied from the current `Metamyth v3.html` landing page. Other pages in that directory include `Journey.html`, `Expedition.html`, and `Kinship Quest.html`.

To run it manually from the workspace root:

```sh
cd "Metamyth Offer Deck" && python3 -m http.server 5000 --bind 0.0.0.0
```

# Publishing to www.metamyth.quest

There are two published sites, updated independently:

- `metamyth-main-landing-page.replit.app` — Replit serves `Metamyth Offer Deck/` raw.
- `www.metamyth.quest` — GitHub Pages serves the root of the `gh-pages` branch (Settings > Pages, "Deploy from a branch").

Pushing to `main` or publishing on Replit does **not** update `gh-pages`. The workflow `.github/workflows/deploy-pages.yml` runs `scripts/deploy-gh-pages.sh` on every push to `main` that touches `Metamyth Offer Deck/`, rebuilding `gh-pages` to match (excluding `uploads/`, `screenshots/`, and OS junk; preserving `CNAME`, `.nojekyll`, and `.image-slots.state.json`). To publish manually, run `bash scripts/deploy-gh-pages.sh` from the repo root.
