# 디자인 규격 상세

## 목차
1. 색상
2. 서체 및 크기
3. 페이지 규격
4. 구조와 클래스
5. 본문 작성 규칙
6. 다쪽 문서 규격
7. 색상 변형

---

## 1. 색상

| 용도 | 값 | CSS 변수 |
|---|---|---|
| 기본(네이비) | `#1E3A5F` | `--navy` |
| 포인트(러스트) | `#B45309` | `--rust` |
| 카드 테두리 | `#D1D5DB` | `--line` |
| 수식 밴드 배경 | `#EEF2F7` | `--band` |
| 칩 배경 | `#F1F5F9` | `--chip-bg` |
| 칩 테두리 | `#CBD5E1` | `--chip-line` |
| 본문 | `#37414F` | `--body` |
| 메타 | `#6B7280` | `--meta` |
| 각주 | `#9CA3AF` | `--note` |

카드는 **테두리만 두고 채움을 두지 않는다**(`background:none`).

## 2. 서체 및 크기

서체는 Noto Sans KR. 크기는 pt로 지정한다(브라우저에서 1pt = 1.333px).

| 요소 | 크기 | 굵기 |
|---|---|---|
| 제목 | 13.1pt | 800 |
| 섹션 배지 | 7.9pt | 700, 흰글씨 |
| 본문 | 6.7pt | 400 |
| 수식 밴드 | 7pt | 600 |
| 칩 | 6pt | 400 |
| 메타 | 6pt | 400 |
| 각주 | 5.7pt | 400 |

행간은 본문 1.42, 밴드 1.45, 칩 1.25.

## 3. 페이지 규격

- A4 세로 210 × 297mm, `@page { margin:0 }`
- 좌우 여백 12mm, 상단 14mm
- **1쪽 문서**: 본문은 페이지 상단 약 55%만 사용하고 하단은 여백으로 둔다. 콘텐츠 하단 한계 163mm.
- **다쪽 문서**: 하단 여백 14mm를 확보한다. 한계 283mm, 권장 사용률 70~75%.

## 4. 구조와 클래스

```html
<div class="sheet">
  <h1 class="title">○○ — 핵심 요약</h1>
  <p class="meta">…</p>
  <div class="rule-navy"></div>

  <div class="row2">
    <div class="card"><span class="badge">1 · …</span><ul class="list">…</ul></div>
    <div class="card"><span class="badge">2 · …</span><ul class="list">…</ul></div>
  </div>

  <div class="row1">
    <div class="card"><span class="badge rust">3 · …</span>
      <div class="formula">…<span class="sub">…</span></div>
      <ol class="nlist">
        <li><span class="no">①</span>…</li>
      </ol>
    </div>
  </div>

  <div class="row2">…4·5…</div>

  <div class="row1">
    <div class="card"><span class="badge">6 · …</span>
      <div class="chips"><span class="chip"><b>…</b> …</span></div>
    </div>
  </div>

  <div class="rule-gray"></div>
  <p class="note">…</p>
</div>
```

제목 형식은 `"○○ — 핵심 요약"`. 다쪽 문서는 `"○○ ① — 총론"`처럼 원문자를 붙인다.

메타는 1줄로 `분류 ｜ 근거 법령 ｜ 출처(발간기관·발간일)` 순서로 쓴다.

## 5. 본문 작성 규칙

- 문체는 격식체·개조식. 종결은 "…함", "…임", "…하여야 함".
- 표제어는 `<b class="term">`(굵은 네이비), 강조 수치는 `<span class="num">`(러스트).
- 3번 섹션 배지에만 `rust` 클래스를 붙인다.
- 수식 밴드는 산정식을 우선하되, 절차형 주제는 시간 흐름(`45일 전 → 20일 전 → …`)을 넣는다.
- `.sub`(밴드 부제)는 선택 사항이며, 분량이 부족하면 먼저 삭제한다.
- 칩은 `<b>항목명</b> 값` 형태로 쓰고 줄바꿈되지 않도록 짧게 유지한다.

## 6. 다쪽 문서 규격

`.sheet` 대신 `.page`를 사용하고 `page-break-after:always`를 적용한다. 마지막 쪽은 `auto`.

```css
.page{ width:210mm; min-height:297mm; padding:14mm 12mm; page-break-after:always; }
.page:last-child{ page-break-after:auto; }
```

각 쪽 하단에 `<p class="pageno">1 / 5</p>`를 넣는다. 화면에서 쪽 구분이 보이도록 `@media screen`에서 배경과 그림자를 준다.

다쪽 문서는 7번 카드(전폭)를 추가해도 된다. 6번을 칩으로 유지하는 대신 7번을 칩으로 옮겨도 무방하다.

## 7. 색상 변형

사용자가 변형을 요청하면 `--navy`만 교체하고 나머지는 유지한다. 원본을 덮어쓰지 않고 별도 파일로 만든다.

| 변형 | `--navy` |
|---|---|
| navy(기본) | `#1E3A5F` |
| green | `#14532D` |
| teal | `#134E4A` |
| plum | `#4C1D3D` |
