"""Reproduce the complete branded readers from the supplied, unmodified packet.

Run: python3 import-packet.py /path/to/metamyth-investor-packet
Only writes the three reader HTML files next to this script. No dependencies.
All prose and original external links are retained. The confirmed $500K ceiling
replaces the old $700K ceiling; inline styling and fixed-page scaling are removed.
"""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}


class Node:
    def __init__(self, tag, attrs=()):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []

    def text(self):
        return "".join(c.text() if isinstance(c, Node) else c for c in self.children)

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.walk()


class Tree(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


IMAGES = {
    "28409bc64b392d93fba923e5bb1e5893.png": "../assets/logo-butterfly.png",
    "b98146101d2ab494df08a60615a766ef.png": "../assets/icons/icon-globe.png",
    "57b7574ab60bf2f250826c13dbbb8ba3.png": "../assets/icons/icon-scroll.png",
    "a63358baa694b511eaaa53f5d6dc9adc.png": "../assets/icons/icon-compass.png",
    "0f8cd903ba44b66264843a4f2e8026f7.png": "../assets/icons/icon-butterfly.png",
}


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower().replace("'", "")).strip("-")


def render(node):
    if isinstance(node, str):
        return escape(node.replace("$700K", "$500K"))
    if node.tag == "script":
        return ""
    attrs = dict(node.attrs)
    style = attrs.pop("style", "")
    if style:
        classes = []
        if node.tag == "div":
            if "width: 816px" in style:
                classes.append("sheet-page")
            elif "height: 1px" in style:
                classes.append("sheet-rule")
            elif "width: 1px" in style:
                classes.append("sheet-spacer")
            else:
                if "display: grid" in style:
                    classes.append("sheet-grid")
                elif "flex-direction: column" in style:
                    classes.append("sheet-group")
                elif "display: flex" in style:
                    classes.append("sheet-row")
                if "border: 1px" in style:
                    classes.append("sheet-panel")
                if any(isinstance(c, Node) and c.tag == "img" for c in node.children) and "gap: 10px" in style:
                    classes.append("sheet-brand")
        if node.tag == "span":
            if "font-family:" in style:
                classes.append("sheet-number")
            elif "letter-spacing:" in style:
                classes.append("sheet-label")
        if node.tag == "p" and "10.5px" in style:
            classes.append("sheet-fine")
        if classes:
            attrs["class"] = " ".join(classes)
    if node.tag == "img":
        attrs["src"] = IMAGES[Path(attrs["src"]).name]
        attrs["loading"] = "lazy"
    if attrs.get("target") == "_blank":
        attrs["rel"] = "noopener noreferrer"
    attr_string = "".join(f' {escape(k)}="{escape(v or "", quote=True)}"' for k, v in attrs.items())
    result = f"<{node.tag}{attr_string}>"
    if node.tag not in VOID:
        inner = "".join(render(c) for c in node.children)
        result += inner + f"</{node.tag}>"
    if node.tag == "table":
        result = '<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable financial table">' + result + "</div>"
    return result


def build(source_dir):
    destination = Path(__file__).resolve().parent
    config = [
        ("investor-sheet.html", "Investor Sheet", "01 · The summary", "plot.html", "Continue to The Plot"),
        ("plot.html", "The Plot", "02 · The business plan", "terms.html", "Continue to draft terms"),
        ("terms.html", "Demand Dividend Note", "03 · The draft terms", "index.html#packet", "Return to the packet"),
    ]
    for filename, title, label, next_url, next_title in config:
        source = (source_dir / filename).read_text()
        tree = Tree(source)
        if filename == "investor-sheet.html":
            roots = [n for n in tree.root.walk() if "width: 816px" in n.attrs.get("style", "")]
        else:
            roots = [n for n in tree.root.walk() if n.tag == "article" and n.attrs.get("class") == "doc"]
            roots = roots[0].children
        headings = []
        used_ids = set()
        for root in roots:
            if not isinstance(root, Node):
                continue
            for node in root.walk():
                if node.tag == "h2":
                    anchor = slug(node.text())
                    if anchor in used_ids:
                        anchor += f"-{len(used_ids)}"
                    used_ids.add(anchor)
                    node.attrs["id"] = anchor
                    headings.append((anchor, node.text()))
        toc = "".join(f'<a href="#{escape(anchor)}">{escape(text)}</a>' for anchor, text in headings)
        prose = "".join(render(root) for root in roots)
        clarification = ""
        if filename == "plot.html":
            clarification = ''
        if filename == "investor-sheet.html":
            clarification = ''
        html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#091e14">
<meta name="description" content="{escape(title)} — the complete Metamyth pre-seed investor document. Draft, for discussion.">
<title>{escape(title)} · Metamyth Investor Room</title>
<link rel="icon" href="../assets/logo-butterfly.png">
<link rel="stylesheet" href="fund.css">
<script src="fund.js" defer></script>
</head>
<body class="reader">
<a class="skip" href="#document">Skip to document</a>
<div class="progress" aria-hidden="true"></div>
<header class="topbar">
<a class="brand" href="../" aria-label="Metamyth home"><img src="../assets/logo-butterfly.png" width="35" height="35" alt=""><span>Metamyth</span><span class="context">Investor room</span></a>
<nav class="top-links" aria-label="Site navigation"><a class="back-site" href="index.html#packet">← All documents</a><a class="gold-link" href="terms.html#risks-and-open-terms">Risks &amp; open terms</a></nav>
</header>
<div class="reader-tools"><span class="eyebrow">{label}</span><span class="muted">Q4 2026 · Complete source document · Draft</span><button class="button" type="button" data-print>Print document</button></div>
<main class="reader-layout" id="document">
<aside class="contents" aria-label="Document navigation"><details open><summary>In this document</summary><nav aria-label="Table of contents">{toc}</nav></details></aside>
<article class="doc" aria-label="{escape(title)}">
<div class="reader-status"><strong>Draft · For discussion only.</strong> Not an offer to sell securities. Projections are estimates, not guarantees. Final terms will be set with counsel. Capital is at risk.</div>
{prose}
{clarification}
<nav class="doc-nav" aria-label="Continue reading"><a href="index.html#packet">← Back to the packet</a><a href="{next_url}">{next_title} →</a></nav>
</article>
</main>
<footer class="reader-bottom">For discussion only; not an offer to sell securities. Projections are estimates, not guarantees. All terms are draft. Final terms are set in a note agreement prepared with counsel.</footer>
</body>
</html>
"""
        (destination / filename).write_text(html)
        print(f"Generated {filename}: {len(headings)} sections; complete source prose retained")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 import-packet.py /path/to/metamyth-investor-packet")
    build(Path(sys.argv[1]).resolve())
