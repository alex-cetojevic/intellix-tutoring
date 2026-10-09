"""Rebuild the three cut-down font files in fonts/ from the originals in tools/font-sources/.

They hold only the characters the site uses, so phones download less before the first paint.
Run this after adding a formula with a new symbol, or text with a new accented letter
(for example Ł or ő):

    pip3 install fonttools brotli
    python3 tools/subset_fonts.py

A character left out is not lost: the browser shows it in the fallback font (Georgia or Arial).
"""
import html.parser
import pathlib
import subprocess

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'tools' / 'font-sources'
FONTS = ROOT / 'fonts'

# Elements set in the math font (--font-math in styles.css)
MATH_CLASSES = {'math', 'marking-work', 'worksheet-math'}
VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
# Always kept, so a new formula with a new letter or digit still shows in the math font
ASCII = {chr(c) for c in range(0x20, 0x7F)}
CROATIAN = set('ČčĆćĐđŠšŽž')


class TextCollector(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.math_stack = []
        self.all_text = set()
        self.math_text = set()

    def handle_starttag(self, tag, attrs):
        if tag in VOID_TAGS:
            return
        classes = set((dict(attrs).get('class') or '').split())
        self.math_stack.append(bool(classes & MATH_CLASSES))

    def handle_endtag(self, tag):
        if tag not in VOID_TAGS and self.math_stack:
            self.math_stack.pop()

    def handle_data(self, data):
        self.all_text.update(data)
        if any(self.math_stack):
            self.math_text.update(data)


def site_text():
    files = subprocess.run(['git', '-C', str(ROOT), 'ls-files', '*.html', '*.js'],
                           capture_output=True, text=True, check=True).stdout.split()
    collector = TextCollector()
    for name in files:
        text = (ROOT / name).read_text(encoding='utf-8')
        if name.endswith('.js'):
            collector.all_text.update(text)
        else:
            collector.feed(text)
            collector.math_stack.clear()
    return collector.all_text, collector.math_text - {'\n', '\r', '\t'}


def build(source, target, wanted, report_missing=False):
    font = TTFont(SOURCES / source)
    available = {chr(c) for c in font.getBestCmap()}
    kept = wanted & available
    subsetter = subset.Subsetter(subset.Options())
    subsetter.populate(text=''.join(sorted(kept)))
    subsetter.subset(font)
    font.flavor = 'woff2'
    font.save(FONTS / target)
    print(f'{target}: {len(kept)} characters, {(FONTS / target).stat().st_size} bytes')
    left_out = sorted(c for c in wanted - available if not c.isspace())
    if report_missing and left_out:
        print(f'  not in this font file, shown in the fallback font: {" ".join(left_out)}')


def main():
    all_text, math_text = site_text()
    for style in ('normal', 'italic'):
        build(f'stix-two-text-latin-wght-{style}.woff2', f'stix-two-text-latin-subset-wght-{style}.woff2',
              ASCII | math_text, report_missing=True)
    build('libre-franklin-latin-ext-wght-normal.woff2', 'libre-franklin-latin-ext-subset-wght-normal.woff2',
          all_text | CROATIAN)


if __name__ == '__main__':
    main()
