(function(){try{
if(window.self!==window.top)return;
if(document.getElementById('omCloseBtn'))return;
var b=document.createElement('button');
b.id='omCloseBtn';b.type='button';b.setAttribute('aria-label','창 닫기');
b.innerHTML='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span style="font-size:12.5px;font-weight:600;letter-spacing:-.01em">닫기</span>';
b.style.cssText='position:fixed;top:12px;right:12px;z-index:99999;display:inline-flex;align-items:center;gap:5px;padding:8px 13px;border:1px solid #d9d8d4;border-radius:999px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#55524d;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.08);font-family:inherit';
b.addEventListener('click',function(){
  window.close();
  setTimeout(function(){
    if(!window.closed){
      if(history.length>1){history.back();}
      else{location.href='bible.html';}
    }
  },250);
});
function add(){document.body.appendChild(b);}
if(document.body)add();else document.addEventListener('DOMContentLoaded',add);
}catch(e){}})();
