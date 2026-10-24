#!/usr/bin/env python3
"""Reproducibly merge extracted user-supplied vocabulary into the Wordtrail app.

No OCR guesses or inferred inflections become study definitions. Reference-only
word occurrences enrich known entries; unmatched occurrences remain in work/.
"""
from pathlib import Path
from collections import defaultdict, Counter
import copy
import json
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'work'
OUT = ROOT / 'src/data'
OUT.mkdir(parents=True, exist_ok=True)

def read(name):
    return json.loads((WORK / name).read_text())

def clean(text):
    text = unicodedata.normalize('NFKC', str(text or ''))
    text = text.replace('’', "'").replace('‘', "'").replace('\u00ad', '').replace('Ĵ', 'tt').replace('ĵ', 'tt')
    return re.sub(r'\s+', ' ', text).strip()

def norm(word):
    return ''.join(c for c in unicodedata.normalize('NFKD', clean(word).lower()) if not unicodedata.combining(c))

def slug(word):
    return re.sub('[^a-z0-9]+', '-', norm(word)).strip('-')

PRIMARY = read('primary-vocab.json')
SECONDARY = read('secondary-vocab.json')
REFERENCE = read('reference-vocab.json')
RAW_SOURCES = read('primary-sources.json') + read('secondary-sources.json') + read('resources.json')
SOURCE_MAP = {s['id']: s for s in RAW_SOURCES}
assert len(RAW_SOURCES) == len(SOURCE_MAP) == 67, 'Expected 67 distinct supplied source files.'

RANK = {sid: rank for rank, sid in enumerate([
    'powerscore', 'master', 'essential-500', 'flash-review', 'power-vocab',
    'vocab-capacity', 'contextual', 'file_00000000c99081fa8971a5854a4bf201',
    'barron3500', 'barron-mnemonics',
])}
POS = {'adj': 'adjective', 'adj.': 'adjective', 'adv': 'adverb', 'adv.': 'adverb',
       'n': 'noun', 'n.': 'noun', 'v': 'verb', 'v.': 'verb', 'vb': 'verb'}
issues = []


def source_ref(ref):
    sid = ref['id']
    assert sid in SOURCE_MAP, f'Unknown source {sid}'
    out = {'id': sid, 'title': SOURCE_MAP[sid]['title']}
    if isinstance(ref.get('page'), int) and ref['page'] > 0:
        pages = SOURCE_MAP[sid].get('pages')
        assert not pages or ref['page'] <= pages, f'Page beyond source: {sid} {ref["page"]}'
        out['page'] = ref['page']
    if ref.get('originalWord'):
        out['originalWord'] = ref['originalWord']
    return out


def usable_word(word):
    # Three-word terms and genuine source variants are legitimate headings.
    # Sentence fragments, control characters and long prose are not.
    return (1 < len(word) <= 48 and len(word.split()) <= 5
            and bool(re.fullmatch(r"[a-zà-ž0-9][a-zà-ž0-9 .\-'’]*", word))
            and bool(re.search(r'[a-zà-ž]', word)))


def clean_definition(text, word):
    text = clean(text).strip(' :;')
    text = re.sub(r'\s*;\s*;', '; ', text)
    if not text:
        return ''
    if len(text) > 650 or re.search(r'Mnemonics?\s*:|Wordlist|Word Forms:|Accent Coaching|[\u0900-\u097f]', text, re.I):
        issues.append({'word': word, 'issue': 'Unclear definition withheld', 'text': text})
        return ''
    # An isolated OCR label cannot serve as a meaning.
    if text.lower().strip(' .():') in {'meaning', 'noun', 'verb', 'adj', 'adjective', 'adv', 'adverb', 'null'}:
        issues.append({'word': word, 'issue': 'Definition label without meaning withheld'})
        return ''
    return text


def clean_example(text, word):
    text = clean(text)
    if not text:
        return ''
    if len(text) > 900 or re.search(r'Wordlist|Word Forms:|Accent Coaching|Barron.s SAT I Basic Word List|[\u0900-\u097f]', text, re.I):
        issues.append({'word': word, 'issue': 'Unclear usage example withheld'})
        return ''
    return text


def candidate(record, alternative=None):
    word = clean(record['word']).lower()
    if alternative:
        source = source_ref(alternative.get('source') or record['sources'][0])
        definition = clean_definition(alternative.get('definition'), word)
        pos = clean(alternative.get('pos'))
        example = clean_example(alternative.get('example'), word)
    else:
        source = source_ref(record.get('definitionSource') or record['sources'][0])
        definition = clean_definition(record.get('definition'), word)
        pos = clean(record.get('pos'))
        example = clean_example(record.get('example'), word)
    # Preserve coherent candidate bundles. Never borrow another sense's example.
    result = {'word': word, 'definition': definition, 'source': source,
              'rank': RANK.get(source['id'], 20)}
    if pos:
        result['pos'] = POS.get(pos.lower(), pos)
    if example:
        result['example'] = example
    if not alternative and record.get('mnemonic'):
        result['mnemonic'] = clean(record['mnemonic'])
    return result


buckets = {}
raw_source_words = defaultdict(set)
for record in PRIMARY + SECONDARY + REFERENCE:
    for ref in record['sources']:
        raw_source_words[ref['id']].add(norm(record['word']))


def add_record(record, occurrences_only=False):
    word = clean(record['word']).lower()
    if not usable_word(word):
        issues.append({'word': word, 'issue': 'Invalid or sentence-length headword excluded'})
        return
    k = norm(word)
    bucket = buckets.setdefault(k, {'word': word, 'sources': [], 'tags': [], 'candidates': []})
    for ref in record['sources']:
        bucket['sources'].append(source_ref(ref))
    bucket['tags'].extend(clean(t) for t in record.get('tags', []))
    if not occurrences_only:
        bucket['candidates'].append(candidate(record))
        for alt in record.get('alternateDefinitions', []):
            cand = candidate(record, alt)
            bucket['candidates'].append(cand)
            bucket['sources'].append(cand['source'])


for record in PRIMARY + SECONDARY:
    add_record(record)
# A reference glossary supplies study meanings; bare occurrences do not.
for record in REFERENCE:
    if record.get('definition'):
        add_record(record)

pending = []
matched_occurrences = 0
for record in REFERENCE:
    if record.get('definition'):
        continue
    if norm(record['word']) in buckets:
        add_record(record, occurrences_only=True)
        matched_occurrences += 1
    else:
        pending.append(copy.deepcopy(record))

words = []
app_source_words = defaultdict(set)
for k, bucket in sorted(buckets.items()):
    candidates = bucket['candidates']
    defined = [c for c in candidates if c['definition']]
    # Prefer higher-quality named dictionaries; for tied senses retain a supplied example.
    selected = min(defined, key=lambda c: (c['rank'], not bool(c.get('example')))) if defined else candidates[0]
    word = selected['word']
    result = {'id': slug(word), 'word': word, 'definition': selected['definition']}
    for field in ['pos', 'example', 'mnemonic']:
        if selected.get(field):
            result[field] = selected[field]
    if selected['definition']:
        result['definitionSource'] = selected['source']
    refs = defaultdict(list)
    for ref in bucket['sources']:
        refs[ref['id']].append(ref)
    result['sources'] = []
    for sid, entries in refs.items():
        all_pages = sorted({e['page'] for e in entries if e.get('page')})
        combined = {'id': sid, 'title': SOURCE_MAP[sid]['title']}
        definition_page = selected['source'].get('page') if selected['source']['id'] == sid else None
        if all_pages:
            combined['page'] = definition_page or all_pages[0]
            if len(all_pages) > 1:
                combined['pages'] = all_pages
        original = sorted({e['originalWord'] for e in entries if e.get('originalWord')})
        if original:
            combined['originalWords'] = original
        result['sources'].append(combined)
        app_source_words[sid].add(k)
    result['sources'].sort(key=lambda s: (s['id'] != selected['source']['id'], RANK.get(s['id'], 20), s['title']))
    tags = list(dict.fromkeys(bucket['tags']))
    if tags:
        result['tags'] = tags
    seen = {norm(selected['definition'])}
    alternatives = []
    for cand in sorted(defined, key=lambda c: c['rank']):
        definition_key = norm(cand['definition'])
        if definition_key in seen:
            continue
        seen.add(definition_key)
        alt = {'definition': cand['definition'], 'source': cand['source']}
        for field in ['pos', 'example']:
            if cand.get(field):
                alt[field] = cand[field]
        alternatives.append(alt)
    if alternatives:
        result['alternateDefinitions'] = alternatives
    words.append(result)

# Original editorial wording fills missing meanings without claiming book provenance.
editorial = json.loads((OUT / 'editorial-definitions.json').read_text()) if (OUT / 'editorial-definitions.json').exists() else []
by_word = {norm(w['word']): w for w in words}
editorial_count = 0
for record in editorial:
    word = by_word.get(norm(record['word']))
    if not word or word['definition']:
        continue
    if record['confidence'] == 'reviewed':
        word.update({field: record[field] for field in ['definition', 'pos', 'example']})
        word['definitionSource'] = {'id': 'wordtrail-editorial', 'title': 'Wordtrail · original definition and example'}
        editorial_count += 1
    elif record.get('note'):
        word['definitionNote'] = record['note']

source_rows = []
for raw in RAW_SOURCES:
    sid = raw['id']
    note = raw.get('note') or raw.get('notes') or raw.get('limitations') or ''
    word_count = len(app_source_words[sid])
    extracted_count = len(raw_source_words[sid])
    if raw.get('kind') and extracted_count:
        note += f' {word_count:,} vocabulary headwords link to this resource in the app; extracted occurrence-only forms are linked only when they match an existing library word.'
    row = {'id': sid, 'title': raw['title'], 'kind': raw.get('kind', 'vocabulary'),
           'status': raw.get('status', 'imported'), 'wordCount': word_count,
           'extractedWordCount': extracted_count, 'note': note}
    if raw.get('pages'):
        row['pages'] = raw['pages']
    if raw.get('filename'):
        row['filename'] = raw['filename']
    source_rows.append(row)

ids = [w['id'] for w in words]
assert len(ids) == len(set(ids)), 'Slug collision must be resolved before publication.'
assert len(words) == len({norm(w['word']) for w in words})
assert all(len(w['sources']) == len({s['id'] for s in w['sources']}) for w in words)
assert all(s['wordCount'] == sum(s['id'] in {ref['id'] for ref in w['sources']} for w in words) for s in source_rows)
assert all(not w['definition'] or w.get('definitionSource') for w in words)
assert all(ref['id'] in SOURCE_MAP for w in words for ref in w['sources'])

unavailable = [{'id': s['id'], 'title': s['title'], 'reason': s['note']} for s in source_rows if s['status'] == 'unavailable']
coverage = {
    'uniqueHeadwords': len(words),
    'withDefinitions': sum(bool(w['definition']) for w in words),
    'originalEditorialDefinitions': editorial_count,
    'headwordsOnly': sum(not w['definition'] for w in words),
    'withExamples': sum(bool(w.get('example')) for w in words),
    'withAlternateDefinitions': sum(bool(w.get('alternateDefinitions')) for w in words),
    'sourceFiles': len(source_rows),
    'sourceStatusCounts': dict(Counter(s['status'] for s in source_rows)),
    'referenceDefinedInputRecords': sum(bool(r.get('definition')) for r in REFERENCE),
    'referenceOccurrenceRecordsMatched': matched_occurrences,
    'referenceOccurrenceRecordsPending': len(pending),
    'sourceCoverage': source_rows,
    'unavailableFiles': unavailable,
    'issues': issues,
    'limitations': [
        'Three uploads exceed the 32 MiB transfer limit; their contents were not inspected.',
        'Barron’s Mnemonics extraction is partial; the uploaded file ends at vogue.',
        'Source definitions are preserved with provenance; they are not an independently reviewed dictionary.',
        '254 missing meanings use labeled original Wordtrail editorial definitions and examples; two ambiguous source headwords remain excluded from quizzes.',
        'Unmatched reference-only forms appear in the separate Reference index; they are not app study cards.',
        'Words without definitions remain searchable but are excluded from scored vocabulary practice.',
        'Source page numbers refer to PDF page positions, which may differ from printed page labels.',
        'Indexed reference books and test PDFs are inventoried; not every exercise is converted into app practice.'
    ]
}
reference_index = [{**r, 'id': 'ref-' + slug(r['word'])} for r in pending]
assert len({r['id'] for r in reference_index}) == len(reference_index)
(OUT / 'reference-index.json').write_text(json.dumps(reference_index, ensure_ascii=False, separators=(',', ':')) + '\n')
(OUT / 'vocabulary.json').write_text(json.dumps(words, ensure_ascii=False, separators=(',', ':')) + '\n')
(OUT / 'sources.json').write_text(json.dumps(source_rows, ensure_ascii=False, indent=2) + '\n')
(WORK / 'reference-pending.json').write_text(json.dumps(pending, ensure_ascii=False, indent=2) + '\n')
(WORK / 'coverage-report.json').write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in coverage.items() if k not in ['sourceCoverage', 'issues']}, ensure_ascii=False, indent=2))
print('Merge issues:', len(issues))
