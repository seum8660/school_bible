#!/usr/bin/env python3
"""요약문서 높이 실측 검증 — 다쪽 표준.

사용법:
    python3 verify_fixed.py out.html            # 1쪽 문서 (한계 163mm)
    python3 verify_fixed.py out.html --multi    # 다쪽 문서 (한계 283mm, 쪽별 측정)

verify.py는 페이지를 정규식 r'<div class="page">.*?\\n</div>' 로 자른다. 이 방식은
카드·수식 밴드 등 내부에 중첩된 </div>에서 조용히 잘려 페이지 높이를 잘못 읽는다.
verify_fixed.py는 div 깊이를 세어 .page 블록을 정확히 분리하므로 다쪽 문서는 이 파일을 쓴다.

wkhtmltoimage(구 WebKit)는 CSS Grid를 지원하지 않아 2단 카드가 세로로 쌓인다. 측정할
때만 Grid를 table 레이아웃으로 치환하므로 배포 파일은 Grid 그대로 두면 된다.

필요 도구: wkhtmltoimage, Pillow
"""
import subprocess
import sys
import re
import tempfile
import os
from PIL import Image

MM = 3.7795  # 96dpi 기준 1mm당 픽셀 수
PATCH = """
.row2{ display:table !important; width:100%; border-collapse:separate; border-spacing:1.9mm 0; }
.row2 > .card{ display:table-cell !important; width:50%; vertical-align:top; }
.page.haspin{ min-height:0 !important; display:block !important; }
.row1.recap{ margin-top:0 !important; }
"""


def split_pages(body):
    """div 깊이를 세어 최상위 <div class="page"> 블록만 정확히 분리한다(page haspin 등 클래스 포함)."""
    pages = []
    i = 0
    open_re = re.compile(r'<div class="page(?:\s[^"]*)?">')
    while True:
        mo = open_re.search(body, i)
        if not mo:
            break
        s = mo.start()
        depth = 0
        j = s
        while j < len(body):
            m = re.compile(r'<div\b|</div>').search(body, j)
            if not m:
                break
            if m.group() == '</div>':
                depth -= 1
                if depth == 0:
                    pages.append(body[s:m.end()])
                    i = m.end()
                    break
            else:
                depth += 1
            j = m.end()
        else:
            break
    return pages


def bottom_mm(html_text):
    """렌더링 후 마지막 콘텐츠 픽셀의 위치를 mm로 반환한다."""
    d = tempfile.mkdtemp()
    h = os.path.join(d, "v.html")
    p = os.path.join(d, "v.png")
    with open(h, "w", encoding="utf-8") as f:
        f.write(html_text)
    subprocess.run(
        ["wkhtmltoimage", "--width", "794", "--disable-smart-width", h, p],
        capture_output=True,
    )
    im = Image.open(p).convert("L")
    w, ht = im.size
    px = im.load()
    rows = [y for y in range(ht) if any(px[x, y] < 200 for x in range(w))]
    return (max(rows) if rows else 0) / MM


def report(label, mm, limit):
    ok = mm <= limit
    status = (
        "적합 (여유 %.1fmm)" % (limit - mm)
        if ok
        else "초과 %.1fmm — 내용을 줄일 것" % (mm - limit)
    )
    print("%s하단 %6.1fmm  사용률 %4.1f%%  → %s" % (label, mm, mm / 297 * 100, status))
    return ok


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    path = sys.argv[1]
    multi = "--multi" in sys.argv
    src = open(path, encoding="utf-8").read().replace("</style>", PATCH + "</style>")
    limit = 283 if multi else 163

    if multi:
        head = src.split("<body>")[0]
        body = src.split("<body>")[1].split("</body>")[0]
        pages = split_pages(body)
        if not pages:
            print("경고: .page 요소를 찾지 못했습니다. 단일쪽으로 측정합니다.")
            sys.exit(0 if report("", bottom_mm(src), limit) else 1)
        allok = True
        for i, pg in enumerate(pages, 1):
            mm = bottom_mm(head + "<body>" + pg + "</body></html>")
            allok &= report("%d쪽  " % i, mm, limit)
        sys.exit(0 if allok else 1)
    else:
        sys.exit(0 if report("", bottom_mm(src), limit) else 1)


if __name__ == "__main__":
    main()
