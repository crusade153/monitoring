export type Metric = 'usdkrw' | 'jpykrw' | 'wti' | 'natgas';

export interface PricePoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface NewsItem {
  pub_date: string; // YYYY-MM-DD
  keyword: string;
  title: string;
  link: string;
  source: string | null;
}

export interface Briefing {
  date: string; // YYYY-MM-DD
  content: string;
  model: string | null;
}

/** KST 기준 오늘 날짜 (YYYY-MM-DD) */
export function todayKst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}
