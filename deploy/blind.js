// 임시 블라인드 (교육시설과 · 시설과-문서번호 · 감사관) — 공개 시 이 파일 참조만 제거
(function(){
  var re=/교육시설과|시설과(?=-)|감사관/g;
  function blindNode(tn){
    var t=tn.nodeValue;
    if(!t || !/교육시설과|시설과-|감사관/.test(t)) return;
    var p=tn.parentNode;
    if(!p) return;
    if(p.closest && p.closest('.blind-skip')) return;
    if(p.classList && p.classList.contains('blinded')) return;
    var frag=document.createDocumentFragment(), last=0, m;
    re.lastIndex=0;
    while((m=re.exec(t))){
      if(m.index>last) frag.appendChild(document.createTextNode(t.slice(last,m.index)));
      var s=document.createElement('span');
      s.className='blinded';
      s.textContent=m[0];
      s.style.cssText='background:currentColor;color:transparent;border-radius:3px;filter:blur(.5px);user-select:none';
      s.title='비공개';
      frag.appendChild(s);
      last=m.index+m[0].length;
    }
    if(last<t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    p.replaceChild(frag,tn);
  }
  function walk(root){
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
    var list=[],n;
    while((n=w.nextNode())) list.push(n);
    list.forEach(blindNode);
  }
  function run(){
    walk(document.body);
    new MutationObserver(function(muts){
      muts.forEach(function(mu){
        Array.prototype.forEach.call(mu.addedNodes,function(nd){
          if(nd.nodeType===3) blindNode(nd);
          else if(nd.nodeType===1) walk(nd);
        });
      });
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState!=='loading') run();
  else document.addEventListener('DOMContentLoaded',run);
})();
