# Reads whole pictures of the live walk (step-NNNNNN-x2.png, 1920 by 1080, one px of the page a px) and says, for each, how bright the rim of the ball is against the glass of a window right beside it.
# python3 pipeline/phase5/polish-lamps-rim.py RUN.json DIR INSERTS.json STEP [STEP ...]
import json, math, sys
from PIL import Image
run = json.load(open(sys.argv[1]))
d = sys.argv[2]
ins = json.load(open(sys.argv[3]))
for st in map(int, sys.argv[4:]):
    row = run['rows'][st]
    bx, by = row[3], row[4] - row[5]
    im = Image.open(f'{d}/step-{st:06d}-x2.png').convert('RGB')
    px = im.load()
    def lum(x, y):
        r, g, b = px[int(round(x)), int(round(y))]
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    def ring(a, r0, r1):
        s = 0; n = 0
        for k in range(4):
            r = r0 + (r1 - r0) * k / 3
            s += lum(bx + r * math.cos(a), by + r * math.sin(a)); n += 1
        return s / n
    for w in ins:
        wx, wy = w['x'], w['y'] - row[5]
        dist = math.hypot(bx - wx, by - wy)
        if dist > w['r'] + 48: continue
        rims = []; glass = []; darker = 0; n = 0
        for i in range(120):
            a = i * math.pi / 60
            ox, oy = bx + 53 * math.cos(a), by + 53 * math.sin(a)
            if math.hypot(ox - wx, oy - wy) > w['r'] - 8: continue
            rim = ring(a, 43.5, 47); out = ring(a, 50.5, 55)
            rims.append(rim); glass.append(out); n += 1
            if rim < out: darker += 1
        if n == 0:
            print(f'step {st} {w["id"]}: middle {dist:.1f} px off, no glass beside the rim'); continue
        cen = sum(lum(bx + r * math.cos(a), by + r * math.sin(a)) for r in (8, 16, 24) for a in (0.5, 2.1, 3.7, 5.3)) / 12
        print(f'step {st} {w["id"]}: middle {dist:.1f} px off; rim {sum(rims)/n:.0f}, glass beside it {sum(glass)/n:.0f} (of 255); rim darker on {darker} of {n} places round; brightest rim {max(rims):.0f}, darkest glass {min(glass):.0f}; inside the ball {cen:.0f}')
