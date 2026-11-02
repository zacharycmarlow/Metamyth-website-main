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
#   - excludes working files: uploads/, screenshots/, .DS_Store, .thumbnail
#   - creates extensionless clean-URL copies (kinship, expedition, journey,
#     journey-map) and points internal nav links at them
#   - commits and pushes HEAD to origin gh-pages
#
# NOTE: the live site was previously optimized (PNG/JPG -> WebP, unused
# files pruned). That optimization is a separate manual step; this script
# publishes the deck as-is, which is correct but may serve larger images.
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

# Clean the published tree but keep .git
find "$WORK" -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +
cp -r "$SRC/." "$WORK/"

# Exclude working files that are not part of the site.
rm -rf "$WORK/uploads" "$WORK/screenshots" "$WORK/.DS_Store" "$WORK/.thumbnail"
find "$WORK" -name .DS_Store -delete

for f in CNAME .nojekyll .image-slots.state.json; do
  [ -f "$SAVE/$f" ] && cp "$SAVE/$f" "$WORK/$f"
done

# Clean-URL copies (GitHub Pages serves them extensionless)
cp "$WORK/Kinship Quest.html" "$WORK/kinship.html"
cp "$WORK/Expedition.html"    "$WORK/expedition.html"
cp "$WORK/Journey.html"       "$WORK/journey.html"
cp "$WORK/Journey Map.html"   "$WORK/journey-map.html"

# Point internal nav links at the clean URLs
for f in "$WORK"/*.html; do
  sed -i 's|/Kinship%20Quest.html?v=[a-zA-Z0-9-]*|kinship|g' "$f"
  sed -i 's|href="Journey Map.html"|href="journey-map"|g' "$f"
  sed -i 's|href="Journey.html"|href="journey"|g' "$f"
  sed -i 's|href="Expedition.html"|href="expedition"|g' "$f"
done

[ -f "$WORK/CNAME" ] || echo metamyth.quest > "$WORK/CNAME"
touch "$WORK/.nojekyll"

git -C "$WORK" add -A
git -C "$WORK" -c user.name="${GIT_AUTHOR_NAME:-Devin}" \
  -c user.email="${GIT_AUTHOR_EMAIL:-devin@cognition.ai}" \
  commit -qm "Deploy offer deck $(date +%F)" || { echo "no changes"; exit 0; }
git -C "$WORK" push origin HEAD:refs/heads/gh-pages
echo "Pushed gh-pages. Site: https://metamyth.quest (preview: https://zacharycmarlow.github.io/metamyth-kinship-quest-offer-page/)"
