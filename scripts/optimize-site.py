#!/usr/bin/env python3
"""Optimize a static site tree in place before publishing to gh-pages.

  - PNG/JPG/JPEG -> WebP (Pillow), originals removed when all conversions
    succeed; references in .html/.css/.js/.md are rewritten to .webp,
    including dynamically-built paths like `${IC}${n.ic}.png`.
  - TTF/OTF -> WOFF2 (fontTools+brotli); @font-face srcs get the woff2 URL
    prepended with the original kept as fallback, and font-display: swap
    is added where missing.
  - <img> tags gain loading="lazy" decoding="async" (first <img> per page
    stays eager so it can remain the LCP candidate).

Usage: optimize-site.py <site-root>
Missing optional deps degrade gracefully (that step is skipped).
"""
import os
import re
import sys
import urllib.parse

ROOT = os.path.abspath(sys.argv[1])
IMG_EXTS = ('.png', '.jpg', '.jpeg')
FONT_EXTS = ('.ttf', '.otf')
TEXT_EXTS = ('.html', '.css', '.js', '.md')

relp = lambda p: os.path.relpath(p, ROOT).replace(os.sep, '/')


def walk_files(pred):
    for dp, _, fns in os.walk(ROOT):
        for fn in fns:
            if pred(fn):
                yield os.path.join(dp, fn)


# --- 1. images -> webp ----------------------------------------------------
converted = {}   # original rel path -> webp rel path
failed = []
try:
    from PIL import Image
except ImportError:
    print('[optimize] Pillow missing; skipping image conversion', file=sys.stderr)
else:
    for src in walk_files(lambda f: f.lower().endswith(IMG_EXTS)):
        dst = os.path.splitext(src)[0] + '.webp'
        try:
            im = Image.open(src)
            if im.mode not in ('RGB', 'RGBA'):
                want_a = 'A' in (im.mode or '') or 'transparency' in im.info
                im = im.convert('RGBA' if want_a else 'RGB')
            im.save(dst, 'WEBP', quality=80, method=4)
            converted[relp(src)] = relp(dst)
        except Exception as e:
            failed.append(src)
            print(f'[optimize] image conversion failed {src}: {e}', file=sys.stderr)
    if failed:
        # Keep every original so stale .png references can never 404.
        print(f'[optimize] {len(failed)} image(s) failed; keeping all originals',
              file=sys.stderr)
    else:
        for src in walk_files(lambda f: f.lower().endswith(IMG_EXTS)):
            os.remove(src)

# --- 2. fonts -> woff2 ----------------------------------------------------
fonts = {}  # original rel path -> woff2 rel path
try:
    from fontTools.ttLib import TTFont
    import brotli  # noqa: F401  (required for woff2 compression)
except ImportError:
    print('[optimize] fontTools/brotli missing; skipping font conversion',
          file=sys.stderr)
else:
    for src in walk_files(lambda f: f.lower().endswith(FONT_EXTS)):
        dst = os.path.splitext(src)[0] + '.woff2'
        try:
            f = TTFont(src)
            f.flavor = 'woff2'
            f.save(dst)
            fonts[relp(src)] = relp(dst)
        except Exception as e:
            print(f'[optimize] font conversion failed {src}: {e}', file=sys.stderr)

# --- 3. rewrite references ------------------------------------------------
IMG_TOKEN = re.compile(
    r"([0-9A-Za-z_./%~+\- \t'\"(){}$=\[\]|]*?)\.(png|jpe?g|PNG|JPE?G)\b")
FONT_URL = re.compile(
    r"url\(\s*(['\"]?)([^'\")]+\.(?:ttf|otf|TTF|OTF))\1\s*\)"
    r"(\s*format\(\s*['\"](?:truetype|opentype)['\"]\s*\))?")


def resolve(path, base):
    """Resolve a URL path to a ROOT-relative path, trying file-dir then root."""
    p = urllib.parse.unquote(path.strip().strip('\'"'))
    if p.startswith(('http://', 'https://', 'data:', 'mailto:', '//')):
        return None
    if p.startswith('/'):
        cands = [os.path.normpath(os.path.join(ROOT, p.lstrip('/')))]
    else:
        cands = [os.path.normpath(os.path.join(base, p)),
                 os.path.normpath(os.path.join(ROOT, p))]
    for c in cands:
        r = relp(c)
        if not r.startswith('..'):
            return r
    return None


def sub_images(m):
    token, ext = m.group(1), m.group(2)
    if '${' in token:  # dynamically built path: swap ext only if every image converted
        return m.group(0) if failed else f'{token}.webp'
    seg = re.split(r"[\s'\"=()]+", token)[-1]
    if not seg:
        return m.group(0)
    key = resolve(seg + '.' + ext, cur_dir)
    if key in converted:
        return f'{token}.webp'
    return m.group(0)


def sub_font(m):
    q, path, fmt = m.group(1), m.group(2), m.group(3) or ''
    key = resolve(path, cur_dir)
    if key in fonts:
        woff = path.rsplit('.', 1)[0] + '.woff2'
        return f"url({q}{woff}{q}) format('woff2'), {m.group(0)}"
    return m.group(0)


FONT_FACE = re.compile(r'@font-face\s*\{[^}]*\}')
IMG_TAG = re.compile(r'<img\b[^>]*?/?>', re.S)


def add_lazy(html):
    seen = [0]

    def fix(m):
        tag = m.group(0)
        seen[0] += 1
        # First two <img>s are the nav logo + hero background (LCP candidates);
        # fetchpriority="high" marks an author-chosen priority image.
        if ('loading=' not in tag and 'fetchpriority' not in tag
                and seen[0] > 2):
            tag = tag.replace('<img', '<img loading="lazy"', 1)
        if 'decoding=' not in tag:
            tag = tag.replace('<img', '<img decoding="async"', 1)
        return tag
    return IMG_TAG.sub(fix, html)


def add_font_display(m):
    block = m.group(0)
    if 'font-display' in block:
        return block
    return block.replace('{', '{\n      font-display: swap;', 1)


for path in walk_files(lambda f: f.lower().endswith(TEXT_EXTS)):
    cur_dir = os.path.dirname(path)
    txt = open(path, encoding='utf-8', errors='replace').read()
    new = IMG_TOKEN.sub(sub_images, txt)
    new = FONT_URL.sub(sub_font, new)
    new = FONT_FACE.sub(add_font_display, new)
    if path.lower().endswith('.html'):
        new = add_lazy(new)
    if new != txt:
        open(path, 'w', encoding='utf-8').write(new)

# --- 4. stats ---------------------------------------------------------------
def tree_size():
    return sum(os.path.getsize(os.path.join(dp, f))
               for dp, _, fns in os.walk(ROOT) for f in fns)


print(f'[optimize] {len(converted)} images -> webp, '
      f'{len(fonts)} fonts -> woff2, tree now {tree_size() / 1e6:.1f}MB')
