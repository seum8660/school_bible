# SCHOOL BIBLE 자동화 운영 절차

예약 작업(Claude)과 GitHub Actions가 이 문서를 기준으로 동작한다.

## 전체 흐름
```
inbox/*.pdf ──(예약작업 A: 매일)──▶ manuals/NN_*_요약.html + PDF
                                        │ main 푸시
                                        ▼
                     GitHub Actions deploy.yml
                     ├ tools/build_hub.py   → bible.html 카드·manuals/manifest.json
                     ├ tools/build_vault.py → vault/ 옵시디언 노트
                     └ GitHub Pages 배포
예약작업 B: 매주 월요일 ─▶ 법령·지침 개정 점검 → reports/점검_YYYYMMDD.md
```

## 예약작업 A — 요약문서 생성 (inbox 처리)
1. 저장소 `seum8660/school_bible` 를 준비하고 `inbox/*.pdf` 를 확인한다. 없으면 즉시 종료(보고 없음).
2. PDF마다:
   - 번호: `python3 tools/build_hub.py --next`
   - 주제: 문서 제목에서 핵심어 1~3개를 뽑아 `_`로 연결(한글, 공백 없음)
   - `bible-summary` 스킬로 요약문서를 만든다(A4 1장, 네이비/러스트 규격, 분량 실측 검증 필수).
   - 요약 HTML `<head>` 에 허브 카드용 메타태그를 넣는다:
     ```html
     <meta name="bible:name" content="문서 정식 명칭">
     <meta name="bible:sub"  content="발행기관 · 한 줄 설명">
     <meta name="bible:kind" content="지침|가이드">   <!-- 파일명 [지침]/[가이드] 우선 -->
     <meta name="bible:tags" content="태그1,태그2,태그3">
     ```
   - 저장: `manuals/NN_주제_요약.html`, 원문은 `git mv inbox/원본.pdf manuals/NN_주제.pdf`
3. `python3 tools/build_hub.py` 와 `python3 tools/build_vault.py` 를 실행해 결과를 확인한다(카드 추가 로그).
4. `reports/요약_YYYYMMDD.md` 에 처리 목록(번호·문서명·요약 파일·페이지 사용률)을 적는다.
5. main 에 커밋·푸시한다(메시지: `요약문서 자동 생성: NN 문서명`). 푸시하면 Actions가 배포한다.
6. 실패한 PDF는 `inbox/` 에 그대로 두고 보고서에 사유를 적는다.

## 예약작업 B — 정기 개정 점검
1. `manuals/manifest.json` 의 각 문서에서 근거 법령·고시·지침명과 기준일(요약문서 meta 줄)을 읽는다.
2. 법령은 국가법령정보(law MCP)로 최신 시행일·개정일을 조회, 매뉴얼·가이드는 발행기관 사이트를 웹 검색한다.
3. 요약문서 기준일 이후 개정·신판이 확인된 항목만 표로 정리한다:
   `번호 | 문서 | 요약 기준 | 최신 개정 | 변경 요지 | 출처 링크`
4. 국토교통부 민원마당 질의회신에 학교시설·계약·건설기술 관련 신규 항목이 있으면 함께 적는다.
5. `reports/점검_YYYYMMDD.md` 로 저장해 main 에 푸시한다. 요약문서 본문은 **직접 고치지 않는다**(사람 검토 후 반영).
   개정 사항이 없으면 한 줄로 "변경 없음"만 기록한다.

## 수동 실행
```bash
python3 tools/build_hub.py --check   # 허브 반영 필요 여부
python3 tools/build_hub.py           # 허브 갱신
python3 tools/build_vault.py         # 볼트 갱신 (pip install beautifulsoup4 markdownify lxml)
```

## manifest.json 필드
`no`(카드 번호) · `file` · `kind` · `title` · `name` · `sub` · `pdf` · `tags` ·
`badges_html`(사이트 링크 등 수기 배지, 선택) · `graph_label`(그래프뷰 노드와 이름이 다를 때, 선택)
카드 순서·문구를 바꾸려면 manifest.json 을 고치고 build_hub.py 를 실행한다.
