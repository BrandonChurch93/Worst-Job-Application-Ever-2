"""Draw one picture with a waveform for each sound file: its name, its length and its peak.
Usage: python3 pipeline/audio/waveform_sheet.py <out.jpg> <title> <file> [<file> ...]
A status that follows new sounds shows this picture. Decoding is done by ffmpeg, drawing by PIL."""
import subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

out, title, files = Path(sys.argv[1]), sys.argv[2], [Path(p) for p in sys.argv[3:]]
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
PAPER, INK, SOFT, WAVE = (233, 230, 223), (28, 28, 30), (120, 116, 108), (214, 96, 28)
W, ROW, PAD, HEAD = 1200, 150, 28, 70
RATE = 44100

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

im = Image.new('RGB', (W, HEAD + ROW * len(files) + PAD), PAPER)
d = ImageDraw.Draw(im)
d.text((PAD, 22), title, fill=INK, font=ImageFont.truetype(FONT, 26))
label, small = ImageFont.truetype(FONT, 18), ImageFont.truetype(FONT, 15)
for i, f in enumerate(files):
    x = decode(f)
    secs = len(x) / RATE
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    peak_db = 20 * np.log10(peak) if peak > 0 else float('-inf')
    top = HEAD + i * ROW
    d.text((PAD, top), f.name, fill=INK, font=label)
    d.text((PAD, top + 24), f'{secs:.2f} s, peak {peak_db:.1f} dBFS', fill=SOFT, font=small)
    x0, x1, mid, half = PAD, W - PAD, top + 96, 44
    d.line([(x0, mid), (x1, mid)], fill=SOFT, width=1)
    cols = x1 - x0
    if len(x):
        edges = np.linspace(0, len(x), cols + 1).astype(int)
        for c in range(cols):
            seg = x[edges[c]:max(edges[c + 1], edges[c] + 1)]
            lo, hi = float(seg.min()), float(seg.max())
            d.line([(x0 + c, mid - hi * half), (x0 + c, mid - lo * half)], fill=WAVE, width=1)
im.save(out, quality=88)
print(out, im.size)
