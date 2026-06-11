/**
 * 기존 news 테이블 1회성 정리 (유사도 중복 제거 도입 이전 데이터용)
 * 같은 키워드 내 제목 bigram Jaccard ≥ 0.3이면 받아쓰기로 보고 최초 1건만 유지.
 * (src/lib/collectors.ts의 titleBigrams/jaccard와 동일 로직)
 *
 * 실행: node --env-file=.env.local scripts/dedup-news.mjs
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const THRESHOLD = 0.3;

const bigrams = (title) => {
  const s = title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
};
const jaccard = (a, b) => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

const rows = await sql`SELECT id, keyword, title FROM news ORDER BY id`;

const kept = [];
const dupIds = [];
for (const r of rows) {
  const bg = bigrams(r.title);
  const isDup = kept.some((k) => k.keyword === r.keyword && jaccard(k.bg, bg) >= THRESHOLD);
  if (isDup) dupIds.push(r.id);
  else kept.push({ keyword: r.keyword, bg });
}

if (dupIds.length > 0) {
  await sql`DELETE FROM news WHERE id = ANY(${dupIds}::bigint[])`;
}
console.log(`전체 ${rows.length}건 → 받아쓰기 ${dupIds.length}건 삭제, 잔여 ${rows.length - dupIds.length}건`);
