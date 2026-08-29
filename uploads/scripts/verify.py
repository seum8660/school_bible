#!/usr/bin/env python3
"""요약문서 높이 실측 검증.

사용법:
    python3 verify.py out.html            # 1쪽 문서 (한계 163mm)
    python3 verify.py out.html --multi    # 다쪽 문서 (한계 283mm, 쪽별 측정)

wkhtmltoimage(구 WebKit)는 CSS Grid를 지원하지 않아 2단 카드가 세로로 쌓인다.
그 상태로 측정하면 높이가 약 2배로 나온다. 이 스크립트는 측정할 때만 Grid를
table 레이아웃으로 치환하므로 배포 파일은 Grid 그대로 두면 된다.

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
.row2{ display:table !important; width:100%; border-collapse:separate; border-spacing:1.7mm 0; }
.row2 > .card{ display:table-cell !important; width:50%; vertical-align:top; }
"""


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
        pages = re.findall(r'<div class="page">.*?\n</div>', src, re.S)
        head = src.split("<body>")[0]
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
