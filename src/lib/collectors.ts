/**
 * 외부 데이터 수집 어댑터 (소스별 분리 — 단종/포맷 변경 시 해당 함수만 교체)
 * 서버사이드 전용. 각 함수는 실패 시 throw — 호출부(cron)에서 소스별로 격리 처리.
 */

const TIMEOUT_MS = 10_000;
// 일부 소스(Yahoo 등)는 기본 UA를 차단하므로 브라우저 UA 사용
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function fetchOpts(): RequestInit {
  return {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
    headers: { 'User-Agent': UA },
  };
}

/** 원화 환율 — open.er-api.com (무료, 키 불필요). base 통화 1단위당 KRW */
export async function fetchKrwRate(base: 'USD' | 'JPY'): Promise<number> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, fetchOpts());
  if (!res.ok) throw new Error(`er-api HTTP ${res.status}`);
  const data = await res.json();
  const rate = data?.rates?.KRW;
  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
    throw new Error(`er-api: KRW rate missing (base ${base})`);
  }
  return rate;
}

/**
 * 선물 현재가 — Yahoo Finance chart API (CL=F, NG=F 등)
 * 주의: 기획 당시 소스였던 Stooq CSV는 2026-06 기준 404 (단종) — Yahoo로 교체됨
 */
export async function fetchYahooPrice(symbol: string): Promise<number> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
    fetchOpts()
  );
  if (!res.ok) throw new Error(`yahoo HTTP ${res.status}`);
  const data = await res.json();
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new Error(`yahoo: regularMarketPrice missing (${symbol})`);
  }
  return price;
}

export interface RssItem {
  title: string;
  link: string;
  pubDate: string; // YYYY-MM-DD (KST)
  source: string | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!m) return null;
  return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim());
}

/** Google News 제목 말미의 " - 언론사" 꼬리표 제거 */
function stripSourceSuffix(title: string, source: string | null): string {
  if (source && title.endsWith(` - ${source}`)) {
    return title.slice(0, title.length - source.length - 3).trim();
  }
  return title;
}

/** 제목 정규화 — 공백/기호 제거 + 소문자 */
export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * 받아쓰기 기사 판정용 문자 bigram 집합.
 * 한국어 헤드라인은 조사/축약 변형이 많아 단어 비교가 안 통하므로 문자 단위 사용.
 */
export function titleBigrams(title: string): Set<string> {
  const s = normalizeTitle(title);
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

/** Jaccard 유사도 (0~1). 실데이터 튜닝 결과 0.3 이상이면 동일 사건의 받아쓰기. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** 키워드별 Google News RSS — 최근 7일 기사 목록 (when:7d) */
export async function fetchNewsForKeyword(keyword: string): Promise<RssItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${keyword} when:7d`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const res = await fetch(url, fetchOpts());
  if (!res.ok) throw new Error(`google news rss HTTP ${res.status}`);
  const xml = await res.text();

  const items: RssItem[] = [];
  for (const block of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    const title = tag(block, 'title');
    const link = tag(block, 'link');
    const pubDateRaw = tag(block, 'pubDate');
    if (!title || !link || !pubDateRaw) continue;
    const parsed = new Date(pubDateRaw);
    if (isNaN(parsed.getTime())) continue;
    const source = tag(block, 'source');
    items.push({
      title: stripSourceSuffix(title, source),
      link,
      pubDate: parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }),
      source,
    });
  }
  return items;
}
