import { neon } from '@neondatabase/serverless';

let client: ReturnType<typeof neon> | undefined;

/** Neon HTTP 클라이언트 (서버사이드 전용). 빌드 시점 평가를 피하기 위해 lazy 초기화. */
export function getSql() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}
