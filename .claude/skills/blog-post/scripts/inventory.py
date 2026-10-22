#!/usr/bin/env python3
"""List what is already published on intellixtutoring.com, so a new post does not repeat it.

Usage (from anywhere):
  python3 .claude/skills/blog-post/scripts/inventory.py              # every English blog post: title, summary, sections
  python3 .claude/skills/blog-post/scripts/inventory.py --lang it    # the Italian posts instead
  python3 .claude/skills/blog-post/scripts/inventory.py --pages      # service and school pages too
  python3 .claude/skills/blog-post/scripts/inventory.py --search syllabus "paper 3" sillabo
      # every page (blog and service, EN and IT) that mentions a word, with the lines that match
"""
import argparse
import html
import re
import signal
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SKIP_DIRS = {"redirects", "tools", "clients", "intellix-redesign-handoff", "_includes", "_site", "brand", "fonts"}
SKIP_FILES = {"404.html"}


def front_matter(text):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    fm = {}
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip().strip("'\"")
    return fm


def plain(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def body_text(text):
    """Visible text of the page body, one line per block, without scripts or JSON-LD."""
    text = re.sub(r"<script.*?</script>", " ", text, flags=re.S)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.S)
    text = re.sub(r"\{%.*?%\}", " ", text)
    text = re.sub(r"</(p|h[1-6]|li|div|td|th|tr)>", "\n", text)
    lines = (plain(l) for l in text.splitlines())
    return [re.sub(r"\s+", " ", l) for l in lines if l]


def describe(path):
    text = path.read_text(encoding="utf-8")
    fm = front_matter(text)
    date = re.search(r'class="article-meta">([^<&]+)', text)
    short = re.search(r'answer-first-label">[^<]*</div>\s*<p>(.*?)</p>', text, re.S)
    article = text.split('id="next-title"')[0]
    h2s = [plain(h) for h in re.findall(r"<h2[^>]*>(.*?)</h2>", article, re.S)]
    faqs = [plain(h) for h in re.findall(r'<h3 class="faq-q">(.*?)</h3>', text, re.S)]
    links = sorted(set(re.findall(r'href="(/(?:it/)?blog/[^"#]+/)"', article)))
    return fm, date.group(1).strip() if date else "", plain(short.group(1)) if short else "", h2s, faqs, links


def pages(blog_only, lang):
    out = []
    for p in sorted(REPO.rglob("*.html")):
        rel = p.relative_to(REPO)
        if rel.parts[0] in SKIP_DIRS or rel.parts[0].startswith(".") or rel.name in SKIP_FILES:
            continue
        is_it = rel.parts[0] == "it"
        if lang and (lang == "it") != is_it:
            continue
        is_blog = "blog" in rel.parts[:-1]
        if blog_only and not is_blog:
            continue
        out.append(rel)
    return out


def show_inventory(lang, with_pages):
    rels = pages(blog_only=not with_pages, lang=lang)
    posts = [r for r in rels if "blog" in r.parts[:-1]]
    others = [r for r in rels if r not in posts]
    print(f"# {len(posts)} blog posts ({lang.upper()})\n")
    for rel in posts:
        fm, date, short, h2s, faqs, links = describe(REPO / rel)
        twin = REPO / ("it" / rel if lang == "en" else Path(*rel.parts[1:]))
        print(f"## {rel}  [{date}]{'' if twin.exists() else '  (no twin in the other language)'}")
        print(f"Title: {fm.get('title', '?')}")
        print(f"Summary: {fm.get('description', '')}")
        if short:
            print(f"In short: {short}")
        print("Sections: " + " | ".join(h2s))
        if faqs:
            print("FAQ: " + " | ".join(faqs))
        if links:
            print("Links to posts: " + ", ".join(links))
        print()
    if others:
        print(f"# {len(others)} other pages\n")
        for rel in others:
            fm, *_ = describe(REPO / rel)
            print(f"- {rel}: {fm.get('title', '?')}")


def search(words):
    pats = [re.compile(re.escape(w), re.I) for w in words]
    for rel in pages(blog_only=False, lang=None):
        # Stop at "Where to go next": those boxes repeat the same blurbs on many pages.
        lines = body_text((REPO / rel).read_text(encoding="utf-8").split('id="next-title"')[0])
        hits = [l for l in lines if any(p.search(l) for p in pats)]
        if hits:
            print(f"## {rel}  ({len(hits)} lines)")
            for l in hits[:6]:
                print(f"  - {l[:220]}")
            print()


if __name__ == "__main__":
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)  # quiet exit when piped into head
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lang", choices=["en", "it"], default="en")
    ap.add_argument("--pages", action="store_true", help="also list service and school pages")
    ap.add_argument("--search", nargs="+", metavar="WORD", help="find pages that mention any of these words")
    args = ap.parse_args()
    if args.search:
        search(args.search)
    else:
        show_inventory(args.lang, args.pages)
