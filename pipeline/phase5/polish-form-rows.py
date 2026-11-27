import sys
from PIL import Image
import numpy as np
def lum(path):
    im=np.asarray(Image.open(path).convert('RGB')).astype(float)
    return im[...,0]*0.2126+im[...,1]*0.7152+im[...,2]*0.0722
def runs(mask,off):
    out=[];s=None
    for i,m in enumerate(mask):
        if m and s is None: s=i
        if not m and s is not None: out.append((s+off,i-1+off)); s=None
    if s is not None: out.append((s+off,len(mask)-1+off))
    return out
def measure(path,tx0,tx1,fx0,fx1,y0,y1,ink=130,drop=14):
    L=lum(path)
    paper=np.median(L[y0:y1,fx0:fx1].mean(axis=1)[:6])
    fm=L[y0:y1,fx0:fx1].mean(axis=1)
    fields=[r for r in runs(np.abs(fm-paper)>drop,y0) if r[1]-r[0]>=30]
    tmin=L[y0:y1,tx0:tx1].min(axis=1)
    mask=tmin<ink
    for a,b in fields: mask[max(0,a-y0-6):b-y0+7]=False
    texts=[r for r in runs(mask,y0) if r[1]-r[0]>=5]
    return paper,fields,texts
if __name__=='__main__':
    path=sys.argv[1]; a=list(map(int,sys.argv[2:8])); kw={}
    if len(sys.argv)>8: kw['ink']=int(sys.argv[8])
    if len(sys.argv)>9: kw['drop']=int(sys.argv[9])
    paper,fields,texts=measure(path,*a,**kw)
    print(path.split('/')[-1],'paper',round(paper))
    print(' pockets (top,foot,height):',[(a,b,b-a+1) for a,b in fields])
    print(' text ink (top,foot,rows): ',[(a,b,b-a+1) for a,b in texts])
