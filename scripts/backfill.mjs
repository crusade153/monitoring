/**
 * 초기 90일 시세 백필 (1회 실행용)
 * Yahoo Finance chart API → Neon prices 테이블
 * (기획 당시 소스였던 Stooq CSV는 2026-06 기준 단종되어 Yahoo로 교체)
 *
 * 참고: 일일 환율 수집은 open.er-api.com 기준이라 Yahoo(KRW=X) 백필분과
 * 소수점 수준 차이가 있을 수 있음 — 추이 파악 목적이므로 허용.
 *
 * 실행: node --env-file=.env.local scripts/backfill.mjs
 */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL이 없습니다. .env.local 확인 후 --env-file로 실행하세요.');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const UA = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  },
};

const SYMBOLS = [
  { yahoo: '005380.KS', metric: 'hyundai', scale: 1 }, // 현대차
  { yahoo: '000270.KS', metric: 'kia', scale: 1 }, // 기아
  { yahoo: 'KRW=X', metric: 'usdkrw', scale: 1 },
  { yahoo: 'CL=F', metric: 'wti', scale: 1 }, // PP 원가 선행 프록시
];

for (const { yahoo, metric, scale } of SYMBOLS) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?range=3mo&interval=1d`;
  const res = await fetch(url, UA);
  if (!res.ok) {
    console.error(`[${metric}] HTTP ${res.status} — 건너뜀`);
    continue;
  }
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  const dates = [];
  const values = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null || !Number.isFinite(close)) continue; // 휴장/미확정 봉 제외
    dates.push(new Date(timestamps[i] * 1000).toISOString().slice(0, 10));
    values.push(Math.round(close * scale * 100) / 100);
  }
  if (dates.length === 0) {
    console.error(`[${metric}] 유효한 데이터 없음 — 응답 확인 필요`);
    continue;
  }

  await sql`
    INSERT INTO prices (date, metric, value)
    SELECT d, ${metric}, v
    FROM unnest(${dates}::date[], ${values}::numeric[]) AS t(d, v)
    ON CONFLICT (date, metric) DO UPDATE SET value = EXCLUDED.value
  `;
  console.log(`[${metric}] ${dates.length}건 적재 (${dates[0]} ~ ${dates.at(-1)})`);
}
