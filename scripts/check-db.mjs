// DB 적재 상태 빠른 점검: node --env-file=.env.local scripts/check-db.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const prices = await sql`
  SELECT metric, count(*)::int AS rows, max(date)::text AS latest
  FROM prices GROUP BY metric ORDER BY metric
`;
const news = await sql`
  SELECT count(*)::int AS rows, max(pub_date)::text AS latest FROM news
`;
console.log('prices:', JSON.stringify(prices));
console.log('news  :', JSON.stringify(news));
