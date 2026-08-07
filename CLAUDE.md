# 프로젝트 규칙

## "저장" 요청 처리
사용자가 **"저장"** 또는 **"파일 저장해줘"**라고 하면:
1. 최신 `bible.html` → `deploy/index.html` 복사
2. 최신 `설계용역비.html` → `설계용역비_산출_대시보드.html` 및 `deploy/설계용역비_산출_대시보드.html` 복사
   (bible의 링크가 이 파일명을 참조함)
3. 그 외 수정한 대시보드 파일도 `deploy/`에 같은 이름으로 복사
4. `present_fs_item_for_download`로 `deploy` 폴더를 zip 다운로드 카드로 제시

사용자는 받은 zip을 로컬 `C:\Users\user\Documents\GitHub\school_bible` 폴더에 풀어 사용한다.
이 폴더는 깃허브에 자동 동기화(자동 업로드)되는 로컬 저장소이므로, 압축을 풀면 곧 사이트에 반영된다.
(로컬 폴더에 직접 쓰는 것은 불가능하므로 항상 다운로드 카드로 전달)

## 파일 구조
- `bible.html` — 학교시설업무 치트키 SCHOOL BIBLE (배포 시 `index.html`)
- `설계용역비.html` — 설계용역비 산출 대시보드 (BF인증·손해배상보험료 하위 대시보드 포함)
- `얼마니_소요예산_대시보드.html` — 소요예산 산출
- `deploy/` — 깃허브 배포용 완성본
