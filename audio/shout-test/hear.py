import sys, os, subprocess, numpy as np
def load(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
from faster_whisper import WhisperModel
m=WhisperModel(os.environ.get('WM','base'),device='cpu',compute_type='int8')
for f in sys.argv[1:]:
    segs,info=m.transcribe(load(f),language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False,word_timestamps=True)
    out=[]
    for s in segs:
        for w in (s.words or []): out.append(f"{w.word.strip()}@{w.start:.2f}-{w.end:.2f}")
    print(os.path.basename(f),'|',' '.join(out) or '(nothing heard)')
