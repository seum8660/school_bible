# SCHOOL BIBLE 자동화 운영 절차

예약 작업(Claude)과 GitHub Actions가 이 문서를 기준으로 동작한다.

## 전체 흐름
```
예약작업 C(매주 월): tools/sources.json 게시판 탐색 ─▶ 검토 페이지(자료 검토함)에 후보 등록
                                  │ Mini 승인
                                  ▼
예약작업 A(매일): 승인분 → inbox/downloads.txt ─▶ Actions fetch-inbox.yml 이 원문 PDF를 inbox/ 에 저장
inbox/*.pdf ──(예약작업 A 이어서)──▶ manuals/NN_*_요약.html + PDF
                                        │ main 푸시
                                        ▼
                     GitHub Actions deploy.yml
                     ├ tools/build_hub.py   → bible.html 카드·manuals/manifest.json
                     ├ tools/build_vault.py → vault/ 옵시디언 노트
                     └ GitHub Pages 배포
예약작업 B: 매주 월요일 ─▶ 법령·지침 개정 점검 → reports/점검_YYYYMMDD.md
```

## 검토 페이지 (자료 검토함)
주소는 tools/sources.json 의 review_page. ArtifactData 도구로 컬렉션 `candidates` 를 읽고 쓴다.
문서 id: `기관-게시판-글번호` (예: koies-00087-3143, codil-policy-13277)
필드: title · org · board · date(YYYY-MM-DD) · url · reason(요약이 필요한 이유 1~2문장) · kind(지침/가이드) · note · found ·
status(pending→approved→queued→done | failed | rejected) · summaryUrl(게시 후)
Mini가 페이지에서 pending 을 approved/rejected 로 바꾼다. 쓰기는 항상 읽은 version 을 if_version 으로 고정한다.

## 예약작업 C — 새 자료 탐색 (매주 월요일)
1. tools/sources.json 의 게시판을 확인한다. '직접 읽기'는 WebFetch 로 목록을, CODIL 은 WebSearch(site:codil.or.kr ...)로 최근 게시글을 찾는다.
   robots.txt 로 금지된 곳(건축HUB)은 접속하지 않는다.
2. 최근 12개월 게시글 중 학교시설 업무와 관련 있는 매뉴얼·지침·가이드라인·안내서만 고른다(keywords 참고). 홍보물·채용·행사·리플릿은 제외.
3. 이미 사이트에 있는 문서(manuals/manifest.json 의 name 과 비교)와 검토 페이지에 이미 있는 id 는 제외한다.
4. 새 후보를 candidates 에 status=pending 으로 등록한다(batch). reason 은 사이트의 어떤 요약·업무와 연결되는지 구체적으로.
5. 새 후보가 있으면 건수와 제목만 짧게 보고한다. 없으면 "새 후보 없음" 한 줄.

## 예약작업 A — 요약문서 생성 (inbox 처리)
0. 검토 페이지에서 status=approved 인 후보를 읽어 `inbox/downloads.txt` 에 `url | title | kind` 줄로 추가하고 status=queued 로 바꾼다.
   추가한 줄이 있으면 main 에 푸시한 뒤 Actions(승인 자료 원문 다운로드)가 끝날 때까지 기다린다
   (1분 간격 git pull, 최대 15분 — downloads.txt 에서 줄이 빠지고 reports/다운로드_*.md 가 생기면 완료).
   다운로드 보고서에서 실패한 항목은 status=failed, note=사유 로 바꾼다.
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
   - PDF가 90MB를 넘거나 스캔본이라 글자를 읽을 수 없으면 요약하지 않고 실패로 기록한다.
3. `python3 tools/build_hub.py` 와 `python3 tools/build_vault.py` 를 실행해 결과를 확인한다(카드 추가 로그).
4. `reports/요약_YYYYMMDD.md` 에 처리 목록(번호·문서명·요약 파일·페이지 사용률)을 적는다.
5. main 에 커밋·푸시한다(메시지: `요약문서 자동 생성: NN 문서명`). 푸시하면 Actions가 배포한다.
6. 실패한 PDF는 `inbox/` 에 그대로 두고 보고서에 사유를 적는다.
7. 검토 페이지 후보에서 온 문서는 status=done, summaryUrl=https://seum8660.github.io/school_bible/manuals/NN_주제_요약.html 로 바꾼다
   (inbox 파일명은 `[구분]제목.pdf` 이므로 제목으로 짝지음).

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
