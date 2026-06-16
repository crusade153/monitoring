import type { Briefing, Metric, NewsItem, PricePoint } from './types';
import { todayKst } from './types';

const DAY_MS = 86_400_000;

export type SignalTone = 'good' | 'neutral' | 'watch' | 'risk';

export interface MetricSnapshot {
  metric: Metric;
  latest: PricePoint | null;
  previous: PricePoint | null;
  delta: number;
  pct: number;
  staleDays: number | null;
}

export interface BusinessSignal {
  key: string;
  title: string;
  headline: string;
  detail: string;
  tone: SignalTone;
}

export interface DataStatusItem {
  label: string;
  value: string;
  tone: SignalTone;
}

export interface DashboardStatus {
  asOf: string;
  items: DataStatusItem[];
}

function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) return null;
  return Math.floor((Date.parse(todayKst()) - parsed) / DAY_MS);
}

function pctWord(pct: number, upWord: string, downWord: string): string {
  if (pct > 0.2) return upWord;
  if (pct < -0.2) return downWord;
  return '보합';
}

export function metricSnapshot(metric: Metric, series: PricePoint[]): MetricSnapshot {
  const latest = series.at(-1) ?? null;
  const previous = series.at(-2) ?? null;
  const delta = latest && previous ? latest.value - previous.value : 0;
  const pct = latest && previous ? (delta / previous.value) * 100 : 0;

  return {
    metric,
    latest,
    previous,
    delta,
    pct,
    staleDays: daysSince(latest?.date),
  };
}

export function getEvidenceNews(news: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const evidence: NewsItem[] = [];

  for (const item of news) {
    if (seen.has(item.keyword)) continue;
    seen.add(item.keyword);
    evidence.push(item);
    if (evidence.length >= 4) break;
  }

  return evidence;
}

export function buildBusinessSignals(snapshots: Record<Metric, MetricSnapshot>, news: NewsItem[]): BusinessSignal[] {
  const hyundai = snapshots.hyundai;
  const kia = snapshots.kia;
  const usdkrw = snapshots.usdkrw;
  const wti = snapshots.wti;
  const demandPct = (hyundai.pct + kia.pct) / 2;
  const tradeNews = news.filter((item) => item.keyword.includes('관세') || item.keyword.includes('통상')).length;
  const ppNews = news.filter((item) => item.keyword.includes('PP') || item.keyword.includes('석유화학')).length;

  return [
    {
      key: 'demand',
      title: '수요 신호',
      headline:
        Math.abs(demandPct) < 0.2
          ? '고객사 신호 보합'
          : `현대차·기아 ${pctWord(demandPct, '상승', '하락')} 흐름`,
      detail: `현대차 ${hyundai.pct.toFixed(2)}%, 기아 ${kia.pct.toFixed(2)}% 전일 대비. 생산·판매 뉴스와 함께 해석하세요.`,
      tone: demandPct < -1 ? 'watch' : demandPct > 1 ? 'good' : 'neutral',
    },
    {
      key: 'cost',
      title: '원가 신호',
      headline: wti.pct > 1 ? '원가 압력 상승 관찰' : wti.pct < -1 ? '원가 부담 완화 가능' : '원가 신호 보합',
      detail: `WTI ${wti.pct.toFixed(2)}% 전일 대비. PP·납사·석유화학 관련 뉴스 ${ppNews}건을 함께 확인하세요.`,
      tone: wti.pct > 1 ? 'risk' : wti.pct < -1 ? 'good' : 'neutral',
    },
    {
      key: 'fx',
      title: '환율 신호',
      headline: usdkrw.pct > 0.3 ? '수입 원가 부담 확대' : usdkrw.pct < -0.3 ? '환율 부담 완화' : '환율 영향 제한적',
      detail: `USD/KRW ${usdkrw.pct.toFixed(2)}% 전일 대비. 원재료 수입 단가와 결제 시점을 같이 봐야 합니다.`,
      tone: usdkrw.pct > 0.3 ? 'risk' : usdkrw.pct < -0.3 ? 'good' : 'neutral',
    },
    {
      key: 'risk',
      title: '리스크 신호',
      headline: tradeNews > 0 ? '통상·관세 이슈 확인 필요' : '정책 리스크 특이 신호 낮음',
      detail: `최근 7일 관세·통상 뉴스 ${tradeNews}건. 고객사 미국 판매와 부품 발주 영향 여부를 확인하세요.`,
      tone: tradeNews > 0 ? 'watch' : 'neutral',
    },
  ];
}

export function buildDashboardStatus(
  snapshots: MetricSnapshot[],
  news: NewsItem[],
  briefing: Briefing | null
): DashboardStatus {
  const healthyPrices = snapshots.filter((item) => item.latest && (item.staleDays ?? 99) < 2).length;
  const latestDates = [
    ...snapshots.map((item) => item.latest?.date).filter(Boolean),
    news[0]?.pub_date,
    briefing?.date,
  ] as string[];
  const asOf = latestDates.sort().at(-1) ?? todayKst();
  const newestNewsDays = daysSince(news[0]?.pub_date);
  const briefingDays = daysSince(briefing?.date);

  return {
    asOf,
    items: [
      {
        label: '시세',
        value: `${healthyPrices}/${snapshots.length} 정상`,
        tone: healthyPrices === snapshots.length ? 'good' : healthyPrices > 0 ? 'watch' : 'risk',
      },
      {
        label: '뉴스',
        value: news.length > 0 ? `최근 7일 ${news.length}건` : '수집 대기',
        tone: news.length > 0 && (newestNewsDays ?? 99) <= 7 ? 'good' : 'watch',
      },
      {
        label: 'AI 브리핑',
        value: briefing ? `${briefing.date} 생성` : '생성 대기',
        tone: briefing && (briefingDays ?? 99) <= 1 ? 'good' : 'watch',
      },
    ],
  };
}
