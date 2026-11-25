#!/usr/bin/env python3
"""Bakes type for the site: outlines, advances and kerning of each font, as JSON under public/fonts/.

The site draws every word as geometry made from these outlines. Nothing is a picture of text.
This is a build-time tool. The site and `npm run build` need only the JSON files it wrote.

Sources:
  Inter 4.1, the official release archive, SIL Open Font License 1.1.
  Playfair Display, from the pinned npm package @fontsource/playfair-display, SIL Open Font License 1.1.

Run from the repo root:  python3 pipeline/fonts/bake_fonts.py
"""
import hashlib
import io
import json
import os
import sys
import urllib.request
import zipfile

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
import uharfbuzz as hb

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, 'references', 'cache', 'fonts')
OUT = os.path.join(ROOT, 'public', 'fonts')
INTER_URL = 'https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip'
INTER_SHA256 = '9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e'

# What is baked: Latin with its accents, punctuation, arrows and the few symbols the copy uses.
RANGES = [(0x20, 0x7E), (0xA0, 0xFF), (0x100, 0x17F), (0x2010, 0x2027), (0x2030, 0x203A), (0x20AC, 0x20AC),
          (0x2122, 0x2122), (0x2190, 0x2199), (0x2212, 0x2212), (0x221E, 0x221E), (0x2248, 0x2248),
          (0x2260, 0x2265), (0x25CF, 0x25CF), (0x2713, 0x2717)]
# Kerning is kept between these: everything a line of copy is likely to put side by side.
KERN_RANGES = [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2030, 0x203A)]

FONTS = [
    ('inter-400', 'inter', 'extras/ttf/Inter-Regular.ttf', 'Inter', 'Regular', 400),
    ('inter-500', 'inter', 'extras/ttf/Inter-Medium.ttf', 'Inter', 'Medium', 500),
    ('inter-600', 'inter', 'extras/ttf/Inter-SemiBold.ttf', 'Inter', 'SemiBold', 600),
    ('inter-display-600', 'inter', 'extras/ttf/InterDisplay-SemiBold.ttf', 'Inter Display', 'SemiBold', 600),
    ('playfair-700', 'playfair', 'playfair-display-latin-700-normal.woff', 'Playfair Display', 'Bold', 700),
    ('playfair-900', 'playfair', 'playfair-display-latin-900-normal.woff', 'Playfair Display', 'Black', 900),
]


class Recorder(BasePen):
    """Collects a glyph as a flat list: 0 x y move, 1 x y line, 2 cx cy x y quadratic, 3 c1x c1y c2x c2y x y cubic, 4 close."""

    def __init__(self, glyph_set):
        super().__init__(glyph_set)
        self.out = []

    def _moveTo(self, p):
        self.out += [0, round(p[0]), round(p[1])]

    def _lineTo(self, p):
        self.out += [1, round(p[0]), round(p[1])]

    def _qCurveToOne(self, c, p):
        self.out += [2, round(c[0]), round(c[1]), round(p[0]), round(p[1])]

    def _curveToOne(self, c1, c2, p):
        self.out += [3, round(c1[0]), round(c1[1]), round(c2[0]), round(c2[1]), round(p[0]), round(p[1])]

    def _closePath(self):
        self.out += [4]

    def _endPath(self):
        self.out += [4]


def inter_bytes(member):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, 'Inter-4.1.zip')
    if not os.path.exists(path):
        urllib.request.urlretrieve(INTER_URL, path)
    digest = hashlib.sha256(open(path, 'rb').read()).hexdigest()
    if digest != INTER_SHA256:
        sys.exit(f'Inter archive has sha256 {digest}, expected {INTER_SHA256}')
    with zipfile.ZipFile(path) as z:
        return z.read(member), z.read('LICENSE.txt')


def playfair_bytes(name):
    base = os.path.join(ROOT, 'node_modules', '@fontsource', 'playfair-display')
    font = TTFont(os.path.join(base, 'files', name))
    font.flavor = None
    buf = io.BytesIO()
    font.save(buf)
    return buf.getvalue(), open(os.path.join(base, 'LICENSE'), 'rb').read()


def in_ranges(cp, ranges):
    return any(a <= cp <= b for a, b in ranges)


def bake(out_name, kind, member, family, style, weight):
    data, licence = inter_bytes(member) if kind == 'inter' else playfair_bytes(member)
    font = TTFont(io.BytesIO(data))
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    hmtx = font['hmtx']
    os2 = font['OS/2']
    chars = sorted(cp for cp in cmap if in_ranges(cp, RANGES))
    glyphs = {}
    for cp in chars:
        name = cmap[cp]
        pen = Recorder(glyph_set)
        glyph_set[name].draw(pen)
        glyphs[str(cp)] = {'a': hmtx[name][0], 'p': pen.out}
    # Kerning, read with the same shaping engine browsers use, pair by pair.
    face = hb.Face(data)
    hfont = hb.Font(face)
    off = {'kern': False, 'liga': False, 'clig': False, 'calt': False, 'ccmp': False, 'locl': False, 'rlig': False, 'dlig': False}
    on = dict(off, kern=True)
    kern_chars = [cp for cp in chars if in_ranges(cp, KERN_RANGES)]

    def advance(a, b, features):
        buf = hb.Buffer()
        buf.add_codepoints([a, b])
        buf.guess_segment_properties()
        hb.shape(hfont, buf, features)
        if len(buf.glyph_positions) != 2:
            return None
        return buf.glyph_positions[0].x_advance + buf.glyph_positions[1].x_offset

    kern = {}
    pairs = 0
    for a in kern_chars:
        row = []
        for b in kern_chars:
            k1 = advance(a, b, on)
            k0 = advance(a, b, off)
            if k1 is None or k0 is None:
                continue
            d = k1 - k0
            if d != 0:
                row += [b, d]
                pairs += 1
        if row:
            kern[str(a)] = row
    out = {
        'family': family, 'style': style, 'weight': weight,
        'unitsPerEm': font['head'].unitsPerEm,
        'ascender': font['hhea'].ascent, 'descender': font['hhea'].descent, 'lineGap': font['hhea'].lineGap,
        'capHeight': getattr(os2, 'sCapHeight', 0), 'xHeight': getattr(os2, 'sxHeight', 0),
        'source': ('Inter 4.1, ' + member) if kind == 'inter' else ('@fontsource/playfair-display 5.3.0, files/' + member),
        'licence': 'SIL Open Font License 1.1',
        'glyphs': glyphs, 'kern': kern,
    }
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, out_name + '.json')
    with open(path, 'w') as f:
        json.dump(out, f, separators=(',', ':'), sort_keys=True)
    lic = os.path.join(OUT, ('Inter' if kind == 'inter' else 'PlayfairDisplay') + '-LICENSE.txt')
    with open(lic, 'wb') as f:
        f.write(licence)
    size = os.path.getsize(path)
    digest = hashlib.sha256(open(path, 'rb').read()).hexdigest()[:16]
    print(f'{out_name}.json  glyphs {len(glyphs)}  kerning pairs {pairs}  {size} bytes  sha256 {digest}')


if __name__ == '__main__':
    for row in FONTS:
        bake(*row)
