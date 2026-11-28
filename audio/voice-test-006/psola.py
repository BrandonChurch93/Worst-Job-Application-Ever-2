# psola.py IN OUT PITCHFACTOR DURFACTOR : Praat overlap-add resynthesis, formants kept
import sys, parselmouth
from parselmouth.praat import call
src, out, pf, df = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
s = parselmouth.Sound(src)
if s.n_channels > 1: s = s.convert_to_mono()
m = call(s, "To Manipulation", 0.01, 55, 350)
pt = call(m, "Extract pitch tier")
call(pt, "Multiply frequencies", s.xmin, s.xmax, pf)
call([pt, m], "Replace pitch tier")
dt = call(m, "Extract duration tier")
call(dt, "Add point", s.xmin, df)
call(dt, "Add point", s.xmax, df)
call([dt, m], "Replace duration tier")
r = call(m, "Get resynthesis (overlap-add)")
r.save(out, "WAV")
print(out, round(r.duration, 2))
