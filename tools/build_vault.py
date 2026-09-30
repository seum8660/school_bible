#!/usr/bin/env python3
"""치트키 사이트 → 옵시디언 볼트(vault/) 자동 노트화.

- manuals/manifest.json 의 요약문서 → vault/매뉴얼/*.md (본문 전체를 마크다운으로 변환)
- 워크플로우세부_*.html            → vault/워크플로우/*.md
- graph_data.js 의 단계·업무·법령·인증 노드 → 각 노트, 연결(link)은 [[위키링크]], 태그는 #태그
- 자동생성 노트에는 frontmatter 'generated: school_bible' 표시 → 다음 실행 때 이 표시가 있는 파일만 교체·삭제
  (직접 쓴 노트는 절대 건드리지 않음. 개인 메모는 vault/내 노트/ 폴더 권장)
의존성: pip install beautifulsoup4 markdownify
"""
import difflib, json, os, re
from collections import defaultdict
from bs4 import BeautifulSoup
from markdownify import markdownify

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT = os.path.join(ROOT, 'vault')
SITE = 'https://seum8660.github.io/school_bible/'
MARK = 'generated: school_bible'
FOLDER = {'root': '', 'phase': '단계', 'law': '법령', 'cert': '인증', 'flow': '워크플로우',
          'item:manual': '매뉴얼'}


def safe(name):
    name = re.sub(r'[\\/:*?"<>|#^\[\]]', ' ', name)
    return re.sub(r'\s+', ' ', name).strip()[:80]


def norm(s):
    return re.sub(r'[^0-9A-Za-z가-힣]', '', s or '')


def html_to_md(path):
    soup = BeautifulSoup(open(path, encoding='utf-8').read(), 'lxml')
    for t in soup(['script', 'style', 'svg', 'noscript', 'button']):
        t.decompose()
    for t in soup.select('.ico, .rico, .no, .ubar'):
        t.decompose()
    for b in soup.select('.badge'):  # 요약문서 섹션 배지 → 제목
        lb = b.select_one('.lb') or b
        n = lb.find('i')
        txt = lb.get_text(' ', strip=True)
        h = soup.new_tag('h2'); h.string = (f'{n.get_text(strip=True)}. ' + txt[len(n.get_text(strip=True)):].strip()) if n else txt
        b.replace_with(h)
    for q in soup.select('.formula, .rolebar'):
        q.name = 'blockquote'
    body = soup.body or soup
    title = (soup.title.get_text(strip=True) if soup.title else '')
    md = markdownify(str(body), heading_style='ATX', bullets='-', strip=['a', 'img'])
    md = re.sub(r'\n{3,}', '\n\n', md).strip()
    md = re.sub(r'^# .*\n', '', md, count=1)  # 첫 H1은 노트 제목과 중복
    return title, md


def fm(d):
    out = ['---']
    for k, v in d.items():
        if v in (None, [], ''):
            continue
        if isinstance(v, list):
            out.append(f'{k}:'); out += [f'  - "{x}"' for x in v]
        else:
            out.append(f'{k}: "{v}"' if isinstance(v, str) and k != 'generated' else f'{k}: {v}')
    out.append(MARK); out.append('---')
    return '\n'.join(out) + '\n'


def tagify(t):
    return re.sub(r'\s+', '_', re.sub(r'[^\w가-힣\s/-]', '', t)).strip('_')


def main():
    notes = {}  # 상대경로 → 내용
    manifest = json.load(open(os.path.join(ROOT, 'manuals', 'manifest.json'), encoding='utf-8'))
    g = json.loads(re.search(r'=\s*(\{.*\})\s*;?\s*$', open(os.path.join(ROOT, 'graph_data.js'), encoding='utf-8').read(), re.S).group(1))
    nodes = {n['id']: n for n in g['nodes']}

    # 1) 그래프 노드 → 노트 이름 결정 (매뉴얼 노드는 manifest 요약문서와 짝지음)
    name_of, man_for_node = {}, {}
    man_keys = [(norm(e['name']), e) for e in manifest]
    for n in g['nodes']:
        if n['group'] == 'tag':
            continue
        label = n['label']
        if n['group'] == 'item:manual':
            k = norm(label)
            # 우선순위: manifest 'graph_label' 지정 → 이름 포함관계 → 유사도 0.75 이상
            hit = next((e for e in manifest if e.get('graph_label') == label), None) \
                or next((e for mk, e in man_keys if k and (k in mk or mk in k)), None)
            if not hit:
                r, e = max(((difflib.SequenceMatcher(None, k, mk).ratio(), e) for mk, e in man_keys), key=lambda x: x[0])
                hit = e if r >= 0.75 else None
            if hit:
                man_for_node[n['id']] = hit; label = hit['name']
        if n.get('url', '') and n['url'].startswith('워크플로우세부_'):
            folder = '워크플로우'
            label = label.replace('[세부] ', '')
        else:
            folder = FOLDER.get(n['group'], '업무')
        name_of[n['id']] = (folder, safe(label))

    # 2) 링크 → 위키링크/태그
    rel, tags = defaultdict(set), defaultdict(set)
    for l in g['links']:
        s, t = nodes.get(l['source']), nodes.get(l['target'])
        if not s or not t:
            continue
        if s['group'] == 'tag' and t['id'] in name_of:
            tags[t['id']].add(tagify(s['label'].lstrip('#')))
        elif t['group'] == 'tag' and s['id'] in name_of:
            tags[s['id']].add(tagify(t['label'].lstrip('#')))
        elif s['id'] in name_of and t['id'] in name_of:
            rel[s['id']].add(t['id']); rel[t['id']].add(s['id'])

    def link(nid):
        return f'[[{name_of[nid][1]}]]'

    # 3) 매뉴얼 요약문서 노트 (manifest 전체)
    node_for_man = {e['file']: nid for nid, e in man_for_node.items()}
    for e in manifest:
        nid = node_for_man.get(e['file'])
        title, md = html_to_md(os.path.join(ROOT, 'manuals', e['file']))
        ts = sorted(set(tagify(t) for t in (e.get('tags') or [])) | tags.get(nid, set()))
        aliases = [nodes[nid]['label']] if nid and nodes[nid]['label'] != e['name'] else []
        head = fm({'title': e['name'], 'aliases': aliases, '구분': e['kind'], '번호': e['no'],
                   '요약문서': SITE + 'manuals/' + e['file'],
                   '원문PDF': SITE + 'manuals/' + e['pdf'] if e.get('pdf') else None, 'tags': ts})
        conn = '\n'.join('- ' + link(x) for x in sorted(rel.get(nid, ()), key=lambda x: name_of[x][1]))
        body = f'# {e["name"]}\n\n> {e["sub"]}\n\n' if e.get('sub') else f'# {e["name"]}\n\n'
        body += md + ('\n\n## 연결\n' + conn if conn else '') + '\n'
        notes[f'매뉴얼/{safe(e["name"])}.md'] = head + '\n' + body

    # 4) 나머지 그래프 노드 노트 (세부 워크플로우는 페이지 본문 포함)
    for nid, (folder, name) in name_of.items():
        if nid in man_for_node:
            continue
        n = nodes[nid]
        path = f'{folder}/{name}.md' if folder else f'{name}.md'
        url = n.get('url')
        md = ''
        if url and os.path.exists(os.path.join(ROOT, url)):
            md = html_to_md(os.path.join(ROOT, url))[1]
        head = fm({'title': name, '구분': n['group'], '사이트': SITE + url if url else None,
                   'tags': sorted(tags.get(nid, ()))})
        conn = '\n'.join('- ' + link(x) for x in sorted(rel.get(nid, ()), key=lambda x: name_of[x][1]))
        body = f'# {name}\n\n' + (f'> {n["desc"]}\n\n' if n.get('desc') else '') + \
               ('## 연결\n' + conn + '\n\n' if conn else '') + (md + '\n' if md else '')
        notes[path] = head + '\n' + body

    # 5) 세부 워크플로우 페이지 중 그래프에 없는 것
    have = {nodes[n].get('url') for n in name_of}
    for f in sorted(os.listdir(ROOT)):
        if f.startswith('워크플로우세부_') and f.endswith('.html') and f not in have:
            title, md = html_to_md(os.path.join(ROOT, f))
            name = safe(re.split(r'\s+[—|–-]\s+', title)[0] or f[8:-5].replace('_', ' '))
            notes[f'워크플로우/{name}.md'] = fm({'title': name, '사이트': SITE + f}) + f'\n# {name}\n\n{md}\n'

    # 6) 매뉴얼 색인(MOC)
    idx = '\n'.join(f'- {e["no"]}. [[{safe(e["name"])}]] — {e.get("sub", "")}' for e in manifest)
    notes['매뉴얼/_매뉴얼 색인.md'] = fm({'title': '매뉴얼 색인'}) + f'\n# 매뉴얼 및 지침 색인\n\n{idx}\n'

    # 쓰기: 자동생성 표시가 있는 파일만 교체·삭제
    old = set()
    for dp, _, fs in os.walk(VAULT):
        for f in fs:
            if f.endswith('.md'):
                p = os.path.join(dp, f)
                head = open(p, encoding='utf-8').read(4000)
                if head.startswith('---\n') and MARK in head.split('\n---', 1)[0].splitlines():  # frontmatter 안의 표시만 인정
                    old.add(os.path.relpath(p, VAULT))
    changed = 0
    for rp, txt in notes.items():
        p = os.path.join(VAULT, rp)
        if os.path.exists(p) and rp not in old:
            print('건너뜀(직접 작성한 노트):', rp); continue
        os.makedirs(os.path.dirname(p), exist_ok=True)
        if not os.path.exists(p) or open(p, encoding='utf-8').read() != txt:
            open(p, 'w', encoding='utf-8').write(txt); changed += 1
    for rp in old - set(notes):
        os.remove(os.path.join(VAULT, rp)); changed += 1
    print(f'노트 {len(notes)}개 · 변경 {changed}개')


if __name__ == '__main__':
    main()
