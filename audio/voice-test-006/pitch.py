import sys, json, os, numpy as np, parselmouth
def meas(f):
    s = parselmouth.Sound(f)
    if s.n_channels > 1: s = s.convert_to_mono()
    p = s.to_pitch_ac(time_step=0.01, pitch_floor=55, pitch_ceiling=350)
    f0 = p.selected_array['frequency']; v = f0[f0 > 0]
    it = s.to_intensity(minimum_pitch=75, time_step=0.01)
    db = it.values[0]; t = it.xs()
    thr = db.max() - 35
    on = db > thr
    # gaps
    gaps = []; i = 0
    while i < len(on):
        if not on[i]:
            j = i
            while j < len(on) and not on[j]: j += 1
            if i > 0 and j < len(on): gaps.append((round(float(t[i]), 2), round((j - i) * 0.01, 2)))
            i = j
        else: i += 1
    big = [g for g in gaps if g[1] >= 0.30]
    spoken = float(on.sum() * 0.01)
    return dict(sec=round(s.duration, 2), f0_med=round(float(np.median(v)), 1) if len(v) else None,
                f0_p10=round(float(np.percentile(v, 10)), 1) if len(v) else None, f0_p90=round(float(np.percentile(v, 90)), 1) if len(v) else None,
                spoken=round(spoken, 2), gaps=big)
if __name__ == '__main__':
    for f in sys.argv[1:]:
        m = meas(f)
        words = None
        j = f[:-4] + '.json'
        if os.path.exists(j):
            try:
                d = json.load(open(j)); tx = d.get('text') or d.get('words') or ''
                if isinstance(tx, str) and tx: words = len([w for w in tx.replace('/', ' ').split() if w.strip()])
            except Exception: pass
        g = m['gaps']
        print(f"{os.path.basename(f):38s} {m['sec']:6.2f}s f0 med {m['f0_med']} (p10 {m['f0_p10']}, p90 {m['f0_p90']}) spoken {m['spoken']:5.2f}s" + (f" words {words} = {words/m['spoken']:.2f}/s spoken, {words/m['sec']:.2f}/s whole" if words else '') + f" pauses>=0.3s: {len(g)}" + (f" mean {np.mean([x[1] for x in g]):.2f} max {max(x[1] for x in g):.2f}" if g else ''))
