"""모든 HTML <head>에 구글 애널리틱스(GA4) 태그를 넣는다. 이미 있으면 건너뛴다.
배포(deploy.yml) 때 자동 실행되므로 새 HTML을 추가해도 태그가 빠지지 않는다.
templates/(내부 제작 규격)는 제외."""
import pathlib, re

GA_ID = 'G-FCC3V64RW9'
SNIP = ('<!-- Google tag (gtag.js) -->\n'
        f'<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>\n'
        "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
        f"gtag('js',new Date());gtag('config','{GA_ID}');</script>\n")
ROOT = pathlib.Path(__file__).resolve().parent.parent

n = 0
for p in ROOT.rglob('*.html'):
    rel = p.relative_to(ROOT).parts
    if rel[0] in ('.git', 'templates'):
        continue
    s = p.read_text(encoding='utf-8')
    if 'googletagmanager.com/gtag/js' in s:
        continue
    m = re.search(r'<head\b[^>]*>', s, re.I)
    s = s[:m.end()] + '\n' + SNIP + s[m.end():] if m else SNIP + s
    p.write_text(s, encoding='utf-8')
    n += 1
print(f'GA 태그 추가: {n}개 파일')
