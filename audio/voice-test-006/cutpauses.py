import sys, subprocess, numpy as np, parselmouth
# usage: cutpauses.py IN OUT keep1,keep2,...  (seconds kept of each pause >= 0.3 s, in order)
inp, out, keeps = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3].split(',')]
sr = 48000
raw = subprocess.run(['ffmpeg','-v','error','-i',inp,'-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True).stdout
x = np.frombuffer(raw, dtype=np.float32).copy()
s = parselmouth.Sound(x.astype(np.float64), sampling_frequency=sr)
it = s.to_intensity(minimum_pitch=75, time_step=0.005); db = it.values[0]; t = it.xs(); on = db > db.max()-35
gaps=[]; i=0
while i < len(on):
    if not on[i]:
        j=i
        while j < len(on) and not on[j]: j+=1
        if i>0 and j<len(on) and (t[j]-t[i])>=0.30: gaps.append((float(t[i]), float(t[j])))
        i=j
    else: i+=1
assert len(gaps)==len(keeps), (len(gaps), len(keeps), gaps)
pieces=[]; pos=0; f=int(0.012*sr)
for (a,b),k in zip(gaps,keeps):
    mid=(a+b)/2; ca=int((mid-(b-a)/2+k/2)*sr); cb=int((mid+(b-a)/2-k/2)*sr)   # keep k/2 of silence each side
    seg=x[pos:ca].copy(); seg[-f:]*=np.linspace(1,0,f); pieces.append(seg)
    pos=cb
    x[pos:pos+f]*=np.linspace(0,1,f)
pieces.append(x[pos:])
y=np.concatenate(pieces)
p=subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(sr),'-ac','1','-i','-',out],input=y.astype(np.float32).tobytes())
print('gaps found:', [(round(a,2), round(b-a,2)) for a,b in gaps]); print('in', round(len(x)/sr,2), 's out', round(len(y)/sr,2), 's')
