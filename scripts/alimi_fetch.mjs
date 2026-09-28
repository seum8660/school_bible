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
  const r = await fetch(BASE + '?' + q);
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { resultCode: 'fail', resultMsg: t.slice(0, 200) }; }
}
const rowsOf = j => (Array.isArray(j.list) ? j.list.flat() : []);

if (MODE === 'discover') {
  const out = {};
  for (let t = 0; t <= 45; t++) {
    const j = await call(t, '02', MAP.sidoCode ? { sidoCode: MAP.sidoCode } : {});
    const rows = rowsOf(j);
    if (rows.length) { out[t] = { count: rows.length, sample: rows[0] }; console.log('apiType', t, rows.length, Object.keys(rows[0]).join(',')); }
  }
  fs.writeFileSync('data/alimi_fields.json', JSON.stringify(out, null, 1));
} else if (!MAP.apiType) {
  console.log('alimi_map.json의 apiType이 비어 있어 건너뜀 — discover 먼저 실행');
} else {
  const schools = {};
  const extra = {};
  if (MAP.sidoCode) extra.sidoCode = MAP.sidoCode;
  if (MAP.sggCode) extra.sggCode = MAP.sggCode;
  for (const k of KINDS) {
    const j = await call(MAP.apiType, k, extra);
    for (const row of rowsOf(j)) {
      const name = row[MAP.nameField || 'SCHUL_NM'];
      if (!name) continue;
      const g = (MAP.grades || []).map(x => [x.label, +row[x.c] || 0, +row[x.s] || 0]);
      schools[name] = { kind: k, year: row[MAP.yearField] || '', grades: g,
        cls: +row[MAP.clsTotal] || null, stu: +row[MAP.stuTotal] || null };
    }
    console.log(k, Object.keys(schools).length);
  }
  fs.writeFileSync('data/alimi.json', JSON.stringify({ updated: new Date().toISOString().slice(0, 10), schools }));
}
