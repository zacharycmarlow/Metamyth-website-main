#!/usr/bin/env bash
# Rebuild the gh-pages branch from the "Metamyth Offer Deck" directory on main.
# www.metamyth.quest serves the root of gh-pages (Settings > Pages ->
# "Deploy from a branch"). Replit serves the same directory raw, so what
# this publishes matches the Replit site.
#
# What it does:
#   - checks out the current remote gh-pages tip into a temp git worktree
#   - replaces the published tree with a copy of "Metamyth Offer Deck/"
#   - preserves deploy-only files: CNAME, .nojekyll, .image-slots.state.json
#     (the image-slot tooling's persisted state)
#   - preserves live-only directories that are not the Offer Deck:
#     legend/ (the company vision), fund-archive/ (the old fund packet),
#     and fund/ (on the live site this is a small redirect to /legend/,
#     not the Offer Deck fund packet). They are restored after the copy
#     and optimization so a publish cannot delete or replace them.
#   - excludes working files: uploads/, screenshots/, .DS_Store, .thumbnail
#   - optimizes for fast loading (scripts/optimize-site.py): images -> WebP,
#     fonts -> WOFF2 + font-display:swap, lazy-loading on <img> tags
#   - creates extensionless clean-URL copies (kinship, adventure, expedition,
#     journey, journey-map). adventure.html is already the /adventure page;
#     Expedition.html is only the redirect, copied to expedition.html.
#   - writes name/index.html redirects so /kinship/ and the other clean
#     URLs with a trailing slash do not 404.
#   - commits and pushes HEAD to origin gh-pages
#
# Optimization needs Pillow + fontTools/brotli (pip install pillow fonttools
# brotli); missing deps are skipped with a warning, so an unoptimized tree
# is still published rather than failing the deploy.
#
# Run from the repo root:  bash scripts/deploy-gh-pages.sh
# The GitHub Actions workflow .github/workflows/deploy-pages.yml runs this
# automatically on pushes to main that touch "Metamyth Offer Deck/".
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SRC="$REPO_ROOT/Metamyth Offer Deck"
WORK="$(mktemp -d)"
SAVE="$(mktemp -d)"

cleanup() {
  git -C "$REPO_ROOT" worktree remove --force "$WORK" 2>/dev/null || rm -rf "$WORK"
  rm -rf "$SAVE"
}
trap cleanup EXIT

# Base the new tree on the current published branch so history is kept and
# the push is a fast-forward. Fall back to an orphan branch on first deploy.
if git -C "$REPO_ROOT" fetch origin gh-pages 2>/dev/null; then
  git -C "$REPO_ROOT" worktree add --detach "$WORK" FETCH_HEAD >/dev/null
else
  git -C "$REPO_ROOT" worktree add --detach "$WORK" >/dev/null
  git -C "$WORK" checkout --orphan gh-pages
  git -C "$WORK" rm -rfq . || true
fi

# Preserve deploy-only files across the rebuild.
for f in CNAME .nojekyll .image-slots.state.json; do
  [ -f "$WORK/$f" ] && cp "$WORK/$f" "$SAVE/$f"
done
# Live-only trees. legend/ is the company vision. fund/ on the live site is
# a 544-byte redirect to /legend/, not the Offer Deck packet. fund-archive/
# keeps that packet. Restore them after the copy and optimization so they
# win over whatever the Offer Deck tree contains.
for d in legend fund-archive fund; do
  if [ -d "$WORK/$d" ]; then
    rm -rf "$SAVE/$d"
    cp -a "$WORK/$d" "$SAVE/$d"
  fi
done

# Clean the published tree but keep .git
find "$WORK" -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +
cp -r "$SRC/." "$WORK/"

# Exclude working files that are not part of the site.
rm -rf "$WORK/uploads" "$WORK/screenshots" "$WORK/.DS_Store" "$WORK/.thumbnail"
find "$WORK" -name .DS_Store -delete

for f in CNAME .nojekyll .image-slots.state.json; do
  [ -f "$SAVE/$f" ] && cp "$SAVE/$f" "$WORK/$f"
done

# Optimize the copied tree for fast loading (images/fonts/lazy-load).
python3 "$REPO_ROOT/scripts/optimize-site.py" "$WORK"

# Clean-URL copies (GitHub Pages serves them extensionless).
# /adventure is adventure.html itself. /expedition and /Expedition.html
# are the redirect (Expedition.html copied to expedition.html).
cp "$WORK/Kinship Quest.html" "$WORK/kinship.html"
cp "$WORK/Expedition.html"    "$WORK/expedition.html"
cp "$WORK/Journey.html"       "$WORK/journey.html"
cp "$WORK/Journey Map.html"   "$WORK/journey-map.html"
if [ ! -f "$WORK/adventure.html" ]; then
  echo "adventure.html missing; /adventure would 404" >&2
  exit 1
fi

# Point internal nav links at the clean URLs
for f in "$WORK"/*.html; do
  sed -i 's|/Kinship%20Quest.html?v=[a-zA-Z0-9-]*|kinship|g' "$f"
  sed -i 's|href="Journey Map.html"|href="journey-map"|g' "$f"
  sed -i 's|href="Journey.html"|href="journey"|g' "$f"
  sed -i 's|href="Expedition.html"|href="expedition"|g' "$f"
done

# Trailing-slash URLs (/kinship/ and the rest) 404 on GitHub Pages unless a
# directory index exists. Redirect to the extensionless page so relative
# assets on that page are not resolved from inside the slash directory.
# Do not create these inside legend/, fund/, or fund-archive/.
write_slash_redirect() {
  local name="$1"
  mkdir -p "$WORK/$name"
  cat > "$WORK/$name/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/${name}">
<link rel="canonical" href="https://www.metamyth.quest/${name}">
<title>Metamyth</title>
<script>location.replace("/${name}");</script>
</head>
<body>
<p><a href="/${name}">Continue</a></p>
</body>
</html>
EOF
}
for name in kinship adventure expedition journey journey-map; do
  write_slash_redirect "$name"
done

# Put the live-only trees back last, so optimization and the slash
# redirects cannot replace or rewrite them.
for d in legend fund-archive fund; do
  if [ -d "$SAVE/$d" ]; then
    rm -rf "$WORK/$d"
    cp -a "$SAVE/$d" "$WORK/$d"
  fi
done

[ -f "$WORK/CNAME" ] || echo metamyth.quest > "$WORK/CNAME"
touch "$WORK/.nojekyll"

git -C "$WORK" add -A
git -C "$WORK" -c user.name="${GIT_AUTHOR_NAME:-Devin}" \
  -c user.email="${GIT_AUTHOR_EMAIL:-devin@cognition.ai}" \
  commit -qm "Deploy offer deck $(date +%F)" || { echo "no changes"; exit 0; }
git -C "$WORK" push origin HEAD:refs/heads/gh-pages
echo "Pushed gh-pages. Site: https://metamyth.quest (preview: https://zacharycmarlow.github.io/metamyth-kinship-quest-offer-page/)"
