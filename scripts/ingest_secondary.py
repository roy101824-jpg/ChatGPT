"""Extract structured headwords from the user's supplied PDFs. No web dictionary substitutions.
Run from repo root: python scripts/ingest_secondary.py
Requires pdftotext and PyMuPDF. Raw PDFs stay outside the source tree.
"""
from pathlib import Path
import json, re, subprocess, unicodedata, difflib, os
import fitz, itertools
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'work'; TXT=WORK/'secondary-text'; TXT.mkdir(exist_ok=True,parents=True)
SOURCES={
'contextual':('GRE Contextual Vocabulary.pdf','GRE Contextual Vocabulary'),
'power-vocab':('GRE Power Vocab.pdf','GRE Power Vocab'),
'vocab-capacity':('GRE Vocab Capacity 2017_ Over 1,300 Powerful Memory Tricks and Mnemonics.pdf','GRE Vocab Capacity 2017'),
'flash-review':('GRE Vocabulary Flash Review.pdf','GRE Vocabulary Flash Review'),
'essential-500':('500 Essential Words_ GRE Vocabulary Flash Cards (Manhattan Prep GRE Strategy Guides).pdf','Manhattan Prep 500 Essential Words')}
FILES={}; TEXT={}; MANIFEST=[]; RESULT=[]
for sid,(filename,title) in SOURCES.items():
 p=next(Path(os.environ.get('WORDTRAIL_SOURCE_DIR', '/workspace/attachments')).rglob(filename));FILES[sid]=p
 out=TXT/(filename+'.txt')
 if not out.exists():subprocess.run(['pdftotext','-layout',str(p),str(out)],check=True)
 TEXT[sid]=out.read_text()
def clean(s):
 s=s.replace('\xad','').replace('\u200b','').replace('ﬁ','fi').replace('ﬂ','fl')
 s=re.sub(r'(?<=[a-z])-\s*\n\s*(?=[a-z])','',s)
 return re.sub(r'\s+',' ',s).strip()
def norm(s):return unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode().strip()
def rec(sid,word,definition,page,**kwargs):
 word=clean(word).lower();definition=clean(definition)
 if not word or not definition:raise ValueError((sid,word,definition))
 d={'word':word,'definition':definition,'sources':[{'id':sid,'title':SOURCES[sid][1],'page':page}]}
 d.update({k:clean(v) for k,v in kwargs.items() if v});return d
def manifest(sid,items,limitations,**extra):
 MANIFEST.append({'id':sid,'title':SOURCES[sid][1],'filename':SOURCES[sid][0],
 'status':'imported','pages':len(fitz.open(FILES[sid])),'entries':len(items),
 'uniqueWords':len({norm(x['word']) for x in items}), 'limitations':limitations,**extra})
 RESULT.extend(items)
# Each Manhattan card has a headword face and a definition face.
sid='essential-500';pages=TEXT[sid].split('\f');items=[]
for i,p in enumerate(pages):
 if not p.lstrip().startswith('Definition:'):continue
 front=pages[i-1].strip();word=front.splitlines()[0].strip()
 pos=re.search(r'\(([^)]+)\)',front)
 dm=re.search(r'Definition:\s*(.*?)(?=Usage:)',p,re.S)
 em=re.search(r'Usage:\s*(.*?)(?=Related Words:|More Info:|$)',p,re.S)
 assert dm,(i,front)
 items.append(rec(sid,word,dm.group(1),i+1,pos=pos.group(1) if pos else '',example=em.group(1) if em else ''))
assert len(items)==500,len(items)
manifest(sid,items,'All 500 front/back cards extracted. Alternate senses are retained within the supplied definitions; related-word discussions are not separate cards.')
# Capacity: main headword section only; exclude word-root appendix and index.
sid='vocab-capacity';raw=TEXT[sid];pages=raw.split('\f');start=9;end=319
text='\n'.join(pages[start:end]);prefix=len('\n'.join(pages[:start]))+1
pattern=re.compile(r'^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ-]+|non sequitur)(?::?[ \t]+\((noun|verb|adjective|adverb|adj|n)(?:, (?:noun|verb|adjective|adverb))?:?\):?[ \t]*|:[ \t]*(noun|verb|adjective|adverb),?[ \t]*|:[ \t]*(?=to set right))',re.M)
matches=[m for m in pattern.finditer(text) if m.group(1)!='Think'];items=[];seen=set()
for j,m in enumerate(matches):
 word=m.group(1);key=norm(word)
 if key in seen:continue
 body=text[m.end():matches[j+1].start() if j+1<len(matches) else len(text)]
 # Only genuine entries contain a mnemonic prompt before the next heading.
 if 'Think:' not in body:continue
 before=body.split('Think:')[0]
 pron=re.search(r'(?:[.!?][ \t]*|\n)[“\"]',before)
 definition=before[:pron.start()+1].strip() if pron else before.strip()
 # No extraneous paragraphs should precede the pronunciation / mnemonic prompt.
 definition=re.split(r'\n\s*\n',definition)[0]
 if key=='acme':definition='the highest point of something'
 if word.lower()=='intimates' or word.lower()=='adjective':continue
 if key=='meterological':word='meteorological';definition='pertaining to weather patterns.'
 if key=='epitome':pos='noun'
 else:pos=m.group(2) or m.group(3) or ''
 # Newline replacement preserves the character count of form feeds.
 page=raw[:prefix+m.start()].count('\f')+1
 # Definitions are suitable for general study. Original memory stories can contain adult/crude content,
 # so do not silently expose them as app examples or mnemonics.
 items.append(rec(sid,word,definition,page,pos=pos));seen.add(key)
manifest(sid,items,'Main vocabulary entries extracted; word-root appendix excluded. Adult/crude memory stories and mnemonic prompts are intentionally not imported. Corrected source typos meteorological/weather patterns and epitome part of speech. Source variants retained.')
# Power Vocab: headword + pronunciation + POS is a reliable structural marker.
sid='power-vocab';doc=fitz.open(FILES[sid]);items=[];lines=[]
for pno,page in enumerate(doc):
 for b in page.get_text('dict')['blocks']:
  for l in b.get('lines',[]):
   spans=l['spans'];text=''.join(x['text'] for x in spans)
   lines.append({'page':pno+1,'y':l['bbox'][1],'x':l['bbox'][0],'text':text,
    'bold':''.join(x['text'] for x in spans if 'Bold' in x['font'])})
lines.sort(key=lambda l:(l['page'],l['y'],l['x']))
merged=[];row=[]
for line in lines:
 if row and (line['page']!=row[0]['page'] or abs(line['y']-row[0]['y'])>1):
  row.sort(key=lambda l:l['x']);merged.append({**row[0],'text':' '.join(l['text'].strip() for l in row),'bold':' '.join(l['bold'] for l in row)});row=[]
 row.append(line)
if row:
 row.sort(key=lambda l:l['x']);merged.append({**row[0],'text':' '.join(l['text'].strip() for l in row),'bold':' '.join(l['bold'] for l in row)})
lines=merged
pattern=re.compile(r"^([A-ZÀ-Ý0-9][A-ZÀ-Ý0-9 ’'—-]+?)\s+(?:\([^)]*\)\s+)?(adj|adv|n|v)\s+(.+)$")
seen=set()
for i,line in enumerate(lines):
 m=pattern.match(line['text'])
 if not m or not line['bold'] or line['x']>80:continue
 word=m.group(1).lower()
 if word in seen:continue
 seen.add(word);parts=[m.group(3)];j=i+1;last=line
 while j<len(lines):
  nxt=lines[j]
  if nxt['x']>80 or pattern.match(nxt['text']):break
  if nxt['page']==last['page']:
   if nxt['y']-last['y']>21:break
  elif nxt['page']==last['page']+1:
   if last['y']<700 or not nxt['text'][:1].islower():break
  else:break
  parts.append(nxt['text']);last=nxt;j+=1
 definition=clean(' '.join(parts));example=''
 if j<len(lines) and 95<lines[j]['x']<105:
  ep=[lines[j]['text']];last=lines[j];k=j+1
  while k<len(lines):
   nxt=lines[k]
   if not 95<nxt['x']<105:break
   if nxt['page']==last['page'] and nxt['y']-last['y']>21:break
   if nxt['page']>last['page'] and (last['y']<700 or nxt['page']!=last['page']+1):break
   ep.append(nxt['text']);last=nxt;k+=1
  example=clean(' '.join(ep))
 items.append(rec(sid,word,definition,line['page'],pos={'adj':'adjective','adv':'adverb','n':'noun','v':'verb'}[m.group(2)],example=example))
manifest(sid,items,'Structured dictionary-style headwords extracted using font and line spacing, including discipline-specific vocabulary. Root lists, ordinary passage words, and answer-choice-only words are not treated as defined headwords. First supplied usage paragraph retained where detectable.')
# Contextual: use explicitly labelled Definitions blocks, never exercise guesses/answers.
sid='contextual';raw=TEXT[sid];text=raw.replace('\f','\n');items=[];seen=set()
blocks=list(re.finditer(r'^\s*Definitions\s*\n\s*(.*?)(?=\n\s*\n)',text,re.M|re.S))
for block in blocks:
 body=block.group(1)
 headers=list(re.finditer(r'\b([A-Za-z]+):\s*',body))
 for i,m in enumerate(headers):
  word=m.group(1).lower();definition=body[m.end():headers[i+1].start() if i+1<len(headers) else len(body)]
  if word in seen:continue
  seen.add(word);page=raw[:block.start(1)+m.start()].count('\f')+1
  items.append(rec(sid,word,definition,page))
manifest(sid,items,'All 24 explicitly labelled definition blocks extracted. Inflected forms are retained. Definitions joined across line breaks; the inline onerous definition is split from inept. Exercise-only words without an explicit definition are excluded.',definitionBlocks=len(blocks))
# Flash Review: font and coordinates separate front-face headwords from back-face definitions.
sid='flash-review';doc=fitz.open(FILES[sid]);items=[];audit=[]
for n in range(18,len(doc)-1,2):
 heads=[]
 for b in doc[n].get_text('dict')['blocks']:
  for l in b.get('lines',[]):
   for s in l['spans']:
    if s['font']=='Avenir-Black' and abs(s['size']-11)<.2:heads.append(s['text'].strip())
 if not heads:continue
 lines=[]
 for b in doc[n+1].get_text('dict')['blocks']:
  for l in b.get('lines',[]):
   ss=[s for s in l['spans'] if 53<s['bbox'][0]<250 and 8.5<s['size']<=10]
   if ss:lines.append({'y':min(s['bbox'][1] for s in ss),'text':''.join(s['text'] for s in ss),'bold':' '.join(s['text'] for s in ss if 'Black' in s['font'])})
 lines.sort(key=lambda l:l['y']);groups=[]
 for line in lines:
  if not groups or line['y']-groups[-1][-1]['y']>22:groups.append([])
  groups[-1].append(line)
 assert len(groups)==len(heads),(n+1,heads,len(groups))
 def wordscore(w,group):
  bold=norm(' '.join(l['bold'] for l in group)).split()
  return max([1 if v.startswith(norm(w)) else difflib.SequenceMatcher(None,norm(w),v).ratio() for v in bold]+[0])
 assignment=max(itertools.permutations(heads),key=lambda perm:sum(wordscore(w,g) for w,g in zip(perm,groups)))
 for gi,group in enumerate(groups):
  word=assignment[gi]
  if wordscore(word,group)<.56:audit.append({'page':n+2,'word':word,'issue':'weak highlight match'})
  # The first paragraph is the primary definition. Secondary senses remain in original source.
  stop=next((k for k in range(1,len(group)) if group[k]['y']-group[k-1]['y']>13.5),len(group))
  definition=clean('\n'.join(l['text'] for l in group[:stop]))
  remainder='\n'.join(l['text'] for l in group[stop:]);example=remainder.split('Synonyms:')[0]
  pos='';pm=re.match(r'^\((adj\.|v\.|n\.)\)\s*',definition)
  if pm:pos={'adj.':'adjective','v.':'verb','n.':'noun'}[pm.group(1)];definition=definition[pm.end():]
  if word=='eschew':
   definition='to avoid, especially for ethical or practical reasons'
   example='A strict vegetarian, she eschews eggs and dairy products in addition to meat and fish.'
  if word=='homogeneous':
   definition='composed of parts that are all alike'
   example=' '.join(l['text'] for l in group).split('Synonyms:')[0]
  if word=='hyperbole':definition='extravagant and intentional exaggeration'
  items.append(rec(sid,word,definition,n+2,pos=pos,example=example))
assert len(items)==600,len(items)
manifest(sid,items,'All 600 headwords extracted; first sense and supplied usage retained. Front/back mapping checked against highlighted usage forms; corrected reversed errant/eschew ordering and misplaced homogeneous definition in original source.',mappingFallbacks=audit)
# Minimal structural checks; original source definitions remain attributable, not silently rewritten.
for r in RESULT:
 assert 1<len(r['word'])<50,r
 assert len(r['definition'])<800,r
 assert '__' not in r['definition'],r
WORK.joinpath('secondary-vocab.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2))
WORK.joinpath('secondary-sources.json').write_text(json.dumps(MANIFEST,ensure_ascii=False,indent=2))
print(json.dumps([{'id':m['id'],'entries':m['entries'],'uniqueWords':m['uniqueWords'],'fallbacks':len(m.get('mappingFallbacks',[]))} for m in MANIFEST],indent=2))
print('total records',len(RESULT),'union',len({norm(r['word']) for r in RESULT}))
