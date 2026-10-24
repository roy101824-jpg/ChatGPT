#!/usr/bin/env python3
"""Extract vocabulary from seven user-supplied study files; no embedded instructions executed."""
import re, json, unicodedata, bisect, copy, os
from pathlib import Path
import fitz, docx, openpyxl
BASE=Path(__file__).resolve().parents[1]
ATT=Path(os.environ.get('WORDTRAIL_SOURCE_DIR', '/workspace/attachments'))
OUT=BASE/'work'
OUT.mkdir(exist_ok=True)
SOURCES={
 'powerscore':('PowerScore vocab list.pdf','PowerScore • Repeat Offenders'),
 'master':('GRE Master Word List.pdf','GRE Master Wordlist'),
 'barron3500':('Barron 3500 Word List.pdf','Barron’s 3,500 • SAT I word list'),
 'barron-mnemonics':('Barrons Mnemonics Word List.pdf','Barron’s Mnemonics'),
 'high333':('Printable GRE English Vocabulary_ 333 High Frequency Words List.docx','333 High-Frequency Words'),
 'gregmat':('GREGMAT WORD LIST FOR PRACTICE.docx','GregMat practice sheet'),
 'additional':('Additional Words Sheet.xlsx','Additional Words sheet'),
}
records=[]; manifests=[]; stats={}; issues=[]
def fix(s):
 return unicodedata.normalize('NFKC',s).replace('Ĵ','tt').replace('ĵ','tt').replace('\u00ad','').replace('’',"'")
def clean(s):
 s=re.sub(r'\b\d*\s*Barron.s SAT I Basic Word List',' ',fix(s))
 return re.sub(r'\s+',' ',s).strip(' :;\t\n')
def key(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if not unicodedata.combining(c)).strip()
def valid_word(s):return bool(re.fullmatch(r"[a-zà-ž]+(?:[ '\-][a-zà-ž]+){0,2}",s,re.I)) and len(s)>1

def file_for(s):return next(ATT.rglob(SOURCES[s][0]))
def pdf(s):
 doc=fitz.open(file_for(s)); pages=[fix(p.get_text()) for p in doc]
 offsets=[];t=''
 for p in pages:offsets.append(len(t));t+=p+'\n'
 return pages,t,lambda i:bisect.bisect_right(offsets,i)
def add(s,w,d='',page=None,**extra):
 w=clean(w).lower();w=re.sub(r'^\d+[., ]*','',w)
 corrections={'accooutre':'accoutre','ambidexterous':'ambidextrous','prefactory':'prefatory','presumptous':'presumptuous','convuluted':'convoluted','dessicate':'desiccate','deterrant':'deterrent','dielectical':'dialectical','discrepency':'discrepancy','imsomnia':'insomnia','iniquitious':'iniquitous','insubtantial':'insubstantial','interpoler':'interloper','inveigile':'inveigle','forbearers':'forebears','patios':'patois'}
 original=w
 w=corrections.get(w,w)
 if w!=original:issues.append({'source':s,'originalWord':original,'word':w,'issue':'source spelling corrected'})
 if not valid_word(w):
  issues.append({'source':s,'word':w,'issue':'invalid headword'});return
 d=clean(d)
 if s=='barron-mnemonics':
  posmatch=re.match(r'^\(?(adj(?:ective)?|adv(?:erb)?|noun|verb|n|v)\.?\)?[.,:]?\s+',d,re.I)
  if posmatch:
   extra.setdefault('pos',{'adj':'adjective','adv':'adverb','n':'noun','v':'verb'}.get(posmatch[1].lower(),posmatch[1].lower()))
   d=d[posmatch.end():]
  d=re.split(r';|\bEx[.:]\s*',d,maxsplit=1)[0].strip(' ;.,:')
  d=d.replace('becoz','because')
  if re.search(r'\b(and|or|of|the|a|to|that|which|with|an|in|from|as)$',d,re.I) or w in ['principle','linguistics']:d=''
 if d.lower() in ['null','none','meaning']:d=''
 rec={'word':w,'definition':d,'sources':[{'id':s,'title':SOURCES[s][1]}]}
 if page:rec['sources'][0]['page']=page
 if w!=original:rec['sources'][0]['originalWord']=original
 if extra.get('example'):
  extra['example']=re.split(r'\b[a-z]+(?:ADJ|ADV|V|N)\.\s',clean(extra['example']),maxsplit=1)[0]
 rec.update({k:clean(v) if isinstance(v,str) else v for k,v in extra.items() if v})
 if d:rec['definitionSource']={'id':s,**({'page':page} if page else {})}
 records.append(rec)

# Cleanest structured source: exactly 700 headword entries, independent of quiz sections.
pages,t,page=pdf('powerscore')
ms=list(re.finditer(r'(?m)^\uf035\s*([\w-]+):\s*\(([^)]+)\)\s*',t))
for i,m in enumerate(ms):
 body=t[m.end():ms[i+1].start() if i+1<len(ms) else t.find('Vocabulary Quiz',m.end())]
 lines=[l.strip() for l in body.splitlines() if l.strip()]
 definition=lines[0] if lines else ''
 example=[]
 for line in lines[1:]:
  if re.search(r'^(Word Forms?:|Antonym Forms?:|Related Words?:|\d+$|PowerScore GRE|from the powerscore)',line):break
  example.append(line)
 add('powerscore',m.group(1),definition,page(m.start()),pos={'vb':'verb','n':'noun','adj':'adjective','adv':'adverb'}.get(m.group(2),m.group(2)),example=' '.join(example),tags=['high-frequency'])
manifests.append({'id':'powerscore','filename':SOURCES['powerscore'][0],'title':SOURCES['powerscore'][1],'pages':len(pages),'status':'imported','notes':'All 700 labeled entries extracted, representing 699 unique headwords (obstreperous appears twice). Practice quiz sections are excluded.'})

# Master source: uppercase heading, part of speech, explicit Syn/Ant/Usage labels.
pages,t,page=pdf('master')
ms=list(re.finditer(r'(?m)^([A-ZÀ-Þ][A-ZÀ-Þ -]+) \(?([a-z]+)\)?\s*\[[^\]]*\]',t))
for i,m in enumerate(ms):
 body=t[m.end():ms[i+1].start() if i+1<len(ms) else len(t)]
 syn=re.search(r'Syn:\s*(.*?)(?:\nAnt:|\nUsage:|\n\s*\*\*\*|$)',body,re.S)
 example=re.search(r'Usage:\s*(.*?)(?:\n\s*\*\*\*|\nChapter|\n[A-Za-z-]+\n[A-Za-z-]+\n|$)',body,re.S)
 add('master',m.group(1),syn.group(1) if syn else '',page(m.start()),pos={'v':'verb','n':'noun','adj':'adjective','adv':'adverb'}.get(m.group(2),m.group(2)),example=example.group(1) if example else '')
manifests.append({'id':'master','filename':SOURCES['master'][0],'title':SOURCES['master'][1],'pages':len(pages),'status':'imported','notes':'All 1,535 labeled headwords extracted with synonym-based definitions and usage sentences.'})

# Barron list contains Hindi glosses, varying POS punctuation, and an index.
pages,t,page=pdf('barron3500')
clean_pages=[]
for p in pages:
 p=re.sub(r'Accent Coaching Institute[^\n]*\n96716-39776[^\n]*\n','',p)
 p=re.sub(r'(?m)^\d+\s*\n','',p)
 p=re.sub(r'(?m)^Barron.s SAT I Basic Word List[^\n]*\n','',p)
 p=re.sub(r'(?m)^Word List \d+[^\n]*\n','',p)
 clean_pages.append(p)
# Detect entries from headwords followed by part of speech and/or Hindi gloss.
for pi,p in enumerate(clean_pages[:137]):
 matches=list(re.finditer(r"(?m)^([A-Za-z][A-Za-z'\-]*(?: [a-z][a-z'\-]*)?)\s+(?:(ADJ|ADV|V|N)\s*[.,]?(?:\s*,?\s*(?:ADJ|ADV|V|N)[.,]?)?\s*)?[ /.,]*?(?=[\u0900-\u097f])",p))
 for i,m in enumerate(matches):
  body=p[m.end():matches[i+1].start() if i+1<len(matches) else len(p)]
  body=re.sub(r'[\u0900-\u097f]+','',body)
  body=re.sub(r'^[^a-zA-Z]+','',body)
  body=re.sub(r'^K/','',body)
  body=clean(body)
  # Sources use a short definition followed by a capitalized example sentence.
  split=re.split(r'(?:\.|\))\s+(?=[A-Z"“])',body,maxsplit=1)
  definition=split[0].rstrip('.')
  example=split[1] if len(split)>1 else ''
  if len(definition)>450:
   issues.append({'source':'barron3500','word':m.group(1),'issue':'definition over 450 characters; withheld'})
   definition='';example=''
  add('barron3500',m.group(1),definition,pi+1,pos={'V':'verb','N':'noun','ADJ':'adjective','ADV':'adverb'}.get(m.group(2),''),example=example)
# Add every index headword, retaining headword-only status until merged with a definition.
start=t.rfind('zephyr',0,sum(len(p)+1 for p in pages[:137]))
for pi,p in enumerate(clean_pages[137:],138):
 for line in p.splitlines():
  word=clean(line)
  if valid_word(word):add('barron3500',word,page=pi)
manifests.append({'id':'barron3500','filename':SOURCES['barron3500'][0],'title':SOURCES['barron3500'][1],'pages':len(pages),'status':'imported','notes':'File title says 3,500; internal title identifies a SAT I list. Entries and alphabetical index are combined. Hindi glosses are omitted. Unclear entries remain headword-only.'})

# Practice sheets provide headwords, not filled-in meanings.
for s in ['high333','gregmat']:
 doc=docx.Document(file_for(s));n=0
 for ti,table in enumerate(doc.tables):
  for row in table.rows:
   word=row.cells[0].text.strip()
   if re.match(r'^\d+\.',word):
    word=re.sub(r'^\d+\.\s*','',word)
    add(s,word,tags=['high-frequency'] if s=='high333' else ['gregmat',f'group-{ti+1}']);n+=1
 manifests.append({'id':s,'filename':SOURCES[s][0],'title':SOURCES[s][1],'status':'imported','notes':'Practice sheet contains headwords only. Meanings are matched from other supplied word lists where available.','inputRows':n})
 if s=='high333':manifests[-1]['notes']+=' All 333 rows are present; strut appears twice, leaving 332 unique words.'
 if s=='gregmat':manifests[-1]['notes']+=' All 1,050 rows are present, representing 1,045 unique words.'
wb=openpyxl.load_workbook(file_for('additional'),read_only=True,data_only=True)
for sh in wb:
 for row in sh.values:
  if row and isinstance(row[0],str):
   # One malformed spreadsheet cell contains an entire block of words.
   cell=row[0].replace('AUTONOMOUSMIRTHFUL','AUTONOMOUS\nMIRTHFUL')
   for word in cell.splitlines():
    if word.strip():add('additional',word)
manifests.append({'id':'additional','filename':SOURCES['additional'][0],'title':SOURCES['additional'][1],'status':'imported','notes':'Spreadsheet has 1,050 rows with no definitions; one malformed cell combines 31 words and is split during import. It substantially overlaps the GregMat practice sheet.','inputRows':sum(s.max_row for s in wb)})

# Mnemonic document is inconsistent (numbered, bullet, Word:/Meaning: formats).
# Only definitions are imported; unreviewed memory aids are not promoted to study facts.
pages,t,page=pdf('barron-mnemonics')
patterns=[
 r'(?m)^\s*\d+[.,]\s*\d?[A-Z]?(?=[A-Z][a-z])', # not used; documented odd numbering
]
headers=[]
# Grid tables keep their meanings in a dedicated column, separate from memory aids.
mdoc=fitz.open(file_for('barron-mnemonics'))
for pi,p in enumerate(mdoc):
 if pi not in list(range(41,46))+list(range(51,56))+list(range(61,65))+list(range(86,91))+list(range(117,122)):continue
 for table in p.find_tables().tables:
  for row in table.extract():
   if len(row)>=3 and row[0] and re.fullmatch(r'\d+',row[0].strip()) and row[1]:
    add('barron-mnemonics',row[1],row[2] or '',pi+1)
# Standalone bold headwords in this source's F section.
for pi in range(78,87):
 p=mdoc[pi]
 for b in p.get_text('dict')['blocks']:
  for line in b.get('lines',[]):
   spans=line.get('spans',[])
   if len(spans)==1 and 'Bold' in spans[0]['font'] and re.fullmatch('[A-Z][a-z]+',spans[0]['text']):
    w=spans[0]['text'];pat=r'(?m)^'+re.escape(w)+r'\s*\n'
    m=re.search(pat,t)
    if m:headers.append((m.start(),m.end(),w,''))
# The M section uses bold 'headword-definition' lines.
for pi in range(131,135):
 p=mdoc[pi]
 for b in p.get_text('dict')['blocks']:
  for line in b.get('lines',[]):
   spans=line.get('spans',[])
   if spans and all('Bold' in sp['font'] for sp in spans):
    txt=''.join(sp['text'] for sp in spans)
    m=re.match(r'^([a-z]+)-(.*)',txt)
    if m:
     if m.group(2):add('barron-mnemonics',m.group(1),m.group(2),pi+1)
     else:
      local=p.get_text();nextline=local[local.index(txt)+len(txt):].strip().splitlines()[0]
      add('barron-mnemonics',m.group(1),nextline,pi+1)
for m in re.finditer(r"(?m)^\s*\d+[a-z]?[.,)\]]\s*(?:1(?=[A-Z]))?([A-Za-zÀ-ž][A-Za-zÀ-ž'\-]*)([^\n]*)",t):
 headers.append((m.start(),m.end(),m.group(1),m.group(2)))
for m in re.finditer(r"(?m)^\s*Word\s*\n?\s*:\s*([A-Za-z][A-Za-z'\-]*)([^\n]*)",t):
 headers.append((m.start(),m.end(),m.group(1),m.group(2)))
for m in re.finditer(r"(?m)^\s*•\s*\n?\s*([A-Za-z][A-Za-z'\-]*)\s*\n\s*Meaning\s*:",t):
 headers.append((m.start(),m.end(),m.group(1),''))
headers=sorted(headers)
for i,(start,end,w,inline) in enumerate(headers):
 # Split word-definition dashes, but retain real hyphenated headwords.
 if '-' in w and key(w) not in {key(r['word']) for r in records}:
  w,trail=w.split('-',1);inline=trail.lstrip('-')+' '+inline
 false_headers={'cons','de','de-face','decay','decli','decre','deep','defeat','demo','depravi','difer','fianc','flat','hindi','if','it','johnny','omething','people','reign','rhymes','sounds','the','when','word','a','d','its','you','veigh','pit','fiancé','file'}
 if w.lower() in false_headers:continue
 body=(inline+'\n'+t[end:headers[i+1][0] if i+1<len(headers) else len(t)]).strip()
 body=re.split(r'(?im)(?:\bmnemonics?\s*:?|^\s*M\s*[:\-])',body)[0]
 body=re.sub(r'(?im)^\s*Wordlist\s*\d+\s*','',body)
 body=re.sub(r'^\s*[:.]*\s*(?:Meaning\s*[:.]?\s*)?','',body,flags=re.I)
 body=re.split(r'(?im)^\s*(?:Synonyms?|Note|Example)\s*:',body)[0]
 # Definitions in these unstructured headings occupy the first nonempty line.
 # Later lines often start an unlabeled mnemonic; do not silently blend it in.
 lines=[line.strip() for line in body.splitlines() if line.strip()]
 d=clean(lines[0]) if lines else ''
 d=re.split(r'(?i)(?:\d*Mnemonics?\s*:|\s+[a-z]\)\s+)',d)[0]
 d=re.sub(r'^[•>:;—\s]+','',d)
 if len(d)>500 :
  d=''
 if re.search(r'(?i)\b(?:sounds like|sounds similar|split it|mnemonic)\b',d):d=''
 add('barron-mnemonics',w,d,page(start))
manifests.append({'id':'barron-mnemonics','filename':SOURCES['barron-mnemonics'][0],'title':SOURCES['barron-mnemonics'][1],'pages':len(pages),'status':'partial','notes':'Definitions extracted from numbered headings, Word/Meaning labels, bullets, grid tables, and selected bold headings. Inconsistent formatting may leave missing entries. Supplied PDF stops at “vogue”; unreviewed mnemonics are omitted.'})

# Merge exact/accent-insensitive spelling matches, keeping first (cleaner) definition.
merged={}
for r in records:
 k=key(r['word'])
 if k not in merged:merged[k]=copy.deepcopy(r)
 else:
  old=merged[k]
  for field in ['definition','pos','example','mnemonic']:
   if not old.get(field) and r.get(field):
    old[field]=r[field]
    if field=='definition':old['definitionSource']=r.get('definitionSource')
  if r.get('definition') and r['definition'].lower()!=old.get('definition','').lower():
   alt={'definition':r['definition'],'source':r.get('definitionSource',r['sources'][0])}
   if r.get('pos'):alt['pos']=r['pos']
   if not any(a['definition'].lower()==r['definition'].lower() for a in old.get('alternateDefinitions',[])):
    old.setdefault('alternateDefinitions',[]).append(alt)
  for s in r['sources']:
   if s['id'] not in [x['id'] for x in old['sources']]:old['sources'].append(s)
  if r.get('tags'):old['tags']=list(dict.fromkeys(old.get('tags',[])+r['tags']))
for m in manifests:
 related=[r for r in merged.values() if m['id'] in [s['id'] for s in r['sources']]]
 raw=[r for r in records if m['id'] in [s['id'] for s in r['sources']]]
 m['headwords']=len(related)
 m['withDefinitions']=sum(bool(r['definition']) for r in related)
 m['sourceDefinitions']=len({key(r['word']) for r in raw if r['definition']})
 m['headwordsOnly']=m['headwords']-m['withDefinitions']
result=sorted(merged.values(),key=lambda x:key(x['word']))
(OUT/'primary-vocab.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
(OUT/'primary-sources.json').write_text(json.dumps(manifests,ensure_ascii=False,indent=2))
(OUT/'primary-issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2))
print(json.dumps({'unique':len(result),'defined':sum(bool(r['definition']) for r in result),'sources':manifests,'issues':len(issues)},ensure_ascii=False,indent=2))
