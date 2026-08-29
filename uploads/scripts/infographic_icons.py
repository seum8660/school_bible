# viewBox 0 0 24 24 stroke 아이콘 라이브러리
I = {
 'doccheck':'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 13l2 2 4-4"/>',
 'doclines':'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h6M10 15h6M10 9h3"/>',
 'list':'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.1"/><circle cx="4.5" cy="12" r="1.1"/><circle cx="4.5" cy="18" r="1.1"/>',
 'refresh':'<path d="M19 9a7 7 0 0 0-12-2.5M6 6.5v3.5h3.5"/><path d="M5 15a7 7 0 0 0 12 2.5M18 17.5V14h-3.5"/>',
 'search':'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
 'pin':'<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>',
 'flask':'<path d="M9 3h6M10 3v6l-5 8.5A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-3.5L14 9V3"/><path d="M7.5 15h9"/>',
 'crane':'<path d="M5 21V4h14"/><path d="M5 4l14 4"/><path d="M14 8v3"/><rect x="12.5" y="14" width="3" height="3"/><path d="M4 21h5"/>',
 'wrench':'<path d="M14.5 4.5a4 4 0 0 0-5.2 5.2l-5.3 5.3 2.5 2.5 5.3-5.3a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.1-.4-.4-2.1z"/>',
 'grid':'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16M4 15h16M10 4v16M15 4v16"/>',
 'hammer':'<path d="M14 4l6 6-2 2-6-6z"/><path d="M12 8l-8 8 2 2 8-8"/>',
 'layers':'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
 'shield':'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
 'prop':'<path d="M5 4v16M19 4v16"/><path d="M5 8l14 8M5 16l14-8"/>',
 'clip':'<rect x="6" y="4" width="12" height="17" rx="1.5"/><path d="M9 4V3h6v1"/><path d="M9 12l2 2 4-4"/>',
 'helmet':'<path d="M4 16a8 8 0 0 1 16 0z"/><path d="M3 16h18v2H3z"/><path d="M9 8a3 3 0 0 1 6 0v1"/>',
 'walk':'<circle cx="13" cy="4" r="2"/><path d="M13 7l-3 5 3 2 1 6M13 12l3-1M10 12l-2 6"/>',
 'leaf':'<path d="M5 19C5 11 11 5 20 5c0 8-6 14-15 14z"/><path d="M5 19c3-5 7-8 11-9"/>',
 'truck':'<path d="M3 17V7h11v10M14 11h3.5L21 14v3h-6"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
 'burst':'<path d="M12 2l2.2 5.2L20 5l-2.2 5.5L23 12l-5.2 1.5L20 19l-5.8-2.2L12 22l-2.2-5.2L4 19l2.2-5.5L1 12l5.2-1.5L4 5l5.8 2.2z"/>',
 'school':'<path d="M3 21V10l9-5 9 5v11M3 21h18M9 21v-6h6v6M12 3v3"/>',
 'badge_ok':'<circle cx="12" cy="12" r="8.5"/><path d="M8 12l3 3 5-6"/>',
}
# 32개 배지 → 아이콘
MAP = ['doccheck','refresh','search','doclines','doclines','list',
       'pin','flask','crane','wrench','grid','list',
       'hammer','layers','shield','prop','clip','list',
       'helmet','walk','leaf','truck','burst','list',
       'school','search','shield','list',
       'clip','leaf','badge_ok','list']
def span(name, emph=False):
    cls='ic emph' if emph else 'ic'
    return '<span class="%s"><svg viewBox="0 0 24 24">%s</svg></span>'%(cls, I[name])

# ── 사용법 ─────────────────────────────────────────────
# 이모지 대신 SVG 아이콘 타일을 배지 앞에 넣는다("이모지는 촌스럽다" 피드백).
#   <span class="badge"><span class="ic"><svg viewBox="0 0 24 24">{paths}</svg></span>N · 제목</span>
# span(name)          → 일반(그라데이션 타일) 아이콘
# span(name, emph=True)→ emph 배지(다크 pill) 안의 반투명 타일용
# 배지 32개는 MAP 순서대로 매핑. 제목 아이콘은 tic 타일(I['school'] 등) 사용.
#
# ── 역할(책임 주체) 강조 rolebar ──────────────────────
PERSON = '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.3 2.6-5.5 5.5-5.5 2 0 3.8 1 4.8 2.6"/><path d="M15 13l2 2 4-4"/>'
def rolebar(text_html):
    """발주청·감독자 등 책임 주체 강조 콜아웃(앰버 바 + 인물 아이콘)."""
    return ('<div class="rolebar"><span class="ri"><svg viewBox="0 0 24 24">%s</svg></span>'
            '<span class="t">%s</span></div>' % (PERSON, text_html))
# 예) rolebar('<b>발주청 = 학교·교육청</b> — 해체공사 <b>발주·감독의 책임 주체</b>')
#     본문 역할어는 <span class="rolet">감리원</span> 처럼 앰버 볼드로 감싼다.
