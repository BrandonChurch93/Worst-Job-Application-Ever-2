import sys, numpy as np, parselmouth
def meas(f, maxf=5000):
    s = parselmouth.Sound(f)
    if s.n_channels > 1: s = s.convert_to_mono()
    p = s.to_pitch_ac(time_step=0.01, pitch_floor=55, pitch_ceiling=350)
    fm = s.to_formant_burg(time_step=0.01, max_number_of_formants=5, maximum_formant=maxf)
    ts = p.xs(); f0 = p.selected_array['frequency']
    F = [[], [], []]
    for t, v in zip(ts, f0):
        if v > 0:
            for k in range(3):
                x = fm.get_value_at_time(k + 1, t)
                if x == x: F[k].append(x)
    sp = s.to_spectrum()
    fr = sp.xs(); pw = np.abs(sp.values[0] + 1j * sp.values[1]) ** 2
    m = (fr > 60) & (fr < 8000)
    cen = float((fr[m] * pw[m]).sum() / pw[m].sum())
    v = f0[f0 > 0]
    return dict(sec=round(s.duration, 2), f0=round(float(np.median(v)), 1), F1=round(float(np.median(F[0]))), F2=round(float(np.median(F[1]))), F3=round(float(np.median(F[2]))), centroid=round(cen))
for f in sys.argv[1:]:
    print(f.split('/')[-1][:44].ljust(44), meas(f))
