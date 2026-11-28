import sys, subprocess, numpy as np, parselmouth, json, os
from parselmouth.praat import call
def wav(f):
    o='/tmp/m2_'+os.path.basename(f)+'.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-i',f,'-ac','1','-ar','44100',o],check=True); return o
def measure(f):
    s=parselmouth.Sound(wav(f)); dur=s.get_total_duration()
    p=s.to_pitch_ac(time_step=0.01,pitch_floor=75,pitch_ceiling=600,very_accurate=True,silence_threshold=0.03,voicing_threshold=0.45,octave_cost=0.01,octave_jump_cost=0.35,voiced_unvoiced_cost=0.14)
    f0=p.selected_array['frequency']; t=p.xs()
    inten=s.to_intensity(minimum_pitch=75,time_step=0.01); it=inten.xs(); iv=inten.values[0]
    thr=iv.max()-25
    on=iv>thr
    # sounding span and gaps
    idx=np.where(on)[0]; a,b=it[idx[0]],it[idx[-1]]
    gaps=[]; g=0
    for k in range(idx[0],idx[-1]+1):
        if not on[k]: g+=1
        else:
            if g: gaps.append(g*0.01)
            g=0
    longest=max(gaps) if gaps else 0.0
    v=f0[(f0>0)&(t>=a)&(t<=b)]
    # loudness in thirds of the sounding span
    th=[float(np.mean(iv[(it>=a+(b-a)*i/3)&(it<a+(b-a)*(i+1)/3)])) for i in range(3)]
    # pitch in thirds
    pt=[]
    for i in range(3):
        m=(f0>0)&(t>=a+(b-a)*i/3)&(t<a+(b-a)*(i+1)/3)
        pt.append(round(float(np.median(f0[m])),0) if m.any() else None)
    hnr=call(s.to_harmonicity_cc(0.01,75,0.1,1.0),'Get mean',0,0)
    # end: level in the last 0.08 s of the file against the peak
    x=s.values[0]; n=int(0.08*s.sampling_frequency)
    tail_db=20*np.log10(np.sqrt(np.mean(x[-n:]**2))+1e-9); peak_db=20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
    # spectral centroid of the sounding span
    sp=np.abs(np.fft.rfft(x))**2; fq=np.fft.rfftfreq(len(x),1/s.sampling_frequency)
    lowshare=float(sp[(fq>=80)&(fq<400)].sum()/sp[(fq>=80)&(fq<8000)].sum())
    return dict(file=os.path.basename(f),seconds=round(dur,2),sounding=[round(float(a),2),round(float(b),2)],f0_median=round(float(np.median(v)),0) if len(v) else None,f0_p10=round(float(np.percentile(v,10)),0) if len(v) else None,f0_p90=round(float(np.percentile(v,90)),0) if len(v) else None,f0_thirds=pt,voiced=round(float(len(v)/max(1,((t>=a)&(t<=b)).sum())),2),longest_gap=round(longest,2),gaps=len(gaps),db_thirds=[round(x,1) for x in th],rise_db=round(th[2]-th[0],1),hnr_db=round(float(hnr),1),tail_under_rms_db=round(float(tail_db-peak_db),1),low_share=round(lowshare,3))
if __name__=='__main__':
    out=[measure(f) for f in sys.argv[1:]]
    for m in out: print(json.dumps(m))
