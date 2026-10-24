#!/usr/bin/env python3
"""Create a source-coverage manifest; extracted prose remains in ignored work/."""
from pathlib import Path
import json, re, subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'work'
OUT=WORK/'resource-text'
OUT.mkdir(exist_ok=True)
records=json.loads((WORK/'resource-downloads.json').read_text())

def audit(r):
    result={k:r[k] for k in ('id','title','kind')}
    result.update(pages=None,status='unavailable',textChars=0,note='')
    if 'error' in r:
        result['note']='Not imported: file exceeds the 32 MiB transfer limit. No content was inspected.'
        return result
    path=r['download']['path']
    info=subprocess.run(['pdfinfo',path],capture_output=True,text=True)
    m=re.search(r'^Pages:\s+(\d+)',info.stdout,re.M)
    result['pages']=int(m[1]) if m else None
    outfile=OUT/(r['id']+'.txt')
    proc=subprocess.run(['pdftotext','-layout',path,str(outfile)],capture_output=True,text=True)
    if not outfile.exists():
        result['note']='PDF downloaded, but text extraction failed.'
        return result
    text=outfile.read_text(errors='replace')
    result['textChars']=len(text.strip())
    readable=len(re.findall(r'\b[A-Za-z]{3,}\b',text))
    # Answer keys contain single-letter entries, not long prose words.
    structured_key=r['title']=='answer key.pdf' and len(re.findall(r'\d+\.\s*[A-E]\b',text))>=38*37
    result['status']='needs-ocr' if readable < 20*(result['pages'] or 1) and not structured_key else 'indexed'
    notes=[]
    if result['status']=='needs-ocr': notes.append('Text layer missing or sparse; OCR needed before reliable content extraction.')
    else: notes.append('Text extracted for source inventory; original pages and questions are not bundled in the app.')
    if re.match(r'TEST \d',r['title']) or 'Big-Book' in r['title']:
        notes.append('Legacy GRE material: analogies and antonyms are not current question types.')
    if r['title']=='GRE Argument Essays.pdf':
        notes.append('Legacy Argument task; the current Analytical Writing section uses one Issue essay.')
    elif r['kind']=='writing' or re.search(r'Analyze\s+an\s+Argument|Argument\s+Task',text,re.I):
        notes.append('Contains older writing preparation; any Argument task is legacy and not current GRE format.')
    if r['kind']=='reference': notes.append('Reference edition may use an older test structure; use the current format shown in the app.')
    if r['kind']=='quant': notes.append('Quantitative reference; excluded from the vocabulary word bank.')
    if r['title']=='answer key.pdf': notes.append('Contains 1,406 answer entries for 37 sections; Test 12 Section 2 is absent. Answer-key inventory only; not automatically linked to question IDs.')
    result['note']=' '.join(notes)
    return result

with ThreadPoolExecutor(max_workers=8) as pool:
    output=list(pool.map(audit,records))
(WORK/'resources.json').write_text(json.dumps(output,indent=2))
print(json.dumps({'files':len(output),'statuses':{s:sum(r['status']==s for r in output) for s in ['indexed','needs-ocr','unavailable']},'pages':sum(r['pages'] or 0 for r in output)},indent=2))

# Definitions are extracted only from explicit glossary entries. General prose,
# analogy relationships, and broad semantic group headings are never definitions.
vocab={}
def normalize(s):
    import unicodedata
    s=re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s)).strip()
    # This PDF's font loses the ft ligature in its text layer.
    for broken,correct in [('o en','often'),('so en','soften'),('lo y','lofty'),('thri y','thrifty'),('cra or','craft or')]:
        s=s.replace(broken,correct)
    return s
def add(word,definition,r,page,tags=()):
    word=normalize(word).lower().strip(':,.;')
    if word=='ri': word='rift' # same missing ft ligature in word-group appendix
    if not re.fullmatch(r"[a-z][a-z'-]*(?: [a-z][a-z'-]*){0,2}",word): return
    source={'id':r['id'],'title':r['title'],'page':page}
    if word not in vocab:
        vocab[word]={'word':word,'definition':normalize(definition),'sources':[],'tags':[]}
    elif definition and not vocab[word]['definition']:
        vocab[word]['definition']=normalize(definition)
    if source not in vocab[word]['sources']: vocab[word]['sources'].append(source)
    for tag in tags:
        if tag not in vocab[word]['tags']: vocab[word]['tags'].append(tag)

workbook=next(r for r in records if r['title']=='GRE Verbal Workbook.pdf')
text=(OUT/(workbook['id']+'.txt')).read_text()
start=text.index('180 COMMON GRE WORDS IN CONTEXT')
end=text.index('\fWord Groups Exercise',start)
section=text[start:end].replace('\f','\n')
for m in re.finditer(r'(?m)^([A-Z][A-Z-]+):\s*([^\n]+(?:\n[a-z][^\n]+)*)',section):
    pos=start+m.start()
    add(m[1],m[2],workbook,text[:pos].count('\f')+1,['Context glossary'])
# Uppercase synonym-bank rows; these supply headwords only, not equivalence claims.
for m in re.finditer(r'(?m)^[ \t]*([A-Z][A-Z \t-]+)[ \t]*$',section):
    row=m[1].strip()
    if 'COMMON GRE WORDS' in row: continue
    for word in re.split(r'\s{2,}',row):
        add(word,'',workbook,text[:start+m.start()].count('\f')+1,['Source word'])
start=text.index('\fAppendix A\nKaplan’s Word Groups')
end=text.index('\fAppendix B',start)
section=text[start:end].replace('\f','\n')
for m in re.finditer(r'(?m)^[ \t]+([a-z][a-z/-]+)[ \t]*$',section):
    for word in m[1].split('/'):
        add(word,'',workbook,text[:start+m.start()].count('\f')+1,['Word groups'])

# Explicit answer-choice words and capitalized vocabulary question stems from
# the legacy sectional tests. Leave their definitions empty for curated merging.
for r in records:
    if not re.match(r'TEST \d',r['title']) or 'download' not in r: continue
    text=(OUT/(r['id']+'.txt')).read_text()
    for page_no,page in enumerate(text.split('\f'),1):
        for m in re.finditer(r'\d+\.\s+([A-Z][A-Z-]+)(?:\s*:\s*([A-Z][A-Z-]+))?(?=\s*[:\n]|\s{3,})',page):
            add(m[1],'',r,page_no,['Legacy test vocabulary'])
            if m[2]: add(m[2],'',r,page_no,['Legacy test vocabulary'])
        for m in re.finditer(r'\([A-E]\)\s+([a-z][a-z\'-]*(?:\s*\.\s*\.\s*[a-z][a-z\'-]*)?(?:\s*:\s*[a-z][a-z\'-]*)?)(?=[ \t]{2,}|\n|$)',page):
            for word in re.split(r'\s*(?:\.\s*\.|:)\s*',m[1]):
                add(word,'',r,page_no,['Legacy test vocabulary'])

(WORK/'reference-vocab.json').write_text(json.dumps(list(vocab.values()),indent=2))
print(json.dumps({'reference_words':len(vocab),'with_definitions':sum(bool(v['definition']) for v in vocab.values()),'headwords_only':sum(not v['definition'] for v in vocab.values())},indent=2))
