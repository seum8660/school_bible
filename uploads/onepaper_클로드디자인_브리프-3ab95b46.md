# onepaper 인포그래픽 — 클로드 디자인 브리프

아래 전체를 클로드 디자인 채팅에 붙여넣고 **"이 디자인 시스템으로 만들어줘"** 라고 지시하십시오.
(핵심: 네이비→틸 그라데이션 · 흰 라운드 카드 · **이모지 금지, SVG 라인 아이콘** · 틸 넘버서클 · 책임 주체 역할 강조 · 하단 결론 밴드)

---

## 0. 문서 레이아웃 (1단 A4 구조) — 필수
이 브리프는 **단순 인포그래픽이 아니라 A4 요약문서**다. 반드시 아래 골격을 지킨다.

- **A4 세로 1장** 단위. 내용이 넘치면 페이지를 나눈다(한 장 ≈ 세로 283mm 이내).
- **1단(단일 열) 순차 배열** — 카드를 **위에서 아래로 세로로 쌓는다. 2단(좌우 병렬) 금지.**
- **페이지 골격(위→아래 순서)**
  1. 제목(`.title`, 틸 언더바) + 아이콘 타일
  2. 메타 1줄(`.meta`: 근거법령 ｜ 고시번호 ｜ 발행기관)
  3. 상단 구분선(`.rule-navy`)
  4. **본문 = `.row1 > .card` 를 세로로 반복**(각 카드 = 배지 + 리스트/수식/넘버서클/칩)
  5. 하단 구분선(`.rule-gray`) → 출처 각주(`.note`) → 쪽번호(`.pageno`)
  6. 마지막 페이지 맨 끝에 결론 밴드(`.conclude`)
- **완성 예시(그대로 참고)**: 함께 전달한 `onepaper_템플릿_1페이지.html` — 4개 카드가 1단으로 쌓인 완성 A4 1장.

```css
body{ margin:0; padding:0; }
.page{ width:210mm; padding:13mm 10mm 8mm; page-break-after:always; box-sizing:border-box; }
.row1{ margin-bottom:4mm; }
.meta{ margin:2mm 0 0 0; font-size:6.4pt; font-weight:400; color:var(--gray); letter-spacing:0.01em; line-height:1.45; }
.rule-navy{ height:0; border:none; margin:2.4mm 0 3.6mm 0; }
.rule-gray{ height:0; border-top:0.25mm solid var(--line); margin:3.6mm 0 2mm 0; }
.note{ text-align:center; font-size:6.1pt; line-height:1.5; color:var(--light); margin:0; }
.pageno{ text-align:center; font-size:6.1pt; color:var(--light); margin-top:2.6mm; }
.list li{ font-size:7.6pt; line-height:1.62; padding-left:3.2mm; text-indent:-3.2mm; margin-bottom:1.7mm; }
.nlist li{ font-size:7.6pt; line-height:1.62; padding-left:5mm; text-indent:-5mm; margin-bottom:1.7mm; }
```

## 1. 팔레트 (토큰)
| 용도 | HEX |
|---|---|
| 네이비(제목·구조) | `#1B3A5B` / 딥 `#16304D` |
| 틸(강조·아이콘·수치) | `#227C8E` / `#2E8C9E` |
| 본문 / 보조 / 옅은 | `#42505F` / `#6B7280` / `#8A93A0` |
| 패널(라이트 블루그레이) | `#EAF0F5` / `#F3F7F9` |
| 카드 / 라인 | `#FFFFFF` / `#DCE4EC` |
| 그라데이션 | `linear-gradient(135deg,#1B3A5B,#227C8E)` |
| 역할 강조(앰버) | 배경 `#FDF0E1` · 글자 `#B45309` · 바/아이콘 `#D9730D` |
| 카드 그림자 | `0 1px 6px rgba(27,58,91,.13)` |

## 2. 타이포 · 레이아웃
- 서체: Noto Sans KR / Noto Sans CJK KR
- 제목: 네이비 볼드(대), **한 줄 유지**, 아래 **틸 그라데이션 언더바**
- 카드: 흰 배경, 라운드(≈10px), 부드러운 그림자, 얇은 라인
- 본문: 불릿은 틸 사각(▪), 여유 있는 행간

## 3. 컴포넌트 레시피 (CSS 발췌)
```css
.title{ margin:0; color:var(--navy); font-size:18pt; font-weight:800; letter-spacing:-0.02em; line-height:1.25; white-space:nowrap;
    padding:0 0 2.4mm 0; }
.title::after{ content:""; display:block; height:1.4mm; margin-top:2mm; border-radius:1mm;
    background:var(--grad); width:46mm; }
.card{ border:0.25mm solid var(--line); border-radius:3mm; background:var(--card); box-shadow:var(--shadow);
    padding:3.2mm 4mm 3.4mm 4mm; }
.badge{ display:inline-block; background:none; color:var(--navy); white-space:normal;
    font-size:9.2pt; font-weight:800; letter-spacing:-0.01em; line-height:1.35;
    padding:0 0 1.6mm 0; border-bottom:0.5mm solid var(--teal); margin-bottom:2.6mm; }
.badge.emph{ background:var(--navy2); color:#fff; border-bottom:none; border-radius:1.6mm; padding:1mm 2.8mm; }
.ic{ width:5.8mm; height:5.8mm; border-radius:1.5mm; background:var(--grad);
       display:inline-flex; align-items:center; justify-content:center; flex:none; }
.nlist .no{ display:inline-block; color:#fff; background:var(--teal); font-weight:700; font-size:6.6pt;
    width:4mm; height:4mm; line-height:4mm; text-align:center; border-radius:50%; margin-right:1.4mm; }
.num{ color:var(--teal); font-weight:800; }
.formula{ background:var(--panel); border:none; border-left:1.4mm solid var(--teal); border-radius:1.4mm 2mm 2mm 1.4mm;
    padding:2.8mm 3.8mm; margin:0 0 3mm 0; text-align:center; font-size:7.6pt; font-weight:600; line-height:1.55; color:var(--navy); }
.chip{ font-size:6.7pt; line-height:1.35; background:var(--panel2); border:0.25mm solid var(--line);
    border-radius:1.6mm; padding:1.4mm 2.6mm; color:var(--body); white-space:nowrap; }
.rolebar{ display:flex; align-items:flex-start; gap:2.2mm; background:#FDF0E1; border-left:1.4mm solid #D9730D;
    border-radius:0 1.6mm 1.6mm 0; padding:2mm 3mm; margin:0 0 2.8mm 0; }
.rolet{ color:#B45309; font-weight:800; }
.conclude{ background:var(--grad); border-radius:3mm; padding:4mm 5mm; margin:1mm 0 0 0; color:#fff; box-shadow:var(--shadow); }
```

## 4. SVG 아이콘 (이모지 대신 사용)
- 각 섹션 제목 앞에 **그라데이션 라운드 타일** 안 흰색 라인 아이콘을 넣는다.
- 타일: `linear-gradient(135deg,#1B3A5B,#227C8E)`, 아이콘: `stroke:#fff; fill:none; stroke-width:2`.
- viewBox `0 0 24 24`. 대표 세트:

```html
<!-- doccheck --> <svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 13l2 2 4-4"/></svg>
<!-- search --> <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>
<!-- shield --> <svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
<!-- flask --> <svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 8.5A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-3.5L14 9V3"/><path d="M7.5 15h9"/></svg>
<!-- list --> <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.1"/><circle cx="4.5" cy="12" r="1.1"/><circle cx="4.5" cy="18" r="1.1"/></svg>
<!-- wrench --> <svg viewBox="0 0 24 24"><path d="M14.5 4.5a4 4 0 0 0-5.2 5.2l-5.3 5.3 2.5 2.5 5.3-5.3a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.1-.4-.4-2.1z"/></svg>
<!-- grid --> <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16M4 15h16M10 4v16M15 4v16"/></svg>
<!-- clip --> <svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="1.5"/><path d="M9 4V3h6v1"/><path d="M9 12l2 2 4-4"/></svg>
<!-- badge_ok --> <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8 12l3 3 5-6"/></svg>
```
주제 매핑 예: 문서/작성=doccheck · 검토/점검=search · 안전=shield · 시험=flask · 수치정리=list · 공법/조치=wrench · 시설물=grid · 점검표=clip · 등급/적정=badge_ok.

## 5. 책임 주체(역할) 강조 — 필수
발주청·감독자·관리주체 등 "누가 책임지는가"가 나오면 **앰버 콜아웃**을 넣는다.
```html
<div class="rolebar">
  <span class="ri"><svg viewBox="0 0 24 24">
    <circle cx="9" cy="8" r="3.2"/>
    <path d="M3.5 20c0-3.3 2.6-5.5 5.5-5.5 2 0 3.8 1 4.8 2.6"/>
    <path d="M15 13l2 2 4-4"/></svg></span>
  <span class="t"><b>관리주체 = 책임 주체</b> — 역할 설명…</span>
</div>
```
본문 속 역할어는 `<span class="rolet">관리주체</span>` 로 앰버 볼드 처리.

## 6. 하단 결론 밴드
마지막에 네이비→틸 그라데이션 밴드로 "한줄 결론"을 배치한다.
```html
<div class="conclude"><span class="lab">한줄 결론</span>
  <span class="txt">핵심 메시지 … <b>강조어</b> …</span></div>
```

---
### 지시 예시
> "위 디자인 시스템으로 '○○ 요약' 인포그래픽 1장을 만들어줘. **1단(세로 단일 열)으로** 카드를 순서대로 쌓고, 섹션마다 SVG 아이콘 타일, 책임 주체엔 앰버 역할 콜아웃, 맨 아래 결론 밴드. 제목엔 틸 언더바·메타 1줄·하단 출처 각주까지 포함."
