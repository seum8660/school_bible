// 학교알리미 OpenAPI → data/alimi.json (GitHub Actions에서 실행, 인증키는 Secrets.SCHOOLINFO_KEY)
// MODE=discover : apiType 0~45를 훑어 항목 ID를 data/alimi_fields.json에 기록 (최초 1회)
// MODE=fetch    : scripts/alimi_map.json 설정대로 학교별 학년·학급·학생수를 data/alimi.json에 저장
import fs from 'node:fs';

const KEY = process.env.SCHOOLINFO_KEY;
if (!KEY) { console.error('SCHOOLINFO_KEY 없음'); process.exit(1); }
const MODE = process.env.MODE || 'fetch';
const MAP = JSON.parse(fs.readFileSync('scripts/alimi_map.json', 'utf8'));
const KINDS = MAP.schulKndCodes || ['02', '03', '04'];
const BASE = 'https://www.schoolinfo.go.kr/openApi.do';
fs.mkdirSync('data', { recursive: true });

async function call(apiType, kind, extra = {}) {
  const q = new URLSearchParams({ apiKey: KEY, apiType: String(apiType), schulKndCode: kind, ...extra });
  let t = '';
  try { t = await (await fetch(BASE + '?' + q)).text(); } catch (e) { return { resultCode: 'fail', resultMsg: '요청 실패: ' + e.message }; }
  try { return JSON.parse(t); } catch { return { resultCode: 'fail', resultMsg: t.slice(0, 200) }; }
}
const rowsOf = j => {
  let l = j.list ?? j.schoolinfo ?? j.data;
  if (!l) return [];
  if (!Array.isArray(l)) l = [l];
  return l.flat().filter(x => x && typeof x === 'object');
};

if (MODE === 'discover') {
  const out = { _fail: {} };
  const rg = { sidoCode: MAP.sidoCode || '46', sggCode: MAP.sggCode || '46910' };
  const y = new Date().getFullYear();
  for (let t = 1; t <= 45; t++) {
    for (const yr of [y, y - 1]) {
      const j = await call(t, '02', { ...rg, pbanYr: String(yr) });
      const rows = rowsOf(j);
      if (rows.length) { out[t] = { pbanYr: yr, count: rows.length, sample: rows[0] }; console.log('apiType', t, yr, rows.length); break; }
      out._fail[t] = String(j.resultMsg || '').slice(0, 80);
    }
  }
  fs.writeFileSync('data/alimi_fields.json', JSON.stringify(out, null, 1));
} else if (!MAP.apiType) {
  console.log('alimi_map.json의 apiType이 비어 있어 건너뜀 — discover 먼저 실행');
} else {
  const schools = {}, log = [];
  const y = new Date().getFullYear();
  for (const k of KINDS) {
    let rows = [], yrUsed = '';
    const types = [...new Set([String(MAP.apiType), String(+MAP.apiType)])];
    const sggs = MAP.sggCode ? [MAP.sggCode] : ['', ...(MAP.sggList || [])];
    outer: for (const yr of [y, y - 1, y - 2, y - 3]) {
      for (const t of types) {
        for (const sg of sggs) {
          const q = { sidoCode: MAP.sidoCode || '46', pbanYr: String(yr) };
          if (sg) q.sggCode = sg;
          const j = await call(t, k, q);
          const r = rowsOf(j);
          log.push({ kind: k, yr, t, sg, code: j.resultCode, msg: String(j.resultMsg || '').slice(0, 100), n: r.length });
          if (r.length) { rows = rows.concat(r); yrUsed = yr; }
        }
        if (rows.length) break outer;
      }
    }
    for (const row of rows) {
      const name = row[MAP.nameField || 'SCHUL_NM'];
      if (!name) continue;
      const n = k === '02' ? 6 : 3;
      const g = [];
      for (let i = 1; i <= n; i++) g.push([i + '학년', +row['COL_C' + i] || 0, +row['COL_S' + i] || 0]);
      g.push(['특수학급', +row.COL_C7 || 0, +row.COL_S7 || 0]);
      if ((schools[name] || []).some(c => c.code && c.code === row.SCHUL_CODE)) continue;
      (schools[name] = schools[name] || []).push({ code: row.SCHUL_CODE || '', addr: row.ADRCD_NM || row.SCHUL_RDNMA || '',
        kind: k, year: row[MAP.yearField] || '', grades: g,
        cls: +row[MAP.clsTotal] || null, stu: +row[MAP.stuTotal] || null, tch: +row[MAP.teachField] || null, pbanYr: yrUsed });
    }
    console.log(k, yrUsed, rows.length);
  }
  fs.writeFileSync('data/alimi.json', JSON.stringify({ updated: new Date().toISOString().slice(0, 10), log, schools }));
}
