#!/usr/bin/env python3
"""SCHOOL BIBLE 허브 자동 갱신.

manuals/manifest.json 을 기준으로 bible.html 의 '매뉴얼 및 지침' 카드 목록(#manGrid)을 다시 만든다.
- manuals/ 에 새 *_요약.html 이 있으면 manifest 에 자동 등록(메타태그 → 없으면 추정)
- 삭제된 요약문서는 manifest·허브에서 제거
- 카드 번호(man-no)는 manifest 값을 유지, 새 카드는 마지막 번호+1
사용: python3 tools/build_hub.py [--check | --next]
  --check: 변경이 필요하면 종료코드 1(파일은 안 건드림) · --next: 새 요약문서용 다음 번호 출력
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAN = os.path.join(ROOT, 'manuals')
MANIFEST = os.path.join(MAN, 'manifest.json')
HUB = os.path.join(ROOT, 'bible.html')
CARD_RE = re.compile(r'<a class="man-card".*?</a>', re.S)
GRID_OPEN = '<div class="man-grid" id="manGrid">\n      <!-- 도우미 삽입 지점 -->\n'
PDF_BADGE = '<span class="man-go g-pdf man-go-pdf2" title="PDF 원문 있음">PDF</span>'
SUM_BADGE = '<span class="man-go g-sum">요약 ▾</span>'


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def parse_card(c):
    g = lambda p: (re.search(p, c, re.S) or [None, None])[1]
    badges = g(r'<span class="man-badges">(.*?)</span>(?:<div class="man-tagrow">|</a>$)')
    e = {
        'no': g(r'<span class="man-no">([^<]*)</span>'),
        'file': g(r'href="manuals/([^"]+)"'),
        'kind': g(r'data-kind="([^"]*)"'),
        'title': html.unescape(g(r'data-title="([^"]*)"') or ''),
        'name': html.unescape(g(r'<b>(.*?)</b>')),
        'sub': html.unescape(g(r'</b><span>(.*?)</span></div>') or ''),
        'pdf': g(r'data-dl="manuals/([^"]+)"'),
        'tags': [html.unescape(t) for t in re.findall(r'data-tag="([^"]*)"', c)] if 'man-tagrow' in c else None,
    }
    auto = SUM_BADGE + (PDF_BADGE if e['pdf'] else '')
    if badges != auto:
        e['badges_html'] = badges  # 사이트 링크 등 수기 배지는 그대로 보존
    return e


def render_card(e):
    no = e['no']
    f = 'manuals/' + e['file']
    dl = f' data-dl="manuals/{esc(e["pdf"])}"' if e.get('pdf') else ''
    badges = e.get('badges_html') or (SUM_BADGE + (PDF_BADGE if e.get('pdf') else ''))
    tags = e.get('tags')
    tagrow = '' if tags is None else '<div class="man-tagrow">' + ''.join(
        f'<span class="htag" data-tag="{esc(t)}">#{esc(t)}</span>' for t in tags) + '</div>'
    return (f'<a class="man-card" data-kind="{esc(e["kind"])}" href="{f}" data-inline="{f}"{dl} '
            f'data-title="{esc(e["title"])}"><span class="man-no">{no}</span><div class="man-t">'
            f'<b>{esc(e["name"])}</b><span>{esc(e["sub"])}</span></div><span class="man-badges">'
            f'{badges}</span>{tagrow}</a>')


def meta(doc, name):
    m = re.search(r'<meta\s+name="bible:%s"\s+content="([^"]*)"' % name, doc)
    return html.unescape(m.group(1)) if m else None


def infer_entry(fname):
    """새 요약문서에서 카드 정보 추출. bible:* 메타태그가 있으면 우선 사용."""
    doc = open(os.path.join(MAN, fname), encoding='utf-8').read()
    title = html.unescape(re.sub(r'\s+', ' ', (re.search(r'<title>(.*?)</title>', doc, re.S) or [0, fname])[1]).strip())
    name = meta(doc, 'name') or re.split(r'\s+[—–-]\s+', title)[0].strip()
    sub = meta(doc, 'sub')
    if not sub:
        m = re.search(r'class="meta"[^>]*>(.*?)</', doc, re.S)
        sub = re.sub(r'<[^>]+>', '', html.unescape(m.group(1))).strip() if m else ''
        sub = re.split(r'\s*[·|]\s*', sub)[0][:40]
    num = fname.split('_')[0]
    pdfs = sorted(p for p in os.listdir(MAN) if p.startswith(num + '_') and p.lower().endswith('.pdf'))
    kind = meta(doc, 'kind') or ('지침' if re.search(r'지침|기준|고시|규정', name) else '가이드')
    tags = [t.strip() for t in (meta(doc, 'tags') or '').split(',') if t.strip()]
    if not tags:  # 파일명 주제어를 기본 태그로
        tags = [w for w in fname.replace('_요약.html', '').split('_')[1:] if w][:3]
    return {'file': fname, 'kind': kind, 'title': title, 'name': name, 'sub': sub,
            'pdf': meta(doc, 'pdf') or (pdfs[0] if pdfs else None), 'tags': tags}


def main():
    if '--next' in sys.argv:  # 새 요약문서에 붙일 다음 파일 번호
        stg = os.path.join(ROOT, 'staging')
        files = os.listdir(MAN) + (os.listdir(stg) if os.path.isdir(stg) else [])
        nums = [int(m.group()) for f in files for m in [re.match(r'\d+', f)] if m]
        print(max(nums, default=0) + 1); return
    check = '--check' in sys.argv
    hub = open(HUB, encoding='utf-8').read()
    gi = hub.index(GRID_OPEN) + len(GRID_OPEN)
    cards = list(CARD_RE.finditer(hub, gi))
    ge = cards[-1].end() if cards else gi
    if os.path.exists(MANIFEST):
        entries = json.load(open(MANIFEST, encoding='utf-8'))
    else:  # 최초 1회: 현재 허브 카드에서 manifest 생성
        entries = [parse_card(c.group()) for c in cards]

    summaries = {f for f in os.listdir(MAN) if f.endswith('_요약.html')}
    exists = lambda f: os.path.exists(os.path.join(MAN, f))
    removed = [e['file'] for e in entries if not exists(e['file'])]
    entries = [e for e in entries if exists(e['file'])]
    known = {e['file'] for e in entries}
    added = sorted(summaries - known, key=lambda f: (int(re.match(r'\d+', f).group()) if re.match(r'\d+', f) else 999, f))
    upgraded = []
    for f in list(added):  # 예: 13_환경관리비_산출기준.html → 13_환경관리비_산출기준_요약.html (새 규격 버전)
        stem = f[:-len('_요약.html')]
        old = next((e for e in entries if e['file'] == stem + '.html'), None)
        if old:
            upgraded.append((old['file'], f)); added.remove(f)
            new = infer_entry(f)
            old.update(file=f, title=new['title'])
    nums = [int(e['no']) for e in entries if str(e.get('no', '')).isdigit()]
    for f in added:  # 새 카드는 마지막 번호 다음으로
        e = infer_entry(f)
        e['no'] = str(max(nums, default=0) + 1); nums.append(int(e['no']))
        entries.append(e)

    block = '\n'.join('      ' + render_card(e) for e in entries).lstrip()
    new_hub = hub[:gi] + '      ' + block + hub[ge:]
    new_manifest = json.dumps(entries, ensure_ascii=False, indent=1) + '\n'
    old_manifest = open(MANIFEST, encoding='utf-8').read() if os.path.exists(MANIFEST) else ''
    changed = new_hub != hub or new_manifest != old_manifest

    for a, b in upgraded: print('새 버전으로 교체:', a, '→', b)
    for f in added: print('추가:', f)
    for f in removed: print('제거:', f)
    print(f'카드 {len(entries)}개 · 변경 {"있음" if changed else "없음"}')
    if check:
        sys.exit(1 if changed else 0)
    if changed:
        open(HUB, 'w', encoding='utf-8').write(new_hub)
        open(MANIFEST, 'w', encoding='utf-8').write(new_manifest)


if __name__ == '__main__':
    main()
