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
  let out = first.items; const pages = Math.ceil(first.total / ROWS);
  for (let p = 2; p <= pages; p++) { const r = await page(url, params, p); out = out.concat(r.items); await sleep(200); }
  console.log(`${url.split('/').pop()}: ${out.length} / ${first.total}`);
  return { rows: out, total: first.total };
}
const pick = (r, map) => { const o = {}; for (const [k, src] of Object.entries(map)) { const v = r[src]; if (v !== '' && v != null) o[k] = v; } return o; };

await mkdir('pps_data', { recursive: true });
const meta = { updated: new Date().toISOString(), sets: {} };

const MTRL = { bldng: 'Bildng', engrk: 'Engrk', mchn: 'MchnEqp', elec: 'ElctyIrmc' };
const MF = { id: 'prdctIdntNo', c: 'prdctClsfcNo', n: 'prdctClsfcNoNm', s: 'krnPrdctNm', u: 'unit', p: 'prce', d: 'dlvryCndtnNm', v: 'vatYnNm', t: 'nticeDt', dv: 'prceDiv' };
for (const [k, op] of Object.entries(MTRL)) {
  const { rows, total } = await all(`${B}/ao/PriceInfoService/getPriceInfoListFcltyCmmnMtril${op}`);
  if (total < 0 || !rows.length) { console.log(`${k} 실패 — 기존 파일 유지`); continue; }
  const latest = new Map(); // 같은 물품식별번호는 최신 게시분만
  for (const r of rows) { const key = (r.prdctIdntNo || '') + '|' + (r.krnPrdctNm || ''); const o = latest.get(key); if (!o || String(r.nticeDt) > String(o.nticeDt)) latest.set(key, r); }
  const data = [...latest.values()].map(r => pick(r, MF));
  await writeFile(`pps_data/mtrl_${k}.json`, JSON.stringify(data));
  meta.sets['mtrl_' + k] = data.length;
}

const LF = { id: 'prdctIdntNo', n: 'prdctClsfcNoNm', dn: 'dtilPrdctClsfcNoNm', s: 'prdctSpecNm', u: 'prdctUnit', p: 'cntrctPrceAmt', co: 'cntrctCorpNm', mk: 'prdctMakrNm', rg: 'prdctSplyRgnNm', dl: 'prdctDlvryCndtnNm', ex: 'exclncPrcrmntPrdctYn', mas: 'masYn', cm: 'cntrctMthdNm', ent: 'entrprsDivNm', cert: 'prodctCertList', end: 'cntrctEndDate', cat: 'prdctMidclsfcNm', biz: 'cntrctCorpBizno' };
{
  const { rows, total } = await all(`${B}/at/ShoppingMallPrdctInfoService/getShoppingMallPrdctInfoList`, { inqryDiv: '1' });
  if (total >= 0 && rows.length) {
    const data = rows.map(r => pick(r, LF));
    await writeFile('pps_data/mall.json', JSON.stringify(data));
    meta.sets.mall = data.length;
  } else console.log('mall 실패 — 기존 파일 유지');
}
await writeFile('pps_data/meta.json', JSON.stringify(meta));
console.log(meta);
