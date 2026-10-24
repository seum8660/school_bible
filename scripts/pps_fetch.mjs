// 조달청 공공데이터 수집 → pps_data/*.json (GitHub Actions에서 실행, 인증키는 secrets.DATA_GO_KR_KEY)
import { writeFile, mkdir } from 'node:fs/promises';
const KEY = process.env.PPS_KEY;
if (!KEY) { console.log('PPS_KEY 없음 — 건너뜀'); process.exit(0); }
const B = 'https://apis.data.go.kr/1230000';
const ROWS = 999;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function page(url, params, no) {
  const q = new URLSearchParams({ ...params, pageNo: String(no), numOfRows: String(ROWS), type: 'json' });
  const full = `${url}?serviceKey=${encodeURIComponent(KEY)}&${q}`;
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(full, { signal: AbortSignal.timeout(30000) });
      const j = JSON.parse(await r.text());
      const b = j?.response?.body;
      if (!b) throw new Error(JSON.stringify(j).slice(0, 200));
      let it = b.items; if (it && !Array.isArray(it)) it = it.item ?? it; if (it && !Array.isArray(it)) it = [it];
      return { items: it || [], total: Number(b.totalCount || 0) };
    } catch (e) { console.log(`  재시도 ${t + 1}: ${e.message}`); await sleep(1500); }
  }
  return { items: [], total: -1 };
}
async function all(url, params = {}) {
  const first = await page(url, params, 1);
  const pages = Math.ceil(first.total / ROWS); const res = [first.items];
  const todo = []; for (let p = 2; p <= pages; p++) todo.push(p);
  const worker = async () => { while (todo.length) { const p = todo.shift(); res[p - 1] = (await page(url, params, p)).items; } };
  await Promise.all(Array.from({ length: 6 }, worker)); // 6개 동시 요청
  const out = res.flat();
  console.log(`${url.split('/').pop()} ${params.inqryBgnDate || ''}: ${out.length} / ${first.total}`);
  return { rows: out, total: first.total };
}
const pick = (r, map) => { const o = {}; for (const [k, src] of Object.entries(map)) { const v = r[src]; if (v !== '' && v != null) o[k] = v; } return o; };

await mkdir('pps_data', { recursive: true });
const { readFile: rf } = await import('node:fs/promises');
let prev = {}; try { prev = JSON.parse(await rf('pps_data/meta.json', 'utf8')); } catch (e) {}
const meta = { updated: new Date().toISOString(), sets: { ...(prev.sample ? {} : prev.sets || {}) }, mtrlUpdated: prev.sample ? null : (prev.mtrlUpdated || null) };
// 시설자재는 반기마다 바뀌므로 7일에 한 번만 새로 받음
const mtrlDue = process.env.PPS_FORCE || !meta.mtrlUpdated || (Date.now() - Date.parse(meta.mtrlUpdated)) > 7 * 864e5;

const MTRL = { bldng: 'Bildng', engrk: 'Engrk', mchn: 'MchnEqp', elec: 'ElctyIrmc' };
const MF = { id: 'prdctIdntNo', c: 'prdctClsfcNo', n: 'prdctClsfcNoNm', s: 'krnPrdctNm', u: 'unit', p: 'prce', d: 'dlvryCndtnNm', v: 'vatYnNm', t: 'nticeDt', dv: 'prceDiv' };
for (const [k, op] of Object.entries(mtrlDue ? MTRL : {})) {
  const { rows, total } = await all(`${B}/ao/PriceInfoService/getPriceInfoListFcltyCmmnMtril${op}`);
  if (total < 0 || !rows.length) { console.log(`${k} 실패 — 기존 파일 유지`); continue; }
  const latest = new Map(); // 같은 물품식별번호는 최신 게시분만
  for (const r of rows) { const key = (r.prdctIdntNo || '') + '|' + (r.krnPrdctNm || '') + '|' + (r.dlvryCndtnNm || '') + '|' + (r.splyJrsdctRgnNm || '') + '|' + (r.unit || ''); const o = latest.get(key); if (!o || String(r.nticeDt) > String(o.nticeDt)) latest.set(key, r); }
  const data = [...latest.values()].map(r => pick(r, MF));
  await writeFile(`pps_data/mtrl_${k}.json`, JSON.stringify(data));
  meta.sets['mtrl_' + k] = data.length; meta.mtrlUpdated = meta.updated;
}
if (!mtrlDue) console.log('시설자재: 최근 7일 안에 받아 건너뜀');

const LF = { id: 'prdctIdntNo', n: 'prdctClsfcNoNm', dn: 'dtilPrdctClsfcNoNm', s: 'prdctSpecNm', u: 'prdctUnit', p: 'cntrctPrceAmt', co: 'cntrctCorpNm', mk: 'prdctMakrNm', rg: 'prdctSplyRgnNm', dl: 'prdctDlvryCndtnNm', ex: 'exclncPrcrmntPrdctYn', mas: 'masYn', cm: 'cntrctMthdNm', ent: 'entrprsDivNm', cert: 'prodctCertList', end: 'cntrctEndDate', cat: 'prdctMidclsfcNm', biz: 'cntrctCorpBizno', rd: 'rgstDt', c: 'prdctClsfcNo' };
// 쇼핑몰: 최근 30일 등록·변경분을 받아 기존 파일과 합침(계약기간 끝난 품목은 제외) → 물품분류별 파일 + 색인
{
  const { readFile, readdir } = await import('node:fs/promises');
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const now = new Date(Date.now() + 9 * 3600e3); const today = ymd(now);
  const byId = new Map();
  await mkdir('pps_data/mall', { recursive: true });
  try { for (const f of await readdir('pps_data/mall')) { if (!/^\d+\.json$/.test(f)) continue; for (const r of JSON.parse(await readFile('pps_data/mall/' + f, 'utf8'))) byId.set(r.id + '|' + (r.biz || r.co || ''), r); } } catch (e) {}
  console.log('기존 쇼핑몰 품목', byId.size);
  // 처음(또는 자료가 적을 때)만 30일, 평소에는 최근 3일만 받아 합침
  const DAYS = Number(process.env.PPS_MALL_DAYS || (byId.size > 20000 ? 3 : 30));
  let got = 0, ok = false;
  for (let back = 0; back < DAYS; back += 10) {
    const end = new Date(now - back * 864e5), bgn = new Date(now - Math.min(back + 9, DAYS - 1) * 864e5);
    const { rows, total } = await all(`${B}/at/ShoppingMallPrdctInfoService/getShoppingMallPrdctInfoList`, { inqryDiv: '1', inqryBgnDate: ymd(bgn), inqryEndDate: ymd(end) });
    if (total >= 0) ok = true;
    for (const r of rows) { const o = pick(r, LF); const k = o.id + '|' + (o.biz || o.co || ''); const old = byId.get(k); if (!old || String(o.rd || '') >= String(old.rd || '')) byId.set(k, o); got++; }
  }
  // 과거 자료 채우기: 오래전에 등록돼 최근 변경이 없는 품목(장기 계약)을 위해 실행마다 더 이전 달을 받음 (최대 3년 전까지)
  const parse = s => new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
  const floor = new Date(now - 3 * 365 * 864e5);
  let cursor = prev.mallBackfill ? parse(prev.mallBackfill) : new Date(now - 30 * 864e5);
  const MONTHS = Number(process.env.PPS_BACKFILL_MONTHS || 6);
  for (let i = 0; i < MONTHS && cursor > floor; i++) {
    const end = new Date(cursor - 864e5), bgn = new Date(Math.max(end - 29 * 864e5, floor));
    const { rows, total } = await all(`${B}/at/ShoppingMallPrdctInfoService/getShoppingMallPrdctInfoList`, { inqryDiv: '1', inqryBgnDate: ymd(bgn), inqryEndDate: ymd(end) });
    if (total < 0) break;
    ok = true;
    for (const r of rows) { const o = pick(r, LF); const k = o.id + '|' + (o.biz || o.co || ''); const old = byId.get(k); if (!old || String(o.rd || '') >= String(old.rd || '')) byId.set(k, o); got++; }
    cursor = bgn;
  }
  meta.mallBackfill = ymd(cursor); meta.mallBackfillDone = cursor <= floor;
  console.log('과거 자료 채운 날짜', meta.mallBackfill, meta.mallBackfillDone ? '(완료)' : '(다음 실행에서 계속)');
  if (ok && byId.size) {
    const groups = new Map();
    for (const r of byId.values()) { if (r.end && r.end < today) continue; const c = r.c || 'etc'; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(r); }
    const { rm } = await import('node:fs/promises'); await rm('pps_data/mall', { recursive: true, force: true }); await mkdir('pps_data/mall', { recursive: true });
    const index = [], corp = {};
    for (const [c, list] of groups) {
      list.forEach(r => { delete r.c; });
      await writeFile(`pps_data/mall/${c}.json`, JSON.stringify(list));
      const names = {}; list.forEach(r => { names[r.n] = (names[r.n] || 0) + 1; if (r.co) (corp[r.co] = corp[r.co] || new Set()).add(c); });
      index.push({ c, n: Object.entries(names).sort((a, b) => b[1] - a[1])[0][0], k: list.length, cat: list[0].cat || '' });
    }
    const corpOut = {}; for (const [k, v] of Object.entries(corp)) corpOut[k] = [...v];
    await writeFile('pps_data/mall_index.json', JSON.stringify(index));
    await writeFile('pps_data/mall_corp.json', JSON.stringify(corpOut));
    meta.sets.mall = [...groups.values()].reduce((a, b) => a + b.length, 0); meta.sets.mall_cls = index.length; meta.sets.mall_corp = Object.keys(corpOut).length;
    console.log('쇼핑몰 수집', got, '→ 저장', meta.sets.mall, '품목 /', index.length, '분류');
  } else console.log('mall 실패 — 기존 파일 유지');
}
await writeFile('pps_data/meta.json', JSON.stringify(meta));
console.log(meta);
