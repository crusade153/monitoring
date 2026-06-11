/**
 * briefings 테이블 추가 마이그레이션 (1회 실행)
 * 실행: node --env-file=.env.local scripts/migrate-briefings.mjs
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS briefings (
    date    date PRIMARY KEY,
    content text NOT NULL,
    model   text
  )
`;
console.log('briefings 테이블 준비 완료');
