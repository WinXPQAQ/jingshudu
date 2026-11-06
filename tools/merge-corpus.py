"""Merge worker outputs with global identity/symmetry deduplication."""
import json,sys,csv,hashlib,argparse
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--output',default='corpus-merged');parser.add_argument('sources',nargs='+');args=parser.parse_args();sources=[Path(x) for x in args.sources]
lookup=[]
for t in range(8):
 order=[]
 for i in range(81):
  r,c=divmod(i,9)
  if t&1:r,c=c,r
  if t&2:r=8-r
  if t&4:c=8-c
  order.append(r*9+c)
 lookup.append(order)
def canonical(p):
 keys=[]
 for order in lookup:
  rename={'0':'0'};key=[]
  for i in order:
   n=p[i]
   if n not in rename:rename[n]=str(len(rename))
   key.append(rename[n])
  keys.append(''.join(key))
 return min(keys)
corpus=[[] for _ in range(5)];seen=set();duplicates=0;records=[]
for src in sources:
 metrics={r['puzzle']:r for r in csv.DictReader((src/'ratings.csv').open())}
 for d in range(5):
  for p in (src/f'{d}.txt').read_text().splitlines():
   if len(corpus[d])>=10000:break
   key=canonical(p)
   if key in seen:duplicates+=1;continue
   record=metrics[p]
   assert int(record['finalTier'])==d
   if d>=3:assert int(record['binaryFloor'])>=2 and int(record['logicTier'])>=3
   seen.add(key);corpus[d].append(p);records.append(record)
print(json.dumps({'counts':[len(a) for a in corpus],'symmetryDuplicatesSkipped':duplicates}),flush=True)
out=Path(args.output);out.mkdir(exist_ok=True)
for d in range(5):(out/f'{d}.txt').write_text('\n'.join(corpus[d])+'\n')
with (out/'ratings.csv').open('w') as f:
 writer=csv.DictWriter(f,fieldnames=['puzzle','logicTier','binaryFloor','finalTier']);writer.writeheader();writer.writerows(records)
(out/'puzzles.json').write_text(json.dumps(corpus,separators=(',',':')))
(out/'merge-report.json').write_text(json.dumps({'counts':[len(a) for a in corpus],'symmetryDuplicatesSkipped':duplicates,'sha256':hashlib.sha256((out/'puzzles.json').read_bytes()).hexdigest()},indent=2))
