"""Phase 0 step 8: test images with fine numbered marks, to find the longest edge that reaches a model without being downscaled.
Each image carries one six digit code at each glyph height. The smallest height a viewer reads correctly rises once an image is downscaled."""
import json, random, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
edges = [800, 1200, 1400, 1600, 2000, 2800]
heights = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20]
rng = random.Random(20261124)
truth = {}

def font_for_cap(h):
    size = 4
    while True:
        f = ImageFont.truetype(font_path, size)
        box = f.getbbox('0123456789')
        if box[3] - box[1] >= h:
            return f
        size += 1

for n, edge in enumerate(edges):
    w, hgt = edge, round(edge * 9 / 16)
    im = Image.new('RGB', (w, hgt), (233, 230, 223))
    d = ImageDraw.Draw(im)
    name = f'set-A-{n + 1:02d}'
    big = ImageFont.truetype(font_path, max(28, edge // 28))
    d.text((24, 16), f'{name}', fill=(20, 20, 20), font=big)
    y = 24 + big.size + 24
    rows = {}
    label_font = ImageFont.truetype(font_path, 22)
    for i, h in enumerate(heights):
        code = ''.join(rng.choice('0123456789') for _ in range(6))
        rows[str(h)] = code
        d.text((24, y), f'row {i + 1:02d}:', fill=(20, 20, 20), font=label_font)
        f = font_for_cap(h)
        d.text((160, y + (22 - h) // 2), code, fill=(20, 20, 20), font=f)
        y += max(30, h + 14)
    y += 10
    d.text((24, y), 'ruler: a tick every 10 px, a number every 100 px', fill=(20, 20, 20), font=label_font)
    y += 34
    tiny = font_for_cap(7)
    for x in range(0, w, 10):
        d.line([(x, y), (x, y + (14 if x % 100 == 0 else 6))], fill=(20, 20, 20), width=1)
        if x % 100 == 0:
            d.text((x + 2, y + 16), str(x), fill=(20, 20, 20), font=tiny)
    y += 44
    x = 24
    for period in [2, 3, 4, 6, 8]:
        for k in range(0, 120, period):
            d.rectangle([x + k, y, x + k + period // 2 - (0 if period > 2 else 0) - (1 if period % 2 == 0 else 0), y + 40], fill=(20, 20, 20))
        d.text((x, y + 46), f'lines every {period} px', fill=(20, 20, 20), font=ImageFont.truetype(font_path, 14))
        x += 150
    im.save(out / f'{name}.png')
    truth[name] = {'longEdge': edge, 'size': [w, hgt], 'rows': rows}

(out / 'truth.json').write_text(json.dumps({'heights': heights, 'images': truth}, indent=2) + '\n')
print(json.dumps(truth)[:400])
