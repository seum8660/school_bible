/* 준공정산 계산 코어 — DOM 비의존. 원본 대시보드의 계산 로직을 그대로 이식. */
(function (root) {
'use strict';

const ITEMS = [
  {key:'mat',   name:'직접재료비',   match:['직접재료비'], group:'재료'},
  {key:'imat',  name:'간접재료비',   match:['간접재료비'], group:'재료'},
  {key:'scrap', name:'작업설,부산물(△)', match:['작업부산물','작업설,부산물','작업설부산물','부산물(△)'], group:'재료'},
  {key:'lab',   name:'직접노무비',   match:['직접노무비'], group:'노무'},
  {key:'isle',  name:'도서할증률',   match:['도서할증률','도서할증'], group:'노무'},
  {key:'ilab',  name:'간접노무비',   match:['간접노무비'], group:'노무'},
  {key:'mach',  name:'기계경비',     match:['기계경비','기계 경비','중기경비','건설기계경비','기계손료','^경비'], group:'경비'},
  {key:'sanjae',name:'산재보험료',   match:['산재보험료','산업재해보상보험','산재보험'], group:'경비', settle:true, rule:'상한'},
  {key:'goyong',name:'고용보험료',   match:['고용보험료','고용보험'], group:'경비', settle:true, rule:'상한'},
  {key:'gun',   name:'국민건강보험료', match:['국민건강보험료','건강보험료','국민건강보험','건강보험'], group:'경비', settle:true, rule:'50'},
  {key:'yeon',  name:'국민연금보험료', match:['국민연금보험료','연금보험료','국민연금보험','국민연금','연금보험'], group:'경비', settle:true, rule:'50'},
  {key:'jangi', name:'노인장기요양보험료', match:['노인장기요양보험료','장기요양보험료','노인장기요양','장기요양보험','장기요양'], group:'경비', settle:true, rule:'50'},
  {key:'toejik',name:'퇴직공제부금비', match:['퇴직공제부금비','퇴직공제부금','퇴직공제'], group:'경비', settle:true, rule:'상한'},
  {key:'safe',  name:'산업안전보건관리비', match:['산업안전보건관리비','안전관리비'], group:'경비', settle:true, rule:'항목'},
  {key:'env',   name:'환경보전비',   match:['환경보전비','환경관리비'], group:'경비', settle:true, rule:'항목'},
  {key:'water', name:'수도광열비',   match:['수도광열비'], group:'경비'},
  {key:'etc',   name:'기타경비',     match:['기타경비'], group:'경비'},
  {key:'hado',  name:'하도급대금지급보증수수료', match:['하도급대금지급','하도급보증','건설하도급'], group:'경비'},
  {key:'machyo',name:'건설기계대여대금지급보증', match:['건설기계대여대금','건설기계대여','건설기계대여지급','기계대여'], group:'경비', settle:true, rule:'상한'},
  {key:'waste', name:'건설폐기물처리비', match:['건설폐기물처리비','폐기물처리비','폐기물처리'], group:'경비'},
  {key:'gen',   name:'일반관리비',   match:['일반관리비'], group:'집계'},
  {key:'profit',name:'이윤',         match:['이윤'], group:'집계'},
  {key:'sup',   name:'공급가액',     match:['공급가액'], group:'집계'},
  {key:'vat',   name:'부가가치세',   match:['부가가치세'], group:'집계'},
  {key:'gov',   name:'관급자관급',   match:['관급자관급','관급자재','도급자관급'], group:'집계'},
  {key:'grand', name:'총합계액',     match:['총합계액','총 합계액','도급액'], group:'집계'},
];

const SETTLE_SHEETS = [
  {key:'safe', title:'산업안전보건관리비', kind:'itemized',
   cats:['1. 안전·보건관리자 임금 등','2. 안전시설비 등','3. 보호구 등','4. 안전보건진단비 등',
         '5. 안전보건교육비 등','6. 근로자 건강장해예방비 등','7. 건설재해예방전문지도기관 기술지도비',
         '8. 본사 전담조직 근로자 임금 등','9. 위험성평가 등에 따른 소요비용'],
   note:'「건설업 산업안전보건관리비 계상 및 사용기준」 별지 제1호 서식의 9개 항목 기준.\n① 제7조(사용기준) 및 제8조(사용금액의 감액·반환 등)에 따라 정산한다.\n② 「건설업 산업안전보건관리비 계상 및 사용기준」(고용노동부고시 제2022-43호, 2022. 6. 2. 시행)에 의거 별표2(안전관리비의 항목별 사용 불가내역)는 삭제되었다.\n③ 세금계산서 공급가액(부가세 제외) 기준이며, 사용내역은 사용일자가 빠른 순서로 작성한다.'},
  {key:'env', title:'환경보전비', kind:'itemized',
   cats:['1. 환경오염방지시설 설치 및 운영비용','2. 폐기물의 처리 및 재활용 비용','3. 환경계측비용',
         '4. 환경교육 훈련비용','5. 현장 환경정리 비용','6. 기타'],
   note:'실비 정산 원칙. 세금계산서(부가세 제외) 기준, 계상액을 상한으로 정산.'},
  {key:'health', title:'건강·연금·장기요양', kind:'triple',
   rows:[['gun','건강보험료'],['yeon','국민연금보험료'],['jangi','장기요양보험료']],
   note:'「지방자치단체 입찰 및 계약 집행기준」(행정안전부) 제7장 국민건강보험료 등의 사후정산\n「정부 입찰·계약 집행기준」(기획재정부 계약예규) 제94조 국민건강보험료 등의 사후정산\n「국민건강보험법」·「국민연금법」·「노인장기요양보험법」\n▷ 납부확인서상 사업자(사용자) 부담분을 기준으로 하며, 계상액을 상한으로 정산한다.'},
  {key:'toejik', title:'퇴직공제부금', kind:'simple', row:['toejik','공제부금 납부액'],
   note:'납부확인서상 납부총액 기준으로 검토(단말기 임대·구매비 별도).'},
  {key:'machyo', title:'건설기계대여보증', kind:'simple', row:['machyo','건설기계대여대금 지급보증 수수료'],
   note:'세금계산서 공급가액(부가세 제외) 기준.'},
  {key:'gs', title:'고용·산재보험료', kind:'gs',
   rows:[['sanjae','산재보험료'],['goyong','고용보험료']],
   note:'완납증명서(현장명) 기준, 계상액 상한.'},
];

const RATE_DEFS = [
  {key:'ilab',  label:'간접노무비율',       base:'직접노무비'},
  {key:'sanjae',label:'산재보험료율',        base:'노무비'},
  {key:'goyong',label:'고용보험료율',        base:'노무비'},
  {key:'gun',   label:'건강보험료율',        base:'직접노무비'},
  {key:'yeon',  label:'연금보험료율',        base:'직접노무비'},
  {key:'jangi', label:'장기요양보험료율',    base:'건강보험료'},
  {key:'toejik',label:'퇴직공제부금율',      base:'직접노무비'},
  {key:'safe',  label:'산업안전보건관리비율',base:'재료비+직노'},
  {key:'water', label:'수도광열비율',        base:'재료비+노무비'},
  {key:'etc',   label:'기타경비율',          base:'재료비+노무비'},
  {key:'gen',   label:'일반관리비율',        base:'계'},
  {key:'profit',label:'이윤율',              base:'노무+경비+일반관리비'},
];
const RATE_KEYS = RATE_DEFS.map(d => d.key);
const K_MAT = ['mat','imat'];
const EXP_KEYS = ['mach','sanjae','goyong','gun','yeon','jangi','toejik','safe','env','water','etc','hado','machyo','waste'];
const AGG_ONLY = ['sup','vat','grand'];

const strip = s => String(s == null ? '' : s).replace(/\s/g, '').replace(/[\[\]]/g, '');
const nf = n => (n == null || isNaN(n)) ? '' : Math.round(n).toLocaleString('ko-KR');

/* ── 엑셀 파싱 ───────────────────────────────────────────── */
// 한 헤더 행 안에 「변경전(당초·계약·착공)」과 「변경후(준공·정산)」 금액열이 나란히 있는 경우만 인정
function detectAmountCols(rows) {
  const bad = /일자|기간|명$|년|월|일$/;
  const BEF = /(당초|변경전|계약|착공)/, AFT = /(변경후|변경|준공|정산)/;
  let hit = null;
  rows.slice(0, 25).forEach(r => {
    if (!r || hit) return;
    let before = null, after = null;
    r.forEach((c, i) => {
      if (typeof c !== 'string') return;
      const s = strip(c);
      if (!s || s.length > 12 || bad.test(s)) return;
      if (/증감|비고|산출/.test(s)) return;
      if (before == null && BEF.test(s)) { before = i; return; }
      if (after == null && AFT.test(s)) after = i;
    });
    if (before != null && after != null && before !== after) hit = {before, after};
  });
  return hit;
}

function pickNear(cells, col) {
  let best = null;
  cells.forEach(x => {
    const d = Math.abs(x.c - col);
    if (d <= 2 && (best == null || d < best.d)) best = {d, c: x.c, v: x.v};
  });
  return best;
}

// match 항목이 '^'로 시작하면 라벨 시작 지점만 본다(「경비」가 「기하경비」에 붙지 않도록)
function matchItem(it, sl) {
  const head = sl.replace(/^[A-Za-z0-9]+/, '')
    .replace(/^[ⅠⅡⅢⅣⅤ가나다라마바①②③④⑤().,·\-]+/, '');
  return it.match.some(m => {
    const t = strip(m);
    return t.startsWith('^') ? head.startsWith(t.slice(1)) : sl.includes(t);
  });
}

function parseSheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:null});
  const cols = detectAmountCols(rows);
  const found = {}, before = {}, after = {}; const rawList = [];
  rows.forEach(r => {
    if (!r) return;
    let label = ''; const nums = [], cells = [];
    r.forEach((c, i) => {
      if (typeof c === 'string' && c.trim()) label += c;
      else if (typeof c === 'number') { nums.push(c); cells.push({c: i, v: c}); }
    });
    if (!label || !nums.length) return;
    const sl = strip(label);
    let amt = null;
    nums.forEach(n => { if (Math.abs(n) >= 1 && (amt == null || Math.abs(n) > Math.abs(amt))) amt = n; });
    if (amt == null && nums.some(n => n === 0)) amt = 0;   // 금액이 0인 비목도 읽는다
    if (amt == null) return;
    rawList.push({label: label.trim(), amt});
    const bc = cols ? pickNear(cells, cols.before) : null;
    const ac = cols ? pickNear(cells, cols.after) : null;
    const same = bc && ac && bc.c === ac.c;
    const bv = (bc && !same) ? bc.v : null;
    const av = (ac && !same) ? ac.v : null;
    for (const it of ITEMS) {
      if (it.key !== 'scrap' && found[it.key] != null) continue;
      if (matchItem(it, sl)) {
        if (it.key === 'scrap') { if (found.scrap == null || Math.abs(amt) > Math.abs(found.scrap)) found.scrap = amt; }
        else {
          found[it.key] = (av != null) ? av : amt;
          if (bv != null) before[it.key] = bv;
          if (av != null) after[it.key] = av;
        }
        break;
      }
    }
  });
  const CORE = ['mat','lab','gen','profit','grand'];
  const bKeys = CORE.filter(k => before[k] != null), aKeys = CORE.filter(k => after[k] != null);
  const differs = Object.keys(before).some(k => after[k] != null && after[k] !== before[k]);
  const split = !!cols && bKeys.length >= 3 && aKeys.length >= 3 && differs;
  return {cost: split ? after : found, costBefore: split ? before : null,
    raw: rawList, hitCount: Object.keys(found).length};
}

function parseWorkbook(wb) {
  const CORE = ['mat','lab','gen','profit','sup','grand'];
  const nameHit = wb.SheetNames.filter(n => { const x = strip(n); return x.includes('원가계산') || x.includes('공사원가'); });
  let sheetName = null, parsed = null;
  for (const n of nameHit) {
    const p = parseSheet(wb.Sheets[n]);
    if (CORE.filter(k => p.cost[k] != null).length >= 3) { sheetName = n; parsed = p; break; }
  }
  if (!parsed) {
    let best = null;
    wb.SheetNames.forEach(n => {
      const p = parseSheet(wb.Sheets[n]);
      const coreHit = CORE.filter(k => p.cost[k] != null).length;
      const score = coreHit * 10 + p.hitCount;
      if (coreHit >= 3 && (!best || score > best.score)) best = {name:n, p, score};
    });
    if (best) { sheetName = best.name; parsed = best.p; }
  }
  if (!parsed) return {sheetName:null, cost:{}, costBefore:null, raw:[], ok:false, sheets: wb.SheetNames.slice()};
  return {sheetName, cost: parsed.cost, costBefore: parsed.costBefore, raw: parsed.raw, ok:true, sheets: wb.SheetNames.slice()};
}

// 한 파일에 원가계산서가 여러 시트로 들어있는 경우(설계 + 설계변경 1~3차) 모두 반환
function parseCostSheets(wb) {
  const CORE = ['mat','lab','gen','profit','sup','grand'];
  const out = [];
  wb.SheetNames.forEach(n => {
    const x = strip(n);
    if (!(x.includes('원가계산') || x.includes('공사원가'))) return;
    const p = parseSheet(wb.Sheets[n]);
    if (CORE.filter(k => p.cost[k] != null).length >= 3) out.push({sheetName:n, cost:p.cost, costBefore:p.costBefore, raw:p.raw});
  });
  return out;
}

function extractProjectName(wb) {
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header:1, raw:false, defval:null});
    for (const r of rows) { if (!r) continue;
      for (const c of r) { if (typeof c === 'string') { const m = c.match(/공\s*사\s*명\s*[:：]?\s*(.+)/); if (m && m[1].trim()) return m[1].trim(); } }
    }
  }
  return '';
}

/* ── 요율 역산 ───────────────────────────────────────────── */
function deriveRates(D) {
  const matSum = (D.mat||0) + (D.imat||0);
  const labDirect = D.lab || 0;
  const labSum = (D.lab||0) + (D.isle||0) + (D.ilab||0);
  const r = {};
  r.ilab   = labDirect ? (D.ilab||0)/labDirect : 0;
  r.sanjae = labSum ? (D.sanjae||0)/labSum : 0;
  r.goyong = labSum ? (D.goyong||0)/labSum : 0;
  r.gun    = labDirect ? (D.gun||0)/labDirect : 0;
  r.yeon   = labDirect ? (D.yeon||0)/labDirect : 0;
  r.jangi  = (D.gun||0) ? (D.jangi||0)/(D.gun||0) : 0;
  r.toejik = labDirect ? (D.toejik||0)/labDirect : 0;
  r.safe   = (matSum+labDirect) ? (D.safe||0)/(matSum+labDirect) : 0;
  r.water  = (matSum+labSum) ? (D.water||0)/(matSum+labSum) : 0;
  r.etc    = (matSum+labSum) ? (D.etc||0)/(matSum+labSum) : 0;
  const expSum = EXP_KEYS.reduce((a,k) => a + (D[k]||0), 0);
  const gyeol = matSum + labSum + expSum;
  r.gen = gyeol ? (D.gen||0)/gyeol : 0.06;
  const proBase = labSum + expSum + (D.gen||0);
  r.profit = proBase ? (D.profit||0)/proBase : 0.15;
  return r;
}

const GROUPS = {'재료':['mat','imat','scrap'], '노무':['lab','isle','ilab'], '경비':EXP_KEYS};

function groupSeq(S, g) {
  const def = GROUPS[g] || [];
  const o = ((S.order || {})[g] || []).filter(k => def.includes(k));
  return o.concat(def.filter(k => !o.includes(k)));
}

// 숨긴 비목을 뺀, 사용자가 정한 순서의 비목 목록
function visibleItems(S) {
  const HID = S.hidden || [], done = {}, out = [];
  ITEMS.forEach(it => {
    if (GROUPS[it.group]) {
      if (done[it.group]) return;
      done[it.group] = true;
      groupSeq(S, it.group).forEach(k => {
        if (HID.includes(k)) return;
        const x = ITEMS.find(y => y.key === k); if (x) out.push(x);
      });
    } else if (!HID.includes(it.key)) out.push(it);
  });
  return out;
}

function moveItem(S, key, dir) {
  const it = ITEMS.find(x => x.key === key);
  if (!it || !GROUPS[it.group]) return;
  const cur = groupSeq(S, it.group);
  const i = cur.indexOf(key), j = i + dir;
  if (i < 0 || j < 0 || j >= cur.length) return;
  cur[i] = cur[j]; cur[j] = key;
  S.order = Object.assign({}, S.order, {[it.group]: cur});
}

function toggleHidden(S, key, on) {
  const set = (S.hidden || []).filter(k => k !== key);
  if (on) set.push(key);
  S.hidden = set;
}

function computeCost(baseCost, rates, settleOverride) {
  const get = k => (settleOverride && settleOverride[k] != null) ? settleOverride[k] : (baseCost[k] ?? 0);
  const R = k => (rates[k] != null ? rates[k] : 0);
  const ov = (k, computed) => (settleOverride && settleOverride[k] != null) ? settleOverride[k] : computed;
  const mat = get('mat'), imat = get('imat'), scrap = get('scrap');
  const matSum = mat + imat;
  const labDirect = get('lab'), isle = get('isle');
  const ilab   = ov('ilab', Math.round(labDirect*R('ilab')));
  const labSum = labDirect + isle + ilab;
  const mach = get('mach'), env = get('env'), hado = get('hado'), machyo = get('machyo'), waste = get('waste');
  const sanjae = ov('sanjae', Math.round(labSum*R('sanjae')));
  const goyong = ov('goyong', Math.round(labSum*R('goyong')));
  const gun    = ov('gun',    Math.round(labDirect*R('gun')));
  const yeon   = ov('yeon',   Math.round(labDirect*R('yeon')));
  const jangi  = ov('jangi',  Math.round(gun*R('jangi')));
  const toejik = ov('toejik', Math.round(labDirect*R('toejik')));
  const safe   = ov('safe',   Math.round((matSum+labDirect)*R('safe')));
  const water  = ov('water',  Math.round((matSum+labSum)*R('water')));
  const etc    = ov('etc',    Math.round((matSum+labSum)*R('etc')));
  const expSum = mach+sanjae+goyong+gun+yeon+jangi+toejik+safe+env+water+etc+hado+machyo+waste;
  const gyeol  = matSum + labSum + expSum;
  const gen = ov('gen', Math.round(gyeol*R('gen')));
  const pro = ov('profit', Math.round((labSum+expSum+gen)*R('profit')));
  const supRaw = gyeol + gen + pro + scrap;
  const unit = (rates.supUnit || 1);
  const sup = Math.floor(supRaw/unit)*unit;
  const vat = Math.round(sup*0.1);
  const gov = get('gov');
  const grand = Math.floor((sup + vat + gov)/1000)*1000;   // 총합계액 천원 이하 절사
  return {ilab,sanjae,goyong,gun,yeon,jangi,toejik,safe,water,etc, gyeol, gen, pro, sup, vat, gov, grand, supRaw};
}

function detectSupUnit(D, rates) {
  const test = computeCost(D, {...rates, supUnit:1}, null);
  const raw = test.supRaw, real = D.sup;
  if (real == null) return 1;
  for (const u of [10000,1000,100,10,1]) { if (Math.floor(raw/u)*u === real) return u; }
  return 1;
}

/* 화면 %입력 → 소수 요율 */
function readRates(S, dr) {
  const r = {};
  RATE_KEYS.forEach(k => {
    const v = parseFloat(S.rateInput ? S.rateInput[k] : NaN);
    if (isNaN(v)) { r[k] = dr[k] || 0; return; }
    const shown = Math.round(v*1000)/1000;
    const drPct3 = Math.round((dr[k]||0)*100*1000)/1000;
    if (dr[k] != null && shown === drPct3) r[k] = dr[k];
    else r[k] = v/100;
  });
  return r;
}

/* ── 사후정산 집계 ───────────────────────────────────────── */
function itemizedTotal(S, key) {
  const items = (S.settleInput[key] && S.settleInput[key].items) || [];
  return items.reduce((s,x) => s + (x.price||0)*(x.qty||0), 0);
}
function itemizedSubmit(S, key) {
  const items = (S.settleInput[key] && S.settleInput[key].items) || [];
  return items.reduce((s,x) => {
    const p = (x.subPrice != null ? x.subPrice : x.price) || 0;
    const q = (x.subQty != null ? x.subQty : (x.qty||0));
    return s + p*q;
  }, 0);
}
function hasAnyItem(S, key) { return ((S.settleInput[key] && S.settleInput[key].items) || []).length > 0; }

function admitValue(S, it) {
  const c = S.cost[it.key]; if (!c) return null;
  const calc = c.start || 0;
  if (it.rule === '항목') { const t = itemizedTotal(S, it.key); return (t > 0 || hasAnyItem(S, it.key)) ? t : null; }
  const inp = S.settleInput[it.key]; if (!inp) return null;
  if (inp.admit != null) return Math.min(calc, inp.admit);
  if (inp.submit != null) { const rate = (it.rule === '50') ? (inp.rate ?? 0.5) : 1; return Math.min(calc, inp.submit*rate); }
  return null;
}

/* ── 전체 재계산 (rebuildCost → applySettle → recalcAggregates) ── */
// 설계내역서가 없으면 착공 → 첫 설계변경 산정을 기여 문서로 삼는다
function baseDoc(S) { return S.design || S.start || (S.changes && S.changes[0]) || null; }

function recompute(S) {
  const bd = baseDoc(S);
  if (!bd) return S;
  S.change = S.changes.length ? S.changes[S.changes.length-1] : null;
  const D = bd.cost;
  const bidRaw = parseFloat(S.basic.bid);
  const bid = (!isNaN(bidRaw) && bidRaw > 0) ? bidRaw : null;
  const drDesign = deriveRates(D);
  const supUnit = detectSupUnit(D, drDesign);
  drDesign.supUnit = supUnit;
  S.designRates = drDesign;
  const rStart = {...readRates(S, drDesign), supUnit};

  const HID = S.hidden || [];
  const hidOv = {}; HID.forEach(k => { hidOv[k] = 0; });
  const startBase = {};
  const SM = S.startManual || {};
  // 업로드한 파일에 「변경전(당초·착공)」 금액열이 있으면 그 것을 착공으로 삼는다
  const BEF = S.start ? null
    : ((S.change && S.change.costBefore) || (S.changes[0] && S.changes[0].costBefore) || bd.costBefore || null);
  S.hasBefore = !!BEF;
  ITEMS.forEach(it => {
    if (it.group === '집계' && it.key !== 'gov') return;
    if (HID.includes(it.key)) { startBase[it.key] = 0; return; }
    let v = (S.start && S.start.cost[it.key] != null) ? S.start.cost[it.key]
      : (BEF && BEF[it.key] != null) ? BEF[it.key] : (D[it.key] ?? 0);
    if (!S.start && !BEF && bid && (K_MAT.includes(it.key)||it.key==='lab'||it.key==='isle'||it.key==='mach'||it.key==='env'||it.key==='hado'||it.key==='machyo'||it.key==='waste'||it.key==='gov'))
      v = Math.round(v*bid);
    if (SM[it.key] != null) v = SM[it.key];
    startBase[it.key] = v;
  });
  const aggD = computeCost(D, drDesign, Object.keys(hidOv).length ? hidOv : null);
  const startRateOv = Object.assign({}, hidOv);
  RATE_KEYS.forEach(k => { if (SM[k] != null) startRateOv[k] = SM[k]; });
  const aggS = computeCost(startBase, rStart, Object.keys(startRateOv).length ? startRateOv : null);

  S.rates = rStart;
  S.startCalc = aggS;
  S.startBase = startBase;
  const prevSettle = {};
  Object.keys(S.cost || {}).forEach(k => { prevSettle[k] = S.cost[k].settle; });
  S.cost = {};
  const AGGMAP = {gen:'gen', profit:'pro', sup:'sup', vat:'vat', grand:'grand'};
  ITEMS.forEach(it => {
    if (HID.includes(it.key)) return;
    let design = D[it.key] ?? null, start;
    if (it.group === '집계' && it.key !== 'gov') {
      const ak = AGGMAP[it.key] || it.key;
      design = aggD[ak] ?? D[it.key] ?? null;
      start  = (!HID.length && BEF && BEF[it.key] != null) ? BEF[it.key] : (aggS[ak] ?? null);
    } else if (RATE_KEYS.includes(it.key)) {
      design = aggD[it.key] ?? D[it.key] ?? null;
      start  = (SM[it.key] != null) ? SM[it.key]
        : (!HID.length && BEF && BEF[it.key] != null) ? BEF[it.key] : (aggS[it.key] ?? null);
    } else {
      start = startBase[it.key] ?? null;
      if (it.key === 'gov') design = D.gov ?? null;
    }
    S.cost[it.key] = {design, start, settle: null};
  });
  // 파일의 「도급액」 행은 관급자재가 버진 경우가 있어, 총합계액은 항상 공급가액+부가세+관급으로 맞춘다
  ['design','start'].forEach(col => {
    const g = S.cost;
    if (!g.grand || !g.sup || !g.vat) return;
    const sup = g.sup[col], vat = g.vat[col];
    if (sup == null || vat == null) return;
    g.grand[col] = Math.floor((sup + vat + ((g.gov && g.gov[col]) || 0))/1000)*1000;
  });
  // 사용자가 정산칸을 직접 고친 값은 유지
  if (S.settleManual) Object.keys(S.settleManual).forEach(k => { if (S.cost[k]) S.cost[k].settle = S.settleManual[k]; });

  const changeBase = {};
  ITEMS.forEach(it => {
    if (it.group === '집계' && it.key !== 'gov') return;
    changeBase[it.key] = HID.includes(it.key) ? 0
      : (S.change && S.change.cost[it.key] != null) ? S.change.cost[it.key] : (startBase[it.key] ?? 0);
  });
  S.changeBase = changeBase;
  S.changeRates = rStart;
  applySettle(S);
  return S;
}

function applySettle(S) {
  const hasChange = !!S.change;
  const SM = S.settleManual || {};
  ITEMS.forEach(it => {
    const c = S.cost[it.key]; if (!c) return;
    if (it.group === '집계' && it.key !== 'gov') return;
    if (SM[it.key] != null) { c.settle = SM[it.key]; return; }
    if (it.settle) {
      const av = admitValue(S, it);
      c.settle = (av != null) ? av : (hasChange ? (S.changeBase[it.key] ?? c.start) : null);
    } else {
      c.settle = hasChange ? (S.changeBase[it.key] ?? c.start) : null;
    }
  });
  recalcAggregates(S);
}

function recalcAggregates(S) {
  const bd = baseDoc(S);
  const rates = S.changeRates || S.rates || deriveRates(bd ? bd.cost : {});
  if (rates.supUnit == null && bd) rates.supUnit = detectSupUnit(bd.cost, rates);
  const base = {};
  const src = S.changeBase || S.startBase;
  ITEMS.forEach(it => { if (it.group !== '집계') base[it.key] = src ? (src[it.key] ?? 0) : 0; });
  const override = {};
  (S.hidden || []).forEach(k => { override[k] = 0; });
  ITEMS.forEach(it => {
    if (AGG_ONLY.includes(it.key)) return;
    if (S.cost[it.key] && S.cost[it.key].settle != null) override[it.key] = S.cost[it.key].settle;
  });
  const agg = computeCost(base, rates, override);
  [['gen','gen'],['profit','pro'],['sup','sup'],['vat','vat'],['grand','grand']].forEach(([k,kk]) => {
    if (!S.cost[k]) return;
    if ((k === 'gen' || k === 'profit') && override[k] != null) S.cost[k].settle = override[k];
    else S.cost[k].settle = agg[kk];
  });
  RATE_KEYS.forEach(k => {
    if (k === 'gen' || k === 'profit') return;
    if (S.cost[k]) S.cost[k].settle = (override[k] != null) ? override[k] : agg[k];
  });
  ITEMS.forEach(it => {
    const k = it.key;
    if (RATE_KEYS.includes(k) || AGG_ONLY.includes(k) || k === 'gen' || k === 'profit') return;
    if (S.cost[k] && override[k] != null) S.cost[k].settle = override[k];
  });
}

function ruleLabel(it) {
  return {'상한':'계상액 상한','50':'','항목':'항목별 사용내역 검토'}[it.rule] || '';
}
function formulaLabel(S, it) {
  const r = S.rates || {};
  const pct = k => ((r[k]||0)*100).toFixed(3).replace(/\.?0+$/,'') + '%';
  const F = {
    ilab:'직접노무비 × '+pct('ilab'), sanjae:'노무비(직+간) × '+pct('sanjae'), goyong:'노무비(직+간) × '+pct('goyong'),
    gun:'직접노무비 × '+pct('gun'), yeon:'직접노무비 × '+pct('yeon'), jangi:'건강보험료 × '+pct('jangi'),
    toejik:'직접노무비 × '+pct('toejik'), safe:'(재료비+직노) × '+pct('safe'), water:'(재료비+노무비) × '+pct('water'),
    etc:'(재료비+노무비) × '+pct('etc'), gen:'계(순공사원가) × '+pct('gen'),
    profit:'(노무비+경비+일반관리비) × '+pct('profit'),
    sup:'계 + 일반관리비 + 이윤 + 작업부산물 (원단위 절사)', vat:'공급가액 × 10% (반올림)',
    grand:'공급가액 + 부가세 + 관급자재 (천원이하 절사)',
  };
  let f = F[it.key] || '';
  if (['sup','vat','grand'].includes(it.key)) f += ' ※ 절사·반올림 차이가 있으면 원본 내역서와 대조 확인';
  if (it.settle && it.rule) { const rl = ruleLabel(it); if (rl) f = f ? (f+' · '+rl) : rl; }
  return f;
}

/* ── 내보내기 페이로드 ───────────────────────────────────── */
function buildCostRows(S) {
  const byKey = k => ITEMS.find(x => x.key === k);
  const row = (it, kind) => { const c = S.cost[it.key] || {}; return {kind: kind||'item', name: it.name,
    start: c.start ?? 0, settle: c.settle != null ? c.settle : (c.start ?? 0),
    note: ((S.noteInput || {})[it.key] != null && String(S.noteInput[it.key]).trim() !== '')
      ? S.noteInput[it.key] : formulaLabel(S, it),
    rate: RATE_KEYS.includes(it.key) ? (S.rates && S.rates[it.key]) : null}; };
  const sum = (keys, field) => keys.reduce((a,k) => { const c = S.cost[k]||{}; return a + (field==='start'?(c.start||0):(c.settle!=null?c.settle:(c.start||0))); }, 0);
  const rows = [];
  rows.push({kind:'section', name:'순공사원가 · 재료비'});
  const vis = k => !((S.hidden || []).includes(k));
  groupSeq(S, '재료').filter(vis).forEach(k => { if (S.cost[k] && (S.cost[k].start || S.cost[k].design)) rows.push(row(byKey(k))); });
  rows.push({kind:'sub', name:'[ 재료비 소계 ]', start:sum(['mat','imat'],'start'), settle:sum(['mat','imat'],'settle'), note:''});
  rows.push({kind:'section', name:'노무비'});
  groupSeq(S, '노무').filter(vis).forEach(k => { if (S.cost[k] && (S.cost[k].start || S.cost[k].design)) rows.push(row(byKey(k))); });
  rows.push({kind:'sub', name:'[ 노무비 소계 ]', start:sum(['lab','isle','ilab'],'start'), settle:sum(['lab','isle','ilab'],'settle'), note:''});
  rows.push({kind:'section', name:'경비'});
  groupSeq(S, '경비').filter(vis).forEach(k => { if (S.cost[k] && (S.cost[k].start || S.cost[k].design)) rows.push(row(byKey(k))); });
  rows.push({kind:'sub', name:'[ 경비 소계 ]', start:sum(EXP_KEYS,'start'), settle:sum(EXP_KEYS,'settle'), note:''});
  const gyeolKeys = ['mat','imat','lab','isle','ilab',...EXP_KEYS];
  rows.push({kind:'total', name:'계 (순공사원가)', start:sum(gyeolKeys,'start'), settle:sum(gyeolKeys,'settle'), note:''});
  rows.push({kind:'section', name:'일반관리비 · 이윤 · 부가세'});
  ['gen','profit','sup','vat','gov'].forEach(k => { if (S.cost[k]) rows.push(row(byKey(k))); });
  rows.push(row(byKey('grand'), 'total'));
  return rows;
}

function buildSettlePayload(S) {
  return SETTLE_SHEETS.map(s => {
    if (s.kind === 'itemized') {
      return {title:s.title, key:s.key, mode:'itemized', note:s.note,
        calc: (S.cost[s.key] && S.cost[s.key].start) || 0, submit: itemizedSubmit(S, s.key), admit: itemizedTotal(S, s.key),
        cats: s.cats, items: (((S.settleInput[s.key]||{}).items)||[]).map(x => ({...x}))};
    }
    const rows = (s.kind === 'simple' ? [s.row] : s.rows).map(([ik, label]) => {
      const item = ITEMS.find(x => x.key === ik);
      const calc = (S.cost[ik] && S.cost[ik].start) || 0;
      const inp = S.settleInput[ik] || {};
      return {label, calc, submit: inp.submit ?? 0, admit: admitValue(S, item) ?? calc, rate: (inp.rate ?? 0.5)};
    });
    return {title:s.title, key:s.key, mode:(s.kind === 'triple' ? 'cmpRate' : 'cmp'), note:s.note, rows};
  });
}

/* 사후정산 6종 총괄 (엑셀 총괄표 + 화면 요약) */
function settleOverview(S) {
  return SETTLE_SHEETS.map(s => {
    if (s.kind === 'itemized') {
      const calc = (S.cost[s.key] && S.cost[s.key].start) || 0;
      const admit = itemizedTotal(S, s.key);
      return {key:s.key, title:s.title, calc, submit: itemizedSubmit(S, s.key), admit,
        chg: admit - calc, filled: hasAnyItem(S, s.key)};
    }
    const keys = (s.kind === 'simple' ? [s.row] : s.rows).map(r => r[0]);
    let calc = 0, submit = 0, admit = 0, filled = false;
    keys.forEach(ik => {
      const item = ITEMS.find(x => x.key === ik);
      const c = (S.cost[ik] && S.cost[ik].start) || 0;
      const inp = S.settleInput[ik] || {};
      const a = admitValue(S, item);
      calc += c; submit += (inp.submit || 0); admit += (a != null ? a : c);
      if (inp.submit != null || inp.admit != null) filled = true;
    });
    return {key:s.key, title:s.title, calc, submit, admit, chg: admit - calc, filled};
  });
}

root.SettleCore = {ITEMS, SETTLE_SHEETS, RATE_DEFS, RATE_KEYS, EXP_KEYS, AGG_ONLY,
  nf, strip, parseWorkbook, parseCostSheets, baseDoc, extractProjectName, deriveRates, computeCost, detectSupUnit,
  recompute, applySettle, recalcAggregates, admitValue, itemizedTotal, itemizedSubmit, hasAnyItem,
  visibleItems, moveItem, toggleHidden, GROUPS,
  formulaLabel, ruleLabel, buildCostRows, buildSettlePayload, settleOverview};
})(window);
