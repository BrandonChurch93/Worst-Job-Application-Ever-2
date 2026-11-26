import json, math, sys
import cv2
import numpy as np

name = sys.argv[1] if len(sys.argv) > 1 else 'critic'
live = sys.argv[2] if len(sys.argv) > 2 else '/tmp/live0.json'
base = 'out/work/fix-flipper/' + name + '/'
rows = json.load(open(base + 'rows.json'))['rows']
sim = {r['step']: r for r in json.load(open(live))['rows']}
BALL = 96.0
PIVOT = (13.47, 8.95)
out = []
print('n  page s   step  sim place px     page hero px    drawn ball px    off px  sim bat  drawn bat')
for r in rows:
    step = round(r['pageTime'] * 240)
    s = sim.get(step)
    img = cv2.imread(base + r['file'])
    top = r['heroY'] - r['scroll']
    if s:
        top0 = s['hy'] - s['v'] * BALL
    cx, cy = r['heroX'], top
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    x0, y0 = int(cx - 110), int(cy - 110)
    x0c, y0c = max(0, x0), max(0, y0)
    roi = g[y0c:int(cy + 110), x0c:int(cx + 110)]
    roi = cv2.GaussianBlur(roi, (5, 5), 1.2)
    cs = cv2.HoughCircles(roi, cv2.HOUGH_GRADIENT, dp=1, minDist=20, param1=120, param2=18, minRadius=44, maxRadius=52)
    drawn = None
    if cs is not None:
        best = min(cs[0], key=lambda c: (c[0] + x0c - cx) ** 2 + (c[1] + y0c - cy) ** 2)
        drawn = (float(best[0] + x0c), float(best[1] + y0c), float(best[2]))
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    px = PIVOT[0] * BALL
    py = PIVOT[1] * BALL + (r['heroY'] - r['scroll'] - (s['v'] * BALL if s else 0)) if s else None
    bat = None
    if s:
        m = cv2.inRange(hsv, (8, 150, 120), (22, 255, 255))
        m[:, :960] = 0
        m[:, 1340:] = 0
        m[:int(py - 200), :] = 0
        m[int(py + 200):, :] = 0
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        count, labels, stats, cents = cv2.connectedComponentsWithStats(m)
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])) if count > 1 else 0
        ys, xs = np.nonzero(labels == big) if big else (np.array([]), np.array([]))
        d = np.hypot(xs - cx, ys - cy)
        keep = d > 54
        xs, ys = xs[keep], ys[keep]
        if len(xs) > 400:
            pts = np.stack([xs, ys], 1).astype(np.float64)
            mean = pts.mean(0)
            u, sv, vt = np.linalg.svd(pts - mean, full_matrices=False)
            ax = vt[0]
            if ax[0] > 0:
                ax = -ax
            bat = math.degrees(math.atan2(ax[1], -ax[0]))
    off = math.hypot(drawn[0] - cx, drawn[1] - cy) if drawn else None
    simp = (s['hx'], s['hy'] - r['scroll']) if s else None
    print('%2d %.4f %5d  %s  %7.1f %6.1f  %s  %s  %s  %s' % (
        r['n'] + 1, r['pageTime'], step,
        ('%7.1f %6.1f' % simp) if simp else '   none      ',
        cx, cy,
        ('%7.1f %6.1f r %.1f' % drawn) if drawn else 'not found',
        ('%5.1f' % off) if off is not None else '  -  ',
        ('%6.1f' % s['R']) if s else '  -  ',
        ('%6.1f' % bat) if bat is not None else '  -  '))
    out.append({'n': r['n'] + 1, 'pageTime': r['pageTime'], 'step': step, 'sim': simp, 'hero': [cx, cy], 'drawn': drawn, 'simBat': s['R'] if s else None, 'drawnBat': bat})
json.dump(out, open(base + 'drawn.json', 'w'), indent=1)
