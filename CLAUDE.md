# 프로젝트 규칙

## 폴더 구조 — 단일 폴더 방식
`deploy/` 폴더는 **사용하지 않는다.** 프로젝트 루트가 곧 배포본이다.
루트를 그대로 `C:\Users\user\Documents\GitHub\school_bible` 에 풀면 사이트에 반영된다.
(이 폴더는 깃허브에 자동 동기화된다. 로컬 폴더에 직접 쓸 수 없으므로 항상 다운로드 카드로 전달)

## 자동저장 (요청 없어도 매 턴 수행)
파일을 **하나라도 수정·추가한 턴**이라면, 사용자가 "저장"이라고 말하지 않아도
턴을 끝내기 전에 반드시 아래를 실행한다:
1. `intro.html`을 고쳤으면 `index.html`에도 같은 내용으로 복사 (첫화면 = 인트로)
2. `present_fs_item_for_download`로 **프로젝트 전체**를 zip 다운로드 카드로 제시
3. 요약은 한 줄 — "저장 완료, zip 첨부" 정도

## 주요 파일
- `bible.html` — 학교시설업무 치트키 SCHOOL BIBLE (사이트 본체)
- `index.html` / `intro.html` — 첫화면 인트로 (둘은 항상 같은 내용)
- `bible_notion.html` — bible.html로 보내는 리다이렉트 스텁
- `설계용역비_산출_대시보드.html` — 설계용역비 산출 (BF인증·손해배상보험료 하위 대시보드 포함)
- `얼마니_소요예산_대시보드.html` — 소요예산 산출
- `워크플로우_통합보드.html` + `wf_boards.js` / `wf_tags.js` — 워크플로우 보드 26종
- `graph_data.js` — 그래프뷰 데이터
- `manuals/` — 매뉴얼·지침 요약문서 및 원문 PDF
- `templates/` — 제작 규격서(내부용)
