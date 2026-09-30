#!/usr/bin/env python3
"""school_bible/vault/ → 노트 전용 저장소(clone 경로)로 복사하고 커밋한다. 푸시는 호출한 쪽에서.
'내 노트' 폴더와 .obsidian 설정, .git 은 건드리지 않는다. 사용: python3 tools/sync_vault_repo.py /path/to/school_bible_vault
"""
import os, shutil, subprocess, sys
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'vault')
KEEP = {'.git', '.obsidian', '내 노트'}
dst = sys.argv[1]
for name in os.listdir(dst):  # 자동 영역을 지우고 새로 복사(삭제된 노트 반영)
    if name not in KEEP:
        p = os.path.join(dst, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
for name in os.listdir(SRC):
    if name in KEEP:
        continue
    s, d = os.path.join(SRC, name), os.path.join(dst, name)
    shutil.copytree(s, d) if os.path.isdir(s) else shutil.copy2(s, d)
run = lambda *a: subprocess.run(['git', '-C', dst, *a], capture_output=True, text=True)
run('add', '-A')
if run('diff', '--cached', '--quiet').returncode == 0:
    print('노트 저장소: 변경 없음')
else:
    r = run('-c', 'user.name=Mini', '-c', 'user.email=seum8660@gmail.com', 'commit', '-qm', '치트키 노트 갱신')
    print('노트 저장소: 커밋 완료 — push 필요' if r.returncode == 0 else r.stderr)
