import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSql } from '@/lib/db';
import {
  fetchKrwRate,
  fetchNewsForKeyword,
  fetchYahooPrice,
  jaccard,
  titleBigrams,
  type RssItem,
} from '@/lib/collectors';
import { generateBriefing } from '@/lib/briefing';
import { NEWS_KEYWORDS } from '@/lib/keywords';
import { todayKst, type Metric, type NewsItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * 일 1회 수집 (Vercel Cron). 멱등 — 같은 날짜 재실행 시 UPDATE/스킵.
 * 소스별 실패 격리: 한 소스가 죽어도 나머지는 적재.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sql = getSql();
  const today = todayKst();
  const results: Record<string, string> = {};

  // 1~2. 시세 4종 (직렬, 소스별 실패 격리)
  const priceSources: { metric: Metric; get: () => Promise<number> }[] = [
    { metric: 'usdkrw', get: () => fetchKrwRate('USD') },
    { metric: 'jpykrw', get: async () => (await fetchKrwRate('JPY')) * 100 }, // 100엔 기준
    { metric: 'wti', get: () => fetchYahooPrice('CL=F') },
    { metric: 'natgas', get: () => fetchYahooPrice('NG=F') },
  ];
  for (const { metric, get } of priceSources) {
    try {
      const v = Math.round((await get()) * 100) / 100;
      await sql`
        INSERT INTO prices (date, metric, value) VALUES (${today}, ${metric}, ${v})
        ON CONFLICT (date, metric) DO UPDATE SET value = EXCLUDED.value
      `;
      results[metric] = `ok (${v})`;
    } catch (e) {
      results[metric] = `fail: ${errMsg(e)}`;
    }
  }

  // 3. 뉴스 (키워드 직렬 수집 → 제목 중복 제거 → 단일 INSERT)
  const fetched: (RssItem & { keyword: string })[] = [];
  for (const keyword of NEWS_KEYWORDS) {
    try {
      for (const item of await fetchNewsForKeyword(keyword)) {
        fetched.push({ ...item, keyword });
      }
      results[`news:${keyword}`] = 'ok';
    } catch (e) {
      results[`news:${keyword}`] = `fail: ${errMsg(e)}`;
    }
  }
  if (fetched.length > 0) {
    try {
      // 받아쓰기 기사 제거: 같은 키워드 내 제목 유사도(bigram Jaccard ≥ 0.3)로
      // 기존 14일치 + 배치 내 기사와 비교, 최초 1건만 유지
      const SIMILARITY_THRESHOLD = 0.3;
      const existing = (await sql`
        SELECT keyword, title FROM news WHERE pub_date >= CURRENT_DATE - 14
      `) as { keyword: string; title: string }[];
      const kept = existing.map((r) => ({ keyword: r.keyword, bg: titleBigrams(r.title) }));
      const unique: typeof fetched = [];
      for (const item of fetched) {
        const bg = titleBigrams(item.title);
        const isDup = kept.some(
          (k) => k.keyword === item.keyword && jaccard(k.bg, bg) >= SIMILARITY_THRESHOLD
        );
        if (isDup) continue;
        kept.push({ keyword: item.keyword, bg });
        unique.push(item);
      }

      if (unique.length > 0) {
        await sql`
          INSERT INTO news (pub_date, keyword, title, link, source)
          SELECT * FROM unnest(
            ${unique.map((i) => i.pubDate)}::date[],
            ${unique.map((i) => i.keyword)}::text[],
            ${unique.map((i) => i.title)}::text[],
            ${unique.map((i) => i.link)}::text[],
            ${unique.map((i) => i.source)}::text[]
          )
          ON CONFLICT (link) DO NOTHING
        `;
      }
      results['news:insert'] = `ok (${fetched.length} fetched, ${unique.length} unique)`;
    } catch (e) {
      results['news:insert'] = `fail: ${errMsg(e)}`;
    }
  }

  // 4. 90일 경과 뉴스 정리 (테이블 비대 방지)
  try {
    await sql`DELETE FROM news WHERE pub_date < CURRENT_DATE - 90`;
  } catch (e) {
    results.cleanup = `fail: ${errMsg(e)}`;
  }

  // 5. AI 브리핑 (적재 완료된 당일 데이터 기준, 1일 1회 생성·멱등)
  try {
    const PRICE_LABELS: Record<Metric, { label: string; unit: string }> = {
      usdkrw: { label: 'USD/KRW 환율', unit: '₩' },
      jpykrw: { label: 'JPY/KRW 환율(100엔)', unit: '₩' },
      wti: { label: 'WTI 유가(배럴)', unit: '$' },
      natgas: { label: '천연가스(MMBtu)', unit: '$' },
    };
    const priceRows = (await sql`
      SELECT metric, date::text AS date, value::float AS value
      FROM prices WHERE date >= CURRENT_DATE - 30 ORDER BY date ASC
    `) as { metric: Metric; date: string; value: number }[];
    const newsRows = (await sql`
      SELECT pub_date::text AS pub_date, keyword, title, link, source
      FROM news WHERE pub_date >= CURRENT_DATE - 7
      ORDER BY pub_date DESC, id DESC LIMIT 50
    `) as NewsItem[];

    const briefing = await generateBriefing({
      date: today,
      prices: (Object.keys(PRICE_LABELS) as Metric[]).map((metric) => ({
        ...PRICE_LABELS[metric],
        rows: priceRows.filter((r) => r.metric === metric),
      })),
      news: newsRows,
    });
    await sql`
      INSERT INTO briefings (date, content, model)
      VALUES (${today}, ${briefing.content}, ${briefing.model})
      ON CONFLICT (date) DO UPDATE SET content = EXCLUDED.content, model = EXCLUDED.model
    `;
    results.briefing = `ok (${briefing.model})`;
  } catch (e) {
    results.briefing = `fail: ${errMsg(e)}`;
  }

  revalidateTag('dash');
  return NextResponse.json({ date: today, results });
}
