#!/usr/bin/env python3
"""승인된 자료의 원문 PDF를 inbox/ 로 내려받는다 (GitHub Actions에서 실행).

입력: inbox/downloads.txt — 한 줄에 하나
    게시글또는PDF주소 | 문서명(선택) | 구분(지침/가이드, 선택)
지원: 한국교육시설안전원(koies.or.kr) 게시글 · CODIL(codil.or.kr) 게시글 · PDF 직접 주소 · 기타 페이지의 .pdf 링크
처리된 줄은 inbox/downloads_done.txt 로 옮기고, 결과는 reports/다운로드_YYYYMMDD.md 에 남긴다.
사용: python3 tools/fetch_docs.py [--dry 목록파일]   (--dry: /tmp 에만 받고 결과만 출력)
"""
import datetime, html, os, re, ssl, subprocess, sys, tempfile, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(ROOT, 'inbox')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
_ctx = {}


def ssl_ctx(host):
    """중간 인증서를 빠뜨린 사이트(CODIL 등)는 AIA 주소에서 중간 인증서를 받아 검증에 추가한다. 검증은 끄지 않는다."""
    if host in _ctx:
        return _ctx[host]
    ctx = ssl.create_default_context()
    try:
        out = subprocess.run(f'echo | timeout 20 openssl s_client -connect {host}:443 -servername {host} 2>/dev/null'
                             f' | openssl x509 -noout -text', shell=True, capture_output=True, text=True).stdout
        m = re.search(r'CA Issuers - URI:(\S+)', out)
        if m:
            der = urllib.request.urlopen(m.group(1), timeout=30).read()
            pem = der.decode() if b'BEGIN CERT' in der else ssl.DER_cert_to_PEM_cert(der)
            ctx.load_verify_locations(cadata=pem)
    except Exception as e:
        print('  중간 인증서 준비 실패(기본 검증 사용):', e)
    _ctx[host] = ctx
    return ctx


def get(url, tries=3, timeout=90):
    host = urllib.parse.urlparse(url).hostname
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': url})
            with urllib.request.urlopen(req, timeout=timeout, context=ssl_ctx(host)) as r:
                return r.read(), r.headers.get('Content-Type', ''), r.headers.get('Content-Disposition', '')
        except Exception as e:
            last = e; time.sleep(5 * (i + 1))
    raise RuntimeError(f'{url} — {last}')


def find_files(url, page):
    """게시글 HTML에서 (파일명, 다운로드주소) 목록을 뽑는다."""
    base = '{0.scheme}://{0.netloc}'.format(urllib.parse.urlparse(url))
    files = []
    if 'koies.or.kr' in url:  # DEXT5 다운로더: fileUrl = baseUrl + "/comm/getFile?..." 다음에 name: "..."
        for m in re.finditer(r'baseUrl\s*\+\s*"([^"]+)".*?name:\s*"([^"]+)"', page, re.S):
            files.append((html.unescape(m.group(2)), base + html.unescape(m.group(1))))
    else:  # CODIL 등: 본문의 파일 링크
        for m in re.finditer(r'<a[^>]+href="([^"]*(?:\.pdf|\.hwpx?|filebank|download|fileDown)[^"]*)"[^>]*>(.*?)</a>', page, re.S | re.I):
            href = urllib.parse.urljoin(url, html.unescape(m.group(1)))
            label = re.sub(r'<[^>]+>|\s+', ' ', m.group(2)).strip()
            files.append((label or os.path.basename(urllib.parse.urlparse(href).path), href))
    seen, out = set(), []
    for n, u in files:
        if u not in seen:
            seen.add(u); out.append((n, u))
    return out


def safe_name(s):
    s = html.unescape(s).replace('\xa0', ' ')
    s = re.sub(r'\.(pdf|hwpx?)\b.*$', '', s, flags=re.I)  # 확장자 뒤 "[4.7 Mbyte]" 등 제거
    s = re.sub(r'^\[?붙임\]?\s*|^\d+\.\s*', '', s.replace('_', ' '))
    s = re.sub(r'[\\/:*?"<>|]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()[:80]


def process(line, outdir):
    parts = [p.strip() for p in line.split('|')]
    url, title, kind = (parts + ['', ''])[:3]
    url = re.sub(r'^https?://codil\.or\.kr', 'https://www.codil.or.kr', url)  # www 없는 주소는 403
    prefix = f'[{kind}]' if kind in ('지침', '가이드') else ''
    if re.search(r'\.pdf($|\?)', url, re.I) or 'filebank' in url:
        cands = [(title or os.path.basename(urllib.parse.urlparse(url).path), url)]
    else:
        page = get(url)[0].decode('utf-8', 'replace')
        cands = find_files(url, page)
    pdfs = [(n, u) for n, u in cands if not re.search(r'\.hwpx?($|\?)', n + u, re.I)]
    if not pdfs:
        return None, '첨부 PDF 없음' + (' (HWP만 있음)' if cands else '')
    got = []  # 게시글에 PDF가 여럿이면(공고문+본문 등) 가장 큰 파일 = 본문 하나만 저장
    for n, u in pdfs[:5]:
        data = get(u)[0]
        if data.startswith(b'%PDF'):
            got.append((len(data), n, data))
    saved = []
    if got:
        size, n, data = max(got)
        if size > 95 * 1048576:  # GitHub 파일 한도(100MB)
            return None, f'PDF가 너무 큼({size / 1048576:.0f}MB) — 직접 업로드 필요'
        name = safe_name(title or n) or 'document'
        path = os.path.join(outdir, prefix + name + '.pdf')
        open(path, 'wb').write(data)
        saved.append((os.path.basename(path), size))
    return (saved, None) if saved else (None, 'PDF 형식 파일을 받지 못함')


def main():
    dry = '--dry' in sys.argv
    src = sys.argv[sys.argv.index('--dry') + 1] if dry else os.path.join(INBOX, 'downloads.txt')
    outdir = tempfile.mkdtemp() if dry else INBOX
    if not os.path.exists(src):
        print('downloads.txt 없음'); return
    lines = [l.strip() for l in open(src, encoding='utf-8') if l.strip() and not l.startswith('#')]
    if not lines:
        print('대기 항목 없음'); return
    today = datetime.date.today().strftime('%Y%m%d')
    rows, done, keep = [], [], []
    for line in lines:
        try:
            saved, err = process(line, outdir)
        except Exception as e:
            saved, err = None, f'접속 실패: {e}'
        url = line.split('|')[0].strip()
        if saved:
            done.append(line)
            rows += [f'| 완료 | {n} | {s / 1048576:.1f}MB | {url} |' for n, s in saved]
        else:
            (keep if err.startswith('접속 실패') else done).append(line)  # 접속 실패만 다음에 재시도
            rows.append(f'| 실패 | {err} | - | {url} |')
    report = f'# 원문 다운로드 {today}\n\n| 결과 | 파일 | 크기 | 출처 |\n|---|---|---|---|\n' + '\n'.join(rows) + '\n'
    print(report)
    if dry:
        return
    os.makedirs(os.path.join(ROOT, 'reports'), exist_ok=True)
    with open(os.path.join(ROOT, 'reports', f'다운로드_{today}.md'), 'a', encoding='utf-8') as f:
        f.write(report)
    with open(os.path.join(INBOX, 'downloads_done.txt'), 'a', encoding='utf-8') as f:
        f.writelines(f'{today} {l}\n' for l in done)
    with open(src, 'w', encoding='utf-8') as f:
        f.write('# 게시글주소 | 문서명(선택) | 지침/가이드(선택)\n' + ''.join(l + '\n' for l in keep))


if __name__ == '__main__':
    main()
