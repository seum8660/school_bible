/* 워크플로우 보드 해시태그 사전 + 그래프 연결 데이터
   - WF_TAGS   : 보드 키 → 해시태그 배열
   - WF_BOARDNM  : 보드 키 → 보드 이름
   - WF_GRAPH  : 그래프 뷰(2D·3D)에 합칠 노드/링크
*/
var WF_BOARDNM={cycle:'프로세스(Process)',change:'설계변경',extend:'공기연장',cm:'감리방식',safety:'안전사고',permit:'인허가',evalx:'엔지니어링평가',pre:'사전기획 적정성검토',pubrev:'공공건축심의',contest:'설계공모 운영',bid:'설계 입찰공고',order:'설계용역 발주',audit:'일상감사',advis:'기술자문위원회',ve:'설계경제성검토(VE)',dfs:'설계안전성검토(DfS)',precert:'예비인증 신청',dseval:'설계용역 평가',safecert:'교육시설 안전인증',report:'실정보고',prefin:'예비준공검사',finish:'준공검사',demol:'해체계획서 작성·검토',indirect:'공기연장 간접공사비',fmsafe:'시설물 안전·유지관리',subcon:'건설공사 하도급 심사'};

var WF_TAGS={
  cycle:['전주기','사전기획','설계','발주','준공검사'],
  pre:['사전기획','적정성검토','교육시설안전원','그린스마트'],
  pubrev:['공공건축심의','건축서비스산업법','심의위원회'],
  contest:['설계공모','심사위원회','당선작'],
  bid:['입찰공고','협상에의한계약','제안서평가'],
  order:['설계용역','설계대가','과업지시서'],
  audit:['일상감사','감사관','계약심의'],
  advis:['기술자문위원회','공사기간산정','설계변경'],
  ve:['VE','설계경제성검토','건설기술진흥법'],
  dfs:['DfS','설계안전성검토','국토안전관리원'],
  precert:['예비인증','BF','ZEB','녹색건축'],
  dseval:['설계용역평가','건설엔지니어링','평가위원회'],
  cm:['건설사업관리','감리','감독권한대행','건설사업관리계획'],
  permit:['인허가','건축허가','사용승인','도시계획시설'],
  change:['설계변경','계약금액조정','실정보고'],
  extend:['공기연장','지체상금','계약기간변경'],
  report:['실정보고','현장여건','설계변경'],
  safety:['안전사고','중대재해','산업안전보건법'],
  prefin:['예비준공검사','시설물 인수인계'],
  finish:['준공검사','준공검사필증','사용승인'],
  evalx:['시공평가','건설엔지니어링','CSI'],
  safecert:['교육시설 안전인증','교육시설법','최우수등급'],
  demol:['해체계획서','해체공사','석면'],
  indirect:['간접공사비','공기연장','실비정산'],
  fmsafe:['시설물안전법','정기안전점검','제3종시설물'],
  subcon:['하도급','하도급심사','하도급율','부대입찰','건설산업기본법']
};

/* 보드 → 어느 단계(장)에 붙일지 */
var WF_PHASE={
  cycle:'root',pre:'phase:plan',pubrev:'phase:plan',contest:'phase:design',bid:'phase:design',
  order:'phase:design',audit:'phase:design',advis:'phase:design',ve:'phase:design',dfs:'phase:design',
  precert:'phase:design',dseval:'phase:design',cm:'phase:cm',permit:'phase:plan',change:'phase:const',
  extend:'phase:const',report:'phase:const',safety:'phase:const',prefin:'phase:comp',finish:'phase:comp',
  evalx:'phase:comp',safecert:'phase:comp',demol:'phase:const',indirect:'phase:const',fmsafe:'phase:comp',subcon:'phase:const'
};

window.WF_GRAPH=(function(){
  var WFC='#e8590c', nodes=[], links=[], seen={};
  nodes.push({id:'wf:hub',label:'워크플로우 보드',group:'wf',color:WFC,url:'워크플로우_통합보드.html'});
  links.push({source:'root',target:'wf:hub',kind:'wf'});
  Object.keys(WF_TAGS).forEach(function(k){
    var bid='wf:'+k;
    nodes.push({id:bid,label:WF_BOARDNM[k]||k,group:'wf',color:WFC,url:'워크플로우_통합보드.html#'+k,board:k});
    links.push({source:'wf:hub',target:bid,kind:'wf'});
    var ph=WF_PHASE[k];
    if(ph && ph!=='root') links.push({source:ph,target:bid,kind:'wf'});
    (WF_TAGS[k]||[]).forEach(function(t){
      var tid='wftag:'+t;
      if(!seen[t]){ seen[t]=1; nodes.push({id:tid,label:'#'+t,group:'tag',color:'#8a8580',tag:t}); }
      links.push({source:bid,target:tid,kind:'tag'});
    });
  });
  return {nodes:nodes,links:links};
})();
