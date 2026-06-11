import { unstable_cache } from 'next/cache';
import { getSql } from './db';
import type { Briefing, Metric, NewsItem, PricePoint } from './types';

const CACHE_OPTS = { revalidate: 600, tags: ['dash'] };

/** 최근 90일 시세 (오름차순). 30일 토글은 클라이언트에서 slice. */
export const getPriceSeries = unstable_cache(
  async (metric: Metric): Promise<PricePoint[]> => {
    const sql = getSql();
    const rows = await sql`
      SELECT date::text AS date, value::float AS value
      FROM prices
      WHERE metric = ${metric} AND date >= CURRENT_DATE - 90
      ORDER BY date ASC
      LIMIT 91
    `;
    return rows as PricePoint[];
  },
  ['price-series'],
  CACHE_OPTS
);

/** 가장 최근 AI 브리핑 (없으면 null) */
export const getLatestBriefing = unstable_cache(
  async (): Promise<Briefing | null> => {
    const sql = getSql();
    const rows = (await sql`
      SELECT date::text AS date, content, model
      FROM briefings ORDER BY date DESC LIMIT 1
    `) as Briefing[];
    return rows[0] ?? null;
  },
  ['latest-briefing'],
  CACHE_OPTS
);

/** 최근 7일 뉴스 (최신순, 최대 50건) */
export const getRecentNews = unstable_cache(
  async (): Promise<NewsItem[]> => {
    const sql = getSql();
    const rows = await sql`
      SELECT pub_date::text AS pub_date, keyword, title, link, source
      FROM news
      WHERE pub_date >= CURRENT_DATE - 7
      ORDER BY pub_date DESC, id DESC
      LIMIT 50
    `;
    return rows as NewsItem[];
  },
  ['recent-news'],
  CACHE_OPTS
);
