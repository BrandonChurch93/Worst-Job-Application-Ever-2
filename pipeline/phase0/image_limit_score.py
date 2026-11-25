"""Phase 0 step 8: score every viewer's reading of the test pictures against the truth file.
Usage: python3 pipeline/phase0/image_limit_score.py <folder with truth.json and answers/> <out.json>
For each viewer and picture it reports the smallest glyph height read correctly, how many rows were read wrongly
(a wrong reading given as if it were right is worse than "cannot read") and what the fine line patterns looked like."""
import json, re, sys
from pathlib import Path

root = Path(sys.argv[1])
truth = json.loads((root / 'truth.json').read_text())
heights = truth['heights']
result = {'heights': heights, 'viewers': {}}
for f in sorted((root / 'answers').glob('*.txt')):
    text = f.read_text()
    model = re.search(r'^MODEL:\s*(.+)$', text, re.M)
    sound = re.search(r'^SOUND:\s*(.+)$', text, re.M)
    notes = re.search(r'^NOTES:\s*(.+)$', text, re.M)
    entry = {'model': model.group(1).strip() if model else 'not stated', 'pictures': {},
             'sound': sound.group(1).strip() if sound else 'not asked',
             'notes': notes.group(1).strip() if notes else ''}
    for name, im in truth['images'].items():
        line = re.search(r'^' + re.escape(name) + r':\s*(.+)$', text, re.M)
        if not line:
            continue
        body = line.group(1)
        rows_part, _, rest = body.partition('|')
        reads = dict(re.findall(r'(\d\d)=(\d+|[a-zA-Z ]+?)(?=\s+\d\d=|\s*$)', rows_part.strip()))
        correct, wrong, unread = [], [], []
        for i, h in enumerate(heights):
            got = reads.get(f'{i + 1:02d}', '').strip()
            want = im['rows'][str(h)]
            if got == want:
                correct.append(h)
            elif got.isdigit():
                wrong.append(h)
            else:
                unread.append(h)
        lines = dict(re.findall(r'(\d)=([a-zA-Z ]+?)(?=\s+\d=|\s*$)', rest.split('lines:')[-1].strip())) if 'lines:' in rest else {}
        ruler = re.search(r'ruler=([^|]+)', rest)
        entry['pictures'][name] = {
            'longEdge': im['longEdge'],
            'smallestHeightReadPx': min(correct) if correct else None,
            'wrongHeightsPx': wrong,
            'unreadHeightsPx': unread,
            'ruler': ruler.group(1).strip() if ruler else '',
            'lines': {k: v.strip() for k, v in lines.items()},
        }
    result['viewers'][f.stem] = entry

Path(sys.argv[2]).write_text(json.dumps(result, indent=2) + '\n')
edges = sorted({im['longEdge'] for im in truth['images'].values()})
print('smallest glyph height read correctly, in px of the picture as made (w = rows read wrongly)')
print('viewer'.ljust(12) + 'model'.ljust(34) + ''.join(str(e).rjust(9) for e in edges))
for v, e in result['viewers'].items():
    cells = []
    for edge in edges:
        p = next((p for p in e['pictures'].values() if p['longEdge'] == edge), None)
        if p is None:
            cells.append('-'.rjust(9))
        else:
            s = str(p['smallestHeightReadPx']) + (f" w{len(p['wrongHeightsPx'])}" if p['wrongHeightsPx'] else '')
            cells.append(s.rjust(9))
    print(v.ljust(12) + e['model'][:32].ljust(34) + ''.join(cells))
print()
print('2 px and 3 px line patterns (s = separate lines, g = flat grey, - = not seen)')
for v, e in result['viewers'].items():
    cells = []
    for edge in edges:
        p = next((p for p in e['pictures'].values() if p['longEdge'] == edge), None)
        if p is None:
            cells.append('-'.rjust(9))
            continue
        def mark(k):
            t = p['lines'].get(k, '')
            return 's' if 'separate' in t else 'g' if 'grey' in t else '-'
        cells.append((mark('2') + mark('3')).rjust(9))
    print(v.ljust(12) + e['model'][:32].ljust(34) + ''.join(cells))
