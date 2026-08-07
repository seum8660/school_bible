/* 준공정산 서식 내보내기 (ExcelJS) — 표지·동의서·원가계산서·요율표·사후정산 총괄·검토서 6종 */
(function (root) {
'use strict';

/* 공사기간 산정서(2026 가이드라인) 서식 팔레트 */
const NAVY='FF1A1A1A', SUBBAR='FFBFBFBF', LABEL='FFF2F2F2', TOTAL='FFD9D9D9', SUBT='FFFAFAFA';
const INK='FF1A1A1A', CAP='FF6B7280', CAP2='FF8B95A1', WHITE='FFFFFFFF';
const NEG='FFD00000', KEY='FFD00000', INPUT='FFFFF8DB', LINE2='FFD9D9D9';
const FONT='맑은 고딕';
const WON='#,##0';

const thin={style:'thin',color:{argb:LINE2}};
const border={top:thin,left:thin,bottom:thin,right:thin};
function fill(argb){return {type:'pattern',pattern:'solid',fgColor:{argb}};}

function st(cell,o){
  o=o||{};
  cell.font={name:FONT, size:o.size||10, bold:!!o.bold, color:{argb:o.color||(o.head?WHITE:INK)}};
  if(o.fill) cell.fill=fill(o.fill);
  else if(o.head) cell.fill=fill(NAVY);
  cell.alignment={vertical:'middle', horizontal:o.align||'left', wrapText:o.wrap!==false};
  if(o.border!==false) cell.border=border;
  if(o.fmt) cell.numFmt=o.fmt;
}
function sectionBar(ws,row,text,ncol){
  ws.mergeCells(row,1,row,ncol);
  const c=ws.getCell(row,1);
  st(c,{bold:true,size:11,align:'left',fill:SUBBAR,color:INK});
  c.value='  '+text;
  ws.getRow(row).height=20;
}
function pageSetup(B,opt){
  return Object.assign({paperSize:9, orientation:B.landscape?'landscape':'portrait',
    fitToPage:true, fitToWidth:1, fitToHeight:0,
    margins:{left:0.5906,right:0.5906,top:0.5906,bottom:0.5906,header:0.1969,footer:0.1969}}, opt||{});
}
function footer(ws,B){
  ws.headerFooter={oddFooter:'&L&9'+(B.name||'')+'&R&9'+(B.today||'')+'   &P / &N'};
}
function titleBars(ws,B,title,NC,size){
  ws.mergeCells(1,1,1,NC);
  const t=ws.getCell(1,1); t.value=title;
  st(t,{head:true,bold:true,size:size||13,align:'center'}); ws.getRow(1).height=26;
  ws.mergeCells(2,1,2,NC);
  const s=ws.getCell(2,1); s.value='  공사명 : '+(B.name||'');
  st(s,{fill:SUBBAR,color:INK,bold:true,size:9,align:'left'}); ws.getRow(2).height=16;
}

/* ── 표지 ─────────────────────────────────────────────── */
function buildCover(wb,B){
  const ws=wb.addWorksheet('표지',{
    pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1,
      margins:{left:0.5906,right:0.5906,top:0.5906,bottom:0.5906,header:0.1969,footer:0.1969}},
    views:[{showGridLines:false}]});
  ws.columns=[{width:3.4},{width:16},{width:14},{width:14},{width:18},{width:16},{width:14},{width:14},{width:3.4}];
  ws.getRow(2).height=40; ws.getRow(3).height=16;
  ws.mergeCells('B3:H3');
  const sub=ws.getCell('B3');
  sub.value='「지방자치단체를 당사자로 하는 계약에 관한 법률」 및 같은 법 시행령·시행규칙에 따라 작성';
  st(sub,{size:9,color:CAP,align:'left',border:false});
  ws.getRow(4).height=8;
  ws.mergeCells('B5:H6');
  const t=ws.getCell('B5'); t.value='준공정산 검토 보고서';
  st(t,{head:true,bold:true,size:28,align:'center',border:false});
  ws.getRow(5).height=30; ws.getRow(6).height=30; ws.getRow(7).height=10;
  ws.mergeCells('B9:H9');
  const pn=ws.getCell('B9'); pn.value=B.name||'';
  st(pn,{bold:true,size:20,color:INK,align:'center',border:false}); ws.getRow(9).height=30;
  ws.mergeCells('B11:H11');
  const div=ws.getCell('B11');
  div.value='  |  '+(B.hasChange?((B.changeStage||'')+'차 설계변경 · 준공정산'):'준공정산');
  st(div,{size:11,color:CAP,align:'center',border:false}); ws.getRow(12).height=16;
  const info=[['발주기관',B.org||''],['시공사',B.vendor||''],['계약일자',B.cdate||''],
    ['착공일자',B.sdate||''],['준공(예정)일자',B.edate||''],
    ['착공 도급액(원)',B.start!=null?B.start:''],['준공 정산액(원)',B.grand!=null?B.grand:''],
    ['증감액(원)',(B.grand!=null&&B.start!=null)?B.grand-B.start:'']];
  let r=14;
  const infoRow={};
  info.forEach(([k,v])=>{
    ws.mergeCells(r,2,r,4); ws.mergeCells(r,5,r,8);
    const kc=ws.getCell(r,2), vc=ws.getCell(r,5);
    kc.value=k; st(kc,{bold:true,color:INK,fill:LABEL,align:'center'});
    vc.value=v; infoRow[k]=r;
    if(k.includes('금액')||k.includes('도급액')) st(vc,{bold:true,size:13,color:KEY,align:'left',fmt:WON});
    else st(vc,{align:'left'});
    ws.getRow(r).height=22; r++;
  });
  if(infoRow['증감액(원)']&&infoRow['착공 도급액(원)']&&infoRow['준공 정산액(원)'])
    ws.getCell(infoRow['증감액(원)'],5).value={formula:'E'+infoRow['준공 정산액(원)']+'-E'+infoRow['착공 도급액(원)']};
  r+=2; ws.mergeCells(r,2,r,8);
  const d=ws.getCell(r,2); d.value='작성일: '+(B.today||'')+(B.writer?'          작성자: '+B.writer:'');
  st(d,{size:12,color:'FF374151',align:'center',border:false});
  r+=4; ws.mergeCells(r,2,r,8);
  const cp=ws.getCell(r,2);
  cp.value='© '+(new Date().getFullYear())+' '+(B.org||'')+'.  본 문서의 무단 전재·복제를 금합니다.';
  st(cp,{size:9,color:CAP2,align:'center',border:false});
}


/* 금액 → 한글 (일금 ○○○원정) */
function hangulAmount(n){
  n=Math.round(Math.abs(n||0));
  if(!n) return '일금 영원정';
  const D=['','일','이','삼','사','오','육','칠','팔','구'];
  const S=['','십','백','천'];
  const B=['','만','억','조','경'];
  let out='', gi=0;
  while(n>0){
    const g=n%10000; n=Math.floor(n/10000);
    if(g){
      let gs='';
      String(g).split('').reverse().forEach((d,i)=>{
        const v=+d; if(!v) return;
        gs=(v===1&&i>0?'':D[v])+S[i]+gs;
      });
      out=gs+B[gi]+out;
    }
    gi++;
  }
  return '일금 '+out+'원정';
}
const DEFAULT_REASON='개인보호구 및 안전장구 구입비 등 중 미사용 항목 및 증빙서류 미비 항목을 제외';
const DEFAULT_CLAUSE='「지방자치단체를 당사자로 하는 계약에 관한 법률」 제22조 및 같은 법 시행령 제74조 4항 3호와 같은 법 시행규칙 제73조 1항 및 「지방자치단체 입찰 및 계약 집행기준」 제9장 6절-1-가-4)【그밖에 발주기관이 설계서를 변경할 필요가 있다고 인정할 경우 등】6절-5【발주기관의 필요에 따른 설계변경 통보】의 규정에 의해 설계변경(실정보고ㆍ지적사항 반영) 하고 상기 변경(정산)금액에 대해 일체 이의 없음을 동의합니다.';

/* 원가계산서 하단 정산 요약·서명란 */
function costFooterBlock(ws,B,r,NC){
  const start=B.start||0, grand=B.grand||0, chg=grand-start;
  const kv=(label,amount,extra)=>{
    const l=ws.getCell(r,1); l.value=label; st(l,{bold:true,align:'left',size:10,border:false});
    ws.mergeCells(r,2,r,3);
    const a=ws.getCell(r,2); a.value=(amount<0?'(△₩':'(₩')+Math.abs(amount).toLocaleString('en-US')+')';
    st(a,{bold:true,align:'right',size:10,color:amount<0?NEG:INK,border:false});
    ws.mergeCells(r,4,r,NC);
    const w=ws.getCell(r,4); w.value=(amount<0?'△ ':'')+hangulAmount(amount)+(extra?'   '+extra:'');
    st(w,{align:'left',size:10,border:false});
    ws.getRow(r).height=19; r++;
  };
  r++;
  sectionBar(ws,r,'정산 요약',NC); r++;
  const nm=ws.getCell(r,1); nm.value='1. 공  사  명'; st(nm,{bold:true,align:'left',size:10,border:false});
  ws.mergeCells(r,2,r,NC);
  const nv=ws.getCell(r,2); nv.value=B.name||''; st(nv,{align:'left',size:10,border:false});
  ws.getRow(r).height=19; r++;
  kv('2. 계 약 금 액',start);
  kv('3. 정 산 금 액',grand);
  kv('4. 증  감  액',chg);
  const rl=ws.getCell(r,1); rl.value='5. 정 산 사 유'; st(rl,{bold:true,align:'left',size:10,border:false});
  ws.mergeCells(r,2,r,NC);
  const rv=ws.getCell(r,2); rv.value=B.reason||DEFAULT_REASON; st(rv,{align:'left',size:10,border:false});
  ws.getRow(r).height=19; r+=2;
  ws.mergeCells(r,1,r+2,NC);
  const cl=ws.getCell(r,1); cl.value=B.clause||DEFAULT_CLAUSE;
  st(cl,{align:'left',size:9.5,border:false}); ws.getRow(r).height=20; r+=4;
  ws.mergeCells(r,1,r,NC);
  const dt=ws.getCell(r,1); dt.value=B.signDate||(B.today||'');
  st(dt,{align:'center',size:11,border:false}); ws.getRow(r).height=24; r+=2;
  const put=(label,val,bold)=>{
    const l=ws.getCell(r,2); l.value=label; st(l,{bold:true,align:'right',size:10,border:false});
    ws.mergeCells(r,3,r,NC);
    const v=ws.getCell(r,3); v.value=val; st(v,{align:'left',size:10,bold:!!bold,border:false});
    ws.getRow(r).height=20; r++;
  };
  put('주  소 :',B.vaddr||'');
  put('상  호 :',B.vendor||'',true);
  put('성  명 :',(B.vrep||'')+'          (인)');
  r++;
  ws.mergeCells(r,1,r,NC);
  const wr=ws.getCell(r,1);
  wr.value='작성자: '+(B.writerRank?B.writerRank+' ':'')+(B.writer||'')+'          (인)';
  st(wr,{align:'right',size:10,border:false}); ws.getRow(r).height=22;
  return r;
}

/* ── 원가계산서(정산) ─────────────────────────────────── */
function buildCostSheet(wb,B,rows){
  const ws=wb.addWorksheet('원가계산서(정산)',{pageSetup:pageSetup(B),views:[{showGridLines:false}]});
  ws.columns=[{width:26},{width:9},{width:15},{width:15},{width:13},{width:28}];
  const NC=6;
  titleBars(ws,B,'공사원가계산서 (준공 정산)',NC);
  footer(ws,B);
  const H=['비        목','요율','착　공','준　공','증감액','산출근거'];
  H.forEach((h,i)=>{const c=ws.getCell(3,i+1);c.value=h;st(c,{bold:true,size:10,align:i===0?'left':'center',fill:SUBBAR,color:INK});});
  ws.getRow(3).height=22;
  ws.pageSetup.printTitlesRow='1:3';
  let r=4;
  let sec=[];              // 현재 구간의 항목 행(부산물 제외)
  const subs=[], keyRow={};
  rows.forEach(row=>{
    if(row.kind==='section'){ sectionBar(ws,r,row.name,NC); sec=[]; r++; return; }
    const isT=row.kind==='total', isS=row.kind==='sub';
    const bg=isT?TOTAL:(isS?SUBT:undefined);
    const nameC=ws.getCell(r,1); nameC.value=row.name; st(nameC,{bold:isT||isS,align:'left',fill:bg});
    const rateC=ws.getCell(r,2); rateC.value=(row.rate!=null?row.rate:null);
    st(rateC,{align:'center',size:9,fill:bg,color:CAP,fmt:'0.000%'});
    const startC=ws.getCell(r,3), setC=ws.getCell(r,4);
    startC.value=row.start; setC.value=row.settle;

    // 자동수식 — 소계·계·부가세·총합계액·증감액
    if(isS && sec.length){
      startC.value={formula: sec.map(n=>'C'+n).join('+')};
      setC.value={formula: sec.map(n=>'D'+n).join('+')};
      subs.push(r);
    } else if(isT && subs.length && /^계/.test(row.name)){
      startC.value={formula: subs.map(n=>'C'+n).join('+')};
      setC.value={formula: subs.map(n=>'D'+n).join('+')};
    } else if(row.name.indexOf('부가가치세')>=0 && keyRow.sup){
      startC.value={formula:'ROUND(C'+keyRow.sup+'*0.1,0)'};
      setC.value={formula:'ROUND(D'+keyRow.sup+'*0.1,0)'};
      keyRow.vat=r;
    } else if(row.name.indexOf('총합계액')>=0 && keyRow.sup && keyRow.vat){
      const g=keyRow.gov;
      const f=c=>'ROUNDDOWN('+c+keyRow.sup+'+'+c+keyRow.vat+(g?('+'+c+g):'')+',-3)';
      startC.value={formula:f('C')}; setC.value={formula:f('D')};
    } else if(!isS && !isT){
      if(row.name.indexOf('공급가액')>=0) keyRow.sup=r;
      else if(row.name.indexOf('관급')>=0) keyRow.gov=r;
      else if(row.name.indexOf('부산물')<0) sec.push(r);
    }
    st(startC,{bold:isT||isS,align:'right',fmt:WON,fill:bg});
    st(setC,{bold:isT||isS,align:'right',fmt:WON,color:isT?KEY:INK,fill:bg});
    const chg=(row.settle!=null&&row.start!=null)?row.settle-row.start:null;
    const chgC=ws.getCell(r,5);
    chgC.value=(row.settle!=null&&row.start!=null)?{formula:'D'+r+'-C'+r}:null;
    st(chgC,{bold:isT||isS,align:'right',fmt:WON,color:chg<0?NEG:INK,fill:bg});
    const noteC=ws.getCell(r,6); noteC.value=row.note||''; st(noteC,{size:8,color:CAP,align:'left',fill:bg});
    ws.getRow(r).height=18; r++;
  });
  costFooterBlock(ws,B,r,NC);
}

/* ── 제비율 대비표 ────────────────────────────────────── */
function buildRateSheet(wb,B,rates){
  const ws=wb.addWorksheet('제비율 대비표',{pageSetup:pageSetup(B,{orientation:'portrait'}),views:[{showGridLines:false}]});
  ws.columns=[{width:28},{width:24},{width:13},{width:13},{width:11}];
  const NC=5;
  titleBars(ws,B,'제비율 대비표 (설계 → 계약)',NC,12);
  footer(ws,B);
  const H=['요율 항목','산정 기준','설계 요율','계약(착공) 요율','증감'];
  H.forEach((h,i)=>{const c=ws.getCell(3,i+1);c.value=h;st(c,{bold:true,size:10,align:i<2?'left':'center',fill:SUBBAR,color:INK});});
  ws.getRow(3).height=20;
  let r=4;
  rates.forEach(x=>{
    const diff=(x.contract!=null&&x.design!=null)?x.contract-x.design:null;
    const cells=[x.label,x.base,x.design,x.contract,diff];
    cells.forEach((v,i)=>{const c=ws.getCell(r,i+1);c.value=v;
      st(c,{align:i<2?'left':'right',size:9.5,
        fmt:i>=2?'0.000%':undefined, bold:i===3,
        color:(i===4&&diff&&diff<0)?NEG:INK});});
    ws.getRow(r).height=17; r++;
  });
  r++;
  sectionBar(ws,r,'비고',NC); r++;
  ws.mergeCells(r,1,r,NC);
  const g=ws.getCell(r,1);
  g.value='설계 요율은 설계 원가계산서에서 역산한 값이며, 계약 요율은 착공(계약) 시점에 적용된 요율입니다. 증감이 0인 항목은 설계 요율을 그대로 유지한 항목입니다.';
  st(g,{size:9,align:'left'}); ws.getRow(r).height=30;
}

/* ── 사후정산 총괄표 ──────────────────────────────────── */
function buildOverviewSheet(wb,B,ov){
  const ws=wb.addWorksheet('사후정산 총괄',{pageSetup:pageSetup(B,{orientation:'portrait'}),views:[{showGridLines:false}]});
  ws.columns=[{width:4},{width:28},{width:15},{width:15},{width:15},{width:13},{width:10}];
  const NC=7;
  titleBars(ws,B,'사후정산 총괄표',NC,12);
  footer(ws,B);
  const H=['No','정산 항목','계상액','시공사 제출액','감독자 검토액','증감액','검토'];
  H.forEach((h,i)=>{const c=ws.getCell(3,i+1);c.value=h;st(c,{bold:true,size:10,align:i===1?'left':'center',fill:SUBBAR,color:INK});});
  ws.getRow(3).height=20;
  let r=4, tc=0, ts=0, ta=0, firstR=4;
  ov.forEach((x,i)=>{
    tc+=x.calc; ts+=x.submit; ta+=x.admit;
    const cells=[i+1,x.title,x.calc,x.submit,x.admit,x.chg,x.filled?'검토완료':'미입력'];
    cells.forEach((v,ci)=>{const c=ws.getCell(r,ci+1);c.value=(ci===5)?{formula:'E'+r+'-C'+r}:v;
      st(c,{align:ci===1?'left':(ci===0||ci===6?'center':'right'),size:9.5,
        fmt:(ci>=2&&ci<=5)?WON:undefined,
        color:(ci===5&&x.chg<0)?NEG:(ci===6&&!x.filled?CAP:INK)});});
    ws.getRow(r).height=18; r++;
  });
  const lastR=r-1;
  ws.mergeCells(r,1,r,2);
  const l=ws.getCell(r,1); l.value='합  계'; st(l,{bold:true,fill:TOTAL,align:'center'});
  ['C','D','E','F'].forEach((col,i)=>{const c=ws.getCell(r,i+3);
    c.value=(lastR>=firstR)?{formula:'SUM('+col+firstR+':'+col+lastR+')'}:0;
    st(c,{bold:true,fill:TOTAL,align:'right',fmt:WON,color:(i===3&&(ta-tc)<0)?NEG:KEY});});
  st(ws.getCell(r,7),{fill:TOTAL}); ws.getRow(r).height=20; r+=2;
  sectionBar(ws,r,'정산 원칙',NC); r++;
  ws.mergeCells(r,1,r,NC);
  const g=ws.getCell(r,1);
  g.value='① 사후정산 대상 비목은 계상액을 상한으로 하여 실제 사용·납부액 범위에서 정산한다.  '+
    '② 건강·연금·장기요양보험료는 납부확인서상 사업자(사용자) 부담분을 기준으로 정산한다(세부 근거는 항목별 검토서 참조).  '+
    '③ 산업안전보건관리비·환경보전비는 항목별 사용내역 검토서에 따른 검토금액으로 정산한다.';
  st(g,{size:9,align:'left'}); ws.getRow(r).height=44;
}

/* ── 사후정산 검토서 ──────────────────────────────────── */
function buildSettleSheet(wb,B,def){
  const ws=wb.addWorksheet(def.title.slice(0,28),{pageSetup:pageSetup(B),views:[{showGridLines:false}]});
  if(def.mode==='itemized') ws.columns=[{width:30},{width:22},{width:6},{width:11},{width:11},{width:13},{width:11},{width:13}];
  else ws.columns=[{width:28.5},{width:14},{width:15},{width:13},{width:15},{width:13},{width:2},{width:2}];
  const NC=def.mode==='itemized'?8:(def.mode==='cmpRate'?6:5);
  titleBars(ws,B,def.title+' 사용내역 검토서',NC,12);
  footer(ws,B);
  let r=4;

  if(def.mode==='itemized'){
    sectionBar(ws,r,'정산 요약',NC); r++;
    [['계상액',def.calc],['시공사 제출액',def.submit],['감독자 검토액',def.admit],['증감액',def.admit-def.calc]]
      .forEach(([k,v],i)=>{
        const kc=ws.getCell(r,i*2+1); kc.value=k; st(kc,{bold:true,fill:LABEL,color:INK,align:'center',size:9});
        const vc=ws.getCell(r,i*2+2); vc.value=(i===3)?{formula:'F'+r+'-B'+r}:v;
        st(vc,{bold:true,align:'right',fmt:WON,color:(k==='증감액'&&v<0)?NEG:INK});
      });
    ws.getRow(r).height=20; r+=2;
    const H=['항목','세부품목','단위','단가','제출수량','제출금액','검토수량','검토금액'];
    H.forEach((h,i)=>{const c=ws.getCell(r,i+1);c.value=h;st(c,{bold:true,size:9,align:i<2?'left':'center',fill:SUBBAR,color:INK});});
    ws.getRow(r).height=20; ws.pageSetup.printTitlesRow='1:'+r; r++;
    const bodyStart=r;
    def.cats.forEach((cat,ci)=>{
      const items=(def.items||[]).filter(x=>x.cat===ci);
      const catH=Math.max(25,13*Math.ceil(cat.length/13));
      if(!items.length){
        const vals=[cat,'','',0,0,0,0,0];
        vals.forEach((v,i)=>{const c=ws.getCell(r,i+1);c.value=v;
          st(c,{align:(i<2)?'left':(i===2?'center':'right'),size:9,bold:(i===0),color:(i>=3?CAP:INK),
            fmt:(i>=3&&i!==4&&i!==6)?WON:((i===4||i===6)?'#,##0.###':undefined)});});
        ws.getRow(r).height=catH; r++;
      }else{
        items.forEach((x,xi)=>{
          const sq=x.subQty!=null?x.subQty:(x.qty||0);
          const vals=[xi===0?cat:'', x.name||'', x.unit||'', x.price||0, sq, (x.price||0)*sq, x.qty||0, (x.price||0)*(x.qty||0)];
          vals.forEach((v,i)=>{const c=ws.getCell(r,i+1);
            c.value=(i===5)?{formula:'D'+r+'*E'+r}:((i===7)?{formula:'D'+r+'*G'+r}:v);
            st(c,{align:(i<2)?'left':(i===2?'center':'right'),size:9,bold:(i===0),
              fmt:(i>=3&&i!==4&&i!==6)?WON:((i===4||i===6)?'#,##0.###':undefined)});});
          ws.getRow(r).height=(xi===0?catH:25); r++;
        });
      }
    });
    const bodyEnd=r-1;
    ws.mergeCells(r,1,r,5);
    const tc=ws.getCell(r,1); tc.value='합  계'; st(tc,{bold:true,fill:TOTAL,align:'center'});
    ws.getCell(r,6).value={formula:'SUM(F'+bodyStart+':F'+bodyEnd+')'};
    st(ws.getCell(r,6),{bold:true,fill:TOTAL,align:'right',fmt:WON});
    st(ws.getCell(r,7),{fill:TOTAL});
    ws.getCell(r,8).value={formula:'SUM(H'+bodyStart+':H'+bodyEnd+')'};
    st(ws.getCell(r,8),{bold:true,fill:TOTAL,align:'right',fmt:WON,color:KEY});
    ws.getRow(r).height=20; r++;
  }else{
    const rate=def.mode==='cmpRate';
    const H=rate?['항목','계상액','시공사 제출액','검토율','감독자 검토액','증감']
                :['항목','계상액','시공사 제출액','감독자 검토액','증감'];
    H.forEach((h,i)=>{const c=ws.getCell(r,i+1);c.value=h;st(c,{bold:true,size:10,align:i===0?'left':'center',fill:SUBBAR,color:INK});});
    ws.getRow(r).height=20; r++;
    let sc=0,ss=0,sa=0;
    const firstR=r;
    def.rows.forEach(row=>{
      const chg=row.admit-row.calc; sc+=row.calc; ss+=row.submit; sa+=row.admit;
      const admitCol=rate?'E':'D';
      const cells=rate?[row.label,row.calc,row.submit,row.rate,row.admit,chg]
                      :[row.label,row.calc,row.submit,row.admit,chg];
      cells.forEach((v,i)=>{const c=ws.getCell(r,i+1);
        const isChg=(i===cells.length-1);
        c.value=isChg?{formula:admitCol+r+'-B'+r}:v;
        st(c,{align:i===0?'left':'right',fmt:(i===0||(rate&&i===3))?undefined:WON,color:(isChg&&chg<0)?NEG:INK});
        if(rate&&i===3){c.numFmt='0%';c.alignment={horizontal:'center',vertical:'middle'};}
      });
      ws.getRow(r).height=18; r++;
    });
    if(def.rows.length>1){
      const lastR=r-1;
      const sumF=col=>({formula:'SUM('+col+firstR+':'+col+lastR+')'});
      const cells=rate?['합  계',sumF('B'),sumF('C'),null,sumF('E'),sumF('F')]
                      :['합  계',sumF('B'),sumF('C'),sumF('D'),sumF('E')];
      cells.forEach((v,i)=>{const c=ws.getCell(r,i+1);c.value=v;
        st(c,{bold:true,fill:TOTAL,align:i===0?'center':'right',fmt:(i===0||(rate&&i===3))?undefined:WON,
          color:(i===cells.length-1&&(sa-sc)<0)?NEG:KEY});});
      ws.getRow(r).height=20; r++;
    }
  }
  r++;
  sectionBar(ws,r,'관련기준',NC); r++;
  ws.mergeCells(r,1,r,NC);
  const g=ws.getCell(r,1); g.value=def.note||'';
  st(g,{size:9,align:'left'});
  ws.getRow(r).height=Math.max(18,15*(def.note||'').split('\n').length);
}

/* ── 준공정산 동의서 ──────────────────────────────────── */
function buildAgree(wb,B){
  const ws=wb.addWorksheet('준공정산동의서',{
    pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1,
      margins:{left:0.5906,right:0.5906,top:0.5906,bottom:0.5906,header:0.1969,footer:0.1969}},
    views:[{showGridLines:false}]});
  ws.columns=[{width:4},{width:20},{width:26},{width:18},{width:26}];
  ws.mergeCells('B2:E2');
  const t=ws.getCell('B2'); t.value='설계변경(준공정산) 동의서';
  st(t,{bold:true,size:18,color:INK,align:'center',border:false}); ws.getRow(2).height=34;
  const kv=(row,label,val,num)=>{
    const k=ws.getCell(row,2); k.value=label; st(k,{bold:true,align:'left',border:false});
    ws.mergeCells(row,3,row,5);
    const v=ws.getCell(row,3); v.value=val; st(v,{align:'left',border:false,fmt:num?WON:undefined});
    ws.getRow(row).height=22;
  };
  kv(4,'1. 공 사 명',B.name||'');
  kv(5,'2. 착 공 액',B.start!=null?B.start:'',true);
  kv(6,'3. 준공(정산)금액',B.grand!=null?B.grand:'',true);
  kv(7,'4. 증  감  액',(B.grand!=null&&B.start!=null)?{formula:'C6-C5'}:'',true);
  kv(8,'5. 계 약 일',B.cdate||'');
  kv(9,'6. 착 공 일',B.sdate||'');
  kv(10,'7. 준공예정일',B.edate||'');
  ws.mergeCells('B12:E15');
  const body=ws.getCell('B12');
  body.value='「지방자치단체를 당사자로 하는 계약에 관한 법률」 제22조 및 같은 법 시행령·시행규칙, '+
    '「지방자치단체 입찰 및 계약 집행기준」의 규정에 따라 설계변경(준공정산)하고, '+
    '상기 변경(정산)금액에 대하여 일체 이의 없음을 동의합니다.';
  st(body,{align:'left',border:false});
  const dt=ws.getCell('C17'); dt.value='20      .        .        .'; st(dt,{align:'center',border:false});
  const put=(row,label,val)=>{const l=ws.getCell(row,3);l.value=label;st(l,{bold:true,align:'left',border:false});
    const v=ws.getCell(row,4);v.value=val;st(v,{align:'left',border:false});};
  put(19,'주 소 :',B.vaddr||''); put(20,'상 호 :',B.vendor||''); put(21,'대 표 :','(인)');
  ws.mergeCells('B24:E24');
  const to=ws.getCell('B24'); to.value=(B.org||'')+' 재무관 귀하';
  st(to,{bold:true,align:'center',border:false});
}

function buildWorkbook(payload){
  const ExcelJS=root.ExcelJS||(typeof require!=='undefined'&&require('exceljs'));
  const wb=new ExcelJS.Workbook();
  wb.creator='준공정산 대시보드';
  const B=payload.basic;
  buildCover(wb,B);
  buildAgree(wb,B);
  buildCostSheet(wb,B,payload.costRows);
  if(payload.overview&&payload.overview.length) buildOverviewSheet(wb,B,payload.overview);
  payload.settleSheets.forEach(d=>buildSettleSheet(wb,B,d));
  return wb;
}

const api={buildWorkbook};
if(typeof module!=='undefined'&&module.exports) module.exports=api;
else root.SettleExport=api;
})(typeof window!=='undefined'?window:globalThis);
