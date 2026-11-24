/* 「학교시설 치트키」 책 발간 알림 팝업 — index.html·intro.html·bible.html 공용
   - 하루 동안 보지 않기: localStorage(bookPopupHide = YYYY-MM-DD)
   - 책 파일: book/ 폴더(HTML). PDF 내려받기는 미니님 요청으로 막아 둠(버튼만 「준비 중」), EPUB은 사이트 용량 때문에 올리지 않음 */
(function(){
  var KEY='bookPopupHide';
  var BOOK='book/학교시설_치트키_전자책_20261124.html';
  var IMG='assets/학교시설_치트키_발간홍보_20261124.jpg';

  function today(){var d=new Date(),p=function(n){return String(n).padStart(2,'0');};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
  function hidden(){try{return localStorage.getItem(KEY)===today();}catch(e){return false;}}

  var css=''
  +'#bkPop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(17,20,24,.55);backdrop-filter:blur(3px);font-family:Pretendard,"Malgun Gothic","Apple SD Gothic Neo",sans-serif;word-break:keep-all}'
  +'#bkPop .bk{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#1e2124;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.35)}'
  +'#bkPop .bk-img{display:block;width:100%;height:auto;border-radius:16px 16px 0 0;background:#f3f5f2}'
  +'#bkPop .bk-b{padding:20px 22px 6px}'
  +'#bkPop .bk-tag{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.06em;color:#137a2c;background:#e8f6ea;border-radius:100px;padding:4px 11px}'
  +'#bkPop h2{margin:10px 0 6px;font-size:21px;line-height:1.35;font-weight:800;letter-spacing:-.01em;color:#1e2124}'
  +'#bkPop p{margin:0;font-size:14.5px;line-height:1.7;color:#464c53}'
  +'#bkPop .bk-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}'
  +'#bkPop .bk-btns a{flex:1 1 150px;text-align:center;text-decoration:none;font-size:14.5px;font-weight:700;border-radius:10px;padding:12px 14px;border:1px solid #cdd1d5;color:#1e2124;background:#fff}'
  +'#bkPop .bk-btns a.p{background:#137a2c;border-color:#137a2c;color:#fff}'
  +'#bkPop .bk-btns a:hover{filter:brightness(.96)}'
  +'#bkPop .bk-btns a.off{color:#8a949e;background:#f4f5f6;border-color:#e6e8ea;cursor:not-allowed;filter:none}'
  +'#bkPop .bk-btns small{display:block;font-size:11.5px;font-weight:500;opacity:.75;margin-top:2px}'
  +'#bkPop .bk-f{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 22px 16px;margin-top:14px;border-top:1px solid #e6e8ea;font-size:13.5px}'
  +'#bkPop .bk-f label{display:flex;align-items:center;gap:6px;color:#6d7882;cursor:pointer}'
  +'#bkPop .bk-f button{font:inherit;font-weight:700;border:0;background:#f4f5f6;color:#1e2124;border-radius:8px;padding:8px 16px;cursor:pointer}'
  +'@media(max-width:520px){#bkPop h2{font-size:18px}#bkPop .bk-b{padding:16px 16px 4px}#bkPop .bk-f{padding:12px 16px 14px}}';

  function show(){
    if(document.getElementById('bkPop')) return;
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var w=document.createElement('div'); w.id='bkPop'; w.setAttribute('role','dialog'); w.setAttribute('aria-modal','true'); w.setAttribute('aria-label','학교시설 치트키 책 발간 안내');
    w.innerHTML=''
    +'<div class="bk">'
    +  '<a href="'+BOOK+'" target="_blank" rel="noopener"><img class="bk-img" src="'+IMG+'" alt="학교시설 치트키 — 학교시설 담당자가 꼭 아는 실무의 지름길"></a>'
    +  '<div class="bk-b">'
    +    '<span class="bk-tag">새 책 발간</span>'
    +    '<h2>「학교시설 치트키」 책이 나왔습니다</h2>'
    +    '<p>기획·설계·시공부터 감리·준공·안전점검·계약·인허가까지, 학교시설 업무 81개를 8부로 정리했습니다. 처음 맡은 업무도 이 책 한 권으로 시작하실 수 있습니다.</p>'
    +    '<div class="bk-btns">'
    +      '<a class="p" href="'+BOOK+'" target="_blank" rel="noopener">바로 읽기<small>브라우저에서 열기</small></a>'
    +      '<a href="#" class="off" aria-disabled="true" onclick="return false">PDF 내려받기<small>준비 중</small></a>'
    +    '</div>'
    +  '</div>'
    +  '<div class="bk-f"><label><input type="checkbox" id="bkHide"> 오늘 하루 보지 않기</label><button type="button" id="bkX">닫기</button></div>'
    +'</div>';
    document.body.appendChild(w);
    function close(){
      var c=document.getElementById('bkHide');
      if(c&&c.checked){try{localStorage.setItem(KEY,today());}catch(e){}}
      w.remove(); document.removeEventListener('keydown',esc);
    }
    function esc(e){if(e.key==='Escape')close();}
    document.getElementById('bkX').addEventListener('click',close);
    w.addEventListener('click',function(e){if(e.target===w)close();});
    document.addEventListener('keydown',esc);
  }
  window.openBookPopup=show;
  if(hidden()) return;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',show); else show();
})();
